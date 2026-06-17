import { Building2, BedDouble, Users, TrendingUp, DollarSign, AlertCircle, Loader2, Home } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useDashboardStats, useRevenueChart, useRecentBookings, useRecentComplaints } from '@/hooks/useDashboard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const StatCard = ({
  title, value, icon: Icon, color, subtext
}: {
  title: string; value: string | number; icon: React.ElementType; color: string; subtext?: string;
}) => (
  <div className="glass-card rounded-xl p-5 hover:border-brand-primary/20 transition-all duration-200 hover:-translate-y-0.5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-text-muted text-sm font-medium">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        {subtext && <p className="text-text-faint text-xs mt-1">{subtext}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace(')', '/15)').replace('(', '(')} `}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 shadow-card">
      <p className="text-text-muted text-xs mb-1">{label}</p>
      <p className="text-brand-primary font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="w-12 h-12 rounded-full bg-surface-dark flex items-center justify-center mb-3">
      <Home className="w-5 h-5 text-text-faint" />
    </div>
    <p className="text-text-muted text-sm">{message}</p>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useRevenueChart();
  const { data: recentBookings, isLoading: bookingsLoading } = useRecentBookings();
  const { data: recentComplaints, isLoading: complaintsLoading } = useRecentComplaints();

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="section-header">Dashboard</h1>
        <p className="text-text-muted text-sm">
          Welcome back, <span className="text-text-primary font-medium">{user?.name}</span> 👋
        </p>
      </div>

      {/* Stat Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Properties" value={stats?.totalProperties ?? 0} icon={Building2} color="text-brand-primary" />
          <StatCard title="Total Rooms" value={stats?.totalRooms ?? 0} icon={Home} color="text-brand-secondary" />
          <StatCard title="Total Beds" value={stats?.totalBeds ?? 0} icon={BedDouble} color="text-brand-accent" />
          <StatCard title="Occupied Beds" value={stats?.occupiedBeds ?? 0} icon={Users} color="text-status-error"
            subtext={`${stats?.occupancyRate ?? 0}% occupancy`} />
          <StatCard title="Vacant Beds" value={stats?.vacantBeds ?? 0} icon={BedDouble} color="text-status-success" />
          <StatCard title="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue ?? 0)} icon={DollarSign} color="text-status-success"
            subtext="This month" />
          <StatCard title="Due Rent" value={formatCurrency(stats?.dueRent ?? 0)} icon={AlertCircle} color="text-status-warning"
            subtext="Pending collection" />
          <StatCard title="Occupancy Rate" value={`${stats?.occupancyRate ?? 0}%`} icon={TrendingUp} color="text-brand-primary"
            subtext="Overall" />
        </div>
      )}

      {/* Revenue Chart + Widgets row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-text-primary font-semibold">Revenue Overview</h2>
              <p className="text-text-faint text-xs">Last 6 months</p>
            </div>
            <div className="px-3 py-1 bg-brand-primary/10 rounded-full text-brand-primary text-xs font-medium">Monthly</div>
          </div>
          {chartLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
            </div>
          ) : chartData?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D4A" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.05)' }} />
                <Bar dataKey="revenue" fill="#6C63FF" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No revenue data yet. Collect your first rent to see chart." />
          )}
        </div>

        {/* Occupancy donut summary */}
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-text-primary font-semibold mb-4">Occupancy Summary</h2>
          {statsLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-surface-dark rounded" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Occupied', value: stats?.occupiedBeds ?? 0, total: stats?.totalBeds ?? 1, color: 'bg-status-error' },
                { label: 'Available', value: stats?.vacantBeds ?? 0, total: stats?.totalBeds ?? 1, color: 'bg-status-success' },
              ].map(({ label, value, total, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-text-muted text-sm">{label}</span>
                    </div>
                    <span className="text-text-primary text-sm font-semibold">{value}</span>
                  </div>
                  <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-surface-border">
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-primary">{stats?.occupancyRate ?? 0}%</p>
                  <p className="text-text-muted text-xs">Overall occupancy</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings + Complaints */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        {/* Recent Bookings */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold">Recent Bookings</h2>
            <a href="/erp/bookings" className="text-brand-primary text-xs hover:underline">View all</a>
          </div>
          {bookingsLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-surface-dark rounded animate-pulse" />)}</div>
          ) : recentBookings?.length ? (
            <div className="space-y-2">
              {recentBookings.map((b: any) => (
                <div key={b._id} className="flex items-center justify-between py-2 border-b border-surface-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-bold">
                      {b.studentId?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">{b.studentId?.name || '—'}</p>
                      <p className="text-text-faint text-xs">{b.propertyId?.name || '—'} · Room {b.roomId?.roomNumber || '—'}</p>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No bookings yet." />
          )}
        </div>

        {/* Recent Complaints */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold">Recent Complaints</h2>
            <a href="/erp/complaints" className="text-brand-primary text-xs hover:underline">View all</a>
          </div>
          {complaintsLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-surface-dark rounded animate-pulse" />)}</div>
          ) : recentComplaints?.length ? (
            <div className="space-y-2">
              {recentComplaints.map((c: any) => (
                <div key={c._id} className="flex items-center justify-between py-2 border-b border-surface-border/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary text-sm font-medium truncate">{c.title}</p>
                    <p className="text-text-faint text-xs">{c.studentId?.name || '—'} · {c.propertyId?.name || '—'}</p>
                  </div>
                  <StatusBadge status={c.status} className="ml-3 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No complaints raised yet." />
          )}
        </div>
      </div>
    </div>
  );
}
