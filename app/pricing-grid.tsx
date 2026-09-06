import { plans } from './lib/site';

export function PricingGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid gap-4 ${compact ? 'md:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
      {plans.map((plan) => (
        <article
          key={plan.name}
          className={`rounded-[22px] border p-5 ${plan.live ? 'border-[#0F3D3E] bg-white' : 'border-[#1C1917]/10 bg-[#F7F4EF]'}`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">{plan.name}</h3>
            {plan.live ? (
              <span className="rounded-full bg-[#0F3D3E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Live</span>
            ) : (
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-600">Coming soon</span>
            )}
          </div>
          <p className="mt-4 text-3xl font-bold tracking-[-0.03em]">
            {plan.price}
            {plan.name !== 'Free' ? <span className="text-sm font-semibold text-stone-500"> / month</span> : null}
          </p>
          {plan.annual ? <p className="mt-1 text-xs text-stone-500">{plan.annual} billed annually</p> : <p className="mt-1 text-xs text-stone-500">Enough to wire one flow</p>}
          <ul className="mt-5 space-y-2 text-sm text-stone-700">
            <li>{plan.inboxes.toLocaleString('en-IN')} active inboxes</li>
            <li>{plan.emails.toLocaleString('en-IN')} emails / month</li>
            <li>{plan.users} organisation {plan.users === 1 ? 'user' : 'users'}</li>
          </ul>
        </article>
      ))}
    </div>
  );
}
