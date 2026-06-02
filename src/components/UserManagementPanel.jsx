import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import API from '../api/axios';
import Icon from './Icons';

export default function UserManagementPanel({ entries = [], onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmUser, setConfirmUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Settings Tab state
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'expos'

  // New user form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Password reset states
  const [editingUser, setEditingUser] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Expo settings states
  const [expos, setExpos] = useState([]);
  const [loadingExpos, setLoadingExpos] = useState(false);
  const [newExpoName, setNewExpoName] = useState('');
  const [expoError, setExpoError] = useState('');
  const [expoSuccess, setExpoSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchExpos();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/users');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpos = async () => {
    setLoadingExpos(true);
    setExpoError('');
    try {
      const { data } = await API.get('/expos');
      setExpos(data);
    } catch (err) {
      setExpoError(err.response?.data?.message || 'Failed to fetch expos');
    } finally {
      setLoadingExpos(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await API.delete(`/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
      setConfirmUser(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setConfirmUser(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    const uname = newUsername.trim().toLowerCase();
    if (!uname) { setCreateError('Username is required'); return; }
    if (uname.length < 3) { setCreateError('Username must be at least 3 characters'); return; }
    if (!/^[a-z0-9_]+$/.test(uname)) { setCreateError('Username: lowercase letters, numbers, underscores only'); return; }
    if (newPassword.length < 6) { setCreateError('Password must be at least 6 characters'); return; }

    setCreateLoading(true);
    try {
      const { data } = await API.post('/users', { username: uname, password: newPassword });
      setUsers((prev) => [...prev, data]);
      setCreateSuccess(`User @${uname} created successfully!`);
      setNewUsername('');
      setNewPassword('');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (editPassword.length < 6) {
      setEditError('Password must be at least 6 characters');
      return;
    }

    setEditLoading(true);
    try {
      await API.put(`/users/${editingUser._id}`, { password: editPassword });
      setEditSuccess(`Password for @${editingUser.username} updated!`);
      setEditPassword('');
      setTimeout(() => {
        setEditingUser(null);
        setEditSuccess('');
      }, 1000);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateExpo = async (e) => {
    e.preventDefault();
    setExpoError('');
    setExpoSuccess('');

    const name = newExpoName.trim();
    if (!name) { setExpoError('Expo name is required'); return; }

    try {
      const { data } = await API.post('/expos', { name });
      setExpos((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setExpoSuccess(`Expo "${name}" added successfully!`);
      setNewExpoName('');
    } catch (err) {
      setExpoError(err.response?.data?.message || 'Failed to add expo');
    }
  };

  const handleDeleteExpo = async (id) => {
    setExpoError('');
    setExpoSuccess('');
    try {
      await API.delete(`/expos/${id}`);
      setExpos(expos.filter((expo) => expo._id !== id));
    } catch (err) {
      setExpoError(err.response?.data?.message || 'Failed to delete expo');
    }
  };

  const getUserEntries = (username) => {
    return entries.filter((e) => e.addedBy?.username === username);
  };

  const exportUserExcel = (targetUser, userEntries) => {
    const data = userEntries.map((e, i) => ({
      '#': i + 1,
      'Name': e.personName,
      'Type': e.type,
      'Company': e.companyName,
      'Mobile': e.mobile,
      'Location': e.location || '',
      'Expo': e.expoName || '',
      'Date & Time': new Date(e.dateTime).toLocaleString('en-IN')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 4 }, { wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visitor Logs');
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `visitor_logs_${targetUser.username}_${today}.xlsx`);
  };

  const roleBadge = (role) =>
    role === 'Admin' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-lime/30 text-brand-lime-dark';

  // ─── Selected User Detail View ──────────────────────────────
  if (selectedUser) {
    const userEntries = getUserEntries(selectedUser.username);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
           style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-fade-in-up max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center"
                title="Back to Users"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
              <div>
                <h3 className="text-lg font-bold text-gray-800">@{selectedUser.username}'s Logs</h3>
                <p className="text-xs text-gray-400">{userEntries.length} visitor entries found</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportUserExcel(selectedUser, userEntries)}
                disabled={userEntries.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-40"
              >
                <Icon.Download className="w-3.5 h-3.5" />
                Excel
              </button>
              <button type="button" onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <Icon.Close className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1 p-6">
            {userEntries.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <p className="font-medium">No visitor logs recorded by this user</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <th className="px-3 py-2">#</th>
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Company</th>
                    <th className="px-2 py-2">Mobile</th>
                    <th className="px-2 py-2">Location</th>
                    <th className="px-2 py-2">Expo</th>
                    <th className="px-2 py-2">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userEntries.map((e, index) => (
                    <tr key={e._id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 text-gray-400 font-mono">{index + 1}</td>
                      <td className="px-2 py-2.5 font-semibold text-gray-800">{e.personName}</td>
                      <td className="px-2 py-2.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          e.type === 'Reseller' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-gray-600">{e.companyName}</td>
                      <td className="px-2 py-2.5 text-gray-600 font-mono">{e.mobile}</td>
                      <td className="px-2 py-2.5 text-gray-600">{e.location}</td>
                      <td className="px-2 py-2.5 text-gray-650 font-semibold">{e.expoName}</td>
                      <td className="px-2 py-2.5 text-gray-500 whitespace-nowrap">
                        {new Date(e.dateTime).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Admin Settings View ──────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
         style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-fade-in-up max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-light flex items-center justify-center shadow-md shadow-brand-orange/20">
              <Icon.Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Admin Settings</h3>
              <p className="text-xs text-gray-400">Configure application resources</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <Icon.Close className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'users' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Users Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expos')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'expos' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Expo Names
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' ? (
          <>
            {/* Create User Form */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add New User (Admin Only)</h4>
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:border-brand-orange"
                      placeholder="Username"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:border-brand-orange"
                      placeholder="Password (min 6 chars)"
                      required
                    />
                  </div>
                </div>
                
                {createError && (
                  <p className="text-red-500 text-xs font-medium">{createError}</p>
                )}
                {createSuccess && (
                  <p className="text-green-600 text-xs font-medium">{createSuccess}</p>
                )}

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={createLoading || !newUsername || !newPassword}
                    className="px-4 py-2 rounded-xl text-white font-semibold text-xs tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-brand-orange/30 bg-brand-orange"
                    style={{ background: 'linear-gradient(135deg, #F26622, #D9551A)' }}
                  >
                    {createLoading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>

            {/* User list */}
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {error && (
                <div className="mb-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">
                  <Icon.AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <Icon.Spinner className="animate-spin w-8 h-8 text-brand-orange mb-2" />
                  <span className="text-sm font-medium">Loading users…</span>
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <p className="font-medium">No users found</p>
                </div>
              ) : (
                users.map((u) => {
                  const userEntries = getUserEntries(u.username);
                  return (
                    <div key={u._id}
                      className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                             style={{ background: 'linear-gradient(135deg, #F26622, #CBDB3A)' }}>
                          {u.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800">{u.displayName}</p>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${roleBadge(u.role)}`}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">@{u.username} · {userEntries.length} {userEntries.length === 1 ? 'entry' : 'entries'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* View Entries Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 transition-all flex items-center justify-center"
                          title="View Entries"
                        >
                          <Icon.Eye className="w-4 h-4" />
                        </button>
                        {/* Excel Download Button */}
                        <button
                          type="button"
                          onClick={() => exportUserExcel(u, userEntries)}
                          disabled={userEntries.length === 0}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center"
                          title="Download Excel"
                        >
                          <Icon.Download className="w-4 h-4" />
                        </button>
                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => { setEditingUser(u); setEditPassword(''); setEditError(''); setEditSuccess(''); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 transition-all flex items-center justify-center"
                          title="Reset Password"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                          </svg>
                        </button>
                        {u.username !== 'admin' && (
                          <button type="button" onClick={() => setConfirmUser(u)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                            title="Delete User"
                          >
                            <Icon.Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <>
            {/* Create Expo Form */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add New Expo</h4>
              <form onSubmit={handleCreateExpo} className="flex gap-2">
                <input
                  type="text"
                  value={newExpoName}
                  onChange={(e) => setNewExpoName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:border-brand-orange"
                  placeholder="e.g. Printo Expo Management Mumbai 2026"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-semibold text-xs tracking-wide transition-all bg-brand-orange"
                  style={{ background: 'linear-gradient(135deg, #F26622, #D9551A)' }}
                >
                  Add
                </button>
              </form>
              {expoError && <p className="text-red-500 text-xs mt-1 font-medium">{expoError}</p>}
              {expoSuccess && <p className="text-green-600 text-xs mt-1 font-medium">{expoSuccess}</p>}
            </div>

            {/* Expo List */}
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {loadingExpos ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <Icon.Spinner className="animate-spin w-8 h-8 text-brand-orange mb-2" />
                  <span className="text-sm font-medium">Loading expos…</span>
                </div>
              ) : expos.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <p className="font-medium">No expo names registered</p>
                </div>
              ) : (
                expos.map((expo) => (
                  <div key={expo._id} className="flex items-center justify-between py-3 border-b border-gray-55 last:border-0">
                    <span className="text-sm font-semibold text-gray-800">{expo.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpo(expo._id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                      title="Delete Expo"
                    >
                      <Icon.Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirm delete user */}
      {confirmUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Icon.Trash className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Delete User</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">Remove user <strong>@{confirmUser.username}</strong>? Their visitor records will remain.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmUser(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="button" onClick={() => handleDelete(confirmUser._id)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md shadow-red-500/20">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Reset Password</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">Set a new password for user <strong>@{editingUser.username}</strong>.</p>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:border-brand-orange"
                  placeholder="New Password (min 6 chars)"
                  required
                  autoFocus
                />
              </div>

              {editError && (
                <p className="text-red-500 text-xs font-medium">{editError}</p>
              )}
              {editSuccess && (
                <p className="text-green-600 text-xs font-medium">{editSuccess}</p>
              )}

              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={editLoading || editPassword.length < 6}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark transition-colors disabled:opacity-50">
                  {editLoading ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
