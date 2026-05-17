// Build flow — search → confirm → style preferences
const { useState: uS_build } = React;

const StepIndicator = ({ current, steps }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'center', marginBottom: 56 }}>
    {steps.map((s, i) => (
      <React.Fragment key={s}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: i < current ? 'var(--ink)' : i === current ? 'var(--accent)' : 'var(--paper)',
            border: '1px solid ' + (i <= current ? 'transparent' : 'var(--rule)'),
            color: i <= current ? 'white' : 'var(--ink-4)',
            fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--mono)'
          }}>
            {i < current ? <Ic name="check" size={12} color="white"/> : i + 1}
          </div>
          <span style={{ fontSize: 12.5, color: i === current ? 'var(--ink)' : 'var(--ink-3)', fontWeight: i === current ? 500 : 400 }}>{s}</span>
        </div>
        {i < steps.length - 1 && <div style={{ width: 36, height: 1, background: 'var(--rule)', margin: '0 18px' }}/>}
      </React.Fragment>
    ))}
  </div>
);

const BuildFlow = ({ go, initialQ = '', user }) => {
  const [step, setStep] = uS_build(0);
  const [query, setQuery] = uS_build(initialQ);
  const [results, setResults] = uS_build(null);
  const [chosen, setChosen] = uS_build(null);
  const [tone, setTone] = uS_build('Friendly');
  const [colorStyle, setColorStyle] = uS_build('Auto');
  const [layout, setLayout] = uS_build('Modern');
  const [extra, setExtra] = uS_build('');

  const SAMPLE = [
    { id: '1', name: "Mike's Pizza",        addr: '218 Congress Ave, Austin TX',  phone: '(512) 555-0182', rating: 4.6, reviews: 312, hours: 'Open · closes 10pm',   category: 'Pizza restaurant',     color: '#16100c', accent: '#e8a368', photos: ['#c2541f', '#6e1f08', '#3a2018', '#8b3e22'] },
    { id: '2', name: "Mike's Pizzeria",     addr: '5500 Burnet Rd, Austin TX',    phone: '(512) 555-0244', rating: 4.3, reviews: 89,  hours: 'Closed · opens 11am',  category: 'Italian restaurant',   color: '#2a1f1a', accent: '#c9986b', photos: ['#8b3e22', '#3a2018', '#c9986b', '#5a2a16'] },
    { id: '3', name: "Mike's Mobile Pizza", addr: 'East 6th St, Austin TX',       phone: null,             rating: 4.8, reviews: 47,  hours: 'Hours vary',          category: 'Food truck',           color: '#3a2410', accent: '#ffd23f', photos: ['#9a7042', '#c9986b', '#3a2410', '#5a3a20'] },
  ];

  const doSearch = () => setResults(SAMPLE);

  const STEPS = ['Find', 'Confirm', 'Style', 'Generate'];

  return (
    <DashShell go={go} current="build" user={user}>
      <div style={{ padding: '60px 40px 40px', maxWidth: 920, margin: '0 auto' }}>
        <StepIndicator current={step} steps={STEPS}/>

        {/* STEP 1: SEARCH */}
        {step === 0 && (
          <div className="fadein-up">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Step 1 · Find your business</div>
              <h1 className="serif" style={{ fontSize: 48, lineHeight: 1.05, margin: 0, fontWeight: 400 }}>
                Where are you on <span className="serif-italic">Google</span>?
              </h1>
              <p style={{ fontSize: 14.5, color: 'var(--ink-3)', marginTop: 14 }}>We'll pull your real address, hours, photos, and reviews.</p>
            </div>

            <div style={{ display: 'flex', gap: 10, padding: 8, background: 'var(--paper)', border: '1px solid var(--ink)', borderRadius: 4, boxShadow: '0 6px 24px rgba(0,0,0,0.05)' }}>
              <div style={{ paddingLeft: 14, display: 'flex', alignItems: 'center' }}><Ic name="search" size={18} color="var(--ink-3)"/></div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Mike's Pizza Austin TX" style={{ flex: 1, fontSize: 15, padding: '14px 0', border: 'none', background: 'transparent', outline: 'none' }}/>
              <button className="btn btn-accent" onClick={doSearch} style={{ padding: '12px 22px' }}>Search Google</button>
            </div>

            {results && (
              <div style={{ marginTop: 32 }} className="fadein-up">
                <div className="mono" style={{ marginBottom: 14 }}>3 matches found</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.map(r => (
                    <div key={r.id} className="card hover-lift" style={{ padding: 18, display: 'flex', gap: 18, cursor: 'pointer', alignItems: 'center' }}
                      onClick={() => { setChosen(r); setStep(1); }}>
                      <BizMonogram name={r.name} color={r.color} textColor={r.accent} size={64} radius={3}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                          <div className="serif" style={{ fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em' }}>{r.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-3)' }}>
                            <Ic name="star-fill" size={11} color="var(--accent)"/> {r.rating} · {r.reviews}
                          </div>
                          <span className="badge" style={{ background: 'var(--paper-2)' }}>{r.category}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Ic name="pin" size={11} color="var(--ink-4)"/> {r.addr}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4, display: 'flex', gap: 16 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Ic name="phone" size={10} color="currentColor"/> {r.phone || <span style={{ color: 'var(--accent-ink)' }}>no phone on file</span>}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Ic name="clock" size={10} color="currentColor"/> {r.hours}</span>
                        </div>
                      </div>
                      <Ic name="arrow-r" size={16} color="var(--ink-4)"/>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--ink-3)' }}>
                  Not here? <a style={{ color: 'var(--accent-ink)', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => { setChosen({ id: 'manual', name: 'New Business', addr: '', phone: '', color: 'var(--ink-2)', accent: 'var(--accent)', photos: [] }); setStep(1); }}>Enter manually</a>
                </div>
              </div>
            )}

            {!results && (
              <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--ink-4)', fontSize: 13 }}>
                <div className="hand" style={{ fontSize: 17, marginBottom: 6 }}>↑ try the example above</div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CONFIRM */}
        {step === 1 && chosen && (
          <div className="fadein-up">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Step 2 · Confirm</div>
              <h1 className="serif" style={{ fontSize: 48, lineHeight: 1.05, margin: 0, fontWeight: 400 }}>Is this <span className="serif-italic">you</span>?</h1>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Photo strip — what we pulled from Google */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 2, height: 200, background: chosen.color }}>
                {(chosen.photos || ['#3a2018','#5a2a16','#8b3e22']).slice(0, 3).map((c, i) => (
                  <div key={i} style={{
                    background: c,
                    backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 10px, rgba(255,255,255,0.04) 10px 11px)',
                    position: 'relative',
                  }}>
                    {i === 0 && (
                      <div style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 9.5, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)' }}>
                        FROM GOOGLE · 1 OF 47
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: '24px 28px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
                  <BizMonogram name={chosen.name} color={chosen.color} textColor={chosen.accent || '#fff'} size={52} radius={3}/>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Ic name="google" size={11}/> imported from Google Business Profile
                    </div>
                    <div className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.0 }}>{chosen.name}</div>
                    {chosen.category && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>{chosen.category}</div>}
                  </div>
                  {chosen.rating && (
                    <div style={{ textAlign: 'right', paddingLeft: 12, borderLeft: '1px solid var(--rule-2)' }}>
                      <div style={{ fontSize: 24, fontWeight: 500, fontFamily: 'var(--serif)', letterSpacing: '-0.02em' }}>{chosen.rating}</div>
                      <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                        {[1,2,3,4,5].map(i => <Ic key={i} name={i <= Math.round(chosen.rating) ? 'star-fill' : 'star'} size={10} color="var(--accent)"/>)}
                      </div>
                      <div className="mono" style={{ marginTop: 4, fontSize: 9 }}>{chosen.reviews} reviews</div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field icon="pin"   label="Address" value={chosen.addr  || 'Add your address'} missing={!chosen.addr}/>
                  <Field icon="phone" label="Phone"   value={chosen.phone || 'Add a phone number'} missing={!chosen.phone}/>
                  <Field icon="clock" label="Hours"   value={chosen.hours || 'Add your hours'} missing={!chosen.hours}/>
                  <Field icon="image" label="Photos"  value={`${(chosen.photos || []).length || 0}+ pulled from Google`}/>
                </div>

                <div style={{ marginTop: 18, padding: 14, background: 'var(--accent-softer)', borderRadius: 3, fontSize: 12.5, color: 'var(--accent-ink)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Ic name="sparkle" size={14} color="var(--accent-ink)"/>
                  <span>Top 3 reviews and your 4 best photos will be featured on the homepage. You can swap any of this later.</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}><Ic name="arrow-l" size={14} color="currentColor"/> Search again</button>
              <button className="btn btn-accent" onClick={() => setStep(2)}>Looks right — continue <Ic name="arrow-r" size={14} color="white"/></button>
            </div>
          </div>
        )}

        {/* STEP 3: STYLE */}
        {step === 2 && (
          <div className="fadein-up">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Step 3 · Style preferences</div>
              <h1 className="serif" style={{ fontSize: 48, lineHeight: 1.05, margin: 0, fontWeight: 400 }}>
                How should it <span className="serif-italic">feel</span>?
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 12 }}>
                All optional — skip any section and we'll use smart defaults for a <em>{chosen?.category || 'restaurant'}</em>.
              </p>
            </div>

            {/* ── TONE ── */}
            <StyleSection label="Tone" hint="How does your business talk to customers?">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                  { id: 'Friendly',     preview: 'Hey there! Come on in, we saved you a seat.' },
                  { id: 'Professional', preview: 'Serving Austin since 2008. Quality you can count on.' },
                  { id: 'Bold',         preview: 'Best pizza in Austin. Full stop.' },
                  { id: 'Minimal',      preview: 'Pizza. Congress Ave. Open at 5.' },
                  { id: 'Luxurious',    preview: 'Crafted with intention. A dining experience unlike any other.' },
                ].map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)} style={{
                    padding: '14px 12px', border: '1.5px solid ' + (tone === t.id ? 'var(--ink)' : 'var(--rule)'),
                    borderRadius: 4, background: tone === t.id ? 'var(--ink)' : 'var(--paper)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.14s',
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: tone === t.id ? 'var(--paper)' : 'var(--ink)', marginBottom: 8 }}>{t.id}</div>
                    <div style={{ fontSize: 11, color: tone === t.id ? 'rgba(255,255,255,0.55)' : 'var(--ink-4)', lineHeight: 1.4, fontStyle: 'italic' }}>"{t.preview}"</div>
                  </button>
                ))}
              </div>
            </StyleSection>

            {/* ── PALETTE ── */}
            <StyleSection label="Color palette" hint="We'll adapt this to your photos and category.">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { id: 'Auto',       label: 'Auto — we pick',  sub: 'Matched to your category',   swatches: ['#c2541f','#f3e9d7','#1a1410'], dark: true  },
                  { id: 'Warm Dark',  label: 'Warm & dark',    sub: 'Terracotta on deep charcoal',  swatches: ['#e8a368','#3a2018','#f7eeda'], dark: true  },
                  { id: 'Light Airy', label: 'Light & airy',   sub: 'Sage on warm cream',           swatches: ['#4a7c59','#f4ebe0','#2e2c26'], dark: false },
                  { id: 'Bold',       label: 'Bold & graphic',  sub: 'High-contrast black + vivid', swatches: ['#ffd23f','#1a1a1a','#ffffff'], dark: true  },
                  { id: 'Cool Clean', label: 'Cool & clean',   sub: 'Navy blue on white',           swatches: ['#1e3a5f','#e8eef4','#c9986b'], dark: false },
                  { id: 'Earthy',     label: 'Earthy & organic', sub: 'Forest + warm sand',         swatches: ['#3e4b2c','#e7e3cf','#94a36b'], dark: false },
                ].map(p => {
                  const active = colorStyle === p.id;
                  return (
                    <button key={p.id} onClick={() => setColorStyle(p.id)} style={{
                      padding: 0, border: '2px solid ' + (active ? 'var(--ink)' : 'var(--rule)'),
                      borderRadius: 5, background: 'transparent', cursor: 'pointer',
                      textAlign: 'left', overflow: 'hidden', transition: 'border-color 0.14s',
                      outline: 'none',
                    }}>
                      {/* swatch strip */}
                      <div style={{ display: 'flex', height: 52 }}>
                        {p.swatches.map((c, i) => (
                          <div key={i} style={{ flex: i === 1 ? 2 : 1, background: c, position: 'relative' }}>
                            {i === 0 && active && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Ic name="check" size={14} color={p.dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)'} strokeWidth={2.5}/>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* label */}
                      <div style={{ padding: '10px 12px', background: active ? 'var(--ink)' : 'var(--paper)' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? 'var(--paper)' : 'var(--ink)' }}>{p.label}</div>
                        <div style={{ fontSize: 10.5, color: active ? 'rgba(255,255,255,0.5)' : 'var(--ink-4)', marginTop: 2 }}>{p.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </StyleSection>

            {/* ── LAYOUT ── */}
            <StyleSection label="Layout style" hint="How information is arranged on the page.">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { id: 'Modern',        sketch: [[60,8],[90,5],[100,5],[70,5],[100,30],[50,5]] },
                  { id: 'Classic',       sketch: [[100,6],[80,4],[60,4],[100,24],[80,4],[70,4]] },
                  { id: 'Bold & Graphic',sketch: [[100,18],[100,18],[80,5],[60,5]] },
                  { id: 'Minimal',       sketch: [[60,5],[80,4],[40,4],[100,18],[50,4]] },
                ].map(l => {
                  const active = layout === l.id;
                  return (
                    <button key={l.id} onClick={() => setLayout(l.id)} style={{
                      padding: 0, border: '2px solid ' + (active ? 'var(--ink)' : 'var(--rule)'),
                      borderRadius: 5, background: active ? 'var(--ink)' : 'var(--paper)',
                      cursor: 'pointer', overflow: 'hidden', transition: 'all 0.14s', outline: 'none',
                    }}>
                      {/* mini wireframe sketch */}
                      <div style={{ padding: '14px 12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {l.sketch.map(([w, h], i) => (
                          <div key={i} style={{
                            width: w + '%', height: h,
                            background: active ? 'rgba(255,255,255,0.18)' : 'var(--rule)',
                            borderRadius: 1,
                          }}/>
                        ))}
                      </div>
                      <div style={{ padding: '8px 12px 12px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--paper)' : 'var(--ink)' }}>{l.id}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </StyleSection>

            {/* ── FREEFORM ── */}
            <StyleSection label="Anything else?" hint="Brand colors, must-mention facts, special instructions. We read every word.">
              <textarea className="input" rows={4} value={extra} onChange={(e) => setExtra(e.target.value)}
                placeholder="e.g. Our brand is navy and gold. We do emergency callouts 24/7. Mention we're family-owned since 1996."/>
            </StyleSection>

            <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}><Ic name="arrow-l" size={14} color="currentColor"/> Back</button>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <a onClick={() => go('generating', { business: chosen, tone: 'Auto', colorStyle: 'Auto', layout: 'Modern', extra: '' })}
                  style={{ fontSize: 13, color: 'var(--ink-3)', textDecoration: 'underline', cursor: 'pointer' }}>
                  Skip — use smart defaults
                </a>
                <button className="btn btn-accent btn-lg" onClick={() => go('generating', { business: chosen, tone, colorStyle, layout, extra })}>
                  <Ic name="sparkle" size={15} color="white"/> Generate my site
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashShell>
  );
};

const Field = ({ icon, label, value, missing }) => (
  <div style={{ padding: 14, border: '1px solid ' + (missing ? 'oklch(0.78 0.10 80)' : 'var(--rule-2)'), borderRadius: 3, background: missing ? 'var(--warn-soft)' : 'transparent' }}>
    <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <Ic name={icon} size={11} color="currentColor"/> {label}
      {missing && <span className="badge badge-warn" style={{ marginLeft: 'auto' }}>Missing</span>}
    </div>
    <div style={{ fontSize: 13.5, color: missing ? 'var(--accent-ink)' : 'var(--ink)' }}>{value}</div>
  </div>
);

const Pills = ({ label, options, value, onChange }) => (
  <div>
    <div className="mono" style={{ marginBottom: 10 }}>{label}</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <button key={o} className={`chip ${value === o ? 'chip-active' : ''}`} onClick={() => onChange(o)} style={{ padding: '8px 14px', fontSize: 13 }}>{o}</button>
      ))}
    </div>
  </div>
);

const StyleSection = ({ label, hint, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
      <div className="mono">{label}</div>
      {hint && <div style={{ fontSize: 12, color: 'var(--ink-4)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--ui)' }}>{hint}</div>}
    </div>
    {children}
  </div>
);

window.BuildFlow = BuildFlow;
