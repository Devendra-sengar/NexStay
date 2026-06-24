import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, BedDouble, Users, CreditCard, TrendingUp, AlertCircle,
  BookOpen, MessageSquare, Plus, ChevronRight, Loader2, CheckCircle
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAdminDashboard } from '@/lib/adminApi';

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  CONFIRMED:  'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-green-100 text-green-700',
  CHECKED_OUT:'bg-slate-100 text-slate-600',
  CANCELLED:  'bg-red-100 text-red-600',
  OPEN:       'bg-red-100 text-red-700',
  IN_PROGRESS:'bg-amber-100 text-amber-700',
  RESOLVED:   'bg-green-100 text-green-700',
  CLOSED:     'bg-slate-100 text-slate-500',
};

const COMPLAINT_ICONS: Record<string, string> = {
  ELECTRICITY: '⚡', FOOD: '🍽️', INTERNET: '📶', WATER: '💧', CLEANING: '🧹', OTHER: '📌',
};

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const { data, isLoading } = useAdminDashboard(selectedProperty || undefined);

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state: new admin with no properties
  if (!data || data.stats.totalProperties === 0) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-2">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome to NexStay! 🏠</h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            You haven't added any properties yet. List your PG on the marketplace to start receiving bookings.
          </p>
          <div className="flex flex-col gap-2 w-full mt-2">
            <button
              onClick={() => navigate('/admin/properties')}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Your First Property
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              Browse the Marketplace
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 w-full text-center">
            {[
              { icon: '📋', label: 'List Property', desc: 'Submit for review' },
              { icon: '✅', label: 'Get Approved', desc: 'Go live in 24h' },
              { icon: '💰', label: 'Earn Revenue', desc: 'Collect rent online' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="card p-4">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-xs font-bold text-text-primary">{label}</p>
                <p className="text-[11px] text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { stats, properties, recentBookings, recentComplaints, overdueRent, occupancyTrend, revenueTrend } = data;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">Here's your hostel overview</p>
        </div>
        {properties.length > 1 && (
          <select
            value={selectedProperty}
            onChange={e => setSelectedProperty(e.target.value)}
            className="input-field text-sm max-w-xs"
          >
            <option value="">All Properties</option>
            {properties.map((p: any) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <StatCard label="Properties" value={stats.totalProperties} icon={Building2} color="bg-primary/10 text-primary" />
        <StatCard label="Total Rooms" value={stats.totalRooms} icon={BedDouble} color="bg-blue-100 text-blue-600" />
        <StatCard label="Total Beds" value={stats.totalBeds} icon={BedDouble} color="bg-indigo-100 text-indigo-600" />
        <StatCard label="Occupied" value={stats.occupiedBeds} icon={Users} color="bg-amber-100 text-amber-600" sub={`${stats.totalBeds > 0 ? Math.round((stats.occupiedBeds/stats.totalBeds)*100) : 0}% fill rate`} />
        <StatCard label="Vacant" value={stats.availableBeds} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard label="Monthly Revenue" value={`₹${(stats.monthlyRevenue ?? 0).toLocaleString('en-IN')}`} icon={CreditCard} color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Rent Due" value={`₹${(stats.dueRent ?? 0).toLocaleString('en-IN')}`} icon={AlertCircle} color="bg-red-100 text-red-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Occupancy trend */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Occupancy Trend (6 months)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={occupancyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Occupancy']} />
              <Line type="monotone" dataKey="occupancy" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Expenses */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Revenue vs Expenses (6 months)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[3,3,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Bookings */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Recent Bookings
            </h2>
            <button onClick={() => navigate('/admin/bookings')} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Guest','Property','Bed','Status','Date','Amount'].map(h => (
                      <th key={h} className="text-left text-text-muted font-medium py-2 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {recentBookings.map((b: any) => (
                    <tr key={b._id} className="hover:bg-surface cursor-pointer" onClick={() => navigate('/admin/bookings')}>
                      <td className="py-2 px-2 font-medium text-text-primary">{b.guestId?.name ?? '—'}</td>
                      <td className="py-2 px-2 text-text-secondary truncate max-w-[100px]">{b.propertyId?.name ?? '—'}</td>
                      <td className="py-2 px-2 text-text-muted">{b.bedId?.bedNumber ?? '—'}</td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-text-muted">{new Date(b.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</td>
                      <td className="py-2 px-2 font-semibold text-text-primary">₹{(b.monthlyRent ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Complaints */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Recent Complaints
            </h2>
            <button onClick={() => navigate('/admin/complaints')} className="text-xs text-primary font-medium hover:underline">All</button>
          </div>
          {recentComplaints.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">No complaints</p>
          ) : (
            <div className="space-y-2.5">
              {recentComplaints.map((c: any) => (
                <div key={c._id} className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">{COMPLAINT_ICONS[c.category] ?? '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{c.title}</p>
                    <p className="text-[11px] text-text-muted">{c.guestId?.name ?? 'Guest'} · {c.propertyId?.name ?? ''}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[c.status] ?? 'bg-slate-100'}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overdue Rent */}
      {overdueRent.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" /> Rent Due This Month
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Tenant','Amount Due','Due Date','Days Overdue'].map(h => (
                    <th key={h} className="text-left text-text-muted font-medium py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {overdueRent.map((r: any) => {
                  const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(r.dueDate).getTime()) / 86400000));
                  return (
                    <tr key={r._id} className="hover:bg-surface">
                      <td className="py-2 px-2 font-medium text-text-primary">{r.hostelStudentId?.name ?? '—'}</td>
                      <td className="py-2 px-2 font-bold text-red-600">₹{Math.max(0, (r.amount ?? 0) - (r.paidAmount ?? 0)).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-text-muted">{new Date(r.dueDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</td>
                      <td className="py-2 px-2">
                        <span className={`font-bold ${daysOverdue > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {daysOverdue > 0 ? `${daysOverdue}d overdue` : 'Due today'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
