import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../auth/context/AuthContext.jsx';
import { authService } from '../../auth/services/authService.js';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read selected file'));
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

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      location: user.location || '',
      imgbbApiKey: window.localStorage.getItem('imgbbApiKey') || '',
    });
    setPreviewUrl(user.profileImageUrl || '');
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
      if (formData.imgbbApiKey) {
        window.localStorage.setItem('imgbbApiKey', formData.imgbbApiKey);
      }

      const updatedUser = await authService.updateMe({
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
      });

      if (selectedFile) {
        await uploadImage();
      }

      await refreshUser?.();
      setFormData((previous) => ({ ...previous, ...updatedUser }));
      toast.success('Profile updated successfully.');
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = useMemo(() => user?.roleLabel || user?.role || 'User', [user]);

  return (
    <section className="feature-page reveal profile-page">
      <header className="feature-header">
        <p className="eyebrow">Profile Settings</p>
        <h2>{roleLabel} Profile</h2>
      </header>

      <form className="profile-layout" onSubmit={submitProfile}>
        <article className="panel-card profile-card">
          <div className="profile-avatar-row">
            {previewUrl ? (
              <img className="profile-avatar large" src={previewUrl} alt={user?.name || 'Profile'} />
            ) : (
              <div className="profile-avatar large placeholder">{user?.name?.slice(0, 1) || 'U'}</div>
            )}
            <div>
              <h3>{user?.name || 'User'}</h3>
              <p className="muted-text">Update your public profile image and contact details here.</p>
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="home-filter-field">
              <label htmlFor="profileName">Name</label>
              <input id="profileName" value={formData.name} onChange={handleChange('name')} />
            </div>

            <div className="home-filter-field">
              <label htmlFor="profilePhone">Phone</label>
              <input id="profilePhone" value={formData.phone} onChange={handleChange('phone')} />
            </div>

            <div className="home-filter-field profile-full-width">
              <label htmlFor="profileLocation">Location</label>
              <input
                id="profileLocation"
                value={formData.location}
                onChange={handleChange('location')}
              />
            </div>

            <div className="home-filter-field profile-full-width">
              <label htmlFor="profileImage">Profile Image</label>
              <input id="profileImage" type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            {user?.role === 'upazila_admin' ? (
              <div className="home-filter-field profile-full-width">
                <label htmlFor="imgbbApiKey">ImgBB API Key (Upazila Setting)</label>
                <input
                  id="imgbbApiKey"
                  type="password"
                  value={formData.imgbbApiKey}
                  onChange={handleChange('imgbbApiKey')}
                  placeholder="Save upazila-level ImgBB key"
                />
              </div>
            ) : null}
          </div>

          <button type="submit" disabled={isSubmitting} className="full-width">
            {isSubmitting ? 'Saving Profile...' : 'Save Profile'}
          </button>
        </article>
      </form>
    </section>
  );
};
