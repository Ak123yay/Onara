// Shared chrome — logo, top nav, sidebar, modals
const { useState, useEffect, useRef, useMemo } = React;

const Logo = ({ size = 'md', onClick }) => (
  <a className="onara-logo" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <span className="onara-logo-mark" style={size === 'lg' ? { width: 28, height: 28 } : {}}/>
    <span style={size === 'lg' ? { fontSize: 22 } : {}}>Onara</span>
  </a>
);

const TopNav = ({ go, current, ctaLabel = 'Start free' }) => (
  <header className="nav">
    <Logo onClick={() => go('landing')}/>
    <nav className="nav-links">
      <a onClick={() => go('landing', { hash: 'how' })}>How it works</a>
      <a onClick={() => go('pricing')}>Pricing</a>
      <a onClick={() => go('landing', { hash: 'examples' })}>Examples</a>
      <a onClick={() => go('login')} style={{ color: 'var(--ink)' }}>Sign in</a>
      <button className="btn btn-accent btn-sm" onClick={() => go('welcome')}>{ctaLabel}</button>
    </nav>
  </header>
);

const Sidebar = ({ go, current, user }) => {
  const primary = [
    { id: 'dashboard',     label: 'Overview',      icon: 'home'  },
    { id: 'sites',         label: 'My Sites',       icon: 'sites' },
    { id: 'leads',         label: 'Leads',          icon: 'inbox', badge: 2 },
    { id: 'notifications', label: 'Activity',       icon: 'bell',  badge: 2 },
    { id: 'build',         label: 'Build New',      icon: 'plus'  },
  ];
  const secondary = [
    { id: 'team',    label: 'Team',         icon: 'users'   },
    { id: 'account', label: 'Account',      icon: 'user'    },
    { id: 'help',    label: 'Help',         icon: 'info'    },
  ];

  const NavLink = ({ it }) => (
    <a className={`sidebar-link ${current === it.id ? 'active' : ''}`}
      onClick={() => go(it.id)}
      style={{ position: 'relative' }}>
      <Ic name={it.icon} size={15} color="currentColor"/>
      {it.label}
      {it.badge > 0 && current !== it.id && (
        <span style={{
          marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 100,
          background: 'var(--accent)', color: 'white',
          fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 5px',
        }}>{it.badge}</span>
      )}
    </a>
  );

  return (
    <aside className="sidebar">
      <div style={{ padding: '4px 12px 28px' }}>
        <Logo onClick={() => go('landing')}/>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {primary.map(it => <NavLink key={it.id} it={it}/>)}
      </nav>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--rule-2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {secondary.map(it => <NavLink key={it.id} it={it}/>)}
      </div>

      <div style={{ marginTop: 'auto', padding: '14px 4px 0' }}>
        {user.is_trial && (
          <div className="card" style={{ padding: 14, marginBottom: 12, background: 'var(--accent-softer)', borderColor: 'transparent' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-ink)', marginBottom: 4 }}>Pro trial</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 10 }}>
              {user.trial_days_left} days left to keep your live URL
            </div>
            <button className="btn btn-accent btn-sm" style={{ width: '100%' }} onClick={() => go('upgrade')}>Upgrade now</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderTop: '1px solid var(--rule-2)' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
            {user.email[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--mono)' }}>{user.plan}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const DashShell = ({ children, go, current, user }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--paper)' }}>
    <Sidebar go={go} current={current} user={user}/>
    <main style={{ flex: 1, overflow: 'auto', maxHeight: '100vh' }}>
      {children}
    </main>
  </div>
);

const Modal = ({ children, onClose, width = 540 }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const Toast = ({ message, kind = 'info', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink)', color: 'var(--paper)',
      padding: '10px 18px', borderRadius: 100, fontSize: 13,
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 200,
      animation: 'fadein-up 0.3s ease'
    }}>
      <Ic name={kind === 'success' ? 'check' : 'sparkle'} size={14} color="var(--accent)"/>
      {message}
    </div>
  );
};

window.Logo = Logo;
window.TopNav = TopNav;
window.Sidebar = Sidebar;
window.DashShell = DashShell;
window.Modal = Modal;
window.Toast = Toast;
