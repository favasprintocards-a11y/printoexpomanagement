import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

export default function Header({ onManageUsers }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleColor = user.role === 'Admin' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-lime/30 text-brand-lime-dark';

  return (
    <header className="sticky top-0 z-40 glass border-b border-gray-200/50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Printo Expo Logo"
            className="h-10 w-auto object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">Printo Expo Management</h1>
            <p className="text-[10px] font-medium text-gray-400 -mt-0.5 tracking-wide uppercase">Visitor Management</p>
          </div>
        </div>

        {/* User info & logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-700">{user.displayName}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleColor}`}>
              {user.role}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
               style={{ background: 'linear-gradient(135deg, #F26622, #CBDB3A)' }}>
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          {user.role === 'Admin' && onManageUsers && (
            <button
              id="manage-users-btn"
              onClick={onManageUsers}
              className="p-2 rounded-lg text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 transition-all duration-200"
              title="Manage Users"
            >
              <Icon.UserPlus className="w-5 h-5" />
            </button>
          )}
          <button
            id="logout-btn"
            onClick={logout}
            className="ml-1 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
            title="Logout"
          >
            <Icon.Logout className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
