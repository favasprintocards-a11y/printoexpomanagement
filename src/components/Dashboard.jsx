import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import StatsCards from './StatsCards';
import VisitorForm from './VisitorForm';
import VisitorTable from './VisitorTable';
import UserManagementPanel from './UserManagementPanel';
import ExpoSelectionScreen from './ExpoSelectionScreen';
import Toast from './Toast';
import Icon from './Icons';

export default function Dashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [showUserMgmt, setShowUserMgmt] = useState(false);
  const [selectedExpo, setSelectedExpo] = useState(null);

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/visitors');
      setEntries(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch visitor entries');
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (formData) => {
    try {
      const { data } = await API.post('/visitors', formData);
      setEntries((prev) => [data, ...prev]);
      setToast({ message: 'Visitor added successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to add visitor', type: 'error' });
    }
  };

  const deleteEntry = async (id) => {
    try {
      await API.delete(`/visitors/${id}`);
      setEntries((prev) => prev.filter((e) => e._id !== id));
      setToast({ message: 'Entry deleted', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete entry', type: 'error' });
    }
  };

  const deleteMultipleEntries = async (ids) => {
    try {
      await API.post('/visitors/batch-delete', { ids });
      setEntries((prev) => prev.filter((e) => !ids.includes(e._id)));
      setToast({ message: `${ids.length} entries deleted successfully!`, type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete entries', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Header onManageUsers={() => setShowUserMgmt(true)} />

      {/* Background accents */}
      <div className="fixed top-0 left-0 w-full h-80 pointer-events-none"
           style={{ background: 'linear-gradient(180deg, rgba(242,102,34,0.03) 0%, transparent 100%)' }}></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400">
            <Icon.Spinner className="animate-spin w-10 h-10 text-brand-orange mb-3" />
            <span className="font-semibold text-sm">Loading…</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="flex items-center justify-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl max-w-md mx-auto">
              <Icon.AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchVisitors} className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark transition-all shadow-md">
              Retry
            </button>
          </div>
        ) : selectedExpo ? (
          <>
            {/* Expo breadcrumb bar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedExpo(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 transition-all"
                  title="Back to Expo List"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Expo</p>
                  <h2 className="text-lg font-extrabold text-gray-800 leading-tight">{selectedExpo}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedExpo(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-orange border border-brand-orange/30 hover:bg-brand-orange/10 transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Change Expo
              </button>
            </div>

            <VisitorForm onSubmit={addEntry} selectedExpo={selectedExpo} />
            <VisitorTable entries={entries} user={user} onDelete={deleteEntry} onDeleteMultiple={deleteMultipleEntries} selectedExpo={selectedExpo} />
            <StatsCards entries={entries} selectedExpo={selectedExpo} />
          </>
        ) : (
          <ExpoSelectionScreen entries={entries} onSelect={setSelectedExpo} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-300 font-medium no-print">
        © {new Date().getFullYear()} Printo Expo · Visitor Management System
      </footer>

      {showUserMgmt && <UserManagementPanel entries={entries} onClose={() => setShowUserMgmt(false)} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
