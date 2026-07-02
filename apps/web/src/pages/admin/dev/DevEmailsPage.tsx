import { Mail, RefreshCw } from 'lucide-react';
import { useDevEmails } from '@/lib/adminApi';
import { useQueryClient } from '@tanstack/react-query';

export default function DevEmailsPage() {
  const { data: emails = [], isLoading, dataUpdatedAt } = useDevEmails();
  const qc = useQueryClient();

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mock Email Viewer</h1>
          <p className="text-sm text-text-secondary mt-0.5">Dev-only — last 50 system-generated emails</p>
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['dev-emails'] })}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
        ) : emails.length === 0 ? (
          <div className="p-10 text-center">
            <Mail className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No emails sent yet. Trigger a booking accept, check-in, or complaint update to see logs here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr>{['Sent At','To','Subject','Preview'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {emails.map((e: any) => (
                <tr key={e.id} className="hover:bg-surface-input/40">
                  <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted whitespace-nowrap">
                    {new Date(e.sentAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm font-medium">{e.to}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm">{e.subject}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted max-w-[260px] truncate">{e.preview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {dataUpdatedAt && (
        <p className="text-xs text-text-muted text-right mt-3">
          Last updated: {new Date(dataUpdatedAt).toLocaleTimeString('en-IN')}
        </p>
      )}
    </div>
  );
}
