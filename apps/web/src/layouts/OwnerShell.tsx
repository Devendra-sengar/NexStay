import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, BedDouble, Users, BookOpen,
  CreditCard, Receipt, MessageSquare, BarChart3, Settings,
  ChevronLeft, ChevronRight, Bell, Search, LogOut, Menu, X, BarChart2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getInitials } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';


// Pages
import DashboardPage from '@/pages/erp/Dashboard';
import PropertyListPage from '@/pages/erp/properties/PropertyList';
import PropertyFormPage from '@/pages/erp/properties/PropertyForm';
import PropertyDetailPage from '@/pages/erp/properties/PropertyDetail';
import BillingPage from '@/pages/erp/settings/BillingPage';
import TenantListPage from '@/pages/erp/tenants/TenantList';
import TenantDetailPage from '@/pages/erp/tenants/TenantDetail';
import CheckInWizard from '@/pages/erp/tenants/CheckInWizard';
import CheckOutWizard from '@/pages/erp/tenants/CheckOutWizard';
import RentDashboardPage from '@/pages/erp/rent/RentDashboard';
import RentReceiptPage from '@/pages/erp/rent/RentReceipt';
import ExpensesPage from '@/pages/erp/expenses/ExpensesPage';
import ComplaintsListPage from '@/pages/erp/complaints/ComplaintsList';
import OwnerComplaintDetail from '@/pages/erp/complaints/ComplaintDetail';
import ReportsPage from '@/pages/erp/reports/ReportsPage';

const EmptyPage = ({ title }: { title: string }) => (
  <div className="page-container">
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6">
        <BarChart2 className="w-8 h-8 text-brand-primary/50" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
      <p className="text-text-muted max-w-sm">This section is coming in the next phase.</p>
      <div className="mt-4 px-4 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-xs font-medium">
        🚧 Coming in Phase 2+
      </div>
    </div>
  </div>
);

type NavItem = { label: string; icon: React.ElementType; path: string; ownerOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/erp/dashboard' },
  { label: 'Properties', icon: Building2, path: '/erp/properties' },
  { label: 'Rooms & Beds', icon: BedDouble, path: '/erp/rooms' },
  { label: 'Tenants', icon: Users, path: '/erp/tenants' },
  { label: 'Bookings', icon: BookOpen, path: '/erp/bookings' },
  { label: 'Rent', icon: CreditCard, path: '/erp/rent' },
  { label: 'Expenses', icon: Receipt, path: '/erp/expenses' },
  { label: 'Complaints', icon: MessageSquare, path: '/erp/complaints' },
  { label: 'Reports', icon: BarChart3, path: '/erp/reports' },
  { label: 'Settings', icon: Settings, path: '/erp/settings' },
  { label: 'Billing', icon: CreditCard, path: '/erp/billing', ownerOnly: true },
];

export default function OwnerShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.role === 'PG_OWNER';

  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleNav = NAV_ITEMS.filter(item => !item.ownerOnly || isOwner);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={cn(
      'flex flex-col bg-surface-card border-r border-surface-border transition-all duration-300 h-full',
      mobile ? 'w-64' : collapsed ? 'w-[72px]' : 'w-[260px]'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-5 border-b border-surface-border', collapsed && !mobile && 'justify-center px-0 py-5')}>
        <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0 shadow-glow">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <span className="text-lg font-bold text-text-primary">Nex<span className="text-brand-primary">Stay</span></span>
            <p className="text-[10px] text-text-faint capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              'nav-item',
              isActive && 'active',
              collapsed && !mobile && 'justify-center px-0'
            )}
            title={collapsed && !mobile ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}

        {/* RBAC note for manager */}
        {!isOwner && !collapsed && (
          <div className="mt-4 mx-1 px-3 py-2 bg-surface-dark rounded-lg border border-surface-border/50">
            <p className="text-text-faint text-[10px] leading-relaxed">
              🔒 Billing & Delete actions are restricted to PG Owners.
            </p>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className={cn('p-3 border-t border-surface-border', collapsed && !mobile && 'flex justify-center')}>
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.name || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-medium truncate">{user?.name}</p>
              <p className="text-text-faint text-xs truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-text-faint hover:text-status-error transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="text-text-faint hover:text-status-error transition-colors p-2" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface-dark flex">
      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />}

      {/* Mobile sidebar */}
      <div className={cn('lg:hidden fixed left-0 top-0 h-full z-50 transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <Sidebar mobile />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute z-10 w-6 h-6 rounded-full bg-surface-border hover:bg-brand-primary transition-colors items-center justify-center shadow-card"
        style={{ left: collapsed ? '58px' : '246px', top: '44px' }}
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
      </button>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-surface-card border-b border-surface-border flex items-center gap-4 px-6 flex-shrink-0">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-text-muted hover:text-text-primary">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 bg-surface-dark border border-surface-border rounded-lg px-3 py-2 hover:border-brand-primary/30 transition-colors">
            <Search className="w-4 h-4 text-text-faint" />
            <input placeholder="Search tenants, rooms, complaints..." className="bg-transparent text-sm text-text-primary placeholder-text-faint outline-none flex-1" />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2 bg-surface-dark border border-surface-border rounded-lg px-2.5 py-1.5 cursor-pointer hover:border-brand-primary/30 transition-colors">

              <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.name || 'U')}
              </div>
              <span className="text-text-primary text-sm font-medium hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Properties */}
            <Route path="properties" element={<PropertyListPage />} />
            <Route path="properties/new" element={<PropertyFormPage />} />
            <Route path="properties/:id" element={<PropertyDetailPage />} />
            <Route path="properties/:id/edit" element={<PropertyFormPage />} />

            {/* Owner-only */}
            <Route path="billing" element={isOwner ? <BillingPage /> : <EmptyPage title="Access Denied" />} />

            {/* Tenants */}
            <Route path="tenants" element={<TenantListPage />} />
            <Route path="tenants/checkin/:bookingId" element={<CheckInWizard />} />
            <Route path="tenants/checkout/:bookingId" element={<CheckOutWizard />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />
            <Route path="bookings" element={<EmptyPage title="Bookings" />} />
            <Route path="bookings/:id" element={<EmptyPage title="Booking Detail" />} />
            {/* Rent */}
            <Route path="rent" element={<RentDashboardPage />} />
            <Route path="rent/receipt/:id" element={<RentReceiptPage />} />

            {/* Expenses */}
            <Route path="expenses" element={<ExpensesPage />} />
            {/* Complaints */}
            <Route path="complaints" element={<ComplaintsListPage />} />
            <Route path="complaints/:id" element={<OwnerComplaintDetail />} />
            
            {/* Phase 2+ stubs */}
            <Route path="rooms" element={<EmptyPage title="Rooms & Beds Overview" />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<EmptyPage title="Settings" />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
