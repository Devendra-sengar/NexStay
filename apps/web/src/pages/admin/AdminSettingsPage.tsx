import { Settings, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Admin Settings</h2>
        <p className="text-text-muted text-sm">Manage global variables, verification guidelines, and system variables.</p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl p-8 max-w-xl shadow-xl flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
          <Settings className="w-8 h-8 text-brand-primary" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">System Settings</h3>
        <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
          Global platform parameters, backup routines, and API endpoints are managed here. These controls are locked to Super Admin users.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-dark border border-surface-border rounded-full text-xs font-semibold text-text-muted">
          <Shield className="w-3.5 h-3.5 text-brand-primary" /> Fully Protected Endpoint
        </div>
      </div>
    </div>
  );
}
