import { useState, useEffect } from 'react';
import API from '../api/axios';
import Icon from './Icons';

const GRADIENTS = [
  'from-brand-orange to-orange-400',
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-yellow-400',
  'from-rose-500 to-red-400',
  'from-cyan-500 to-sky-500',
  'from-violet-500 to-purple-400',
];

export default function ExpoSelectionScreen({ entries = [], onSelect }) {
  const [expos, setExpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpos();
  }, []);

  const fetchExpos = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/expos');
      setExpos(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expos');
    } finally {
      setLoading(false);
    }
  };

  const expoCount = (name) => entries.filter((e) => e.expoName === name).length;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400">
        <Icon.Spinner className="animate-spin w-10 h-10 text-brand-orange mb-3" />
        <span className="font-semibold text-sm">Loading expos…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <div className="flex items-center justify-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl max-w-md mx-auto">
          <Icon.AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchExpos}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark transition-all shadow-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <img
          src="/logo.png"
          alt="Printo Expo Logo"
          className="h-12 w-auto object-contain"
        />
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Expo Events</h2>
          <p className="text-xs text-gray-400 mt-1">Select an expo to start logging visitors</p>
        </div>
      </div>

      {expos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <p className="text-gray-500 font-semibold">No expos available</p>
          <p className="text-xs text-gray-300 mt-1">Ask an admin to add expo names in Settings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {expos.map((expo, i) => {
            const count = expoCount(expo.name);
            return (
              <button
                key={expo._id}
                onClick={() => onSelect(expo.name)}
                className={`relative overflow-hidden w-full text-left p-6 rounded-2xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} text-white shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-200 animate-fade-in`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Decorative background icon */}
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>

                <p className="font-extrabold text-xl leading-snug mb-2 pr-8">{expo.name}</p>
                <p className="text-xs opacity-80 font-medium">
                  {count} visitor{count !== 1 ? 's' : ''} logged
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
