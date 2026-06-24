import { Users, Building2, BookOpen, DollarSign, Globe, Clock, ShieldCheck } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useSuperDashboard } from '@/lib/superAdminApi';
import { cn } from '@/lib/utils';

const FMT = (v: number) => `₹${v.toLocaleString('en-IN')}`;

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="card p-5">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value ?? '—'}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function SuperDashboard() {
  const { data, isLoading } = useSuperDashboard();
  const stats = data?.stats;

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-500" /> Platform Dashboard
        </h1>
        <p className="text-text-secondary text-sm mt-1">NexStay platform-wide analytics — all owners, all properties.</p>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard label="Total Owners" value={stats?.totalOwners} icon={Users} color="bg-indigo-100 text-indigo-600" />
          <StatCard label="Approved Props" value={stats?.approved} icon={Building2} color="bg-emerald-100 text-emerald-600" sub={`${stats?.pending} pending`} />
          <StatCard label="Total Guests" value={stats?.totalGuests} icon={Users} color="bg-blue-100 text-blue-600" />
          <StatCard label="Total Bookings" value={stats?.totalBookings} icon={BookOpen} color="bg-amber-100 text-amber-600" />
          <StatCard label="Platform Revenue" value={stats?.platformRevenue ? FMT(stats.platformRevenue) : '₹0'} icon={DollarSign} color="bg-purple-100 text-purple-600" />
          <StatCard label="Cities Covered" value={stats?.citiesCovered} icon={Globe} color="bg-pink-100 text-pink-600" />
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">New Owner Registrations (6 months)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.ownersByMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Owners" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">New Bookings per Month (6 months)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.bookingsByMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Platform Revenue per Month (6 months)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.revenueByMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={FMT} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4,4,0,0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Top 5 Cities by Properties</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.topCities ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[0,4,4,0]} name="Properties" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending items alert */}
      {stats?.pending > 0 && (
        <div className="mt-5 card p-4 border-l-4 border-amber-400 bg-amber-50 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{stats.pending} properties</span> are pending verification.
            <a href="/superadmin/properties" className="ml-2 underline hover:no-underline">Review now →</a>
          </p>
        </div>
      )}
    </div>
  );
}
