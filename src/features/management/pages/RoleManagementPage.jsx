import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { userService } from '../../../services/userService.js';

const BASE_FORM = {
  name: '',
  email: '',
  password: '',
  role: '',
  bloodGroup: 'A+',
  phone: '',
  location: '',
  divisionId: '',
  districtId: '',
  upazilaId: '',
  areaType: '',
  unionId: '',
  unionName: '',
  wardNumber: '',
};

const uniqueRoles = (roles) => [...new Set(roles.filter(Boolean))];

export const RoleManagementPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(BASE_FORM);
  const [locationKey, setLocationKey] = useState(0);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [managementMeta, setManagementMeta] = useState({
    roles: [],
    assignableRoles: [],
    rolesRequiringAreaType: [],
    rolesRequiringUnionSelection: [],
    defaultCreateRole: null,
  });

  const allowedRoles = useMemo(() => managementMeta.assignableRoles || [], [managementMeta.assignableRoles]);

  const roleLabelMap = useMemo(() => {
    const map = new Map();
    (managementMeta.roles || []).forEach((item) => {
      map.set(item.role, item.title || item.role);
    });
    return map;
  }, [managementMeta.roles]);

  const formatRoleLabel = (value) => roleLabelMap.get(value) || value;

  const loadManagementMeta = async () => {
    setIsMetaLoading(true);

    try {
      const response = await userService.getUserManagementMeta();
      const data = response.data || {};

      setManagementMeta({
        roles: data.roles || [],
        assignableRoles: data.assignableRoles || [],
        rolesRequiringAreaType: data.rolesRequiringAreaType || [],
        rolesRequiringUnionSelection: data.rolesRequiringUnionSelection || [],
        defaultCreateRole: data.defaultCreateRole || null,
      });

      setForm((previous) => ({
        ...previous,
        role: data.defaultCreateRole || data.assignableRoles?.[0] || previous.role || '',
      }));
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Role তথ্য লোড করা যায়নি।');
    } finally {
      setIsMetaLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await userService.getUsers();
      const data = response.data || [];
      setUsers(data);

      const drafts = {};
      data.forEach((item) => {
        drafts[item.id] = item.role;
      });
      setRoleDrafts(drafts);
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'ইউজার তালিকা লোড করা যায়নি।';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadManagementMeta();
    loadUsers();
  }, []);

  useEffect(() => {
    if (!managementMeta.defaultCreateRole) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      role: previous.role || managementMeta.defaultCreateRole,
    }));
  }, [managementMeta.defaultCreateRole]);

  const handleCreateChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleCreateLocationChange = (value) => {
    setForm((previous) => ({
      ...previous,
      divisionId: value.divisionId,
      districtId: value.districtId,
      upazilaId: value.upazilaId,
      areaType: value.areaType,
      unionId: value.unionId,
      unionName: value.unionName,
      wardNumber: value.wardNumber,
    }));
  };

  const resetCreateForm = () => {
    setForm((previous) => ({ ...BASE_FORM, role: managementMeta.defaultCreateRole || allowedRoles[0] || previous.role || '' }));
    setLocationKey((previous) => previous + 1);
  };

  const closeCreateDialog = () => {
    if (!isSubmitting) {
      setIsCreateDialogOpen(false);
    }
  };

  const submitCreateUser = async (event) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.password || !form.bloodGroup) {
      toast.error('ইউজারের প্রয়োজনীয় তথ্য পূরণ করুন।');
      return;
    }

    if (!allowedRoles.includes(form.role)) {
      toast.error('আপনার অ্যাকাউন্ট থেকে এই role দেওয়া যাবে না।');
      return;
    }

    if (!form.divisionId || !form.districtId || !form.upazilaId) {
      toast.error('বিভাগ, জেলা ও উপজেলা নির্বাচন করুন।');
      return;
    }

    const needsAreaType = (managementMeta.rolesRequiringAreaType || []).includes(form.role);
    if (needsAreaType && !form.areaType) {
      toast.error('ইউনিয়ন বা পৌরসভার ধরন নির্বাচন করুন।');
      return;
    }

    const needsUnionSelection = (managementMeta.rolesRequiringUnionSelection || []).includes(form.role);
    if (needsUnionSelection && !form.unionId && !form.unionName) {
      toast.error('ইউনিয়ন নির্বাচন করুন বা ইউনিয়নের নাম লিখুন।');
      return;
    }

    try {
      setIsSubmitting(true);

      await userService.createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        bloodGroup: form.bloodGroup,
        divisionId: form.divisionId,
        districtId: form.districtId,
        upazilaId: form.upazilaId,
        areaType: form.areaType,
        unionId: form.unionId || undefined,
        unionName: form.unionName || undefined,
        wardNumber: form.wardNumber || undefined,
        location: form.location || undefined,
        phone: form.phone || undefined,
      });

      toast.success('ইউজার তৈরি হয়েছে।');
      resetCreateForm();
      setIsCreateDialogOpen(false);
      await loadUsers();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'ইউজার তৈরি করা যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRoleUpdate = async (userId) => {
    const nextRole = roleDrafts[userId];
    if (!nextRole) {
      return;
    }

    try {
      await userService.updateUserRole(userId, { role: nextRole });
      toast.success('ইউজারের role আপডেট হয়েছে।');
      await loadUsers();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'ইউজারের role আপডেট করা যায়নি।');
    }
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <div>
          <p className="eyebrow">ব্যবস্থাপনা</p>
          <h2>Role ব্যবস্থাপনা</h2>
        </div>
        <button type="button" className="inline-link-btn" onClick={() => setIsCreateDialogOpen(true)} disabled={isMetaLoading || allowedRoles.length === 0}>
          ইউজার তৈরি করুন
        </button>
      </header>

      {isCreateDialogOpen ? (
        <div className="app-dialog-backdrop" role="presentation" onMouseDown={closeCreateDialog}>
          <section className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="createUserDialogTitle" onMouseDown={(event) => event.stopPropagation()}>
            <div className="app-dialog-header">
              <div>
                <p className="eyebrow">নতুন ইউজার</p>
                <h3 id="createUserDialogTitle">ইউজার তৈরি করুন</h3>
              </div>
              <button type="button" className="app-dialog-close" aria-label="Close create user dialog" onClick={closeCreateDialog} disabled={isSubmitting}>
                ×
              </button>
            </div>

            <form className="app-dialog-form" onSubmit={submitCreateUser}>
              <div className="app-dialog-grid">
                <div className="home-filter-field">
                  <label htmlFor="userName">নাম</label>
                  <input id="userName" value={form.name} onChange={handleCreateChange('name')} />
                </div>
                <div className="home-filter-field">
                  <label htmlFor="userEmail">ইমেইল</label>
                  <input id="userEmail" type="email" value={form.email} onChange={handleCreateChange('email')} />
                </div>
                <div className="home-filter-field">
                  <label htmlFor="userPassword">পাসওয়ার্ড</label>
                  <input id="userPassword" type="password" value={form.password} onChange={handleCreateChange('password')} />
                </div>
                <div className="home-filter-field">
                  <label htmlFor="userBloodGroup">রক্তের গ্রুপ</label>
                  <select id="userBloodGroup" value={form.bloodGroup} onChange={handleCreateChange('bloodGroup')}>
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
                  <label htmlFor="userRole">Role</label>
                  <select id="userRole" value={form.role} onChange={handleCreateChange('role')} disabled={isMetaLoading || allowedRoles.length === 0}>
                    {allowedRoles.length === 0 ? (
                      <option value="">দেওয়ার মতো role নেই</option>
                    ) : (
                      allowedRoles.map((role) => (
                        <option key={role} value={role}>{formatRoleLabel(role)}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="home-filter-field">
                  <label htmlFor="userPhone">মোবাইল</label>
                  <input id="userPhone" value={form.phone} onChange={handleCreateChange('phone')} />
                </div>
                <div className="home-filter-field app-dialog-full">
                  <label htmlFor="userLocation">ঠিকানা</label>
                  <input id="userLocation" value={form.location} onChange={handleCreateChange('location')} />
                </div>
              </div>

              <LocationSelector
                mode="filter"
                idPrefix="roleManagement"
                resetKey={locationKey}
                enableAutoDetect={false}
                onChange={handleCreateLocationChange}
              />

              <div className="app-dialog-actions">
                <button type="button" className="inline-link-btn ghost-action" onClick={closeCreateDialog} disabled={isSubmitting}>
                  বন্ধ করুন
                </button>
                <button type="submit" disabled={isSubmitting || isMetaLoading || allowedRoles.length === 0} className="inline-link-btn">
                  {isSubmitting ? 'তৈরি হচ্ছে...' : 'ইউজার তৈরি করুন'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <article className="panel-card role-management-section">
        <h3>আপনার এলাকার ইউজার</h3>
        {isLoading ? <p className="muted-text">ইউজার লোড হচ্ছে...</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
        <div className="table-card role-management-table-card">
          <table>
            <thead>
              <tr>
                <th>নাম</th>
                <th>ইমেইল</th>
                <th>Role</th>
                <th>লোকেশন</th>
                <th>Role পরিবর্তন</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td data-label="নাম">{item.name}</td>
                  <td data-label="ইমেইল">{item.email}</td>
                  <td data-label="Role">{formatRoleLabel(item.role)}</td>
                  <td data-label="লোকেশন">
                    {[item.locationNames?.division, item.locationNames?.district, item.locationNames?.upazila, item.locationNames?.union]
                      .filter(Boolean)
                      .join(' / ') || 'উল্লেখ নেই'}
                  </td>
                  <td data-label="Role পরিবর্তন">
                    <select
                      value={roleDrafts[item.id] || item.role}
                      onChange={(event) =>
                        setRoleDrafts((previous) => ({
                          ...previous,
                          [item.id]: event.target.value,
                        }))
                      }
                    >
                      {uniqueRoles([item.role, ...allowedRoles]).map((role) => (
                        <option key={role} value={role}>{formatRoleLabel(role)}</option>
                      ))}
                    </select>
                  </td>
                  <td data-label="অ্যাকশন">
                    <button type="button" className="inline-link-btn" onClick={() => submitRoleUpdate(item.id)}>
                      Role সংরক্ষণ
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6}>আপনার এলাকায় কোনো ইউজার পাওয়া যায়নি।</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};
