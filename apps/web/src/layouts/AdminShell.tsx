import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, UserCog, CheckSquare,
  BadgeCheck, BookOpen, CreditCard, BarChart3, Settings,
  Shield, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getInitials } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';
import { useAdminStats } from '@/hooks/useAdmin';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminOwnersPage from '@/pages/admin/AdminOwnersPage';
import AdminStudentsPage from '@/pages/admin/AdminStudentsPage';
import AdminManagersPage from '@/pages/admin/AdminManagersPage';
import AdminPropertyVerificationPage from '@/pages/admin/AdminPropertyVerificationPage';
import AdminOwnerVerificationPage from '@/pages/admin/AdminOwnerVerificationPage';
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Owners', icon: Users, path: '/admin/owners' },
  { label: 'Students', icon: GraduationCap, path: '/admin/students' },
  { label: 'Managers', icon: UserCog, path: '/admin/managers' },
  { label: 'Property Verification', icon: CheckSquare, path: '/admin/property-verification' },
  { label: 'Owner Verification', icon: BadgeCheck, path: '/admin/owner-verification' },
  { label: 'Bookings', icon: BookOpen, path: '/admin/bookings' },
  { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: statsData } = useAdminStats();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => { logout(); navigate('/login'); };

  const stats = statsData?.stats || {
    totalOwners: 0,
    totalProperties: 0,
    totalStudents: 0,
    activeBookings: 0,
  };

  const dynamicStats = [
    { label: 'Total Owners', value: stats.totalOwners.toString(), color: 'text-brand-primary' },
    { label: 'Properties', value: stats.totalProperties.toString(), color: 'text-brand-secondary' },
    { label: 'Students', value: stats.totalStudents.toString(), color: 'text-brand-accent' },
    { label: 'Active Bookings', value: stats.activeBookings.toString(), color: 'text-status-success' },
  ];

  const Sidebar = () => (
    <aside className="w-64 h-full flex flex-col bg-surface-card border-r border-surface-border">
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-text-primary">Nex<span className="text-brand-primary">Stay</span></span>
          <p className="text-[10px] text-brand-primary font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn('nav-item', isActive && 'active')}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-surface-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.name || 'A')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-sm font-medium truncate">{user?.name}</p>
            <p className="text-brand-primary text-xs font-medium">Super Admin</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="text-text-faint hover:text-status-error transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface-dark flex relative">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={cn(
        'lg:hidden fixed left-0 top-0 h-full z-50 transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-surface-card border-b border-surface-border flex items-center gap-4 px-6 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-text-muted hover:text-text-primary focus:outline-none"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <h1 className="text-text-primary font-semibold text-sm hidden sm:block">NexStay Admin Panel</h1>

          {/* Quick stats */}
          <div className="hidden xl:flex items-center gap-6 ml-6">
            {dynamicStats.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={cn('text-lg font-bold', s.color)}>{s.value}</span>
                <span className="text-text-faint text-xs">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2 bg-surface-dark border border-surface-border rounded-lg px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.name || 'A')}
              </div>
              <span className="text-text-primary text-sm font-medium hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="owners" element={<AdminOwnersPage />} />
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="managers" element={<AdminManagersPage />} />
            <Route path="property-verification" element={<AdminPropertyVerificationPage />} />
            <Route path="owner-verification" element={<AdminOwnerVerificationPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="*" element={<AdminDashboardPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

