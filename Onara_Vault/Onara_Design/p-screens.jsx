// Additional screens: Welcome onboarding, Analytics deep-dive, Settings deep-dive,
// Suspended public page, Trial-end modal, Public site (full), Mobile preview.

const { useState: uS_scr, useEffect: uE_scr } = React;

/* ════════════════════════════════════════════════════════════
   1. WELCOME — first-time post-signup
   ════════════════════════════════════════════════════════════ */
const Welcome = ({ go, user }) => {
  const [step, setStep] = uS_scr(0);
  const STEPS = [
    { mono: '01', title: 'Search Google', body: "We'll pull your real address, hours, photos, reviews — so you don't retype any of it." },
    { mono: '02', title: 'Tell us how it should feel', body: 'Optional. Pick a tone, a layout vibe, anything brand-specific. Or skip entirely.' },
    { mono: '03', title: 'We build. You watch.', body: '10 specialist agents work in sequence. 60–120 seconds. You get a real, public URL at the end.' },
  ];
  return (
    <DashShell go={go} current="dashboard" user={user}>
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '60px 40px', position: 'relative', overflow: 'hidden' }}>
        {/* soft background blooms */}
        <div style={{ position: 'absolute', top: -180, right: -120, width: 520, height: 520, borderRadius: '50%', background: 'oklch(0.62 0.13 50 / 0.15)', filter: 'blur(80px)' }}/>
        <div style={{ position: 'absolute', bottom: -200, left: -100, width: 480, height: 480, borderRadius: '50%', background: 'oklch(0.55 0.08 145 / 0.12)', filter: 'blur(80px)' }}/>

        <div style={{ maxWidth: 760, width: '100%', position: 'relative' }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Welcome to Onara</div>
          <h1 className="serif" style={{ fontSize: 64, lineHeight: 1.0, margin: 0, fontWeight: 400, letterSpacing: '-0.025em' }}>
            Hi {user.name?.split(' ')[0] || 'there'}.<br/>
            <span className="serif-italic" style={{ color: 'var(--accent-ink)' }}>Let's build your first site.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-3)', marginTop: 18, maxWidth: 520 }}>
            Three quick things to know before we start. The whole thing takes 60–120 seconds.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 40 }}>
            {STEPS.map((s, i) => (
              <div key={i}
                onMouseEnter={() => setStep(i)}
                className="card"
                style={{
                  padding: 22,
                  background: step === i ? 'var(--ink)' : 'var(--paper)',
                  color: step === i ? 'var(--paper)' : 'var(--ink)',
                  borderColor: step === i ? 'transparent' : 'var(--rule-2)',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                }}>
                <div className="mono" style={{ color: step === i ? 'var(--accent-soft)' : 'var(--ink-4)' }}>{s.mono}</div>
                <div className="serif" style={{ fontSize: 20, fontWeight: 500, marginTop: 10, letterSpacing: '-0.015em' }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: step === i ? 'var(--ink-5)' : 'var(--ink-3)', marginTop: 10, lineHeight: 1.5 }}>{s.body}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn btn-accent btn-lg" onClick={() => go('build')}>
              <Ic name="sparkle" size={15} color="white"/> Build my first site
            </button>
            <a onClick={() => go('dashboard')} style={{ fontSize: 13, color: 'var(--ink-3)', textDecoration: 'underline', cursor: 'pointer' }}>I'll explore first</a>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ink-3)' }}>
              <Ic name="shield" size={12} color="var(--leaf)"/> 14-day Pro trial · no card required
            </div>
          </div>
        </div>
      </div>
    </DashShell>
  );
};

/* ════════════════════════════════════════════════════════════
   2. ANALYTICS — replaces the placeholder analytics tab
   ════════════════════════════════════════════════════════════ */
