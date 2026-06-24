import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { Home, BookOpen, MessageSquare, User, Building2, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Pages
import AccountDashboardPage from '@/pages/account/DashboardPage';
import AccountBookingsPage from '@/pages/account/BookingsPage';
import AccountComplaintsPage from '@/pages/account/ComplaintsPage';
import AccountProfilePage from '@/pages/account/ProfilePage';

const TAB_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/account/dashboard' },
  { label: 'Bookings', icon: BookOpen, path: '/account/bookings' },
  { label: 'Complaints', icon: MessageSquare, path: '/account/complaints' },
  { label: 'Profile', icon: User, path: '/account/profile' },
  { label: 'Home', icon: Home, path: '/' },
];

export default function GuestPortalLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top navbar — same as marketplace */}
      <header className="sticky top-0 z-50 bg-white border-b border-surface-border shadow-card">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-text-primary">Nex<span className="text-primary">Stay</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-text-secondary hidden sm:block">{user?.name}</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button onClick={logout} className="text-text-muted hover:text-danger transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Routes>
          <Route path="dashboard" element={<AccountDashboardPage />} />
          <Route path="bookings" element={<AccountBookingsPage />} />
          <Route path="complaints" element={<AccountComplaintsPage />} />
          <Route path="profile" element={<AccountProfilePage />} />
          <Route path="*" element={<AccountDashboardPage />} />
        </Routes>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border pb-safe z-50">
        <div className="flex">
          {TAB_ITEMS.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
