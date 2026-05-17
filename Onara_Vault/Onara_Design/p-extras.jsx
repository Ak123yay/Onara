// Pricing, domain connect, trial-end, suspended public page
const { useState: uS_extra } = React;

const Pricing = ({ go, user, params }) => {
  const [billing, setBilling] = uS_extra('monthly');
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopNav go={go}/>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 40px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Pricing</div>
          <h1 className="serif" style={{ fontSize: 64, lineHeight: 1.0, margin: 0, fontWeight: 400, letterSpacing: '-0.025em' }}>
            One plan. <span className="serif-italic">Honest pricing.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-3)', marginTop: 16, maxWidth: 520, margin: '16px auto 0' }}>
            Less than a Saturday-night pizza. Cancel anytime — your site stays online.
          </p>
          <div style={{ display: 'inline-flex', marginTop: 28, padding: 4, background: 'var(--paper-2)', borderRadius: 100, border: '1px solid var(--rule-2)' }}>
            <button className={billing === 'monthly' ? 'chip-active chip' : 'chip'} style={{ padding: '8px 18px', fontSize: 13, border: 'none' }} onClick={() => setBilling('monthly')}>Monthly</button>
            <button className={billing === 'yearly' ? 'chip-active chip' : 'chip'} style={{ padding: '8px 18px', fontSize: 13, border: 'none' }} onClick={() => setBilling('yearly')}>Yearly · save 20%</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 16, alignItems: 'stretch' }}>
          <PricingCard tier="Free" price="$0" period="forever" features={['1 website', '3 revisions / month', 'Dashboard preview only (no public URL)', 'Onara badge in footer']} cta="Start free" muted/>
          <PricingCard tier="Starter" price={billing === 'monthly' ? '$12' : '$8.25'} period={billing === 'monthly' ? '/month' : '/month · $99 / year'} highlight features={['1 website', '10 revisions / month', 'Live public URL on .pages.dev', 'Custom domain ($10 one-time)', 'No Onara branding', 'Email support']} cta="Try Pro free for 14 days" onCta={() => go('welcome')}/>
          <PricingCard tier="Pro" price={billing === 'monthly' ? '$29' : '$24'} period={billing === 'monthly' ? '/month' : '/month, billed yearly'} features={['3 websites', 'Unlimited revisions', 'Download code as .zip', 'Priority generation queue', 'Everything in Starter']} cta="Choose Pro" onCta={() => go('welcome')}/>
        </div>

        <div style={{ marginTop: 60, padding: 32, background: 'var(--ink)', color: 'var(--paper)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 26, fontWeight: 500 }}>Not sure yet?</div>
            <div style={{ fontSize: 14, color: 'var(--ink-4)', marginTop: 6 }}>Build your site free. Pay nothing until you want it live to the public.</div>
          </div>
          <button className="btn btn-accent" onClick={() => go('signup')}>Try the builder <Ic name="arrow-r" size={14} color="white"/></button>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 60 }}>
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, marginBottom: 20 }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Faq q="What happens when my trial ends?" a="All new signups get 14 days of full Pro access — no card required. If you don't add a card, you drop to the Free plan: your dashboard preview stays forever, but the live public URL goes offline (replaced with a friendly suspension page until you upgrade)."/>
            <Faq q="Can I use my own domain?" a="Yes. Custom domains are a one-time $10 setup on any paid plan. We give you a CNAME record pointing to your .pages.dev URL, you add it at your registrar, and we verify automatically."/>
            <Faq q="Do I own the site?" a="On Pro, you can download the full HTML/CSS/JS as a .zip at any time and host it elsewhere — no lock-in."/>
            <Faq q="What if I don't like what you built?" a="Describe the change in plain English. Revisions take 30–60 seconds and only re-run the affected components. Need a human touch? Manual human revisions are a $20 add-on."/>
          </div>
        </div>
      </div>
    </div>
  );
};

const PricingCard = ({ tier, price, period, features, cta, highlight, muted, onCta }) => (
  <div className="card" style={{
    padding: 28,
    background: highlight ? 'var(--ink)' : 'var(--paper)',
    color: highlight ? 'var(--paper)' : 'var(--ink)',
    borderColor: highlight ? 'transparent' : 'var(--rule-2)',
    position: 'relative',
    boxShadow: highlight ? '0 30px 80px rgba(0,0,0,0.18)' : 'none',
    transform: highlight ? 'scale(1.02)' : 'none',
  }}>
    {highlight && <div style={{ position: 'absolute', top: -12, left: 28, padding: '4px 10px', background: 'var(--accent)', color: 'white', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 100 }}>Most chosen</div>}
    <div className="mono" style={{ color: highlight ? 'var(--accent-soft)' : 'var(--ink-3)' }}>{tier}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
      <div className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.03em' }}>{price}</div>
      <div style={{ fontSize: 13, color: highlight ? 'var(--ink-4)' : 'var(--ink-3)' }}>{period}</div>
    </div>
    <ul style={{ marginTop: 22, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {features.map(f => (
        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5 }}>
          <Ic name="check" size={14} color={highlight ? 'var(--accent)' : 'var(--accent-ink)'}/>
          <span style={{ color: highlight ? 'var(--paper)' : 'var(--ink-2)' }}>{f}</span>
        </li>
      ))}
    </ul>
    <button
      onClick={onCta}
      className={highlight ? 'btn btn-accent' : muted ? 'btn btn-ghost' : 'btn btn-soft'}
      style={{ width: '100%', marginTop: 24, padding: '12px 16px' }}
      disabled={muted}>{cta}</button>
  </div>
);

