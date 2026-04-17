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
      toast.error(requestError?.response?.data?.message || 'Failed to load role metadata.');
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
      const message = requestError?.response?.data?.message || 'Failed to load users.';
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
    setForm(BASE_FORM);
    setLocationKey((previous) => previous + 1);
  };

  const submitCreateUser = async (event) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.password || !form.bloodGroup) {
      toast.error('Please fill in the required user fields.');
      return;
    }

    if (!allowedRoles.includes(form.role)) {
      toast.error('You cannot assign that role from your account.');
      return;
    }

    if (!form.divisionId || !form.districtId || !form.upazilaId) {
      toast.error('Please select division, district, and upazila.');
      return;
    }

    const needsAreaType = (managementMeta.rolesRequiringAreaType || []).includes(form.role);
    if (needsAreaType && !form.areaType) {
      toast.error('Please select a union or pouroshava area type.');
      return;
    }

    const needsUnionSelection = (managementMeta.rolesRequiringUnionSelection || []).includes(form.role);
    if (needsUnionSelection && !form.unionId && !form.unionName) {
      toast.error('Please select a union or enter a union name.');
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

      toast.success('User created successfully.');
      resetCreateForm();
      await loadUsers();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to create user.');
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
      toast.success('User role updated.');
      await loadUsers();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to update user role.');
    }
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Management</p>
        <h2>Role Management</h2>
        <p className="role-scope">Manage users according to your scope and hierarchy permissions.</p>
      </header>

      <div className="panel-grid">
        {(managementMeta.roles || []).map((item) => (
          <article className="panel-card" key={item.role}>
            <p className="eyebrow">{item.badge}</p>
            <h3>{item.title}</h3>
            <p className="muted-text">{item.description}</p>
          </article>
        ))}
      </div>

      <article className="panel-card role-management-section">
        <h3>Create User</h3>
        <form className="profile-form-grid" onSubmit={submitCreateUser}>
          <div className="home-filter-field">
            <label htmlFor="userName">Name</label>
            <input id="userName" value={form.name} onChange={handleCreateChange('name')} />
          </div>
          <div className="home-filter-field">
            <label htmlFor="userEmail">Email</label>
            <input id="userEmail" type="email" value={form.email} onChange={handleCreateChange('email')} />
          </div>
          <div className="home-filter-field">
            <label htmlFor="userPassword">Password</label>
            <input id="userPassword" type="password" value={form.password} onChange={handleCreateChange('password')} />
          </div>
          <div className="home-filter-field">
            <label htmlFor="userBloodGroup">Blood Group</label>
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
                <option value="">No assignable roles</option>
              ) : (
                allowedRoles.map((role) => (
                  <option key={role} value={role}>{formatRoleLabel(role)}</option>
                ))
              )}
            </select>
          </div>
          <div className="home-filter-field">
            <label htmlFor="userPhone">Phone</label>
            <input id="userPhone" value={form.phone} onChange={handleCreateChange('phone')} />
          </div>
          <div className="home-filter-field profile-full-width">
            <label htmlFor="userLocation">Location</label>
            <input id="userLocation" value={form.location} onChange={handleCreateChange('location')} />
          </div>
          <div className="profile-full-width">
            <LocationSelector
              mode="filter"
              idPrefix="roleManagement"
              resetKey={locationKey}
              enableAutoDetect={false}
              onChange={handleCreateLocationChange}
            />
          </div>
          <div className="profile-full-width role-management-actions">
            <button type="submit" disabled={isSubmitting || isMetaLoading || allowedRoles.length === 0} className="inline-link-btn">
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </article>

      <article className="panel-card role-management-section">
        <h3>Scoped Users</h3>
        {isLoading ? <p className="muted-text">Loading users...</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
        <div className="table-card role-management-table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Location</th>
                <th>Change Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td data-label="Name">{item.name}</td>
                  <td data-label="Email">{item.email}</td>
                  <td data-label="Role">{formatRoleLabel(item.role)}</td>
                  <td data-label="Location">
                    {[item.locationNames?.division, item.locationNames?.district, item.locationNames?.upazila, item.locationNames?.union]
                      .filter(Boolean)
                      .join(' / ') || 'N/A'}
                  </td>
                  <td data-label="Change Role">
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
                  <td data-label="Action">
                    <button type="button" className="inline-link-btn" onClick={() => submitRoleUpdate(item.id)}>
                      Save Role
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6}>No users found in your scope.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};
