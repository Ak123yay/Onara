// Auth pages — signup / login
const Auth = ({ go, mode = 'signup' }) => {
  const isSignup = mode === 'signup';
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.1fr', background: 'var(--paper)' }}>
      {/* Left — testimonial */}
      <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '40px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'oklch(0.62 0.13 50 / 0.4)', filter: 'blur(60px)' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo onClick={() => go('landing')}/>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hand" style={{ fontSize: 28, color: 'oklch(0.78 0.13 50)', marginBottom: 22 }}>"~90 seconds. I almost cried."</div>
          <div className="serif" style={{ fontSize: 36, lineHeight: 1.1, fontWeight: 400 }}>
            I'd been putting off a website for <span className="serif-italic">six years</span>. Onara built mine while my kettle boiled.
          </div>
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <SiteThumb mockId="bloom" name="Bloom Florist" size={44} radius={3} shadow/>
            <div>
              <div style={{ fontSize: 13.5 }}>Rosa Mendez</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>Bloom Florist · Brooklyn</div>
            </div>
          </div>
        </div>
        <div className="mono" style={{ color: 'var(--ink-4)', position: 'relative', zIndex: 1 }}>
          Trusted by 1,200+ small businesses
        </div>
      </div>

      {/* Right — form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>{isSignup ? 'Create account' : 'Welcome back'}</div>
          <h1 className="serif" style={{ fontSize: 44, lineHeight: 1.05, margin: 0, fontWeight: 400, letterSpacing: '-0.02em' }}>
            {isSignup ? <>Build your first<br/>site in <span className="serif-italic">90s</span>.</> : <>Sign in to <span className="serif-italic">Onara</span>.</>}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 14 }}>
            {isSignup ? '14-day Pro trial. No credit card.' : 'Pick up where you left off.'}
          </p>

          <button className="btn btn-soft" style={{ width: '100%', marginTop: 32, padding: '14px 16px', fontSize: 14 }}
            onClick={() => go(isSignup ? 'welcome' : 'dashboard')}>
            <Ic name="google" size={18}/> Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', color: 'var(--ink-4)', fontSize: 11 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--rule-2)' }}/>
            <span className="mono">or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--rule-2)' }}/>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); go(isSignup ? 'welcome' : 'dashboard'); }}>
            <label className="mono" style={{ display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input" type="email" placeholder="you@business.com" defaultValue="rosa@bloomflorist.com"/>
            <label className="mono" style={{ display: 'block', marginBottom: 6, marginTop: 18 }}>Password</label>
            <input className="input" type="password" placeholder="••••••••" defaultValue="onara2026"/>
            <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: 24, padding: '14px 16px' }}>
              {isSignup ? 'Create account' : 'Sign in'} <Ic name="arrow-r" size={14} color="white"/>
            </button>
          </form>

          <div style={{ marginTop: 24, fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>
            {isSignup ? <>Already have an account? <a onClick={() => go('login')} style={{ color: 'var(--accent-ink)', cursor: 'pointer', textDecoration: 'underline' }}>Sign in</a></>
              : <>New to Onara? <a onClick={() => go('signup')} style={{ color: 'var(--accent-ink)', cursor: 'pointer', textDecoration: 'underline' }}>Create account</a></>}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Auth = Auth;
