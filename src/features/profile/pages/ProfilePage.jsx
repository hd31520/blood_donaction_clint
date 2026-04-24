import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../auth/context/AuthContext.jsx';
import { authService } from '../../auth/services/authService.js';
import { donorSearchService } from '../../donors/services/donorSearchService.js';
import { upazilaSettingsService } from '../services/upazilaSettingsService.js';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('নির্বাচিত ফাইল পড়া যায়নি'));
    reader.readAsDataURL(file);
  });

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    imgbbApiKey: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSavedImgbbKey, setHasSavedImgbbKey] = useState(false);
  const [donorPreferences, setDonorPreferences] = useState({
    bloodGroup: '',
    lastDonationDate: '',
    availabilityStatus: 'available',
    isPhoneVisible: true,
    allowDonorChat: true,
    allowPatientChat: true,
  });

  const donorEligibility = useMemo(() => {
    if (!donorPreferences.lastDonationDate) {
      return {
        isEligibleForDonation: true,
        nextEligibleDonationDate: null,
        daysUntilEligible: 0,
      };
    }

    const lastDate = new Date(donorPreferences.lastDonationDate);
    const nextEligibleDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfNext = new Date(
      nextEligibleDate.getFullYear(),
      nextEligibleDate.getMonth(),
      nextEligibleDate.getDate(),
    );
    const daysUntilEligible = Math.max(
      0,
      Math.ceil((startOfNext.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000)),
    );

    return {
      isEligibleForDonation: daysUntilEligible <= 0,
      nextEligibleDonationDate: startOfNext,
      daysUntilEligible,
    };
  }, [donorPreferences.lastDonationDate]);

  useEffect(() => {
    if (user?.role !== 'donor') {
      return;
    }

    if (!donorEligibility.isEligibleForDonation && donorPreferences.availabilityStatus === 'available') {
      setDonorPreferences((previous) => ({
        ...previous,
        availabilityStatus: 'temporarily_unavailable',
      }));
    }
  }, [
    user?.role,
    donorEligibility.isEligibleForDonation,
    donorPreferences.availabilityStatus,
  ]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      location: user.location || '',
      imgbbApiKey: '',
    });
    setPreviewUrl(user.profileImageUrl || '');

    if (user.role === 'donor' && user.bloodGroup) {
      setDonorPreferences((previous) => ({
        ...previous,
        bloodGroup: previous.bloodGroup || user.bloodGroup,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'upazila_admin') {
      return;
    }

    let isMounted = true;

    const loadImgbbSettings = async () => {
      try {
        const settings = await upazilaSettingsService.getImgbbSettings();

        if (isMounted) {
          setHasSavedImgbbKey(Boolean(settings?.hasImgbbApiKey));
        }
      } catch {
        if (isMounted) {
          setHasSavedImgbbKey(false);
        }
      }
    };

    loadImgbbSettings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'donor') {
      return;
    }

    let isMounted = true;

    const loadDonorPreferences = async () => {
      try {
        const donorProfile = await donorSearchService.getMyProfile();

        if (!isMounted || !donorProfile) {
          return;
        }

        setDonorPreferences({
          bloodGroup: donorProfile.bloodGroup || user.bloodGroup || 'A+',
          lastDonationDate: donorProfile.lastDonationDate
            ? new Date(donorProfile.lastDonationDate).toISOString().slice(0, 10)
            : '',
          availabilityStatus: donorProfile.availabilityStatus || 'available',
          isPhoneVisible: donorProfile.isPhoneVisible !== false,
          allowDonorChat: donorProfile.allowDonorChat !== false,
          allowPatientChat: donorProfile.allowPatientChat !== false,
        });
      } catch {
        if (isMounted) {
          setDonorPreferences((previous) => ({
            ...previous,
            bloodGroup: user.bloodGroup || previous.bloodGroup || 'A+',
          }));
        }
      }
    };

    loadDonorPreferences();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleChange = (field) => (event) => {
    setFormData((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    const dataUrl = await readFileAsDataUrl(file);
    setPreviewUrl(dataUrl);
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      return null;
    }

    const imageDataUrl = previewUrl;
    const uploaded = await authService.uploadProfileImage({
      imageDataUrl,
      imgbbApiKey: formData.imgbbApiKey,
    });

    return uploaded;
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (user?.role === 'upazila_admin' && formData.imgbbApiKey.trim()) {
        await upazilaSettingsService.saveImgbbApiKey(formData.imgbbApiKey.trim());
        setHasSavedImgbbKey(true);
      }

      const updatedUser = await authService.updateMe({
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
      });

      if (user?.role === 'donor') {
        await donorSearchService.updateMyProfile({
          bloodGroup: donorPreferences.bloodGroup || user.bloodGroup || 'A+',
          lastDonationDate: donorPreferences.lastDonationDate || undefined,
          availabilityStatus: donorPreferences.availabilityStatus,
          isPhoneVisible: donorPreferences.isPhoneVisible,
          allowDonorChat: donorPreferences.allowDonorChat,
          allowPatientChat: donorPreferences.allowPatientChat,
        });
      }

      if (selectedFile) {
        await uploadImage();
      }

      await refreshUser?.();
      setFormData((previous) => ({ ...previous, ...updatedUser }));
      toast.success('প্রোফাইল আপডেট হয়েছে।');
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'প্রোফাইল আপডেট করা যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = useMemo(() => user?.roleLabel || user?.role || 'ব্যবহারকারী', [user]);

  return (
    <section className="feature-page reveal profile-page">
      <header className="feature-header">
        <p className="eyebrow">প্রোফাইল সেটিংস</p>
        <h2>{roleLabel} প্রোফাইল</h2>
      </header>

      <form className="profile-layout" onSubmit={submitProfile}>
        <article className="panel-card profile-card">
          <div className="profile-avatar-row">
            {previewUrl ? (
              <img className="profile-avatar large" src={previewUrl} alt={user?.name || 'প্রোফাইল'} />
            ) : (
              <div className="profile-avatar large placeholder">{user?.name?.slice(0, 1) || 'ব'}</div>
            )}
            <div>
              <h3>{user?.name || 'ব্যবহারকারী'}</h3>
              <p className="muted-text">প্রোফাইল ছবি ও যোগাযোগের তথ্য আপডেট করুন।</p>
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="home-filter-field">
              <label htmlFor="profileName">নাম</label>
              <input id="profileName" value={formData.name} onChange={handleChange('name')} />
            </div>

            <div className="home-filter-field">
              <label htmlFor="profilePhone">মোবাইল</label>
              <input id="profilePhone" value={formData.phone} onChange={handleChange('phone')} />
            </div>

            <div className="home-filter-field profile-full-width">
              <label htmlFor="profileLocation">ঠিকানা</label>
              <input
                id="profileLocation"
                value={formData.location}
                onChange={handleChange('location')}
              />
            </div>

            {user?.role === 'donor' ? (
              <>
                <div className="home-filter-field">
                  <label htmlFor="donorBloodGroup">রক্তের গ্রুপ</label>
                  <select
                    id="donorBloodGroup"
                    value={donorPreferences.bloodGroup}
                    onChange={(event) =>
                      setDonorPreferences((previous) => ({
                        ...previous,
                        bloodGroup: event.target.value,
                      }))
                    }
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="home-filter-field">
                  <label htmlFor="lastDonationDate">শেষ রক্তদানের তারিখ</label>
                  <input
                    id="lastDonationDate"
                    type="date"
                    value={donorPreferences.lastDonationDate}
                    onChange={(event) =>
                      setDonorPreferences((previous) => ({
                        ...previous,
                        lastDonationDate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="home-filter-field profile-full-width">
                  <label htmlFor="availabilityStatus">রক্তদানের জন্য প্রস্তুত</label>
                  <select
                    id="availabilityStatus"
                    value={donorPreferences.availabilityStatus}
                    onChange={(event) =>
                      setDonorPreferences((previous) => ({
                        ...previous,
                        availabilityStatus: event.target.value,
                      }))
                    }
                  >
                    <option value="available" disabled={!donorEligibility.isEligibleForDonation}>
                      প্রস্তুত
                    </option>
                    <option value="temporarily_unavailable">সাময়িক অনুপলব্ধ</option>
                    <option value="unavailable">অনুপলব্ধ</option>
                  </select>
                  {!donorEligibility.isEligibleForDonation ? (
                    <p className="muted-text" style={{ marginTop: '0.35rem' }}>
                      আবার রক্ত দিতে পারবেন{' '}
                      {donorEligibility.nextEligibleDonationDate
                        ? donorEligibility.nextEligibleDonationDate.toLocaleDateString('bn-BD')
                        : '৯০ দিন পরে'}{' '}
                      ({donorEligibility.daysUntilEligible.toLocaleString('bn-BD')} দিন বাকি)।
                    </p>
                  ) : null}
                </div>

                <div className="home-filter-field profile-full-width">
                  <label htmlFor="isPhoneVisible">
                    <input
                      id="isPhoneVisible"
                      type="checkbox"
                      checked={donorPreferences.isPhoneVisible}
                      onChange={(event) =>
                        setDonorPreferences((previous) => ({
                          ...previous,
                          isPhoneVisible: event.target.checked,
                        }))
                      }
                    />{' '}
                    আমার মোবাইল নম্বর অ্যাডমিনদের দেখান
                  </label>
                </div>

                <div className="home-filter-field profile-full-width">
                  <label htmlFor="allowDonorChat">
                    <input
                      id="allowDonorChat"
                      type="checkbox"
                      checked={donorPreferences.allowDonorChat}
                      onChange={(event) =>
                        setDonorPreferences((previous) => ({
                          ...previous,
                          allowDonorChat: event.target.checked,
                        }))
                      }
                    />{' '}
                    রক্তদাতা তালিকা থেকে চ্যাট চালু রাখুন
                  </label>
                </div>

                <div className="home-filter-field profile-full-width">
                  <label htmlFor="allowPatientChat">
                    <input
                      id="allowPatientChat"
                      type="checkbox"
                      checked={donorPreferences.allowPatientChat}
                      onChange={(event) =>
                        setDonorPreferences((previous) => ({
                          ...previous,
                          allowPatientChat: event.target.checked,
                        }))
                      }
                    />{' '}
                    রোগীর তালিকায় চ্যাট অপশন দেখান
                  </label>
                </div>
              </>
            ) : null}

            <div className="home-filter-field profile-full-width">
              <label htmlFor="profileImage">প্রোফাইল ছবি</label>
              <input id="profileImage" type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            {user?.role === 'upazila_admin' ? (
              <div className="home-filter-field profile-full-width">
                <label htmlFor="imgbbApiKey">ImgBB API Key (উপজেলা সেটিং)</label>
                <input
                  id="imgbbApiKey"
                  type="password"
                  value={formData.imgbbApiKey}
                  onChange={handleChange('imgbbApiKey')}
                  placeholder={
                    hasSavedImgbbKey
                      ? 'বর্তমান key সংরক্ষিত আছে; বদলাতে নতুন key দিন'
                      : 'উপজেলা পর্যায়ের ImgBB key সংরক্ষণ করুন'
                  }
                />
              </div>
            ) : null}
          </div>

          <button type="submit" disabled={isSubmitting} className="full-width">
            {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল সংরক্ষণ করুন'}
          </button>
        </article>
      </form>
    </section>
  );
};
