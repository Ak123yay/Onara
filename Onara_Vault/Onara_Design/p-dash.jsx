// Dashboard screens: overview, sites list, site detail, account
const { useState: uS_dash } = React;

const SITES = [
  { id: 's1', mockId: 'mike',  name: "Mike's Pizza",   url: 'mikespizza.com',          status: 'live',  visits: 312, trend: '+18%', color: '#16100c', updated: '2 days ago', revisions: 3, custom: true,  industry: 'Italian · Austin TX' },
  { id: 's2', mockId: 'bloom', name: 'Bloom Florist',   url: 'bloom-bk-7e91.pages.dev',  status: 'live',  visits: 189, trend: '+42%', color: '#f4ebe0', updated: '1 week ago', revisions: 1, industry: 'Florist · Brooklyn NY' },
  { id: 's3', mockId: 'pane',  name: 'Old Crow Cafe',   url: 'oldcrow-9c1d.pages.dev',   status: 'draft', visits: 0,   trend: null,   color: '#1a1814', updated: 'Just now',  revisions: 0, industry: 'Cafe · Portland OR' },
];

const Dashboard = ({ go, user }) => (
  <DashShell go={go} current="dashboard" user={user}>
    <div style={{ padding: '40px 48px 60px', maxWidth: 1100 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>Welcome back</div>
      <h1 className="serif" style={{ fontSize: 44, lineHeight: 1.0, margin: 0, fontWeight: 400 }}>
        Hi {user.name?.split(' ')[0] || 'Rosa'}. <span className="serif-italic" style={{ color: 'var(--ink-3)' }}>Two sites are live.</span>
      </h1>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 36 }}>
        <Stat label="Live sites" value="2" hint="of 3 total"/>
        <Stat label="Visits · 7 day" value="501" hint="↑ 24% vs prev"/>
        <Stat label="Revisions" value="4" hint="this month"/>
        <Stat label="Trial" value={`${user.trial_days_left}d`} hint="remaining" highlight/>
      </div>

      {/* Quick build */}
      <div className="card" style={{ marginTop: 28, padding: 26, display: 'flex', alignItems: 'center', gap: 22, background: 'var(--accent-softer)', borderColor: 'transparent' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic name="sparkle" size={22} color="white"/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>Build another site</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>~90 seconds. Search a Google Business profile to start.</div>
        </div>
        <button className="btn btn-accent" onClick={() => go('build')}>New site <Ic name="arrow-r" size={14} color="white"/></button>
      </div>

      {/* Recent activity */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Recent sites</h2>
          <a onClick={() => go('sites')} style={{ fontSize: 12, color: 'var(--accent-ink)', cursor: 'pointer', textDecoration: 'underline' }}>See all →</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SITES.slice(0, 3).map(s => <SiteRow key={s.id} site={s} onClick={() => go('site-detail', { site: s })}/>)}
        </div>
      </div>
    </div>
  </DashShell>
);

const Stat = ({ label, value, hint, highlight }) => (
  <div className="card" style={{ padding: 18, background: highlight ? 'var(--ink)' : 'var(--paper)', color: highlight ? 'var(--paper)' : 'var(--ink)', borderColor: highlight ? 'transparent' : 'var(--rule-2)' }}>
    <div className="mono" style={{ color: highlight ? 'var(--accent-soft)' : 'var(--ink-3)' }}>{label}</div>
    <div className="serif" style={{ fontSize: 32, fontWeight: 500, marginTop: 4, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ fontSize: 11.5, color: highlight ? 'var(--accent-soft)' : 'var(--ink-3)', marginTop: 2 }}>{hint}</div>
  </div>
);

const Sparkline = ({ data, color = 'var(--accent)', width = 64, height = 22 }) => {
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - (v / max) * (height - 2) - 1}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const SiteRow = ({ site, onClick }) => {
  const trend = site.status === 'live' ? [12, 18, 14, 22, 19, 28, 31] : [0,0,0,0,0,0,0];
  return (
    <div className="card hover-lift" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={onClick}>
      <SiteThumb mockId={site.mockId} name={site.name} color={site.color} size={64} radius={3}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="serif" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>{site.name}</div>
          {site.status === 'live' && <span className="badge badge-leaf"><span className="sdot sdot-leaf"/> live</span>}
          {site.status === 'draft' && <span className="badge">draft</span>}
          {site.custom && <span className="badge badge-accent">custom domain</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <span className="mono">{site.url}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>·</span>
          <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{site.industry}</span>
        </div>
      </div>
      {site.status === 'live' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Sparkline data={trend}/>
          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{site.visits} <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>visits</span></div>
            <div style={{ fontSize: 11, color: 'oklch(0.55 0.14 145)', marginTop: 2 }}>{site.trend} · 7d</div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'right', minWidth: 120 }}>
          <div className="mono" style={{ color: 'var(--ink-4)' }}>not published</div>
          <div className="mono" style={{ marginTop: 2 }}>updated {site.updated}</div>
        </div>
      )}
      <Ic name="arrow-r" size={14} color="var(--ink-4)"/>
    </div>
  );
};

