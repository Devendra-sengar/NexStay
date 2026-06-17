import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, MessageSquare, User, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getInitials } from '@/lib/utils';

// Pages
import HomeScreen from '@/pages/student/home/HomeScreen';
import SearchPage from '@/pages/student/search/SearchPage';
import PropertyDetailPage from '@/pages/student/property/PropertyDetail';
import MyComplaintsPage from '@/pages/student/complaints/MyComplaints';
import RaiseComplaintPage from '@/pages/student/complaints/RaiseComplaint';
import StudentComplaintDetail from '@/pages/student/complaints/ComplaintDetail';
import BookBedFlow from '@/pages/student/bookings/BookBedFlow';
import MyBookings from '@/pages/student/bookings/MyBookings';
import NotificationBell from '@/components/NotificationBell';


const TABS = [
  { label: 'Home',       icon: Home,           path: '/app/home'       },
  { label: 'Search',     icon: Search,         path: '/app/search'     },
  { label: 'Bookings',   icon: BookOpen,       path: '/app/bookings'   },
  { label: 'Complaints', icon: MessageSquare,  path: '/app/complaints' },
  { label: 'Profile',    icon: User,           path: '/app/profile'    },
];

const EmptyPage = ({ title, emoji }: { title: string; emoji: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
    <div className="text-5xl mb-4">{emoji}</div>
    <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
    <p className="text-text-muted text-sm max-w-xs">This section is coming soon!</p>
    <div className="mt-4 px-4 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-xs font-medium">
      🚧 Coming Soon
    </div>
  </div>
);

// Pages that should hide the tab bar (detail/form views)
const HIDDEN_TAB_PATHS = ['/app/property/', '/app/complaints/raise', '/app/complaints/', '/app/book/'];

export default function StudentShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => { logout(); navigate('/login'); };

  const showTabBar = !HIDDEN_TAB_PATHS.some(path => location.pathname.includes(path));


  return (
    <div className="min-h-screen bg-surface-dark flex justify-center">
      {/* Mobile-first container */}
      <div className="w-full max-w-[430px] flex flex-col relative bg-surface-dark border-x border-surface-border/30 min-h-screen">
        {/* Top App Bar */}
        <header className="flex-shrink-0 bg-surface-card border-b border-surface-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-text-primary font-bold text-base">Nex<span className="text-brand-primary">Stay</span></span>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-xs font-bold shadow-glow"
              title="Logout"
            >
              {getInitials(user?.name || 'S')}
            </button>
          </div>

        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20">
          <Routes>
            {/* Home */}
            <Route path="home"                 element={<HomeScreen />} />

            {/* Search + Property */}
            <Route path="search"               element={<SearchPage />} />
            <Route path="property/:id"         element={<PropertyDetailPage />} />

            {/* Bookings */}
            <Route path="bookings"             element={<MyBookings />} />
            <Route path="book/:propertyId"     element={<BookBedFlow />} />


            {/* Complaints */}
            <Route path="complaints"           element={<MyComplaintsPage />} />
            <Route path="complaints/raise"     element={<RaiseComplaintPage />} />
            <Route path="complaints/:id"       element={<StudentComplaintDetail />} />

            {/* Profile stub */}
            <Route path="profile"              element={<EmptyPage title="My Profile" emoji="👤" />} />

            {/* Default */}
            <Route path="*"                    element={<HomeScreen />} />
          </Routes>
        </main>

        {/* Bottom Tab Bar */}
        {showTabBar && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex items-center bg-surface-card/95 backdrop-blur-md border-t border-surface-border px-2 py-2 z-20">
            {TABS.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => cn(
                  'flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all duration-200',
                  isActive ? 'text-brand-primary' : 'text-text-faint hover:text-text-muted'
                )}
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                      isActive && 'bg-brand-primary/15'
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
