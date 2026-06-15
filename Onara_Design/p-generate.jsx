// Generation progress + result screens
const { useState: uS_gen, useEffect: uE_gen } = React;

const AGENTS = [
  { id: 'analyst', name: 'Business Analyst', model: 'gpt-oss:20b', task: 'Identifying what your industry needs' },
  { id: 'writer', name: 'Content Writer', model: 'qwen3:8b', task: 'Drafting headline, services, about copy' },
  { id: 'style', name: 'Style Agent', model: 'glm-5.1', task: 'Choosing palette, fonts, layout DNA' },
  { id: 'planner', name: 'Planner', model: 'glm-5.1', task: 'Merging copy + style into a blueprint' },
  { id: 'prompt', name: 'Prompt Engineer', model: 'glm-5.1', task: 'Writing the precise build instructions' },
  { id: 'code', name: 'Code Generator', model: 'Copilot', task: 'Generating HTML, CSS, JavaScript' },
  { id: 'debug', name: 'Debugger', model: 'minimax-m2.7 + RAG', task: 'Fixing tags, links, layout bugs' },
  { id: 'seo', name: 'SEO Agent', model: 'qwen3:8b', task: 'Adding meta, Open Graph, JSON-LD' },
  { id: 'qa', name: 'QA Agent', model: 'minimax-m2.5 + RAG', task: 'Final quality check' },
  { id: 'mobile', name: 'Mobile Optimizer', model: 'qwen3:8b', task: 'Tap targets, fonts, breakpoints' },
];

const Generating = ({ go, params, user }) => {
  const [active, setActive] = uS_gen(0);
  const [progress, setProgress] = uS_gen(0);
  const business = params?.business || { name: "Mike's Pizza", color: '#16100c', accent: '#e8a368' };

  uE_gen(() => {
    if (active >= AGENTS.length) {
      const t = setTimeout(() => go('result', { business }), 1200);
      return () => clearTimeout(t);
    }
    const duration = 1300;
    const start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setProgress(p);
      if (p >= 1) {
        clearInterval(tick);
        setActive(a => a + 1);
        setProgress(0);
      }
    }, 40);
    return () => clearInterval(tick);
  }, [active]);

  return (
    <DashShell go={go} current="build" user={user}>
      <div style={{ padding: '40px 40px 0', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32, height: '100vh', boxSizing: 'border-box' }}>
        {/* Left agents panel */}
        <div style={{ paddingTop: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Building your site</div>
          <h1 className="serif" style={{ fontSize: 32, lineHeight: 1.1, margin: 0, fontWeight: 400 }}>{business.name}</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>10 small AIs working in sequence. Stay or close the tab — we'll save your spot.</p>

          <div style={{ marginTop: 28, padding: 20, background: 'var(--paper-2)', borderRadius: 4, border: '1px solid var(--rule-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="mono">Progress</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)' }}>
                {Math.min(active, AGENTS.length)} / {AGENTS.length}
              </div>
            </div>
            <div className="agent-progress-bar" style={{ marginTop: 10 }}>
              <div className="agent-progress-bar-fill" style={{ width: `${((active + progress) / AGENTS.length) * 100}%` }}/>
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-3)' }}>
              ~{Math.max(5, Math.round((AGENTS.length - active - progress) * 9))}s remaining
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '50vh', overflowY: 'auto' }}>
            {AGENTS.map((a, i) => {
              const status = i < active ? 'done' : i === active ? 'active' : 'pending';
              return (
                <div key={a.id} className={`agent-row ${status}`}>
                  <span className={`sdot ${status === 'done' ? 'sdot-done' : status === 'active' ? 'sdot-on' : 'sdot-pending'}`}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: status === 'active' ? 500 : 400, fontSize: 13 }}>{a.name}</div>
                    {status === 'active' && <div style={{ fontSize: 11, color: 'var(--accent-ink)', marginTop: 2 }}>{a.task}…</div>}
                  </div>
                  <div className="mono" style={{ fontSize: 9.5 }}>{a.model}</div>
                  {status === 'done' && <Ic name="check" size={13} color="var(--ink-3)"/>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: live preview */}
        <div style={{ paddingTop: 16, paddingRight: 32 }}>
          <div className="card" style={{ overflow: 'hidden', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', background: 'var(--paper-2)', borderBottom: '1px solid var(--rule-2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }}/>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }}/>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }}/>
              <div style={{ flex: 1, marginLeft: 14, padding: '5px 14px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 100, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
                preview · building
              </div>
              <div className="badge badge-accent">live</div>
            </div>
            <div style={{ flex: 1, padding: 36, overflow: 'auto', position: 'relative' }}>
              <LivePreview active={active} business={business}/>
            </div>
          </div>
        </div>
      </div>
    </DashShell>
  );
};