const Faq = ({ q, a }) => {
  const [open, setOpen] = uS_extra(false);
  return (
    <div style={{ borderBottom: '1px solid var(--rule-2)', padding: '16px 0' }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{q}</div>
        <span style={{ fontSize: 18, color: 'var(--ink-3)' }}>{open ? '−' : '+'}</span>
      </div>
      {open && <div style={{ marginTop: 10, fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 720 }}>{a}</div>}
    </div>
  );
};

const DomainConnect = ({ go, user }) => {
  const [step, setStep] = uS_extra(0);
  const [domain, setDomain] = uS_extra('');
  return (
    <DashShell go={go} current="sites" user={user}>
      <div style={{ padding: '40px 48px 60px', maxWidth: 760 }}>
        <a onClick={() => go('site-detail')} style={{ fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Ic name="arrow-l" size={12} color="currentColor"/> Back to site
        </a>
        <div className="eyebrow" style={{ marginTop: 16, marginBottom: 10 }}>Custom domain</div>
        <h1 className="serif" style={{ fontSize: 40, lineHeight: 1.0, margin: 0, fontWeight: 400 }}>Use your own <span className="serif-italic">domain</span>.</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 12, maxWidth: 540 }}>$10 one-time setup. We give you two CNAMEs, you add them at your registrar, and we verify automatically.</p>

        {step === 0 && (
          <div className="card" style={{ marginTop: 28, padding: 28 }}>
            <label className="mono" style={{ display: 'block', marginBottom: 8 }}>Your domain</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mikespizza.com" style={{ flex: 1 }}/>
              <button className="btn btn-accent" disabled={!domain} onClick={() => setStep(1)}>Continue</button>
            </div>
            <div style={{ marginTop: 14, padding: 12, background: 'var(--paper-2)', borderRadius: 3, fontSize: 12.5, color: 'var(--ink-3)', display: 'flex', gap: 10 }}>
              <Ic name="info" size={14} color="var(--ink-3)"/>
              Don't own a domain yet? You can buy one at Namecheap or Porkbun in about 2 minutes — usually $10–15/yr.
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="card" style={{ marginTop: 28, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{domain || 'mikespizza.com'}</span>
              <span className="badge" style={{ background: 'var(--warn-soft)', color: 'oklch(0.45 0.10 80)', borderColor: 'transparent' }}><span className="sdot sdot-on"/> verifying</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Add these two records at your domain registrar. We'll detect them within a minute.</p>
            <DnsRow type="CNAME" host="@" value={`${domain.replace(/^www\./,'').split('.')[0] || 'mikes-pizza'}-a3f2.pages.dev`}/>
            <DnsRow type="CNAME" host="www" value={`${domain.replace(/^www\./,'').split('.')[0] || 'mikes-pizza'}-a3f2.pages.dev`}/>
            <div style={{ marginTop: 18, padding: 14, background: 'var(--accent-softer)', borderRadius: 3, fontSize: 12.5, display: 'flex', gap: 10, alignItems: 'center', color: 'var(--accent-ink)' }}>
              <span className="sdot sdot-on"/> Polling DNS every 30s. We'll email you when it's live.
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>Edit domain</button>
              <button className="btn btn-soft">Send instructions to email</button>
            </div>
          </div>
        )}
      </div>
    </DashShell>
  );
};

const DnsRow = ({ type, host, value }) => (
  <div style={{ marginTop: 14, padding: 14, border: '1px dashed var(--rule)', borderRadius: 3, display: 'grid', gridTemplateColumns: '70px 90px 1fr auto', gap: 12, alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 12 }}>
    <span className="badge">{type}</span>
    <span>{host}</span>
    <span style={{ color: 'var(--ink-2)' }}>{value}</span>
    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><Ic name="copy" size={13} color="currentColor"/></button>
  </div>
);

window.Pricing = Pricing;
window.DomainConnect = DomainConnect;