const Sites = ({ go, user }) => (
  <DashShell go={go} current="sites" user={user}>
    <div style={{ padding: '40px 48px 60px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>My sites</div>
          <h1 className="serif" style={{ fontSize: 40, lineHeight: 1.0, margin: 0, fontWeight: 400 }}>3 sites · <span style={{ color: 'var(--ink-3)' }}>2 live</span></h1>
        </div>
        <button className="btn btn-accent" onClick={() => go('build')}><Ic name="plus" size={14} color="white"/> New site</button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['All', 'Live', 'Drafts', 'Paused'].map((t, i) => (
          <button key={t} className={`chip ${i === 0 ? 'chip-active' : ''}`} style={{ padding: '6px 14px', fontSize: 12 }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SITES.map(s => <SiteRow key={s.id} site={s} onClick={() => go('site-detail', { site: s })}/>)}
      </div>
    </div>
  </DashShell>
);

const SiteDetail = ({ go, params, user }) => {
  const site = params?.site || SITES[0];
  const [tab, setTab] = uS_dash('overview');
  const [showRevision, setShowRevision] = uS_dash(false);

  return (
    <DashShell go={go} current="sites" user={user}>
      <div style={{ padding: '32px 48px 60px', maxWidth: 1100 }}>
        <a onClick={() => go('sites')} style={{ fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Ic name="arrow-l" size={12} color="currentColor"/> All sites
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16 }}>
          <SiteThumb mockId={site.mockId} name={site.name} color={site.color} size={80} radius={4} shadow/>
          <div style={{ flex: 1 }}>
            <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: 0 }}>{site.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              {site.status === 'live' && <span className="badge badge-leaf"><span className="sdot sdot-leaf"/> live</span>}
              <span className="mono">{site.url}</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Ic name="copy" size={12} color="var(--ink-3)"/></button>
            </div>
          </div>
          <button className="btn btn-ghost"><Ic name="external" size={13} color="currentColor"/> View site</button>
          <button className="btn btn-accent" onClick={() => setShowRevision(true)}><Ic name="edit" size={13} color="white"/> Request change</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 32, borderBottom: '1px solid var(--rule-2)' }}>
          {['overview', 'revisions', 'analytics', 'settings'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: tab === t ? 'var(--ink)' : 'var(--ink-3)',
                borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent',
                marginBottom: -1, textTransform: 'capitalize', fontFamily: 'inherit'
              }}>{t}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 28, marginTop: 28 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: 'var(--paper-2)', borderBottom: '1px solid var(--rule-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }}/>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }}/>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }}/>
                <div className="mono" style={{ marginLeft: 12 }}>{site.url}</div>
              </div>
              <div style={{ height: 380, overflow: 'hidden' }}>
                <PizzaSitePreview/>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ padding: 18 }}>
                <div className="mono" style={{ marginBottom: 10 }}>Last 7 days</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, gap: 6 }}>
                  {[24, 38, 31, 52, 47, 61, 59].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--accent)', opacity: 0.4 + i * 0.08, borderRadius: '2px 2px 0 0' }}/>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>
                  {['M','T','W','T','F','S','S'].map((d, i) => <span key={i}>{d}</span>)}
                </div>
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 500 }} className="serif">312</div>
                    <div className="mono">visits</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 500 }} className="serif">28</div>
                    <div className="mono">calls</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 500 }} className="serif">14</div>
                    <div className="mono">directions</div>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 18 }}>
                <div className="mono" style={{ marginBottom: 10 }}>Quick actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <ActionLink icon="globe" label="Connect a custom domain" hint="$10 one-time" onClick={() => go('domain')}/>
                  <ActionLink icon="image" label="Replace photos" hint="Drag & drop"/>
                  <ActionLink icon="refresh" label="Re-pull from Google" hint="Sync hours, photos"/>
                  <ActionLink icon="download" label="Download HTML" hint="Take it elsewhere"/>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'revisions' && (
          <div style={{ marginTop: 28 }}>
            <div className="card" style={{ padding: 22, marginBottom: 16, background: 'var(--accent-softer)', borderColor: 'transparent' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <Ic name="sparkle" size={18} color="var(--accent-ink)"/>
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontSize: 18, fontWeight: 500 }}>Request a change in plain English</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>e.g. "Make the hero darker", "Add an order online button", "Use forest green instead of orange"</div>
                </div>
                <button className="btn btn-accent" onClick={() => setShowRevision(true)}>New revision</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <RevisionRow status="done" date="2 days ago" prompt="Make the hero photo larger and add a 'Order online' button" took="42s"/>
              <RevisionRow status="done" date="5 days ago" prompt="Use forest green instead of orange for accents" took="51s"/>
              <RevisionRow status="done" date="1 week ago" prompt="Add a section showing customer reviews from Google" took="1m 12s"/>
            </div>
          </div>
        )}

        {tab === 'analytics' && <AnalyticsPanel site={site}/>}
        {tab === 'settings' && <SettingsPanel site={site} go={go}/>}
      </div>
      {showRevision && <RevisionModal onClose={() => setShowRevision(false)}/>}
    </DashShell>
  );
};

