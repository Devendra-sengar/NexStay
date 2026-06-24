import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, ExternalLink, Inbox, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<string, string> = {
  BOOKING_CONFIRMED: '✅', BOOKING_CANCELLED: '❌', CHECKIN_CONFIRMED: '🏠',
  CHECKOUT_CONFIRMED: '👋', RENT_DUE: '📅', RENT_REMINDER: '⚠️',
  RENT_OVERDUE: '🔴', COMPLAINT_UPDATE: '💬', NEW_BOOKING: '📥',
  NEW_COMPLAINT: '📢', BOOKING: '📖', default: '🔔',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useNotifications(page);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const notifications = data?.data ?? [];
  const unread = data?.unreadCount ?? 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n: any) => {
    if (!n.isRead) markRead.mutate(n._id);
    setOpen(false);
    if (n.linkUrl) navigate(n.linkUrl);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-surface-input transition-colors text-text-secondary hover:text-primary">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-surface-border z-50 flex flex-col max-h-[520px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border flex-shrink-0">
            <h3 className="font-semibold text-text-primary text-sm">Notifications</h3>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={() => markAll.mutate()} disabled={markAll.isPending}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors">
                  {markAll.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-surface-input rounded-lg text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-surface-border">
            {isLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-text-muted">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">All caught up! 🎉</p>
              </div>
            ) : (
              notifications.map((n: any) => (
                <button key={n._id} onClick={() => handleClick(n)}
                  className={cn('w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-surface-input/60 group',
                    !n.isRead && 'bg-blue-50/50 border-l-2 border-l-primary')}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? TYPE_ICON.default}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm leading-snug', !n.isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary')}>{n.title}</p>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-text-muted mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </div>
                  {n.linkUrl && <ExternalLink className="w-3 h-3 text-text-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>
              ))
            )}
          </div>

          {data?.hasNextPage && (
            <div className="px-4 py-2 border-t border-surface-border flex-shrink-0">
              <button onClick={() => setPage(p => p + 1)} className="w-full text-xs text-primary py-1.5 hover:bg-primary/5 rounded-lg transition-colors">
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