const AnalyticsPanel = ({ site }) => {
  const [range, setRange] = uS_scr('7d');
  const data30 = [12,18,14,22,19,28,31,22,35,29,42,38,31,44,52,47,55,48,62,58,71,66,59,72,68,74,81,76,88,92];
  const data = range === '7d' ? data30.slice(-7) : range === '30d' ? data30 : data30.slice(0, 14);
  const max = Math.max(...data);
  const total = data.reduce((a,b) => a+b, 0);

  return (
    <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="mono">Performance overview</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['7d','7 days'], ['14d','14 days'], ['30d','30 days']].map(([k, l]) => (
            <button key={k} className={`chip ${range === k ? 'chip-active' : ''}`} style={{ padding: '5px 12px', fontSize: 11.5 }} onClick={() => setRange(k)}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <MetricCard label="Visits"        value={total.toLocaleString()} delta="+24%" sub="vs prev period"/>
        <MetricCard label="Phone calls"   value="28"   delta="+12%" sub="from the call button"/>
        <MetricCard label="Directions"    value="14"   delta="+8%"  sub="Maps clicks"/>
        <MetricCard label="Avg. on page"  value="1:42" delta="+9s"  sub="duration"/>
      </div>

      {/* Big chart */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{total.toLocaleString()} <span style={{ color: 'var(--ink-3)', fontWeight: 400, fontSize: 14 }}>visits</span></div>
            <div className="mono" style={{ marginTop: 4 }}>Last {range === '7d' ? 7 : range === '14d' ? 14 : 30} days</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 11.5, color: 'var(--ink-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: 2 }}/> Visits</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--leaf)', borderRadius: 2 }}/> Conversions</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180 }}>
          {data.map((h, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
              <div style={{ height: `${(h/max)*100}%`, background: 'var(--accent)', borderRadius: '2px 2px 0 0', opacity: 0.55 + (i/data.length)*0.45, position: 'relative' }}>
                {i === data.length - 1 && (
                  <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                    {h}
                  </div>
                )}
              </div>
              <div style={{ height: `${Math.max(2, (h/max)*22)}%`, background: 'var(--leaf)', borderRadius: 2, opacity: 0.5 }}/>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Sources */}
        <div className="card" style={{ padding: 22 }}>
          <div className="mono" style={{ marginBottom: 16 }}>Where visitors came from</div>
          {[
            ['Google Search', 187, 'var(--accent)'],
            ['Google Maps',    74, 'var(--leaf)'],
            ['Direct',         32, 'var(--ink-3)'],
            ['Facebook',       12, 'oklch(0.65 0.13 240)'],
            ['Instagram',       7, 'oklch(0.65 0.18 350)'],
          ].map(([name, val, col]) => {
            const pct = (val/187)*100;
            return (
              <div key={name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span>{name}</span>
                  <span className="mono" style={{ fontSize: 10.5 }}>{val}</span>
                </div>
                <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: col, transition: 'width 0.4s' }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top pages + devices */}
        <div className="card" style={{ padding: 22 }}>
          <div className="mono" style={{ marginBottom: 16 }}>Top pages</div>
          {[
            ['/', 218, '70%'],
            ['/menu', 71, '23%'],
            ['/visit', 19, '6%'],
            ['/order', 5, '1%'],
          ].map(([p, v, pct]) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--rule-2)' }}>
              <span className="mono" style={{ color: 'var(--ink-2)', textTransform: 'none' }}>{p}</span>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{pct}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', gap: 18, fontSize: 11.5, color: 'var(--ink-3)' }}>
            <DeviceBar label="Mobile" pct={72}/>
            <DeviceBar label="Desktop" pct={24}/>
            <DeviceBar label="Tablet" pct={4}/>
          </div>
        </div>
      </div>

      {/* Insight strip */}
      <div className="card" style={{ padding: 18, background: 'var(--accent-softer)', borderColor: 'transparent', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Ic name="sparkle" size={16} color="var(--accent-ink)"/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>Friday evenings drive 41% of weekly calls. <span style={{ color: 'var(--ink-3)' }}>Consider mentioning your Friday specials higher on the homepage.</span></div>
        </div>
        <button className="btn btn-soft btn-sm">Apply suggestion</button>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, delta, sub }) => (
  <div className="card" style={{ padding: 18 }}>
    <div className="mono">{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
      <div className="serif" style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'oklch(0.55 0.14 145)', fontWeight: 500 }}>{delta}</div>
    </div>
    <div className="mono" style={{ marginTop: 2 }}>{sub}</div>
  </div>
);

const DeviceBar = ({ label, pct }) => (
  <div style={{ flex: 1 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span>{label}</span><span>{pct}%</span>
    </div>
    <div style={{ height: 4, background: 'var(--paper-2)', borderRadius: 2 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--ink-3)', borderRadius: 2 }}/>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   3. SETTINGS — replaces the placeholder settings tab
   ════════════════════════════════════════════════════════════ */
const SettingsPanel = ({ site, go }) => {
  const [pubStatus, setPubStatus] = uS_scr(site?.status === 'live');
  return (
    <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
      <SettingsBlock title="Publishing" desc="Control whether visitors can reach this site.">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>{pubStatus ? 'Site is live' : 'Site is paused'}</div>
            <div className="mono" style={{ marginTop: 2 }}>{pubStatus ? 'mikespizza.com responds with your site' : 'visitors see a "coming soon" page'}</div>
          </div>
          <Toggle on={pubStatus} onChange={setPubStatus}/>
        </div>
      </SettingsBlock>

      <SettingsBlock title="SEO & sharing" desc="What Google and social cards show.">
        <SettingsField label="Page title" value="Mike's Pizza — Wood-fired in East Austin" hint="60 char max · 48 used"/>
        <SettingsField label="Meta description" value="72-hour cold ferment dough, San Marzano tomatoes, fior di latte. Open till 10pm in East Austin." hint="160 char max · 94 used"/>
        <div style={{ display: 'flex', gap: 12, marginTop: 14, padding: 14, background: 'var(--paper-2)', borderRadius: 3 }}>
          <Ic name="info" size={14} color="var(--ink-3)"/>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            LocalBusiness schema is embedded automatically. Open Graph & Twitter cards use your first hero photo.
          </div>
        </div>
      </SettingsBlock>

      <SettingsBlock title="Domain" desc="Your live address.">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div>
            <div className="mono" style={{ fontSize: 13, textTransform: 'none', color: 'var(--ink)' }}>mikespizza.com</div>
            <div className="mono" style={{ marginTop: 2 }}>verified · auto-renew on</div>
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => go && go('domain')}>Manage</button>
        </div>
      </SettingsBlock>

      <SettingsBlock title="Sync from Google" desc="Auto-update hours, photos, and reviews from your Google Business Profile.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <CheckRow label="Hours" desc="Mirror Google hours" defaultOn/>
          <CheckRow label="Reviews" desc="Refresh top 3 weekly" defaultOn/>
          <CheckRow label="Photos" desc="Pull new uploads" defaultOn={false}/>
          <CheckRow label="Phone & address" desc="Stay in sync" defaultOn/>
        </div>
      </SettingsBlock>

      <SettingsBlock title="Export" desc="Take it elsewhere any time. No lock-in.">
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button className="btn btn-soft"><Ic name="download" size={13} color="currentColor"/> Download HTML/CSS</button>
          <button className="btn btn-soft"><Ic name="copy" size={13} color="currentColor"/> Copy GitHub repo</button>
        </div>
      </SettingsBlock>

      <SettingsBlock title="Danger zone" danger desc="These actions can't be undone.">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Delete this site</div>
            <div className="mono" style={{ marginTop: 2 }}>permanently removes the site, URL, and all revisions</div>
          </div>
          <button className="btn btn-ghost" style={{ color: 'oklch(0.55 0.15 25)', borderColor: 'oklch(0.55 0.15 25 / 0.3)' }}>
            <Ic name="trash" size={13} color="currentColor"/> Delete
          </button>
        </div>
      </SettingsBlock>
    </div>
  );
};

const SettingsBlock = ({ title, desc, children, danger }) => (
  <div className="card" style={{ padding: 22, borderColor: danger ? 'oklch(0.85 0.08 25)' : undefined, background: danger ? 'oklch(0.97 0.02 25)' : undefined }}>
    <div className="serif" style={{ fontSize: 17, fontWeight: 500, color: danger ? 'oklch(0.45 0.15 25)' : 'var(--ink)' }}>{title}</div>
    {desc && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4, marginBottom: 14 }}>{desc}</div>}
    {children}
  </div>
);

const SettingsField = ({ label, value, hint }) => (
  <div style={{ marginTop: 12 }}>
    <label className="mono" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
    <input className="input" defaultValue={value}/>
    {hint && <div className="mono" style={{ marginTop: 4, fontSize: 10 }}>{hint}</div>}
  </div>
);

const CheckRow = ({ label, desc, defaultOn }) => {
  const [on, setOn] = uS_scr(defaultOn);
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, border: '1px solid var(--rule-2)', borderRadius: 3, cursor: 'pointer', background: on ? 'var(--accent-softer)' : 'transparent' }}>
      <div onClick={() => setOn(!on)} style={{
        width: 16, height: 16, borderRadius: 3, border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--rule)'),
        background: on ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
      }}>
        {on && <Ic name="check" size={11} color="white" strokeWidth={2.5}/>}
      </div>
      <div onClick={() => setOn(!on)} style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div className="mono" style={{ marginTop: 2, fontSize: 10 }}>{desc}</div>
      </div>
    </label>
  );
};

const Toggle = ({ on, onChange }) => (
  <button onClick={() => onChange(!on)} style={{
    width: 44, height: 24, borderRadius: 100, border: 'none',
    background: on ? 'var(--accent)' : 'var(--ink-5)',
    position: 'relative', cursor: 'pointer', transition: 'background 0.18s',
    padding: 0,
  }}>
    <span style={{
      position: 'absolute', top: 3, left: on ? 23 : 3,
      width: 18, height: 18, borderRadius: '50%', background: 'white',
      transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }}/>
  </button>
);

/* ════════════════════════════════════════════════════════════
   4. SUSPENDED — public-facing page when a site is paused
   ════════════════════════════════════════════════════════════ */
const Suspended = ({ go }) => (
  <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', overflow: 'hidden' }}>
    {/* Ghosted preview of the actual site behind */}
    <div style={{ position: 'absolute', inset: 0, opacity: 0.06, filter: 'blur(3px)', pointerEvents: 'none' }}>
      <PizzaSiteHero/>
    </div>
    <div style={{ position: 'relative', textAlign: 'center', maxWidth: 520 }}>
      <div className="mono" style={{ marginBottom: 14, color: 'var(--accent-ink)' }}>This site is on a quick break</div>
      <h1 className="serif" style={{ fontSize: 56, lineHeight: 1.0, margin: 0, fontWeight: 400, letterSpacing: '-0.02em' }}>
        Back <span className="serif-italic">soon</span>.
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 16, lineHeight: 1.6 }}>
        Mike's Pizza is still serving — the website's just paused while we update it.<br/>
        Call <strong style={{ color: 'var(--ink)' }}>(512) 555-0182</strong> or find us at 218 Congress Ave.
      </p>
      <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <a className="btn btn-accent" href="tel:5125550182"><Ic name="phone" size={13} color="white"/> Call now</a>
        <a className="btn btn-soft" href="#"><Ic name="pin" size={13} color="currentColor"/> Get directions</a>
      </div>
      <div style={{ marginTop: 50, padding: '14px 18px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
        <Logo/>
        <span style={{ marginLeft: 8 }}>· hosted by the owner</span>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   5. TRIAL-END MODAL — gentle paywall
   ════════════════════════════════════════════════════════════ */
const TrialEnd = ({ go, onClose }) => (
  <Modal onClose={onClose} width={520}>
    <div style={{ padding: 36, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: '50%', background: 'var(--accent-softer)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Ic name="clock" size={22} color="var(--accent-ink)"/>
      </div>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Trial ends today</div>
      <h2 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}>
        Keep Mike's Pizza <span className="serif-italic">online</span>?
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 12, lineHeight: 1.55, maxWidth: 380, margin: '12px auto 0' }}>
        Your URL stays live, your custom domain stays connected, and revisions stay unlimited. Less than a Saturday pizza.
      </p>

      <div style={{ marginTop: 22, padding: 20, background: 'var(--paper-2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
        <div>
          <div className="mono">Onara Starter</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>Monthly · cancel anytime</div>
        </div>
        <div className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>$12<span style={{ fontSize: 13, color: 'var(--ink-3)' }}>/mo</span></div>
      </div>

      <button className="btn btn-accent" style={{ width: '100%', marginTop: 18, padding: '14px 20px' }} onClick={() => { onClose && onClose(); go && go('account'); }}>
        Add payment · keep sites live
      </button>
      <a onClick={() => { onClose && onClose(); go && go('suspended'); }} style={{ display: 'inline-block', marginTop: 14, fontSize: 12, color: 'var(--ink-3)', textDecoration: 'underline', cursor: 'pointer' }}>
        Pause my sites instead
      </a>
    </div>
  </Modal>
);

/* ════════════════════════════════════════════════════════════
   6. PUBLIC SITE — the actual generated Mike's Pizza homepage, full
   ════════════════════════════════════════════════════════════ */
const PublicSite = ({ go }) => (
  <div style={{ minHeight: '100vh', background: '#16100c' }}>
    <PizzaSiteHero/>

    {/* MENU */}
    <section style={{ background: '#1a130e', padding: '80px 44px', color: '#f3e9d7' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#e8a368', marginBottom: 10 }}>The menu</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 56, lineHeight: 0.95, fontWeight: 400, margin: 0, letterSpacing: '-0.025em' }}>
              Eight pies. <span style={{ fontStyle: 'italic', fontWeight: 300 }}>That's it.</span>
            </h2>
          </div>
          <div style={{ fontSize: 13, color: '#a89684', maxWidth: 280, lineHeight: 1.6 }}>
            Everything is 12 inches, hand-stretched, fired at 900°F for 90 seconds. Gluten-free crust available.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px 80px' }}>
          {[
            ['Margherita', 'San Marzano, fior di latte, basil, sea salt', '14'],
            ['Pepperoni', 'Calabrian pepperoni, fior di latte, oregano', '16'],
            ['Funghi', 'Roasted cremini & shiitake, taleggio, thyme', '17'],
            ['Sopressata', 'Hot soppressata, honey, chili, fior di latte', '17'],
            ['Bianca', 'Ricotta, mozzarella, garlic confit, lemon zest', '15'],
            ['Diavola', 'Soppressata, chili oil, smoked mozzarella', '17'],
            ['Verdura', 'Wild greens, ricotta salata, garlic, lemon', '16'],
            ['Margherita+', 'Burrata added at the table', '19'],
          ].map(([n, d, p]) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, paddingBottom: 18, borderBottom: '1px solid rgba(232,163,104,0.12)' }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}>{n}</div>
                <div style={{ fontSize: 12.5, color: '#a89684', marginTop: 4 }}>{d}</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: '#e8a368' }}>${p}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* STORY + PHOTO BAND */}
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 480, background: '#16100c' }}>
      <div className="ph" style={{
        background: '#2a1d14', minHeight: 480,
        backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 10px, rgba(232,163,104,0.05) 10px 11px), radial-gradient(circle at 40% 60%, #5a2a16 0%, #2a1d14 70%)',
        color: 'rgba(232,163,104,0.45)', fontSize: 10, letterSpacing: '0.1em',
      }}>OWNER PORTRAIT</div>
      <div style={{ padding: '80px 60px', color: '#f3e9d7', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#e8a368', marginBottom: 14 }}>Our story</div>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 44, lineHeight: 1.0, fontWeight: 400, margin: 0, letterSpacing: '-0.025em' }}>
          Slow dough,<br/><span style={{ fontStyle: 'italic', fontWeight: 300 }}>since 2008.</span>
        </h2>
        <p style={{ fontSize: 14.5, color: '#c4b29a', marginTop: 22, lineHeight: 1.75, maxWidth: 440 }}>
          Mike trained in Naples in '04, came back to Austin with a hand-built oven and a stubborn belief that pizza is a 72-hour project, not a 12-minute one. We've been at it on Congress for fourteen years.
        </p>
        <div style={{ marginTop: 28, display: 'flex', gap: 30, paddingTop: 24, borderTop: '1px solid rgba(243,233,215,0.08)' }}>
          <Stat2 n="72hr" l="cold ferment"/>
          <Stat2 n="900°" l="oven temp"/>
          <Stat2 n="14yr" l="on Congress"/>
        </div>
      </div>
    </section>

    {/* REVIEWS */}
    <section style={{ background: '#1a130e', padding: '80px 44px', color: '#f3e9d7' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="mono" style={{ color: '#e8a368', marginBottom: 10 }}>What people say</div>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, margin: '0 0 36px', letterSpacing: '-0.02em' }}>
          4.6 <span style={{ color: '#e8a368' }}>★</span> on Google · <span style={{ color: '#a89684', fontStyle: 'italic', fontWeight: 300 }}>312 reviews and counting</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            ['"Best pizza in Austin, full stop. The Sopressata is criminal."', 'James K.'],
            ['"Worth the wait on a Friday. The dough is a different animal."', 'Marisol R.'],
            ['"We drove in from San Antonio. Already planning the next trip."', 'Daniel T.'],
          ].map(([q, who], i) => (
            <div key={i} style={{ padding: 26, background: '#211912', borderRadius: 4, border: '1px solid rgba(232,163,104,0.1)' }}>
              <div style={{ display: 'flex', gap: 1, marginBottom: 14 }}>{[1,2,3,4,5].map(s => <Ic key={s} name="star-fill" size={12} color="#e8a368"/>)}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.4, fontStyle: 'italic', fontWeight: 300 }}>{q}</div>
              <div style={{ marginTop: 14, fontSize: 11.5, fontFamily: 'var(--mono)', color: '#a89684', letterSpacing: '0.08em' }}>— {who}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* VISIT / FOOTER */}
    <section style={{ background: '#0f0a07', padding: '80px 44px 40px', color: '#f3e9d7' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 60, paddingBottom: 50, borderBottom: '1px solid rgba(232,163,104,0.12)' }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.0 }}>
              218 Congress Ave<br/><span style={{ color: '#e8a368', fontStyle: 'italic', fontWeight: 300 }}>Austin, TX 78701</span>
            </div>
            <div style={{ marginTop: 18, fontSize: 13, color: '#a89684' }}>(512) 555-0182 · mike@mikespizza.com</div>
          </div>
          <div>
            <div className="mono" style={{ color: '#e8a368', marginBottom: 14 }}>Hours</div>
            {[
              ['Mon–Wed', '5pm – 10pm'],
              ['Thu', '5pm – 11pm'],
              ['Fri–Sat', '4pm – 12am'],
              ['Sun', '4pm – 10pm'],
            ].map(([d, h]) => (
              <div key={d} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#c4b29a', padding: '4px 0' }}>
                <span>{d}</span><span>{h}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="mono" style={{ color: '#e8a368', marginBottom: 14 }}>Follow</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#c4b29a' }}>
              <span>Instagram</span>
              <span>Yelp</span>
              <span>Google</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--mono)', color: '#6f5a44', letterSpacing: '0.08em' }}>
          <span>© 2026 MIKE'S PIZZA · ALL RIGHTS RESERVED</span>
          <a onClick={() => go && go('landing')} style={{ cursor: 'pointer', color: '#6f5a44' }}>SITE BY ONARA</a>
        </div>
      </div>
    </section>
  </div>
);

const Stat2 = ({ n, l }) => (
  <div>
    <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', color: '#e8a368' }}>{n}</div>
    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#a89684', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{l}</div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   7. MOBILE PREVIEW — site rendered in iPhone frame
   ════════════════════════════════════════════════════════════ */
const MobilePreview = ({ go, user }) => {
  const [device, setDevice] = uS_scr('phone');
  return (
    <DashShell go={go} current="sites" user={user}>
      <div style={{ padding: '32px 48px 60px' }}>
        <a onClick={() => go('site-detail')} style={{ fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Ic name="arrow-l" size={12} color="currentColor"/> Back to site
        </a>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16, marginBottom: 28 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Preview · Mike's Pizza</div>
            <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}>How it looks on every screen.</h1>
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--paper-2)', borderRadius: 100, border: '1px solid var(--rule-2)' }}>
            {[['phone','Phone'],['tablet','Tablet'],['desktop','Desktop']].map(([k,l]) => (
              <button key={k} className={`chip ${device === k ? 'chip-active' : ''}`} style={{ border: 'none', padding: '6px 14px', fontSize: 12 }} onClick={() => setDevice(k)}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', background: 'var(--paper-2)', borderRadius: 6, border: '1px dashed var(--rule)' }}>
          {device === 'phone' && <PhoneFrame><PizzaMobile/></PhoneFrame>}
          {device === 'tablet' && (
            <div style={{ width: 600, height: 800, background: '#1a1a1a', borderRadius: 24, padding: 14, boxShadow: '0 30px 80px rgba(0,0,0,0.15)' }}>
              <div style={{ height: '100%', background: '#16100c', borderRadius: 12, overflow: 'hidden', transform: 'scale(0.66)', transformOrigin: '0 0', width: 909, height: 1212 }}>
                <PublicSite go={go}/>
              </div>
            </div>
          )}
          {device === 'desktop' && (
            <div style={{ width: '90%', maxWidth: 1100 }}>
              <BrowserChrome url="mikespizza.com" height={580}>
                <div style={{ height: 580, overflow: 'hidden' }}>
                  <PizzaSiteHero/>
                </div>
              </BrowserChrome>
            </div>
          )}
        </div>
      </div>
    </DashShell>
  );
};

const PhoneFrame = ({ children }) => (
  <div style={{
    width: 320, height: 660, background: '#1a1a1a',
    borderRadius: 38, padding: 8,
    boxShadow: '0 30px 80px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.05)',
    position: 'relative',
  }}>
    <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 90, height: 22, background: '#000', borderRadius: 100, zIndex: 2 }}/>
    <div style={{ width: '100%', height: '100%', background: '#16100c', borderRadius: 32, overflow: 'hidden', position: 'relative' }}>
      {children}
    </div>
  </div>
);

const PizzaMobile = () => (
  <div style={{ height: '100%', overflow: 'auto', background: '#16100c', color: '#f3e9d7', fontFamily: 'var(--ui)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '50px 18px 14px' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500 }}>Mike's <span style={{ fontStyle: 'italic', color: '#e8a368' }}>Pizza</span></div>
      <Ic name="menu" size={18} color="#f3e9d7"/>
    </div>
    <div style={{ padding: '12px 18px 24px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.15em', color: '#e8a368' }}>WOOD-FIRED · SINCE 2008</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 38, lineHeight: 0.98, fontWeight: 400, letterSpacing: '-0.025em', marginTop: 14 }}>
        Austin's<br/><span style={{ fontStyle: 'italic', fontWeight: 300 }}>slowest</span> pizza dough.
      </div>
      <div style={{ fontSize: 12, color: '#a89684', marginTop: 14, lineHeight: 1.6 }}>
        72-hour cold ferment. San Marzano, fior di latte, 900° hearth.
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ padding: '12px', background: '#e8a368', color: '#16100c', borderRadius: 2, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Order online</div>
        <div style={{ padding: '12px', border: '1px solid rgba(243,233,215,0.2)', borderRadius: 2, fontSize: 13, textAlign: 'center' }}>(512) 555-0182</div>
      </div>
      <div className="ph" style={{
        marginTop: 18, height: 200,
        background: '#6e1f08', backgroundImage: 'radial-gradient(circle at 30% 30%, #c2541f, #6e1f08 80%), repeating-linear-gradient(-45deg, transparent 0 10px, rgba(0,0,0,0.06) 10px 11px)',
        color: 'rgba(255,225,200,0.4)', borderRadius: 4,
      }}>MARGHERITA</div>
      <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.15em', color: '#e8a368' }}>THE MENU</div>
      {[['Margherita','$14'],['Pepperoni','$16'],['Funghi','$17'],['Sopressata','$17']].map(([n,p]) => (
        <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(232,163,104,0.12)', fontSize: 13 }}>
          <span style={{ fontFamily: 'var(--serif)' }}>{n}</span><span style={{ color: '#e8a368' }}>{p}</span>
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, {
  Welcome,
  AnalyticsPanel, SettingsPanel,
  Suspended, TrialEnd,
  PublicSite, MobilePreview,
  Toggle,
});