const ActionLink = ({ icon, label, hint, onClick }) => (
  <a onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 3, cursor: 'pointer', transition: 'background 0.15s' }}
    onMouseOver={e => e.currentTarget.style.background = 'var(--paper-2)'}
    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
    <Ic name={icon} size={15} color="var(--ink-3)"/>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13 }}>{label}</div>
      <div className="mono" style={{ fontSize: 10 }}>{hint}</div>
    </div>
    <Ic name="arrow-r" size={11} color="var(--ink-4)"/>
  </a>
);

const RevisionRow = ({ status, date, prompt, took }) => (
  <div className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Ic name="check" size={13} color="var(--accent-ink)"/>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>"{prompt}"</div>
      <div className="mono" style={{ marginTop: 4 }}>{date} · regenerated in {took}</div>
    </div>
    <a style={{ fontSize: 12, color: 'var(--accent-ink)', cursor: 'pointer' }}>View →</a>
  </div>
);

const RevisionModal = ({ onClose }) => {
  const [text, setText] = uS_dash('');
  return (
    <Modal onClose={onClose} width={580}>
      <div style={{ padding: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>New revision</div>
        <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, margin: 0 }}>What should change?</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 10 }}>Describe in plain English. We'll only re-run the parts that need to change — usually under a minute.</p>
        <textarea className="input" rows={5} value={text} onChange={(e) => setText(e.target.value)}
          style={{ marginTop: 16 }}
          placeholder="e.g. Add a big 'Order online' button in the hero. Make the photos bigger. Switch to a darker color scheme."/>
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Make hero darker', 'Add menu PDF', 'Bigger photos', 'Different fonts'].map(s => (
            <button key={s} className="chip" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setText(t => t ? t + ' ' + s : s)}>+ {s}</button>
          ))}
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="mono">Estimated: 45–90s</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-accent" onClick={onClose} disabled={!text.trim()}><Ic name="sparkle" size={13} color="white"/> Regenerate</button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const Account = ({ go, user }) => (
  <DashShell go={go} current="account" user={user}>
    <div style={{ padding: '40px 48px 60px', maxWidth: 760 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>Account</div>
      <h1 className="serif" style={{ fontSize: 40, lineHeight: 1.0, margin: 0, fontWeight: 400 }}>Account & billing</h1>

      <div className="card" style={{ marginTop: 32, padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600 }}>
            {user.email[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>{user.name || 'Rosa Mendez'}</div>
            <div className="mono">{user.email}</div>
          </div>
          <button className="btn btn-ghost">Edit</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 26, background: 'var(--accent-softer)', borderColor: 'transparent' }}>
        <div className="eyebrow" style={{ color: 'var(--accent-ink)', marginBottom: 8 }}>Pro Trial</div>
        <div className="serif" style={{ fontSize: 24, fontWeight: 500 }}>{user.trial_days_left} days left</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>Your live URLs go offline if your trial expires before you upgrade.</div>
        <div style={{ marginTop: 16, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ width: `${(user.trial_days_left / 14) * 100}%`, height: '100%', background: 'var(--accent)' }}/>
        </div>
        <button className="btn btn-accent" style={{ marginTop: 18 }} onClick={() => go('pricing')}>Keep my sites live · from $12/mo</button>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 26 }}>
        <div className="serif" style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Payment method</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>None on file. Add one to keep sites live after trial.</div>
        <button className="btn btn-soft" style={{ marginTop: 14 }}><Ic name="plus" size={13} color="currentColor"/> Add card</button>
      </div>

      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--rule-2)' }}>
        <a style={{ fontSize: 12.5, color: 'var(--ink-3)', cursor: 'pointer' }}>Sign out</a>
      </div>
    </div>
  </DashShell>
);

window.Dashboard = Dashboard;
window.Sites = Sites;
window.SiteDetail = SiteDetail;
window.Account = Account;
window.RevisionModal = RevisionModal;
