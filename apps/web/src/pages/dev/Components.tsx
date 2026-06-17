import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2, Building2, Users, CreditCard, Search } from 'lucide-react';

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const STATUS_CONFIGS = {
  PAID:       { label: 'Paid',       color: 'bg-status-success/15 text-status-success border border-status-success/30' },
  UNPAID:     { label: 'Unpaid',     color: 'bg-status-error/15 text-status-error border border-status-error/30' },
  PARTIAL:    { label: 'Partial',    color: 'bg-status-warning/15 text-status-warning border border-status-warning/30' },
  PENDING:    { label: 'Pending',    color: 'bg-status-info/15 text-status-info border border-status-info/30' },
  CONFIRMED:  { label: 'Confirmed',  color: 'bg-status-success/15 text-status-success border border-status-success/30' },
  CANCELLED:  { label: 'Cancelled',  color: 'bg-status-error/15 text-status-error border border-status-error/30' },
  CHECKED_IN: { label: 'Checked In', color: 'bg-brand-secondary/15 text-brand-secondary border border-brand-secondary/30' },
  OPEN:       { label: 'Open',       color: 'bg-status-error/15 text-status-error border border-status-error/30' },
  IN_PROGRESS:{ label: 'In Progress',color: 'bg-status-warning/15 text-status-warning border border-status-warning/30' },
  RESOLVED:   { label: 'Resolved',   color: 'bg-status-success/15 text-status-success border border-status-success/30' },
  AVAILABLE:  { label: 'Available',  color: 'bg-status-success/15 text-status-success border border-status-success/30' },
  OCCUPIED:   { label: 'Occupied',   color: 'bg-status-error/15 text-status-error border border-status-error/30' },
  RESERVED:   { label: 'Reserved',   color: 'bg-status-warning/15 text-status-warning border border-status-warning/30' },
  APPROVED:   { label: 'Approved',   color: 'bg-status-success/15 text-status-success border border-status-success/30' },
  REJECTED:   { label: 'Rejected',   color: 'bg-status-error/15 text-status-error border border-status-error/30' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIGS;

function StatusBadge({ status }: { status: StatusKey }) {
  const cfg = STATUS_CONFIGS[status];
  return <span className={cn('badge', cfg.color)}>{cfg.label}</span>;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-text-primary mb-1">{title}</h2>
      <div className="w-12 h-0.5 bg-brand-gradient mb-4 rounded-full" />
      {children}
    </div>
  );
}

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-surface-dark">
      <div className="border-b border-surface-border bg-surface-card px-8 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
          <Building2 className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <span className="text-text-primary font-bold">NexStay</span>
          <span className="text-text-muted text-sm ml-2">/ Dev / Component Library</span>
        </div>
        <div className="ml-auto px-3 py-1 bg-brand-accent/10 border border-brand-accent/30 rounded-full text-brand-accent text-xs font-medium">🛠️ Dev Only</div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-text-primary mb-1">Component Library</h1>
        <p className="text-text-muted mb-10">All NexStay UI components — design consistency reference for every phase.</p>

        {/* ── Status Badges ── */}
        <Section title="Status Badges">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIGS) as StatusKey[]).map((s) => <StatusBadge key={s} status={s} />)}
            </div>
          </div>
        </Section>

        {/* ── Buttons ── */}
        <Section title="Buttons">
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Button</button>
              <button className="btn-ghost">Ghost Button</button>
              <button className="btn-primary opacity-50 cursor-not-allowed" disabled>Disabled</button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button className="btn-primary flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</button>
              <button className="btn-primary flex items-center gap-2 bg-status-success hover:bg-status-success/80"><CheckCircle2 className="w-4 h-4" /> Success</button>
              <button className="btn-primary flex items-center gap-2 bg-status-error hover:bg-status-error/80"><XCircle className="w-4 h-4" /> Danger</button>
            </div>
          </div>
        </Section>

        {/* ── Cards ── */}
        <Section title="Cards">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Total Revenue', value: '₹1,24,500', icon: CreditCard, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
              { title: 'Occupied Beds', value: '47 / 60', icon: Users, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
              { title: 'Properties', value: '6', icon: Building2, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
            ].map((card) => (
              <div key={card.title} className="glass-card rounded-xl p-5 hover:border-brand-primary/30 transition-colors cursor-pointer">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', card.bg)}>
                  <card.icon className={cn('w-5 h-5', card.color)} />
                </div>
                <p className="text-text-muted text-sm">{card.title}</p>
                <p className={cn('text-2xl font-bold mt-1', card.color)}>{card.value}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Table ── */}
        <Section title="Table Style">
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="data-table">
              <thead>
                <tr><th>Tenant</th><th>Room</th><th>Rent</th><th>Due Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {[
                  { name: 'Arjun Kumar', room: '101-B1', rent: '₹8,000', due: '15 Jun', status: 'PAID' as StatusKey },
                  { name: 'Sneha Joshi', room: '102-B2', rent: '₹7,500', due: '15 Jun', status: 'UNPAID' as StatusKey },
                  { name: 'Rohan Mehta', room: '201-B1', rent: '₹9,000', due: '15 Jun', status: 'PARTIAL' as StatusKey },
                  { name: 'Pooja Sharma', room: '202-B3', rent: '₹7,000', due: '15 Jun', status: 'PENDING' as StatusKey },
                ].map((row) => (
                  <tr key={row.name}>
                    <td className="font-medium">{row.name}</td>
                    <td className="text-text-muted font-mono text-xs">{row.room}</td>
                    <td className="font-semibold">{row.rent}</td>
                    <td className="text-text-muted">{row.due}</td>
                    <td><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Form Inputs ── */}
        <Section title="Form Inputs">
          <div className="glass-card rounded-xl p-6 space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Normal input</label>
              <input className="input-field" placeholder="Enter value..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">With icon</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                <input className="input-field pl-9" placeholder="Search..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Error state</label>
              <input className="input-field border-status-error focus:border-status-error" placeholder="Invalid input" />
              <p className="text-status-error text-xs mt-1">This field is required</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Select</label>
              <select className="input-field">
                <option>All properties</option>
                <option>Sunrise Boys PG</option>
                <option>Comfort Stay Hostel</option>
              </select>
            </div>
          </div>
        </Section>

        {/* ── States ── */}
        <Section title="Empty / Loading / Error States">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Empty */}
            <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-surface-dark flex items-center justify-center mb-3">
                <span className="text-2xl">📭</span>
              </div>
              <p className="text-text-primary font-semibold text-sm">No data found</p>
              <p className="text-text-muted text-xs mt-1">Add your first record to get started</p>
              <button className="btn-primary text-xs px-4 py-1.5 mt-3">Add now</button>
            </div>

            {/* Loading */}
            <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mb-3">
                <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              </div>
              <p className="text-text-primary font-semibold text-sm">Loading data...</p>
              <p className="text-text-muted text-xs mt-1">Please wait a moment</p>
              <div className="flex gap-1 mt-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>

            {/* Error */}
            <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center border-status-error/20">
              <div className="w-14 h-14 rounded-full bg-status-error/10 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-status-error" />
              </div>
              <p className="text-text-primary font-semibold text-sm">Something went wrong</p>
              <p className="text-text-muted text-xs mt-1">Failed to load data. Try again.</p>
              <button className="btn-primary text-xs px-4 py-1.5 mt-3 bg-status-error hover:bg-status-error/80">Retry</button>
            </div>
          </div>
        </Section>

        {/* ── Colors ── */}
        <Section title="Brand Color Palette">
          <div className="glass-card rounded-xl p-6">
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'brand-primary', hex: '#6C63FF', cls: 'bg-brand-primary' },
                { name: 'brand-secondary', hex: '#22D3EE', cls: 'bg-brand-secondary' },
                { name: 'brand-accent', hex: '#F97316', cls: 'bg-brand-accent' },
                { name: 'surface-dark', hex: '#0F0F1A', cls: 'bg-surface-dark border border-surface-border' },
                { name: 'surface-card', hex: '#1A1A2E', cls: 'bg-surface-card border border-surface-border' },
                { name: 'status-success', hex: '#10B981', cls: 'bg-status-success' },
                { name: 'status-warning', hex: '#F59E0B', cls: 'bg-status-warning' },
                { name: 'status-error', hex: '#EF4444', cls: 'bg-status-error' },
              ].map((c) => (
                <div key={c.name} className="flex flex-col items-center gap-2">
                  <div className={cn('w-14 h-14 rounded-xl', c.cls)} />
                  <p className="text-text-muted text-[10px] font-mono text-center">{c.name}<br />{c.hex}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
