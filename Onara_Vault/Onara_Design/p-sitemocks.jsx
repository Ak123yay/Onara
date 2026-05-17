// Designed mini-website mockups used in the landing gallery & hero.
// No emoji — every preview uses real typography + striped image placeholders.

// ──────────────────────────────────────────────────────────
// Shared chrome — a refined browser frame
// ──────────────────────────────────────────────────────────
const BrowserChrome = ({ url, children, height = 'auto', shadow = true }) => (
  <div className="card" style={{
    overflow: 'hidden',
    boxShadow: shadow ? '0 30px 80px -10px rgba(20,16,10,0.18), 0 8px 24px -8px rgba(20,16,10,0.08)' : 'none',
    borderRadius: 8,
    background: 'var(--paper)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', background: 'var(--paper-2)', borderBottom: '1px solid var(--rule-2)' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }}/>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }}/>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }}/>
      </div>
      <div style={{ flex: 1, marginLeft: 14, padding: '5px 12px', background: 'var(--paper)', border: '1px solid var(--rule-2)', borderRadius: 100, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--leaf)' }}/>
        {url}
      </div>
      <div style={{ width: 36 }}/>
    </div>
    <div style={{ height }}>{children}</div>
  </div>
);

// ──────────────────────────────────────────────────────────
// Hero pizza site — full restaurant homepage, designed properly
// ──────────────────────────────────────────────────────────
const PizzaSiteHero = () => (
  <div style={{ background: '#16100c', color: '#f3e9d7', minHeight: 540, fontFamily: 'var(--ui)' }}>
    {/* Top nav */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 44px', borderBottom: '1px solid rgba(243,233,215,0.08)' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em', color: '#f3e9d7' }}>
        Mike's <span style={{ fontStyle: 'italic', color: '#e8a368', fontWeight: 400 }}>Pizza</span>
      </div>
      <div style={{ display: 'flex', gap: 28, fontSize: 12.5, color: '#a89684', letterSpacing: '0.02em' }}>
        <span>Menu</span><span>Story</span><span>Visit</span>
        <span style={{ color: '#16100c', background: '#e8a368', padding: '6px 14px', borderRadius: 2, fontWeight: 500 }}>Order online</span>
      </div>
    </div>

    {/* Hero grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 0 }}>
      {/* Left: copy */}
      <div style={{ padding: '60px 44px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 460 }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#e8a368', marginBottom: 22 }}>
            Wood-fired · Since 2008
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 64, lineHeight: 0.98, fontWeight: 400, letterSpacing: '-0.025em' }}>
            Austin's<br/>
            <span style={{ fontStyle: 'italic', fontWeight: 300 }}>slowest</span> pizza<br/>
            dough.
          </div>
          <div style={{ fontSize: 13.5, color: '#a89684', marginTop: 22, maxWidth: 360, lineHeight: 1.65 }}>
            72-hour cold ferment. San Marzano tomatoes, fior di latte, a 900° hearth — and a line on weekends.
          </div>
          <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
            <div style={{ padding: '11px 18px', background: '#e8a368', color: '#16100c', borderRadius: 2, fontSize: 12.5, fontWeight: 600 }}>See the menu →</div>
            <div style={{ padding: '11px 18px', border: '1px solid rgba(243,233,215,0.2)', color: '#f3e9d7', borderRadius: 2, fontSize: 12.5 }}>(512) 555-0182</div>
          </div>
        </div>

        {/* tiny review pulled from Google */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(243,233,215,0.08)' }}>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(i => <Ic key={i} name="star-fill" size={12} color="#e8a368"/>)}
          </div>
          <div style={{ fontSize: 11.5, color: '#a89684', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
            4.6 · 312 reviews · pulled from Google
          </div>
        </div>
      </div>

      {/* Right: image area — composed of placeholders, not emoji */}
      <div style={{ padding: 18, display: 'grid', gridTemplateRows: '1.4fr 1fr', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
        <div className="ph" style={{
          gridRow: '1 / span 2', gridColumn: '1',
          background: 'radial-gradient(circle at 30% 30%, #c2541f, #6e1f08 80%)',
          backgroundImage: 'radial-gradient(circle at 30% 30%, #c2541f, #6e1f08 80%), repeating-linear-gradient(-45deg, transparent 0, transparent 10px, rgba(0,0,0,0.06) 10px, rgba(0,0,0,0.06) 11px)',
          backgroundBlendMode: 'multiply',
          color: 'rgba(255,225,200,0.55)', borderRadius: 4, minHeight: 380,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: 16,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em' }}>HERO PHOTO · margherita</div>
        </div>
        <div className="ph" style={{
          background: '#2a1d14',
          backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0, transparent 8px, rgba(232,163,104,0.08) 8px, rgba(232,163,104,0.08) 9px)',
          color: 'rgba(232,163,104,0.45)', borderRadius: 4, minHeight: 150,
        }}>OVEN</div>
        <div className="ph" style={{
          background: '#2a1d14',
          backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0, transparent 8px, rgba(232,163,104,0.08) 8px, rgba(232,163,104,0.08) 9px)',
          color: 'rgba(232,163,104,0.45)', borderRadius: 4, minHeight: 110,
        }}>DINING</div>
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────
// Gallery mini-sites — designed thumbnail-scale previews
// ──────────────────────────────────────────────────────────

// 1. Florist — cream botanical, italic-led
const FloristMock = () => (
  <div style={{ height: '100%', background: '#f4ebe0', color: '#3a2c20', position: 'relative', overflow: 'hidden' }}>
    {/* tiny nav */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a6248' }}>
      <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: '#3a2c20', letterSpacing: '-0.01em', textTransform: 'none' }}>Bloom</span>
      <span>Shop · Visit</span>
    </div>
    <div style={{ padding: '4px 18px 18px', display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: 12, alignItems: 'end', height: 'calc(100% - 40px)' }}>
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 30, lineHeight: 0.95, fontWeight: 400, letterSpacing: '-0.02em' }}>
          arrangements,<br/>by the stem.
        </div>
        <div style={{ fontSize: 8.5, color: '#7a6248', marginTop: 10, fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>
          BROOKLYN · MON–SAT
        </div>
      </div>
      <div className="ph" style={{
        background: '#e6c8b3',
        backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 6px, rgba(122,98,72,0.12) 6px 7px)',
        borderRadius: 100, aspectRatio: '0.75', color: 'rgba(122,98,72,0.5)', fontSize: 8,
      }}>BOUQUET</div>
    </div>
  </div>
);

// 2. Plumber — utility bold, navy + safety orange
const PlumberMock = () => (
  <div style={{ height: '100%', background: '#0e2a3a', color: '#e8eef2', padding: 18, position: 'relative', overflow: 'hidden', fontFamily: 'var(--ui)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 16, height: 16, background: '#ff9341', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }}/>
        <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.03em' }}>CEDAR PLUMBING</span>
      </div>
      <div style={{ fontSize: 8, fontFamily: 'var(--mono)', color: '#7a98aa', letterSpacing: '0.08em' }}>EST. 1994</div>
    </div>
    <div style={{ fontFamily: 'var(--ui)', fontSize: 26, lineHeight: 1.0, fontWeight: 800, letterSpacing: '-0.02em' }}>
      Burst pipe?<br/>
      <span style={{ color: '#ff9341' }}>We're 20 min out.</span>
    </div>
    <div style={{ marginTop: 14, padding: '10px 12px', background: '#ff9341', color: '#0e2a3a', borderRadius: 2, fontSize: 18, fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>(303) 555-0144</span>
      <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.1em' }}>24 / 7</span>
    </div>
    <div style={{ marginTop: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {['Drains', 'Water heaters', 'Re-pipe'].map(s => (
        <span key={s} style={{ fontSize: 8.5, padding: '4px 7px', border: '1px solid rgba(232,238,242,0.2)', borderRadius: 2, color: '#a3bccd' }}>{s}</span>
      ))}
    </div>
  </div>
);

// 3. Photo studio — minimal gallery
const StudioMock = () => (
  <div style={{ height: '100%', background: '#fafaf7', color: '#1c1c1c', padding: 18, fontFamily: 'var(--ui)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em' }}>Aria Studio</span>
      <span style={{ fontSize: 8.5, fontFamily: 'var(--mono)', color: '#6a6a6a', letterSpacing: '0.1em' }}>SEA · 2026</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 12 }}>
      {['1.3', '1.3', '1.3', '1.3', '1.3', '1.3'].map((r, i) => (
        <div key={i} className="ph" style={{
          aspectRatio: r,
          background: ['#e8e6e0', '#cfc8be', '#a59c8e', '#d6cfc1', '#b8b0a2', '#e0d8c8'][i],
          backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 5px, rgba(0,0,0,0.04) 5px 6px)',
          fontSize: 7, color: 'rgba(0,0,0,0.3)', borderRadius: 2,
        }}>{['portrait','wedding','editorial','brand','still life','street'][i].toUpperCase()}</div>
      ))}
    </div>
    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: '#3b3b3b', lineHeight: 1.3 }}>
      Available for book —<br/>Spring '26.
    </div>
  </div>
);

// 4. Cafe — warm, menu-led
const CafeMock = () => (
  <div style={{ height: '100%', background: '#1a1814', color: '#ecdfc4', padding: 18, position: 'relative', fontFamily: 'var(--ui)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 500, color: '#ecdfc4' }}>Norte Coffee</span>
      <span style={{ fontSize: 7, fontFamily: 'var(--mono)', color: '#7a6f56', letterSpacing: '0.12em' }}>OPEN · 7—4</span>
    </div>
    <div style={{ fontFamily: 'var(--serif)', fontSize: 28, lineHeight: 0.98, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 14 }}>
      A bag of beans,<br/>
      <span style={{ fontStyle: 'italic', fontWeight: 300 }}>roasted Tuesday.</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 9.5, color: '#b8a980', fontFamily: 'var(--mono)' }}>
      {[['Ethiopia · Guji','$22'], ['Colombia · Huila','$19'], ['House blend','$16']].map(([n,p]) => (
        <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed rgba(184,169,128,0.2)' }}>
          <span>{n}</span><span style={{ color: '#ecdfc4' }}>{p}</span>
        </div>
      ))}
    </div>
  </div>
);

// 5. Yoga studio — soft, serene
const YogaMock = () => (
  <div style={{ height: '100%', background: 'linear-gradient(180deg, #ede4d8 0%, #d9c9b3 100%)', color: '#2e2418', padding: 18, fontFamily: 'var(--ui)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, letterSpacing: '-0.01em' }}>still.</span>
      <span style={{ fontSize: 8, fontFamily: 'var(--mono)', color: '#6b5a45', letterSpacing: '0.1em' }}>YOGA · OAKLAND</span>
    </div>
    <div style={{ fontFamily: 'var(--serif)', fontSize: 26, lineHeight: 1.0, fontWeight: 400, letterSpacing: '-0.02em' }}>
      A small room.<br/>
      A long breath.
    </div>
    <div style={{ marginTop: 16, fontSize: 9.5, color: '#5a4a35', lineHeight: 1.5 }}>
      8am · vinyasa<br/>
      12pm · slow flow<br/>
      6pm · restorative
    </div>
    <div style={{ marginTop: 14, padding: '8px 12px', background: '#2e2418', color: '#ede4d8', fontSize: 10, letterSpacing: '0.02em', borderRadius: 2, display: 'inline-block' }}>Book a class →</div>
  </div>
);

// 6. Bakery — pastry-shop type
const BakeryMock = () => (
  <div style={{ height: '100%', background: '#fff6e8', color: '#3a2410', padding: 18, fontFamily: 'var(--ui)' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
      <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Pane & Co.</span>
      <span style={{ fontSize: 8, fontFamily: 'var(--mono)', color: '#9a7042', letterSpacing: '0.1em' }}>SINCE 2019</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
      <div className="ph" style={{ aspectRatio: '1.1', background: '#c9986b', backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 5px, rgba(58,36,16,0.1) 5px 6px)', borderRadius: 2, fontSize: 7, color: 'rgba(58,36,16,0.45)' }}>LOAF</div>
      <div className="ph" style={{ aspectRatio: '1.1', background: '#e0bc8c', backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 5px, rgba(58,36,16,0.1) 5px 6px)', borderRadius: 2, fontSize: 7, color: 'rgba(58,36,16,0.45)' }}>CROISSANT</div>
    </div>
    <div style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.05, fontWeight: 500 }}>
      Sourdough,<br/>
      <span style={{ fontStyle: 'italic', color: '#9a7042', fontWeight: 400 }}>baked at four.</span>
    </div>
  </div>
);

// 7. Auto shop — bold, industrial
const AutoMock = () => (
  <div style={{ height: '100%', background: '#1a1a1a', color: '#f5f5f0', padding: 18, fontFamily: 'var(--ui)', position: 'relative' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.04em' }}>HALSTEAD AUTO</span>
      <span style={{ fontSize: 8, fontFamily: 'var(--mono)', color: '#999', letterSpacing: '0.1em' }}>MPLS · ASE</span>
    </div>
    <div style={{ fontSize: 28, lineHeight: 0.95, fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
      Same-day<br/>
      <span style={{ color: '#ffd23f' }}>brake jobs.</span>
    </div>
    <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      <div style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 2 }}>Oil · $59</div>
      <div style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 2 }}>Brake · $189</div>
      <div style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 2 }}>Tires · 4 for $399</div>
      <div style={{ padding: '6px 8px', background: '#ffd23f', color: '#1a1a1a', borderRadius: 2 }}>Book now →</div>
    </div>
  </div>
);

// 8. Hair salon — chic minimal
const SalonMock = () => (
  <div style={{ height: '100%', background: '#f0ece6', color: '#2b2620', padding: 18, fontFamily: 'var(--ui)', position: 'relative' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <span style={{ fontFamily: 'var(--serif)', fontSize: 16, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>MARIN</span>
      <span style={{ fontSize: 8, fontFamily: 'var(--mono)', color: '#7a6b5a', letterSpacing: '0.12em' }}>HAIR · LA</span>
    </div>
    <div className="ph" style={{
      height: 100, background: '#c9b9a3',
      backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 5px, rgba(43,38,32,0.06) 5px 6px)',
      borderRadius: 2, fontSize: 8, color: 'rgba(43,38,32,0.45)', marginBottom: 12
    }}>PORTRAIT</div>
    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.1, fontWeight: 400 }}>
      Cut, color, the<br/>occasional change.
    </div>
    <div style={{ marginTop: 12, fontSize: 9, color: '#7a6b5a', fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>
      Tues — Sat · By appointment
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────
// Reusable identity primitives — replace emoji squares across the app
// ──────────────────────────────────────────────────────────

// Monogram badge — serif initial on a brand-colored field with subtle texture.
// Used wherever we previously had an emoji square (search results, draft sites, etc.)
const BizMonogram = ({ name = 'New Site', color = 'var(--ink-2)', textColor = '#fff', size = 48, radius = 4 }) => {
  // Pull up to 2 letters: "Mike's Pizza" → "MP", "still." → "S"
  const letters = name
    .replace(/[^a-zA-Z &]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => w.toLowerCase() !== 'and' && w !== '&')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'O';
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: color, color: textColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--serif)', fontWeight: 500,
      fontSize: size * 0.42, letterSpacing: '-0.02em',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
      backgroundImage: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent 55%),
                        repeating-linear-gradient(-45deg, transparent 0 6px, rgba(0,0,0,0.05) 6px 7px)`,
      backgroundBlendMode: 'overlay',
    }}>
      <span style={{ position: 'relative', zIndex: 1 }}>{letters}</span>
    </div>
  );
};

// SiteThumb — a small thumbnail showing the actual site design (when we have a mock for it),
// otherwise falls back to a clean monogram. Renders at any size; scales the mock proportionally.
const SiteThumb = ({ mockId, name, color, size = 48, radius = 4, shadow = false }) => {
  const entry = SITE_MOCKS.find(m => m.id === mockId);
  if (!entry) {
    return <BizMonogram name={name} color={color} size={size} radius={radius}/>;
  }
  const Mock = entry.Mock;
  // Mocks are designed for ~280px tall cards. Scale them down to fit `size`.
  const scale = size / 280;
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, overflow: 'hidden',
      flexShrink: 0, background: 'var(--paper-2)',
      border: '1px solid var(--rule-2)',
      boxShadow: shadow ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
      position: 'relative',
    }}>
      <div style={{
        width: 280, height: 280,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
      }}>
        <Mock/>
      </div>
    </div>
  );
};

const SITE_MOCKS = [
  { id: 'mike', name: "Mike's Pizza", type: 'Italian · Austin TX', Mock: CafeMock, accent: '#e8a368', tone: 'Warm / dark' },
  { id: 'bloom', name: 'Bloom Florist', type: 'Florist · Brooklyn NY', Mock: FloristMock, accent: '#c98a7a', tone: 'Cream / italic' },
  { id: 'cedar', name: 'Cedar Plumbing', type: 'Plumbing · Denver CO', Mock: PlumberMock, accent: '#ff9341', tone: 'Bold / utility' },
  { id: 'aria', name: 'Aria Studio', type: 'Photographer · Seattle', Mock: StudioMock, accent: '#1c1c1c', tone: 'Minimal / gallery' },
  { id: 'still', name: 'Still Yoga', type: 'Studio · Oakland CA', Mock: YogaMock, accent: '#2e2418', tone: 'Soft / serif' },
  { id: 'pane', name: 'Pane & Co.', type: 'Bakery · Portland OR', Mock: BakeryMock, accent: '#9a7042', tone: 'Warm / cream' },
  { id: 'halstead', name: 'Halstead Auto', type: 'Auto repair · Minneapolis', Mock: AutoMock, accent: '#ffd23f', tone: 'Industrial / bold' },
  { id: 'marin', name: 'Marin', type: 'Hair salon · Los Angeles', Mock: SalonMock, accent: '#c9b9a3', tone: 'Chic / italic' },
];

Object.assign(window, {
  BrowserChrome,
  BrowserMock: BrowserChrome, // back-compat
  PizzaSiteHero,
  PizzaSitePreview: PizzaSiteHero, // back-compat for p-generate / p-dash
  SITE_MOCKS,
  SiteThumb, BizMonogram,
  FloristMock, PlumberMock, StudioMock, CafeMock, YogaMock, BakeryMock, AutoMock, SalonMock,
});