const LivePreview = ({ active, business }) => {
  // progressive reveal of site elements
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {active >= 1 && (
        <div className="fadein-up" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>{business.name}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-3)' }}>
            <span>Menu</span><span>Hours</span><span>Visit</span>
          </div>
        </div>
      )}
      {active >= 2 && (
        <div className="fadein-up">
          <div className="mono" style={{ marginBottom: 10, color: 'var(--accent-ink)' }}>Wood-fired · since 2008</div>
          <div className="serif" style={{ fontSize: 42, lineHeight: 1.0, fontWeight: 500 }}>
            Austin's slowest<br/>pizza dough.
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 12, maxWidth: 420, lineHeight: 1.6 }}>
            72-hour cold ferment, San Marzano tomatoes, fior di latte. Open till 10.
          </div>
        </div>
      )}
      {active >= 3 && (
        <div className="fadein-up ph-warm" style={{ marginTop: 20, height: 200, borderRadius: 4 }}>hero photo</div>
      )}
      {active >= 4 && (
        <div className="fadein-up" style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['Margherita $14', 'Pepperoni $16', 'Funghi $17'].map(t => (
            <div key={t} className="card-soft" style={{ padding: 14, fontSize: 12 }}>{t}</div>
          ))}
        </div>
      )}
      {active >= 6 && (
        <div className="fadein-up" style={{ marginTop: 20, padding: 16, background: 'var(--ink)', color: 'var(--paper)', borderRadius: 4 }}>
          <div className="mono" style={{ color: 'var(--accent-soft)', marginBottom: 6 }}>Visit</div>
          <div style={{ fontSize: 13 }}>218 Congress Ave · (512) 555-0182</div>
        </div>
      )}
      {active >= 8 && (
        <div className="fadein-up" style={{ marginTop: 16, padding: 12, background: 'var(--accent-softer)', borderRadius: 3, fontSize: 11, color: 'var(--accent-ink)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Ic name="check-circle" size={13} color="var(--accent-ink)"/> SEO meta added · LocalBusiness schema embedded
        </div>
      )}
      {active < 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 60 }}>
          <div className="shimmer" style={{ height: 14, width: '40%', borderRadius: 2 }}/>
          <div className="shimmer" style={{ height: 36, width: '85%', borderRadius: 2 }}/>
          <div className="shimmer" style={{ height: 36, width: '70%', borderRadius: 2 }}/>
          <div className="shimmer" style={{ height: 200, width: '100%', borderRadius: 4, marginTop: 16 }}/>
        </div>
      )}
    </div>
  );
};

const Result = ({ go, params, user }) => {
  const [showConfetti] = uS_gen(true);
  const business = params?.business || { name: "Mike's Pizza" };
  return (
    <DashShell go={go} current="build" user={user}>
      <div style={{ padding: '40px 40px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="fadein-up" style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="hand" style={{ fontSize: 26, marginBottom: 8 }}>↓ it's live ↓</div>
          <h1 className="serif" style={{ fontSize: 56, lineHeight: 1.0, margin: 0, fontWeight: 400 }}>
            {business.name} is <span className="serif-italic" style={{ color: 'var(--accent-ink)' }}>online</span>.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 12 }}>Built in 87 seconds. Deployed to a real public URL.</p>
        </div>

        <div className="fadein-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--paper)', border: '1px solid var(--ink)', borderRadius: 100, fontFamily: 'var(--mono)', fontSize: 12 }}>
            <span className="sdot sdot-leaf"/>
            mikes-pizza-a3f2.pages.dev
            <button onClick={() => {}} style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Ic name="copy" size={13} color="var(--ink-3)"/></button>
          </div>
          <button className="btn btn-accent">Visit live site <Ic name="arrow-up-right" size={14} color="white"/></button>
        </div>

        <div className="fadein-up card" style={{ overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', background: 'var(--paper-2)', borderBottom: '1px solid var(--rule-2)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }}/>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }}/>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }}/>
            <div style={{ flex: 1, marginLeft: 14, padding: '5px 14px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 100, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
              mikes-pizza-a3f2.pages.dev
            </div>
          </div>
          <PizzaSitePreview/>
        </div>

        <div className="fadein-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 28 }}>
          <ActionCard icon="edit" title="Request a revision" desc="Plain English. e.g. 'Make the hero darker.'" onClick={() => go('site-detail', { business })}/>
          <ActionCard icon="globe" title="Connect a domain" desc="Use your own domain. $10 one-time." onClick={() => go('domain')}/>
          <ActionCard icon="layout" title="See in dashboard" desc="Manage all your sites in one place." onClick={() => go('sites')}/>
        </div>
      </div>
    </DashShell>
  );
};

const ActionCard = ({ icon, title, desc, onClick }) => (
  <div className="card hover-lift" style={{ padding: 22, cursor: 'pointer' }} onClick={onClick}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
      <Ic name={icon} size={16} color="var(--accent-ink)"/>
    </div>
    <div className="serif" style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{desc}</div>
  </div>
);

window.Generating = Generating;
window.Result = Result;
