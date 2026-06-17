import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Loader2, MessageSquare, BookOpen, CreditCard, Inbox } from 'lucide-react';
import { useUserNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useUserNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markReadMutation.mutateAsync(notification._id);
    }
    setIsOpen(false);

    // Route based on notification type and user role
    const isStudent = user?.role === 'STUDENT';
    const type = notification.type?.toUpperCase();

    if (type === 'COMPLAINT') {
      navigate(isStudent ? '/app/complaints' : '/erp/complaints');
    } else if (type === 'BOOKING') {
      navigate(isStudent ? '/app/bookings' : '/erp/tenants');
    } else if (type === 'RENT') {
      navigate(isStudent ? '/app/home' : '/erp/rent');
    }
  };

  const getIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'COMPLAINT':
        return <MessageSquare className="w-4 h-4 text-brand-accent" />;
      case 'BOOKING':
        return <BookOpen className="w-4 h-4 text-brand-primary" />;
      case 'RENT':
        return <CreditCard className="w-4 h-4 text-status-success" />;
      default:
        return <Bell className="w-4 h-4 text-text-muted" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary border transition-all duration-200',
          isOpen ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary' : 'bg-surface-dark border-surface-border hover:border-surface-border/80'
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[280px] sm:w-[320px] bg-surface-card border border-surface-border/80 rounded-2xl shadow-card z-50 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-3.5 bg-surface-card/50 border-b border-surface-border/50 flex justify-between items-center">
            <span className="text-text-primary font-bold text-xs">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-[10px] text-brand-primary hover:text-brand-primary-hover font-semibold flex items-center gap-1 transition-colors"
                disabled={markAllReadMutation.isPending}
              >
                {markAllReadMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Mark all read
                  </>
                )}
              </button>
            )}
          </div>

          {/* List of items */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-surface-border/30">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center border border-surface-border/50">
                  <Inbox className="w-5 h-5 text-text-faint" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted">All Caught Up! 🔔</p>
                  <p className="text-[10px] text-text-faint">You have no new notifications.</p>
                </div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'p-3 flex gap-3 cursor-pointer hover:bg-surface-dark transition-colors relative',
                    !n.isRead && 'bg-brand-primary/5'
                  )}
                >
                  {/* Left Icon */}
                  <div className="w-8 h-8 rounded-lg bg-surface-dark border border-surface-border/50 flex items-center justify-center flex-shrink-0">
                    {getIcon(n.type)}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={cn(
                      'text-xs text-text-primary truncate',
                      !n.isRead ? 'font-semibold' : 'font-medium text-text-muted'
                    )}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-text-faint mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[9px] text-text-faint/80 block mt-1">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary absolute right-3 top-3.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
