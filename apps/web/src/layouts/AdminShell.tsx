import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, UserCog, CheckSquare,
  BadgeCheck, BookOpen, CreditCard, BarChart3, Settings,
  Bell, Shield, LogOut, BarChart2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getInitials } from '@/lib/utils';

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

const STATS = [
  { label: 'Total Owners', value: '3', color: 'text-brand-primary' },
  { label: 'Properties', value: '6', color: 'text-brand-secondary' },
  { label: 'Students', value: '15', color: 'text-brand-accent' },
  { label: 'Active Bookings', value: '12', color: 'text-status-success' },
];

const EmptyPage = ({ title }: { title: string }) => (
  <div className="page-container">
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6">
        <BarChart2 className="w-8 h-8 text-brand-primary/50" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
      <p className="text-text-muted max-w-sm">This admin section is coming in Phase 1.</p>
      <div className="mt-4 px-4 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-xs font-medium">
        🚧 Phase 1 — Coming Soon
      </div>
    </div>
  </div>
);

export default function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-surface-dark flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-surface-card border-r border-surface-border">
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
            <NavLink key={path} to={path} className={({ isActive }) => cn('nav-item', isActive && 'active')}>
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-surface-card border-b border-surface-border flex items-center px-6 gap-4 flex-shrink-0">
          <h1 className="text-text-primary font-semibold text-sm hidden sm:block">NexStay Admin Panel</h1>

          {/* Quick stats */}
          <div className="hidden xl:flex items-center gap-6 ml-6">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={cn('text-lg font-bold', s.color)}>{s.value}</span>
                <span className="text-text-faint text-xs">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg bg-surface-dark border border-surface-border flex items-center justify-center text-text-muted hover:text-text-primary transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-error rounded-full text-white text-[10px] flex items-center justify-center font-bold">2</span>
            </button>
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
            <Route path="dashboard" element={<EmptyPage title="Admin Dashboard" />} />
            <Route path="owners" element={<EmptyPage title="PG Owners" />} />
            <Route path="students" element={<EmptyPage title="Students" />} />
            <Route path="managers" element={<EmptyPage title="Property Managers" />} />
            <Route path="property-verification" element={<EmptyPage title="Property Verification" />} />
            <Route path="owner-verification" element={<EmptyPage title="Owner Verification" />} />
            <Route path="bookings" element={<EmptyPage title="All Bookings" />} />
            <Route path="payments" element={<EmptyPage title="Payments" />} />
            <Route path="reports" element={<EmptyPage title="Reports & Analytics" />} />
            <Route path="settings" element={<EmptyPage title="Settings" />} />
            <Route path="*" element={<EmptyPage title="Admin Dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
