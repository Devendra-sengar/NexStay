import { useAdminStats } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Users, Building2, GraduationCap, CalendarCheck, IndianRupee, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminStats();

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const { stats, trends } = data;

  const cardItems = [
    { label: 'Total Owners', value: stats.totalOwners, icon: Users, color: 'from-blue-500/20 to-indigo-500/20', iconColor: 'text-blue-400' },
    { label: 'Total Properties', value: stats.totalProperties, icon: Building2, color: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400' },
    { label: 'Total Students', value: stats.totalStudents, icon: GraduationCap, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { label: 'Active Bookings', value: stats.activeBookings, icon: CalendarCheck, color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400' },
    { label: 'Platform Revenue', value: `₹${stats.platformRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'from-rose-500/20 to-red-500/20', iconColor: 'text-rose-400' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Platform Overview</h2>
        <p className="text-text-muted text-sm">Real-time indicators and metrics across all NexStay properties.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {cardItems.map((c, i) => (
          <div key={i} className={`bg-gradient-to-br ${c.color} border border-surface-border rounded-2xl p-5 flex items-center justify-between shadow-lg backdrop-blur-md hover:scale-102 transition-all`}>
            <div className="space-y-1">
              <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">{c.label}</span>
              <h3 className="text-2xl font-black text-text-primary">{c.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-surface-dark/50 flex items-center justify-center ${c.iconColor}`}>
              <c.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Platform Growth Trend Chart */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-bold text-text-primary">User Signups & Booking Activity</h3>
          </div>
          <span className="text-text-muted text-xs">Last 6 Months</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="period" stroke="#737373" fontSize={11} tickLine={false} />
              <YAxis stroke="#737373" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px' }}
                labelStyle={{ color: '#a3a3a3', fontWeight: 'bold' }}
                itemStyle={{ color: '#f5f5f5' }}
              />
              <Area type="monotone" dataKey="signups" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" name="New Signups" />
              <Area type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" name="Bookings Made" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
