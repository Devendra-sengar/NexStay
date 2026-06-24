import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@nexstay/shared';
import { Toaster } from 'react-hot-toast';

// Shells
import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import GuestPortalLayout from '@/layouts/GuestPortalLayout';
import HostelAdminShell from '@/layouts/HostelAdminShell';
import SuperAdminShell from '@/layouts/SuperAdminShell';

// Auth pages
import LoginPage from '@/pages/auth/Login';
import SignupPage from '@/pages/auth/Signup';
import ForgotPasswordPage from '@/pages/auth/ForgotPassword';
import OtpVerificationPage from '@/pages/auth/OtpVerification';

// 403 page
const ForbiddenPage = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl font-bold text-danger mb-4">403</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
      <p className="text-text-secondary mb-6">You don't have permission to access this page.</p>
      <a href="/" className="btn-primary inline-block">Go Home</a>
    </div>
  </div>
);

// Loading spinner
const LoadingScreen = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-surface-border border-t-primary animate-spin" />
      <p className="text-text-secondary text-sm font-medium">Loading NexStay...</p>
    </div>
  </div>
);

// Guard for HOSTEL_ADMIN routes
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to={`/login?returnUrl=${location.pathname}`} replace />;
  if (user.role !== Role.HOSTEL_ADMIN) return <ForbiddenPage />;
  return <>{children}</>;
};

// Guard for SUPER_ADMIN routes
const SuperAdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user || user.role !== Role.SUPER_ADMIN) return <ForbiddenPage />;
  return <>{children}</>;
};

// Guard for GUEST account portal
const GuestGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to={`/login?returnUrl=${location.pathname}`} replace />;
  return <>{children}</>;
};

// Redirect authenticated users to their dashboard on login/signup
const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (user?.role === Role.HOSTEL_ADMIN) return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === Role.SUPER_ADMIN) return <Navigate to="/superadmin/dashboard" replace />;
  if (user?.role === Role.GUEST) return <Navigate to="/account/bookings" replace />;
  return <>{children}</>;
};

function App() {
  const { isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#fff', color: '#0F172A', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '14px' },
          success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
          error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* ── Auth pages ─────────────────────────── */}
        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
        <Route path="/signup" element={<AuthRedirect><SignupPage /></AuthRedirect>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />

        {/* ── Shell A: Public Marketplace (no auth) */}
        <Route path="/*" element={<MarketplaceLayout />} />

        {/* ── Shell B: Guest Account Portal ───────── */}
        <Route path="/account/*" element={<GuestGuard><GuestPortalLayout /></GuestGuard>} />

        {/* ── Shell C: Hostel Admin ERP ───────────── */}
        <Route path="/admin/*" element={<AdminGuard><HostelAdminShell /></AdminGuard>} />

        {/* ── Shell D: Super Admin Panel ──────────── */}
        <Route path="/superadmin/*" element={<SuperAdminGuard><SuperAdminShell /></SuperAdminGuard>} />

        {/* ── 403 ────────────────────────────────── */}
        <Route path="/403" element={<ForbiddenPage />} />
      </Routes>
    </>
  );
}

export default App;
