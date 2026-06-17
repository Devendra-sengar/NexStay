import { CreditCard, Lock, Sparkles, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter', price: '₹999', period: '/month', beds: 'Up to 50 beds',
    features: ['2 Properties', 'Basic Reports', 'Email Support', 'Student App Access'],
    current: true,
  },
  {
    name: 'Growth', price: '₹2,499', period: '/month', beds: 'Up to 200 beds',
    features: ['10 Properties', 'Advanced Analytics', 'Priority Support', 'Custom Branding', 'API Access'],
    current: false,
    popular: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', beds: 'Unlimited beds',
    features: ['Unlimited Properties', 'White-label', 'Dedicated Manager', 'SLA Guarantee', 'Custom Integrations'],
    current: false,
  },
];

export default function BillingPage() {
  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="section-header mb-0">Billing & Subscription</h1>
          <p className="text-text-muted text-sm">Manage your NexStay plan</p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-xl mb-8 p-6 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 border border-brand-primary/30">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-primary/20 border border-brand-primary/30 rounded-full px-3 py-1 text-xs text-brand-primary font-medium mb-2">
              🚀 Coming Soon
            </div>
            <h2 className="text-text-primary font-bold text-lg mb-1">Payment Gateway Integration</h2>
            <p className="text-text-muted text-sm max-w-lg">
              Online billing, auto-renewals, and invoice generation are being finalized. 
              For now, your account is on the <strong className="text-text-primary">Starter Plan</strong> free of charge.
            </p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-text-primary font-semibold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={`glass-card rounded-xl p-5 relative transition-all duration-200 ${
              plan.popular ? 'border-brand-primary/50 shadow-brand' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-gradient rounded-full text-white text-xs font-bold shadow-glow">
                Most Popular
              </div>
            )}
            {plan.current && (
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-status-success/15 border border-status-success/30 rounded-full text-status-success text-[10px] font-semibold">
                Current Plan
              </div>
            )}

            <h3 className="text-text-primary font-bold text-lg mb-1">{plan.name}</h3>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-2xl font-bold text-brand-primary">{plan.price}</span>
              <span className="text-text-muted text-sm mb-0.5">{plan.period}</span>
            </div>
            <p className="text-text-faint text-xs mb-4">{plan.beds}</p>

            <ul className="space-y-2 mb-5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              disabled
              className={`w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                plan.current
                  ? 'bg-surface-dark text-text-faint cursor-default'
                  : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary hover:text-white cursor-not-allowed opacity-70'
              }`}
            >
              {plan.current ? 'Current Plan' : <><Lock className="w-3.5 h-3.5" /> Coming Soon</>}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-8 glass-card rounded-xl p-5">
        <h2 className="text-text-primary font-semibold mb-4">Billing FAQ</h2>
        <div className="space-y-3">
          {[
            { q: 'When will billing go live?', a: 'Payment integration is planned for Phase 3. You will receive advance notice before any charges.' },
            { q: 'Will my data be preserved when I upgrade?', a: 'Yes, all your properties, rooms, tenants and records carry over seamlessly.' },
            { q: 'Is there a free trial?', a: 'Yes — the entire platform is free during the beta period.' },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-surface-border pb-3 last:border-0">
              <p className="text-text-primary font-medium text-sm mb-1">{q}</p>
              <p className="text-text-muted text-sm">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
