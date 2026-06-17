import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, Calendar, Building2, Download, Eye, Loader2, Users, BedDouble, AlertCircle, RefreshCw } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { useOccupancyReport, useRevenueReport, useBookingReport } from '@/hooks/useReports';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Helper to export data to CSV
const handleCSVExport = (data: any[], headers: { label: string; key: string }[], filename: string) => {
  if (!data || data.length === 0) return;
  const csvHeaders = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const csvRows = data.map(row =>
    headers.map(h => {
      const val = row[h.key];
      const strVal = val === null || val === undefined ? '' : String(val);
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = [csvHeaders, ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'occupancy' | 'revenue' | 'bookings'>('occupancy');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  
  // Date Filters
  const [date, setDate] = useState<string>(''); // point in time for occupancy
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch properties for selector
  const { data: propertiesResponse, isLoading: propertiesLoading } = useProperties();
  const properties = propertiesResponse?.data || [];

  // Query Reports Data
  const { 
    data: occupancyData, 
    isLoading: occupancyLoading, 
    isError: occupancyError,
    refetch: refetchOccupancy
  } = useOccupancyReport({ 
    propertyId: selectedProperty || undefined, 
    date: date || undefined 
  });

  const { 
    data: revenueData, 
    isLoading: revenueLoading, 
    isError: revenueError,
    refetch: refetchRevenue
  } = useRevenueReport({ 
    propertyId: selectedProperty || undefined, 
    startDate: startDate || undefined, 
    endDate: endDate || undefined 
  });

  const { 
    data: bookingData, 
    isLoading: bookingLoading, 
    isError: bookingError,
    refetch: refetchBookings
  } = useBookingReport({ 
    propertyId: selectedProperty || undefined, 
    startDate: startDate || undefined, 
    endDate: endDate || undefined 
  });

  // Revenue chart view MoM vs YoY
  const [revenuePeriodType, setRevenuePeriodType] = useState<'monthly' | 'yearly'>('monthly');

  // Colors for charts
  const CHART_COLORS = {
    occupied: '#EF4444', // Red
    reserved: '#F59E0B', // Amber
    vacant: '#10B981',   // Green
    primary: '#6C63FF',  // Indigo/Purple
    secondary: '#3B82F6', // Blue
  };

  const handleResetFilters = () => {
    setSelectedProperty('');
    setDate('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-header">Reports & Analytics</h1>
          <p className="text-text-muted text-sm">Analyze occupancy, revenue, and bookings across properties.</p>
        </div>
        <button 
          onClick={handleResetFilters}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface-dark border border-surface-border text-text-muted hover:text-text-primary rounded-lg text-xs transition-all duration-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Property Selector */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Property</label>
          {propertiesLoading ? (
            <div className="h-10 bg-surface-dark rounded animate-pulse" />
          ) : (
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full h-10 px-3 bg-surface-dark border border-surface-border rounded-lg text-sm text-text-primary focus:border-brand-primary focus:outline-none transition-all"
            >
              <option value="">All Properties</option>
              {properties.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Date Filters depending on Tab */}
        {activeTab === 'occupancy' ? (
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">As of Date (Point in time)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 bg-surface-dark border border-surface-border rounded-lg text-sm text-text-primary focus:border-brand-primary focus:outline-none transition-all"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 bg-surface-dark border border-surface-border rounded-lg text-sm text-text-primary focus:border-brand-primary focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 bg-surface-dark border border-surface-border rounded-lg text-sm text-text-primary focus:border-brand-primary focus:outline-none transition-all"
              />
            </div>
          </>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-surface-border mb-6">
        <button
          onClick={() => setActiveTab('occupancy')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'occupancy'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          Occupancy Report
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'revenue'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Revenue Report
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Bookings Funnel
        </button>
      </div>

      {/* Report Content */}

      {/* TAB 1: OCCUPANCY REPORT */}
      {activeTab === 'occupancy' && (
        <div>
          {occupancyLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
          ) : occupancyError || !occupancyData ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-status-error mx-auto mb-2" />
              <p className="text-text-primary font-medium">Failed to load occupancy data</p>
              <button onClick={() => refetchOccupancy()} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary/90">Retry</button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass-card rounded-xl p-5">
                  <p className="text-text-muted text-sm font-medium">Total Beds</p>
                  <p className="text-2xl font-bold mt-1 text-text-primary">{occupancyData.totalBeds}</p>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-text-muted text-sm font-medium">Occupied Beds</p>
                  <p className="text-2xl font-bold mt-1 text-status-error">{occupancyData.occupiedBeds}</p>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-text-muted text-sm font-medium">Reserved Beds</p>
                  <p className="text-2xl font-bold mt-1 text-status-warning">{occupancyData.reservedBeds}</p>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-text-muted text-sm font-medium">Vacant Beds</p>
                  <p className="text-2xl font-bold mt-1 text-status-success">{occupancyData.vacantBeds}</p>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-text-muted text-sm font-medium">Occupancy Rate</p>
                  <p className="text-2xl font-bold mt-1 text-brand-primary">{occupancyData.occupancyRate}%</p>
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut Chart */}
                <div className="glass-card rounded-xl p-5 flex flex-col justify-between">
                  <h3 className="text-text-primary font-semibold mb-4">Overall Distribution</h3>
                  <div className="h-56 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Occupied', value: occupancyData.occupiedBeds },
                            { name: 'Reserved', value: occupancyData.reservedBeds },
                            { name: 'Vacant', value: occupancyData.vacantBeds },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill={CHART_COLORS.occupied} />
                          <Cell fill={CHART_COLORS.reserved} />
                          <Cell fill={CHART_COLORS.vacant} />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#2D2D4A', borderRadius: '8px' }}
                          itemStyle={{ color: '#E2E8F0' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.occupied }} />
                      <span className="text-text-muted">Occupied</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.reserved }} />
                      <span className="text-text-muted">Reserved</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.vacant }} />
                      <span className="text-text-muted">Vacant</span>
                    </div>
                  </div>
                </div>

                {/* Property Stacked Bar Chart */}
                <div className="lg:col-span-2 glass-card rounded-xl p-5">
                  <h3 className="text-text-primary font-semibold mb-4">Occupancy by Property</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={occupancyData.propertiesBreakdown.map((p: any) => ({
                          name: p.name,
                          Occupied: p.occupiedBeds,
                          Reserved: p.reservedBeds,
                          Vacant: p.vacantBeds,
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D4A" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#2D2D4A', borderRadius: '8px' }} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                        <Bar dataKey="Occupied" stackId="a" fill={CHART_COLORS.occupied} />
                        <Bar dataKey="Reserved" stackId="a" fill={CHART_COLORS.reserved} />
                        <Bar dataKey="Vacant" stackId="a" fill={CHART_COLORS.vacant} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Room Type Breakdown Table */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-text-primary font-semibold">Breakdown by Room Sharing Type</h3>
                  <button
                    onClick={() => handleCSVExport(
                      occupancyData.roomTypeBreakdown,
                      [
                        { label: 'Room Type', key: 'roomType' },
                        { label: 'Total Beds', key: 'totalBeds' },
                        { label: 'Occupied Beds', key: 'occupiedBeds' },
                        { label: 'Reserved Beds', key: 'reservedBeds' },
                        { label: 'Vacant Beds', key: 'vacantBeds' },
                        { label: 'Occupancy Rate (%)', key: 'occupancyRate' },
                      ],
                      'RoomTypeOccupancyReport'
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg text-xs font-semibold transition-all duration-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-border text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <th className="py-3 px-4">Room Type</th>
                        <th className="py-3 px-4">Total Beds</th>
                        <th className="py-3 px-4">Occupied</th>
                        <th className="py-3 px-4">Reserved</th>
                        <th className="py-3 px-4">Vacant</th>
                        <th className="py-3 px-4 text-right">Occupancy Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-sm">
                      {occupancyData.roomTypeBreakdown.map((r: any) => (
                        <tr key={r.roomType} className="hover:bg-surface-dark/40 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-text-primary">{r.roomType.replace('_', ' ')}</td>
                          <td className="py-3.5 px-4 text-text-muted">{r.totalBeds}</td>
                          <td className="py-3.5 px-4 text-status-error">{r.occupiedBeds}</td>
                          <td className="py-3.5 px-4 text-status-warning">{r.reservedBeds}</td>
                          <td className="py-3.5 px-4 text-status-success">{r.vacantBeds}</td>
                          <td className="py-3.5 px-4 text-right font-semibold text-brand-primary">{r.occupancyRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REVENUE REPORT */}
      {activeTab === 'revenue' && (
        <div>
          {revenueLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
          ) : revenueError || !revenueData ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-status-error mx-auto mb-2" />
              <p className="text-text-primary font-medium">Failed to load revenue data</p>
              <button onClick={() => refetchRevenue()} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary/90">Retry</button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card rounded-xl p-5">
                  <p className="text-text-muted text-sm font-medium">Total Collected</p>
                  <p className="text-2xl font-bold mt-1 text-status-success">{formatCurrency(revenueData.collected)}</p>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-text-muted text-sm font-medium">Pending Dues</p>
                  <p className="text-2xl font-bold mt-1 text-status-warning">{formatCurrency(revenueData.due)}</p>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-text-muted text-sm font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold mt-1 text-status-error">{formatCurrency(revenueData.expenses)}</p>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-text-muted text-sm font-medium">Net Income</p>
                  <p className={`text-2xl font-bold mt-1 ${revenueData.net >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                    {formatCurrency(revenueData.net)}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-text-primary font-semibold">Financial Performance Trends</h3>
                    <p className="text-text-muted text-xs">Line chart tracking collection vs expenses</p>
                  </div>
                  <div className="flex bg-surface-dark border border-surface-border rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setRevenuePeriodType('monthly')}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                        revenuePeriodType === 'monthly' ? 'bg-brand-primary text-white' : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setRevenuePeriodType('yearly')}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                        revenuePeriodType === 'yearly' ? 'bg-brand-primary text-white' : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={revenuePeriodType === 'monthly' ? revenueData.monthlyBreakdown : revenueData.yearlyBreakdown}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D4A" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#2D2D4A', borderRadius: '8px' }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                      <Line type="monotone" dataKey="collected" name="Collected" stroke={CHART_COLORS.vacant} strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="expenses" name="Expenses" stroke={CHART_COLORS.occupied} strokeWidth={2} />
                      <Line type="monotone" dataKey="net" name="Net" stroke={CHART_COLORS.primary} strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-text-primary font-semibold">Breakdown Table</h3>
                  <button
                    onClick={() => handleCSVExport(
                      revenuePeriodType === 'monthly' ? revenueData.monthlyBreakdown : revenueData.yearlyBreakdown,
                      [
                        { label: 'Period', key: 'period' },
                        { label: 'Collected Rent', key: 'collected' },
                        { label: 'Due Rent', key: 'due' },
                        { label: 'Expenses', key: 'expenses' },
                        { label: 'Net Income', key: 'net' },
                      ],
                      revenuePeriodType === 'monthly' ? 'MonthlyRevenueReport' : 'YearlyRevenueReport'
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg text-xs font-semibold transition-all duration-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-border text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4">Collected</th>
                        <th className="py-3 px-4">Due</th>
                        <th className="py-3 px-4">Expenses</th>
                        <th className="py-3 px-4 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-sm">
                      {(revenuePeriodType === 'monthly' ? revenueData.monthlyBreakdown : revenueData.yearlyBreakdown).map((item: any) => (
                        <tr key={item.period} className="hover:bg-surface-dark/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-text-primary">{item.period}</td>
                          <td className="py-3.5 px-4 text-status-success">{formatCurrency(item.collected)}</td>
                          <td className="py-3.5 px-4 text-status-warning">{formatCurrency(item.due)}</td>
                          <td className="py-3.5 px-4 text-status-error">{formatCurrency(item.expenses)}</td>
                          <td className={`py-3.5 px-4 text-right font-bold ${item.net >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                            {formatCurrency(item.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BOOKING REPORT */}
      {activeTab === 'bookings' && (
        <div>
          {bookingLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
          ) : bookingError || !bookingData ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-status-error mx-auto mb-2" />
              <p className="text-text-primary font-medium">Failed to load booking statistics</p>
              <button onClick={() => refetchBookings()} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary/90">Retry</button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Funnel stats */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-text-primary font-semibold mb-4">Bookings Funnel</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Pending Approval', count: bookingData.funnel.pending, color: 'bg-status-warning/15 text-status-warning border border-status-warning/30' },
                    { label: 'Confirmed (Reserved)', count: bookingData.funnel.confirmed, color: 'bg-brand-secondary/15 text-brand-secondary border border-brand-secondary/30' },
                    { label: 'Checked In', count: bookingData.funnel.checkedIn, color: 'bg-status-success/15 text-status-success border border-status-success/30' },
                    { label: 'Checked Out', count: bookingData.funnel.checkedOut, color: 'bg-text-faint/15 text-text-muted border border-surface-border' },
                    { label: 'Cancelled', count: bookingData.funnel.cancelled, color: 'bg-status-error/15 text-status-error border border-status-error/30' },
                  ].map((f) => (
                    <div key={f.label} className={`p-4 rounded-xl flex flex-col justify-between ${f.color}`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">{f.label}</span>
                      <span className="text-3xl font-extrabold mt-3">{f.count}</span>
                    </div>
                  ))}
                </div>
                
                {/* Horizontal progress funnel bars */}
                <div className="mt-8 space-y-4 max-w-3xl">
                  {[
                    { label: 'Total Placed Bookings', count: bookingData.funnel.total, color: 'bg-brand-primary' },
                    { label: 'Checked In (Active Tenants)', count: bookingData.funnel.checkedIn, color: 'bg-status-success' },
                    { label: 'Cancelled Bookings', count: bookingData.funnel.cancelled, color: 'bg-status-error' },
                  ].map((bar) => {
                    const pct = bookingData.funnel.total > 0 ? (bar.count / bookingData.funnel.total) * 100 : 0;
                    return (
                      <div key={bar.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-muted font-semibold">{bar.label}</span>
                          <span className="text-text-primary font-bold">{bar.count} ({Math.round(pct)}%)</span>
                        </div>
                        <div className="h-3 bg-surface-dark rounded-full overflow-hidden border border-surface-border">
                          <div className={`h-full ${bar.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Bookings Table */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-text-primary font-semibold">Bookings Log</h3>
                  <button
                    onClick={() => handleCSVExport(
                      bookingData.records,
                      [
                        { label: 'Booking ID', key: 'bookingId' },
                        { label: 'Student Name', key: 'studentName' },
                        { label: 'Student Email', key: 'studentEmail' },
                        { label: 'Student Phone', key: 'studentPhone' },
                        { label: 'Property Name', key: 'propertyName' },
                        { label: 'Room Number', key: 'roomNumber' },
                        { label: 'Bed Number', key: 'bedNumber' },
                        { label: 'Status', key: 'status' },
                        { label: 'Booking Date', key: 'createdAt' },
                      ],
                      'BookingsReport'
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg text-xs font-semibold transition-all duration-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-border text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Property</th>
                        <th className="py-3 px-4">Room & Bed</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-sm">
                      {bookingData.records.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-text-faint text-xs">No bookings found in this period.</td>
                        </tr>
                      ) : (
                        bookingData.records.map((b: any) => (
                          <tr key={b.bookingId} className="hover:bg-surface-dark/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-text-primary">{b.studentName}</div>
                              <div className="text-text-faint text-xs">{b.studentEmail}</div>
                            </td>
                            <td className="py-3.5 px-4 text-text-muted">{b.propertyName}</td>
                            <td className="py-3.5 px-4">
                              <span className="text-text-muted font-medium">Room {b.roomNumber}</span>
                              <span className="text-text-faint text-xs"> · Bed {b.bedNumber}</span>
                            </td>
                            <td className="py-3.5 px-4 text-text-muted text-xs">{formatDate(b.createdAt)}</td>
                            <td className="py-3.5 px-4 text-right">
                              <StatusBadge status={b.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
