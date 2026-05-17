// Onara landing — hi-fi, customer-facing rebuild
// Order: hero · press · transformation · how · gallery · vs · testimonials · pricing · faq · final cta

const { useState: uS_landing } = React;

const Landing = ({ go }) => {
  const [searchValue, setSearchValue] = uS_landing("Mike's Pizza Austin TX");
  const [faqOpen, setFaqOpen] = uS_landing(0);

  const submit = (e) => { e.preventDefault(); go('build', { q: searchValue }); };

  return (
    <div className="paper" style={{ minHeight: '100vh' }}>
      <TopNav go={go}/>

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section style={{ padding: '88px 40px 70px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -80, width: 460, height: 460, borderRadius: '50%', background: 'var(--accent-softer)', filter: 'blur(60px)', opacity: 0.75, zIndex: 0 }}/>
        <div style={{ position: 'absolute', top: 200, left: -100, width: 280, height: 280, borderRadius: '50%', background: 'oklch(0.94 0.04 145)', filter: 'blur(70px)', opacity: 0.5, zIndex: 0 }}/>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto' }}>
          <div className="mono" style={{ marginBottom: 22, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: 'var(--paper)', border: '1px solid var(--rule-2)', borderRadius: 100 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--leaf)', boxShadow: '0 0 0 3px oklch(0.55 0.08 145 / 0.2)' }}/>
            1,847 sites built this month
          </div>

          <h1 className="serif" style={{ fontSize: 92, lineHeight: 0.96, margin: 0, fontWeight: 400, letterSpacing: '-0.035em', textWrap: 'balance' }}>
            Your website,<br/>
            already <span className="serif-italic hand-u" style={{ fontWeight: 300 }}>built</span> from your<br/>
            Google Business Profile.
          </h1>
          <p style={{ fontSize: 19, color: 'var(--ink-3)', maxWidth: 600, margin: '30px auto 0', lineHeight: 1.5 }}>
            Type your business name. We pull your address, hours, photos and reviews — then design, write and deploy a complete site. In 90 seconds.
          </p>

          {/* Big search */}
          <form onSubmit={submit} style={{ marginTop: 40, maxWidth: 660, margin: '40px auto 0', display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'var(--paper)', border: '1px solid var(--ink)', borderRadius: 4, boxShadow: '0 14px 40px -8px rgba(20,16,10,0.10)' }}>
            <div style={{ paddingLeft: 14 }}><Ic name="search" size={18} color="var(--ink-3)"/></div>
            <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="e.g. Mike's Pizza Austin TX"
              style={{ flex: 1, fontSize: 15.5, color: 'var(--ink)', padding: '15px 0', border: 'none', background: 'transparent', outline: 'none' }}/>
            <button type="submit" className="btn btn-accent" style={{ padding: '14px 22px' }}>
              Build my site <Ic name="arrow-r" size={15} color="white"/>
            </button>
          </form>
          <div className="mono" style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 22, flexWrap: 'wrap' }}>
            <span><Ic name="check" size={11} color="var(--leaf)"/> 14-day Pro trial</span>
            <span><Ic name="check" size={11} color="var(--leaf)"/> No card required</span>
            <span><Ic name="check" size={11} color="var(--leaf)"/> Free forever plan</span>
          </div>

          {/* Hero preview */}
          <div style={{ marginTop: 80, maxWidth: 1080, margin: '80px auto 0' }}>
            <BrowserChrome url="mikes-pizza-a3f2.pages.dev">
              <PizzaSiteHero/>
            </BrowserChrome>
          </div>
        </div>
      </section>

      {/* ════════════════════════ PRESS / LOGO STRIP ════════════════════════ */}
      <section style={{ padding: '40px 40px 60px', borderTop: '1px solid var(--rule-2)' }}>
        <div className="container">
          <div className="mono" style={{ textAlign: 'center', marginBottom: 30 }}>As covered by</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 50, opacity: 0.55, flexWrap: 'wrap' }}>
            {[
              { name: 'Product Hunt', sub: '#1 Product of the Day' },
              { name: 'Indie Hackers', sub: 'Featured launch' },
              { name: 'Small Biz Trends', sub: 'May 2026' },
              { name: 'TechCrunch', sub: 'Startup Battlefield' },
              { name: 'Morning Brew', sub: 'Daily edit' },
            ].map(p => (
              <div key={p.name} style={{ textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ink-2)' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ TRANSFORMATION ════════════════════════ */}
      <section style={{ padding: '120px 40px', borderTop: '1px solid var(--rule-2)', background: 'var(--paper-2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>The trick</div>
            <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.02, margin: 0, fontWeight: 400, letterSpacing: '-0.02em', maxWidth: 760, marginInline: 'auto' }}>
              Your business is <span className="serif-italic">already</span> online.<br/>We just turn it into a website.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 0, alignItems: 'center', maxWidth: 1100, margin: '0 auto' }}>
            {/* Google card */}
            <div style={{ padding: 28, background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 6 }}>
              <div className="mono" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: 'conic-gradient(from 0deg, #4285f4 0 25%, #34a853 25% 50%, #fbbc04 50% 75%, #ea4335 75%)' }}/>
                Google Business Profile
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div className="ph" style={{ width: 70, height: 70, borderRadius: 4, background: '#c2541f', backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 5px, rgba(0,0,0,0.1) 5px 6px)', color: 'rgba(255,255,255,0.4)', fontSize: 7, flexShrink: 0 }}>LOGO</div>
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>Mike's Pizza</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12 }}>
                    <Ic name="star-fill" size={11} color="var(--accent)"/>
                    <span style={{ fontWeight: 600 }}>4.6</span>
                    <span style={{ color: 'var(--ink-3)' }}>· 312 Google reviews</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Pizza restaurant · $$</div>
                </div>
              </div>
              <div style={{ marginTop: 18, display: 'grid', gap: 8 }}>
                {[
                  ['pin', '218 Congress Ave, Austin TX'],
                  ['phone', '(512) 555-0182'],
                  ['clock', 'Open · closes 10pm'],
                  ['globe', 'No website on file'],
                ].map(([i, t], idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: idx === 3 ? 'var(--accent-ink)' : 'var(--ink-2)' }}>
                    <Ic name={i} size={13} color={idx === 3 ? 'var(--accent-ink)' : 'var(--ink-3)'}/>
                    <span style={{ fontStyle: idx === 3 ? 'italic' : 'normal' }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--rule-2)', display: 'flex', gap: 5 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} className="ph" style={{ flex: 1, aspectRatio: '1', background: ['#c2541f','#8a5a3a','#d4a574','#2a1d14'][i], borderRadius: 3 }}/>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="hand" style={{ fontSize: 17, color: 'var(--accent-ink)', whiteSpace: 'nowrap' }}>90 seconds</div>
              <div style={{ width: '100%', position: 'relative', height: 2 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'var(--accent)' }}/>
                <div style={{ position: 'absolute', right: -2, top: -5, width: 0, height: 0, borderLeft: '10px solid var(--accent)', borderTop: '6px solid transparent', borderBottom: '6px solid transparent' }}/>
              </div>
              <div className="mono" style={{ color: 'var(--accent-ink)' }}>onara</div>
            </div>

            {/* Website preview */}
            <div style={{ transform: 'scale(0.92)', transformOrigin: 'center' }}>
              <BrowserChrome url="mikes-pizza-a3f2.pages.dev" shadow={true}>
                <div style={{ height: 280, overflow: 'hidden' }}><CafeMock/></div>
              </BrowserChrome>
              <div style={{ marginTop: 18, textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: 19, fontWeight: 500 }}>Mike's Pizza</div>
                <div className="mono" style={{ marginTop: 4, color: 'var(--accent-ink)' }}>mikes-pizza-a3f2.pages.dev · live</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ HOW IT WORKS ════════════════════════ */}
      <section id="how" style={{ padding: '120px 40px', borderTop: '1px solid var(--rule-2)' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: 14 }}>How it works</div>
          <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.02, margin: 0, fontWeight: 400, letterSpacing: '-0.02em', maxWidth: 700 }}>
            Three steps. <span className="serif-italic" style={{ color: 'var(--ink-3)' }}>One coffee.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 56 }}>
            {[
              { n: '01', t: 'Type your business name', d: "We search Google Maps for your real profile — address, hours, photos, top reviews. Confirm it's you.", icon: 'search', hand: '~10 seconds' },
              { n: '02', t: 'Ten agents build it, live', d: "Analyst, copywriter, art director, designer, dev, debugger, QA — you watch them work in real time.", icon: 'sparkle', hand: '~80 seconds' },
              { n: '03', t: 'Ship to a real URL', d: "Deployed to Cloudflare Pages on a free .pages.dev URL. Connect your domain later for a $10 one-time add-on.", icon: 'globe', hand: 'instant' },
            ].map(s => (
              <div key={s.n} className="card" style={{ padding: 32, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                  <div className="mono" style={{ color: 'var(--accent-ink)' }}>step {s.n}</div>
                  <div className="hand" style={{ fontSize: 16 }}>{s.hand}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Ic name={s.icon} size={19} color="var(--accent-ink)"/>
                </div>
                <h3 className="serif" style={{ fontSize: 25, margin: '0 0 10px', fontWeight: 500, letterSpacing: '-0.015em' }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ GALLERY ════════════════════════ */}
      <section id="examples" style={{ padding: '120px 40px', borderTop: '1px solid var(--rule-2)', background: 'var(--paper-2)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 50, gap: 30, flexWrap: 'wrap' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Real generated sites</div>
              <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.02, margin: 0, fontWeight: 400, letterSpacing: '-0.02em', maxWidth: 720 }}>
                Every business gets its <span className="serif-italic">own look</span>.
              </h2>
              <p style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 14, maxWidth: 540, lineHeight: 1.6 }}>
                We don't use templates. Our art director agent picks type, palette and layout to match your category, vibe and photos.
              </p>
            </div>
            <button className="btn btn-soft btn-sm">Browse all 1,800+ sites <Ic name="arrow-r" size={13} color="currentColor"/></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            {SITE_MOCKS.map(s => {
              const Mock = s.Mock;
              return (
                <div key={s.id} className="card hover-lift" style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 260, position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--rule-2)' }}>
                    <Mock/>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="serif" style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em' }}>{s.name}</div>
                      <div className="mono" style={{ fontSize: 9.5, marginTop: 3 }}>{s.type}</div>
                    </div>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: s.accent, flexShrink: 0, marginTop: 3, border: '1px solid rgba(0,0,0,0.06)' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════ COMPARISON ════════════════════════ */}
      <section style={{ padding: '120px 40px', borderTop: '1px solid var(--rule-2)' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: 14 }}>The honest comparison</div>
          <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.02, margin: 0, fontWeight: 400, letterSpacing: '-0.02em', maxWidth: 720, marginBottom: 50 }}>
            Or you could spend <span className="serif-italic">three weekends</span> in Squarespace.
          </h2>

          <div style={{ overflow: 'hidden', border: '1px solid var(--rule)', borderRadius: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', background: 'var(--ink)', color: 'var(--paper)' }}>
              {['', 'Onara', 'Squarespace', 'Wix', 'Freelancer'].map((h, i) => (
                <div key={i} className={i === 1 ? 'serif' : 'mono'} style={{
                  padding: '18px 20px',
                  fontSize: i === 1 ? 17 : 11,
                  fontWeight: i === 1 ? 500 : 400,
                  color: i === 1 ? 'var(--accent)' : (i === 0 ? 'var(--ink-4)' : 'var(--paper)'),
                  borderRight: i < 4 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>{h || 'Compared on'}</div>
              ))}
            </div>
            {[
              ['Time to a live site', '90 seconds', '6 — 20 hours', '8 — 30 hours', '2 — 6 weeks'],
              ['Decisions you make', '1 (your name)', '~340', '~480', '~60 in meetings'],
              ['Content writing', 'Done for you', 'You write it', 'You write it', 'Often extra'],
              ['Photos & copy from Google', 'Auto-imported', '✕', '✕', 'You email them'],
              ['Starts at', 'Free', '$16 / mo', '$17 / mo', '$1,500 once'],
              ['Looks templatey', 'No', 'Often', 'Usually', 'Depends'],
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', borderTop: '1px solid var(--rule-2)' }}>
                {row.map((cell, j) => (
                  <div key={j} style={{
                    padding: '18px 20px',
                    fontSize: 13.5,
                    color: j === 0 ? 'var(--ink-2)' : (j === 1 ? 'var(--ink)' : 'var(--ink-3)'),
                    fontWeight: j === 1 ? 600 : (j === 0 ? 500 : 400),
                    background: j === 1 ? 'var(--accent-softer)' : 'transparent',
                    borderRight: j < 4 ? '1px solid var(--rule-2)' : 'none',
                  }}>{cell}</div>
                ))}
              </div>
            ))}
          </div>
          <div className="mono" style={{ marginTop: 14, textAlign: 'center' }}>
            We benchmarked against the cheapest paid plan of each, May 2026.
          </div>
        </div>
      </section>

      {/* ════════════════════════ TESTIMONIALS ════════════════════════ */}
      <section style={{ padding: '120px 40px', borderTop: '1px solid var(--rule-2)', background: 'var(--paper-2)' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: 14 }}>From small business owners</div>
          <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.02, margin: 0, fontWeight: 400, letterSpacing: '-0.02em', maxWidth: 760, marginBottom: 50 }}>
            They never wanted to <span className="serif-italic">build a website</span>.<br/>They just needed one.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                quote: "I'd been quoted $2,400 for a 'simple website'. I typed my bakery's name into Onara on the bus home. It was live before my stop.",
                name: 'Marisa Conte',
                biz: 'Pane & Co. — Portland, OR',
                initials: 'MC',
                color: 'oklch(0.62 0.13 50)',
              },
              {
                quote: "Twelve years in business, never had a website because every builder felt like homework. Onara pulled photos I forgot I'd uploaded to Google in 2018.",
                name: 'Ray Halstead',
                biz: 'Halstead Auto — Minneapolis',
                initials: 'RH',
                color: 'oklch(0.58 0.10 230)',
              },
              {
                quote: "I'm a florist, not a designer. The site they generated looked like something I'd have hired a brand studio for. I changed exactly two words.",
                name: 'Yuna Park',
                biz: 'Bloom — Brooklyn, NY',
                initials: 'YP',
                color: 'oklch(0.65 0.10 350)',
              },
            ].map((t, i) => (
              <div key={i} className="card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(s => <Ic key={s} name="star-fill" size={13} color="var(--accent)"/>)}
                </div>
                <div className="serif" style={{ fontSize: 19, lineHeight: 1.45, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  “{t.quote}”
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid var(--rule-2)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{t.biz}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ PRICING TEASER ════════════════════════ */}
      <section style={{ padding: '120px 40px', borderTop: '1px solid var(--rule-2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Pricing</div>
            <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.02, margin: 0, fontWeight: 400, letterSpacing: '-0.02em' }}>
              Start free. <span className="serif-italic">Upgrade when ready.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
            {[
              { name: 'Free', price: '$0', sub: '/forever', features: ['1 website', 'Dashboard preview only', '3 revisions / month', 'Onara badge in footer'], cta: 'Start free', accent: false },
              { name: 'Starter', price: '$12', sub: '/mo · 14-day Pro trial', features: ['1 website', 'Live public URL', '10 revisions / month', 'Custom domain ($10 one-time)', 'No Onara branding'], cta: 'Try Pro free for 14 days', accent: true, badge: 'Most popular' },
              { name: 'Pro', price: '$29', sub: '/mo · or $99/yr', features: ['3 websites', 'Unlimited revisions', 'Priority generation queue', 'Download code as .zip', 'White-label ready'], cta: 'Choose Pro', accent: false },
            ].map(p => (
              <div key={p.name} className="card" style={{
                padding: 28,
                position: 'relative',
                background: p.accent ? 'var(--ink)' : 'var(--paper)',
                color: p.accent ? 'var(--paper)' : 'var(--ink)',
                borderColor: p.accent ? 'var(--ink)' : 'var(--rule)',
              }}>
                {p.badge && (
                  <div style={{ position: 'absolute', top: -10, left: 28, padding: '4px 10px', background: 'var(--accent)', color: 'white', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 100 }}>{p.badge}</div>
                )}
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}>{p.name}</div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="serif" style={{ fontSize: 50, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: p.accent ? 'var(--ink-4)' : 'var(--ink-3)' }}>{p.sub}</span>
                </div>
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: p.accent ? '#ddd' : 'var(--ink-2)' }}>
                      <Ic name="check" size={14} color={p.accent ? 'var(--accent)' : 'var(--leaf)'}/>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button className={`btn ${p.accent ? 'btn-accent' : 'btn-soft'}`} style={{ marginTop: 26, width: '100%' }} onClick={() => go('welcome')}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ FAQ ════════════════════════ */}
      <section style={{ padding: '120px 40px', borderTop: '1px solid var(--rule-2)', background: 'var(--paper-2)' }}>
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="eyebrow" style={{ marginBottom: 14, textAlign: 'center' }}>Honest answers</div>
          <h2 className="serif" style={{ fontSize: 50, lineHeight: 1.02, margin: 0, fontWeight: 400, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 50 }}>
            The questions <span className="serif-italic">we get</span> the most.
          </h2>

          {[
            { q: 'What if I\'m not on Google Maps yet?', a: 'A robust manual fallback form lets you enter your info — name, address, hours, services, a few photos. Takes about two minutes. We strongly recommend claiming your Google Business Profile anyway; we\'ll walk you through it.' },
            { q: 'Can I edit the generated site?', a: 'Yes — describe the change in plain English ("make the hero darker", "shorter copy", "add an order online button") and our agents regenerate just the affected components. Free: 3 revisions/month. Starter: 10/month. Pro: unlimited.' },
            { q: 'What if Google has the wrong hours or address?', a: 'You\'ll see every imported field on a confirmation screen before generation. Fix it once on Onara and we\'ll keep the site in sync. Fix it on Google and we\'ll detect the change and offer to update.' },
            { q: 'Do I own the site if I cancel?', a: 'On Pro, download the full HTML/CSS/JS as a .zip at any time and host it elsewhere — no lock-in. Your .pages.dev URL goes offline if you downgrade (replaced with a friendly suspension page), and a custom domain you brought stays yours.' },
            { q: 'Will it rank on Google?', a: 'Sites ship with semantic HTML, structured data for local business, fast Cloudflare hosting, and your real NAP (name/address/phone) — the foundation Google looks for. We can\'t promise rank, but you\'re starting from a strong base.' },
            { q: 'I already have a website. Should I switch?', a: 'Run your business name through Onara as a test — it\'s free. Compare the result to what you have. Many of our customers were paying $30/mo for a site they hadn\'t updated in three years.' },
          ].map((f, i) => (
            <div key={i} className="card" style={{
              marginBottom: 10,
              padding: 0,
              background: 'var(--paper)',
              overflow: 'hidden',
              borderColor: faqOpen === i ? 'var(--ink)' : 'var(--rule)',
              transition: 'border-color 0.15s',
            }}>
              <button onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} style={{
                width: '100%', padding: '20px 24px', background: 'transparent', border: 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                textAlign: 'left', color: 'var(--ink)', fontSize: 16, fontWeight: 500,
                fontFamily: 'var(--ui)', letterSpacing: '-0.01em',
              }}>
                <span>{f.q}</span>
                <span style={{ transform: faqOpen === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-flex', color: 'var(--ink-3)' }}>
                  <Ic name="plus" size={16} color="currentColor"/>
                </span>
              </button>
              {faqOpen === i && (
                <div className="fadein-up" style={{ padding: '0 24px 22px', fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.65, maxWidth: 720 }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════ FINAL CTA ════════════════════════ */}
      <section style={{ padding: '130px 40px 120px', textAlign: 'center', background: 'var(--ink)', color: 'var(--paper)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.62 0.13 50 / 0.35), transparent 60%)', transform: 'translate(-50%, -50%)', filter: 'blur(40px)' }}/>
        <div className="container" style={{ position: 'relative' }}>
          <div className="mono" style={{ marginBottom: 22, color: 'oklch(0.85 0.04 60)' }}>One more thing</div>
          <h2 className="serif" style={{ fontSize: 88, fontWeight: 300, lineHeight: 0.98, margin: 0, letterSpacing: '-0.035em', textWrap: 'balance' }}>
            Stop staring at a<br/><span className="serif-italic">blank page</span>.
          </h2>
          <p style={{ fontSize: 18, color: 'var(--ink-4)', marginTop: 28, maxWidth: 540, margin: '28px auto 0', lineHeight: 1.55 }}>
            Onara starts where you already are — your Google Business Profile. Type your name, watch ten agents build your site, ship it in 90 seconds.
          </p>

          <form onSubmit={submit} style={{ marginTop: 40, maxWidth: 580, margin: '40px auto 0', display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4 }}>
            <div style={{ paddingLeft: 14 }}><Ic name="search" size={18} color="var(--ink-4)"/></div>
            <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
              style={{ flex: 1, fontSize: 15, color: 'var(--paper)', padding: '14px 0', border: 'none', background: 'transparent', outline: 'none' }}/>
            <button type="submit" className="btn btn-accent" style={{ padding: '14px 22px' }}>
              Try it free <Ic name="arrow-r" size={15} color="white"/>
            </button>
          </form>
          <div className="mono" style={{ marginTop: 16, color: 'oklch(0.78 0.04 60)' }}>14 days of Pro · No card · Cancel any time</div>
        </div>
      </section>

      {/* ════════════════════════ FOOTER ════════════════════════ */}
      <footer style={{ padding: '50px 40px 40px', background: 'var(--paper)', borderTop: '1px solid var(--rule-2)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 50 }}>
          <div>
            <Logo/>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 14, maxWidth: 260, lineHeight: 1.6 }}>
              Websites for small businesses, built from the data you already have.
            </p>
          </div>
          {[
            { h: 'Product', l: ['How it works', 'Pricing', 'Gallery', 'Roadmap'] },
            { h: 'Company', l: ['About', 'Blog', 'Careers', 'Press kit'] },
            { h: 'Legal', l: ['Privacy', 'Terms', 'DPA', 'Contact'] },
          ].map(col => (
            <div key={col.h}>
              <div className="mono" style={{ marginBottom: 14 }}>{col.h}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.l.map(it => <a key={it} style={{ fontSize: 13, color: 'var(--ink-2)', textDecoration: 'none', cursor: 'pointer' }}>{it}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'var(--ink-3)', borderTop: '1px solid var(--rule-2)', paddingTop: 26 }}>
          <div className="mono">© 2026 Onara · Made in Austin</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--leaf)' }}/>
            <span className="mono">All systems normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

window.Landing = Landing;
