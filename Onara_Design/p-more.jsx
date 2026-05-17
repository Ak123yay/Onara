// p-more.jsx — Leads, Notifications, Help, Team, Upgrade, Changelog, 404
const { useState: uS_more } = React;

/* ─── shared data ─── */
const LEAD_DATA = [
  { id:'l1', siteName:"Mike's Pizza",  name:'Danielle Torres', email:'danielle.t@gmail.com',  subject:'Private event inquiry', message:"Hi! I'm organizing a birthday dinner for 20 people next Saturday. Do you take private bookings? Would love to discuss a prix-fixe option.",          date:'2h ago',  read:false, replied:false },
  { id:'l2', siteName:"Mike's Pizza",  name:'Carlos Ruiz',     email:'c.ruiz@yahoo.com',      subject:'Catering question',     message:"Do you do office catering? We have a team of 40 and I'd love to bring in lunch from you guys once a month. Let me know what you offer!",         date:'5h ago',  read:false, replied:false },
  { id:'l3', siteName:'Bloom Florist', name:'Sarah Kim',        email:'sarah.kim@outlook.com', subject:'Wedding florals',       message:"I'm getting married in September and looking for a florist. Can we schedule a consultation? I love your aesthetic — exactly what I've been looking for.",       date:'1d ago',  read:true,  replied:true },
  { id:'l4', siteName:"Mike's Pizza",  name:'James Porter',    email:'jporter@gmail.com',     subject:'Gluten-free options',   message:"My daughter has celiac disease. Do you have a dedicated gluten-free preparation area? Would love to bring the family in if you do.",                  date:'2d ago',  read:true,  replied:false },
  { id:'l5', siteName:'Bloom Florist', name:'Mark Liu',         email:'mark.liu@company.com',  subject:'Corporate arrangements',message:"We need weekly fresh flower arrangements for our office reception. About 3 pieces per week, year-round. Can you handle recurring orders?",              date:'3d ago',  read:true,  replied:true },
  { id:'l6', siteName:"Mike's Pizza",  name:'Priya Nair',      email:'priya.n@gmail.com',     subject:'Reservation for 4',     message:"Can I make a reservation for 4 this Friday at 8pm? Your site doesn't seem to have a booking form — happy to call if easier.",                            date:'4d ago',  read:true,  replied:true },
];

const avatarColor = (name) => `oklch(0.62 0.12 ${(name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360})`;
const initials   = (name) => name.split(' ').map(n => n[0]).join('').slice(0,2);

/* ════════════════════════════════════════════════════════════
   1. LEADS — contact form inbox
   ════════════════════════════════════════════════════════════ */
const Leads = ({ go, user }) => {
  const [filter, setFilter]   = uS_more('all');
  const [leads, setLeads]     = uS_more(LEAD_DATA);
  const [selected, setSelected] = uS_more(null);

  const unread  = leads.filter(l => !l.read).length;
  const replied = leads.filter(l => l.replied).length;

  const filtered = filter === 'unread'  ? leads.filter(l => !l.read)
                 : filter === 'replied' ? leads.filter(l => l.replied)
                 : leads;

  const touch = (lead) => {
    setSelected(lead);
    setLeads(ls => ls.map(l => l.id === lead.id ? {...l, read:true} : l));
  };
  const markReplied = (id) => setLeads(ls => ls.map(l => l.id === id ? {...l, replied:true} : l));

  return (
    <DashShell go={go} current="leads" user={user}>
      <div style={{ padding:'40px 48px 60px', maxWidth:1080 }}>

        {/* header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom:8 }}>Inbox</div>
            <h1 className="serif" style={{ fontSize:40, fontWeight:400, margin:0 }}>
              Leads <span style={{ color:'var(--ink-3)' }}>· {leads.length} total</span>
            </h1>
          </div>
          <button className="btn btn-ghost btn-sm">
            <Ic name="download" size={13} color="currentColor"/> Export CSV
          </button>
        </div>

        {/* filter tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {[['all','All',leads.length],['unread','Unread',unread],['replied','Replied',replied]].map(([k,label,count]) => (
            <button key={k} className={`chip ${filter===k?'chip-active':''}`}
              style={{ padding:'6px 14px', fontSize:12 }} onClick={() => setFilter(k)}>
              {label}
              {count > 0 && (
                <span style={{ marginLeft:6, padding:'1px 6px', borderRadius:100, fontSize:10,
                  background: k==='unread' ? 'var(--accent)' : 'var(--paper-2)',
                  color:       k==='unread' ? 'white'         : 'var(--ink-4)' }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap:16, alignItems:'flex-start' }}>

          {/* list */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {filtered.length === 0 && (
              <div className="card" style={{ padding:48, textAlign:'center' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <Ic name="inbox" size={20} color="var(--ink-4)"/>
                </div>
                <div className="serif" style={{ fontSize:20, fontWeight:500 }}>Nothing here yet</div>
                <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:8 }}>
                  Leads from your contact forms will appear here.
                </div>
              </div>
            )}

            {filtered.map(lead => (
              <div key={lead.id} className="card hover-lift"
                style={{
                  padding:'15px 18px', display:'flex', gap:14, alignItems:'flex-start',
                  cursor:'pointer',
                  borderColor: selected?.id===lead.id ? 'var(--accent)' : !lead.read ? 'var(--ink)' : 'var(--rule-2)',
                  background:  selected?.id===lead.id ? 'var(--accent-softer)' : 'var(--paper)',
                  transition:'all 0.15s',
                }}
                onClick={() => touch(lead)}>

                <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0,
                  background: avatarColor(lead.name), color:'white',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:600 }}>
                  {initials(lead.name)}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:14, fontWeight: lead.read ? 400 : 600 }}>{lead.name}</span>
                      {!lead.read && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block' }}/>}
                      {lead.replied && <span className="badge badge-leaf" style={{ fontSize:9 }}>replied</span>}
                    </div>
                    <span className="mono" style={{ fontSize:10, color:'var(--ink-4)', flexShrink:0 }}>{lead.date}</span>
                  </div>
                  <div style={{ fontSize:12.5, fontWeight:500, color:'var(--ink-2)', marginTop:2 }}>{lead.subject}</div>
                  <div style={{ fontSize:12, color:'var(--ink-4)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {lead.message}
                  </div>
                  <div className="mono" style={{ marginTop:4, fontSize:9.5 }}>via {lead.siteName}</div>
                </div>
              </div>
            ))}
          </div>

          {/* detail pane */}
          {selected && (
            <div className="card fadein-up" style={{ overflow:'hidden', position:'sticky', top:40 }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--rule-2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div className="mono">Lead</div>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer' }}>
                  <Ic name="close" size={15} color="var(--ink-3)"/>
                </button>
              </div>

              <div style={{ padding:22 }}>
                <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:20 }}>
                  <div style={{ width:46, height:46, borderRadius:'50%', background: avatarColor(selected.name),
                    color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:600, flexShrink:0 }}>
                    {initials(selected.name)}
                  </div>
                  <div>
                    <div className="serif" style={{ fontSize:19, fontWeight:500 }}>{selected.name}</div>
                    <div className="mono" style={{ marginTop:2 }}>{selected.email}</div>
                    <div className="mono" style={{ marginTop:2, fontSize:9.5 }}>via {selected.siteName} · {selected.date}</div>
                  </div>
                </div>

                <div style={{ padding:16, background:'var(--paper-2)', borderRadius:4, marginBottom:18 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>{selected.subject}</div>
                  <div style={{ fontSize:13.5, color:'var(--ink-2)', lineHeight:1.65 }}>{selected.message}</div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <a href={`mailto:${selected.email}`} className="btn btn-accent"
                    style={{ textAlign:'center', display:'block', textDecoration:'none' }}
                    onClick={() => markReplied(selected.id)}>
                    <Ic name="mail" size={13} color="white"/> Reply via email
                  </a>
                  {!selected.replied && (
                    <button className="btn btn-ghost" onClick={() => markReplied(selected.id)}>
                      Mark as replied
                    </button>
                  )}
                </div>

                <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--rule-2)' }}>
                  <div style={{ padding:12, background:'var(--accent-softer)', borderRadius:3,
                    fontSize:12.5, color:'var(--accent-ink)', display:'flex', gap:10, alignItems:'flex-start', lineHeight:1.5 }}>
                    <Ic name="sparkle" size={13} color="var(--accent-ink)"/>
                    Add a booking widget to {selected.siteName} — 3 leads this week asked about reservations.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop:24, padding:'14px 18px', display:'flex', alignItems:'center', gap:14,
          background:'var(--paper-2)', borderRadius:4, border:'1px solid var(--rule-2)' }}>
          <Ic name="info" size={13} color="var(--ink-3)"/>
          <div style={{ flex:1, fontSize:12.5, color:'var(--ink-3)' }}>
            Contact forms are added to every generated site. Upgrade to Pro to get email alerts when a new lead arrives.
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => go('upgrade')}>Upgrade</button>
        </div>
      </div>
    </DashShell>
  );
};

/* ════════════════════════════════════════════════════════════
   2. NOTIFICATIONS — activity feed
   ════════════════════════════════════════════════════════════ */
const NOTIF_DATA = [
  { id:'n1', type:'trial',     title:"Trial ends in 11 days",                    body:"Add a card now to keep your sites live. Less than the cost of a pizza.",                                                       time:'Just now', icon:'clock',        action:'Upgrade now',   route:'upgrade',     read:false },
  { id:'n2', type:'google',    title:"Google hours changed · Mike's Pizza",       body:"Your Google hours changed from \"5–10pm\" to \"5pm–12am Fri–Sat\". Update your site to match?",                               time:'3h ago',   icon:'refresh',       action:'Update site',   route:'site-detail', read:false },
  { id:'n3', type:'milestone', title:"500 visits milestone · Mike's Pizza",       body:"Your site crossed 500 total visits. Friday evenings are driving 41% of weekly traffic.",                                      time:'1d ago',   icon:'sparkle',       action:'View analytics',route:'site-detail', read:true  },
  { id:'n4', type:'dns',       title:"mikespizza.com is live",                    body:"DNS verified in 52 seconds. Your custom domain is connected and responding.",                                                   time:'2d ago',   icon:'check-circle',  action:'View site',     route:'public-site', read:true  },
  { id:'n5', type:'review',    title:"12 new Google reviews · Mike's Pizza",      body:"Average rating is now 4.7 ★. We pulled the best 3 onto your homepage automatically.",                                         time:'4d ago',   icon:'star-fill',     action:null,            route:null,          read:true  },
  { id:'n6', type:'system',    title:"Onara v1.8 — May update",                  body:"New: booking widget, multilingual generation, and 3× faster rebuilds. See what's new.",                                       time:'1w ago',   icon:'book',          action:"What's new",    route:'changelog',   read:true  },
];

const TYPE_COLOR = { trial:'var(--accent)', google:'oklch(0.55 0.16 230)', milestone:'var(--accent)', dns:'var(--leaf)', review:'#e8a368', system:'var(--ink-3)' };

const Notifications = ({ go, user }) => {
  const [notifs, setNotifs] = uS_more(NOTIF_DATA);
  const unread = notifs.filter(n => !n.read).length;

  const markOne = (id) => setNotifs(ns => ns.map(n => n.id===id ? {...n,read:true} : n));
  const markAll = ()   => setNotifs(ns => ns.map(n => ({...n,read:true})));

  const today   = notifs.slice(0,2);
  const earlier = notifs.slice(2);

  return (
    <DashShell go={go} current="notifications" user={user}>
      <div style={{ padding:'40px 48px 60px', maxWidth:780 }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom:8 }}>Activity</div>
            <h1 className="serif" style={{ fontSize:40, fontWeight:400, margin:0 }}>
              Notifications {unread>0 && <span style={{ color:'var(--ink-3)' }}>· {unread} new</span>}
            </h1>
          </div>
          {unread>0 && <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>}
        </div>

        {[['Today', today], ['Earlier this week', earlier]].map(([label, group]) => (
          <div key={label} style={{ marginBottom:32 }}>
            <div className="mono" style={{ marginBottom:12, color:'var(--ink-4)' }}>{label}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {group.map(n => (
                <div key={n.id} className="card"
                  style={{ padding:'18px 20px', display:'flex', gap:16, alignItems:'flex-start',
                    borderColor: !n.read ? 'var(--ink)' : 'var(--rule-2)', cursor:'pointer' }}
                  onClick={() => markOne(n.id)}>

                  <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0,
                    background: TYPE_COLOR[n.type]+'1a',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Ic name={n.icon} size={16} color={TYPE_COLOR[n.type]}/>
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:14, fontWeight: n.read ? 400 : 600 }}>{n.title}</span>
                        {!n.read && <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--accent)',display:'inline-block'}}/>}
                      </div>
                      <span className="mono" style={{ fontSize:10, color:'var(--ink-4)', flexShrink:0 }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.55 }}>{n.body}</div>
                    {n.action && (
                      <button className="btn btn-soft btn-sm" style={{ marginTop:10 }}
                        onClick={e => { e.stopPropagation(); markOne(n.id); go(n.route); }}>
                        {n.action} <Ic name="arrow-r" size={11} color="currentColor"/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12,
          background:'var(--paper-2)', borderRadius:4, border:'1px solid var(--rule-2)' }}>
          <Ic name="info" size={13} color="var(--ink-3)"/>
          <div style={{ flex:1, fontSize:12.5, color:'var(--ink-3)' }}>
            Get email alerts for leads and Google sync changes — toggle in{' '}
            <a onClick={() => go('account')} style={{ color:'var(--accent-ink)', cursor:'pointer' }}>Account settings</a>.
          </div>
        </div>
      </div>
    </DashShell>
  );
};

/* ════════════════════════════════════════════════════════════
   3. HELP CENTER
   ════════════════════════════════════════════════════════════ */
const ARTICLES = [
  { cat:'Getting started', title:"How Onara imports from Google Business", reads:'4.2k', time:'3 min' },
  { cat:'Getting started', title:"What to do if your business isn't on Google Maps", reads:'2.8k', time:'2 min' },
  { cat:'Editing',         title:"How to request a revision in plain English", reads:'3.1k', time:'2 min' },
  { cat:'Editing',         title:"Replacing photos on your site", reads:'1.9k', time:'4 min' },
  { cat:'Domains',         title:"Connecting a custom domain (step by step)", reads:'5.6k', time:'5 min' },
  { cat:'Domains',         title:"Where to buy a domain — and why Porkbun", reads:'1.2k', time:'3 min' },
  { cat:'Billing',         title:"What happens when my trial ends?", reads:'3.8k', time:'2 min' },
  { cat:'Billing',         title:"Canceling or pausing your subscription", reads:'2.1k', time:'2 min' },
];

const Help = ({ go, user }) => {
  const [search, setSearch]       = uS_more('');
  const [chatOpen, setChatOpen]   = uS_more(false);
  const [chatMsg, setChatMsg]     = uS_more('');
  const [typing, setTyping]       = uS_more(false);
  const [history, setHistory]     = uS_more([
    { role:'bot', text:"Hi! I'm the Onara support bot. Ask me anything about your account, sites, or billing." }
  ]);

  const filtered = ARTICLES.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.cat.toLowerCase().includes(search.toLowerCase())
  );
  const cats = [...new Set(filtered.map(a => a.cat))];

  const send = () => {
    if (!chatMsg.trim()) return;
    const msg = chatMsg.trim();
    setChatMsg('');
    setHistory(h => [...h, { role:'user', text:msg }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const reply =
        /domain/i.test(msg)  ? "To connect a domain, open Site Detail → Settings → Domain → Manage. You'll add two CNAME records and we verify automatically." :
        /trial/i.test(msg)   ? "Your trial lasts 14 days. If you don't upgrade, your sites pause but all data is kept. Upgrade any time to bring them back." :
        /cancel/i.test(msg)  ? "Cancel any time from Account → Billing. Sites stay live until end of your paid period." :
        /refund/i.test(msg)  ? "We offer a 7-day money-back guarantee. Email help@onara.tech and we'll sort it same day." :
        "Great question — a human from our team will follow up over email within a few hours. Anything else I can help with?";
      setHistory(h => [...h, { role:'bot', text:reply }]);
    }, 1100);
  };

  return (
    <DashShell go={go} current="help" user={user}>
      <div style={{ padding:'40px 48px 60px', maxWidth:880 }}>
        <div className="eyebrow" style={{ marginBottom:10 }}>Support</div>
        <h1 className="serif" style={{ fontSize:44, fontWeight:400, margin:0, letterSpacing:'-0.02em' }}>
          How can we <span className="serif-italic">help</span>?
        </h1>

        {/* Search */}
        <div style={{ display:'flex', alignItems:'center', marginTop:26,
          border:'1px solid var(--ink)', borderRadius:4, overflow:'hidden',
          boxShadow:'0 4px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ padding:'0 16px', display:'flex', alignItems:'center' }}>
            <Ic name="search" size={16} color="var(--ink-3)"/>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search help articles…"
            style={{ flex:1, padding:'14px 0', border:'none', outline:'none', fontSize:15, background:'transparent' }}/>
          {search && (
            <button onClick={() => setSearch('')} style={{ padding:'0 16px', background:'none', border:'none', cursor:'pointer' }}>
              <Ic name="close" size={14} color="var(--ink-3)"/>
            </button>
          )}
        </div>

        {/* Articles */}
        <div style={{ marginTop:36 }}>
          {cats.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'var(--ink-3)' }}>No articles match "{search}".</div>
          )}
          {cats.map(cat => (
            <div key={cat} style={{ marginBottom:28 }}>
              <div className="mono" style={{ marginBottom:12 }}>{cat}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {filtered.filter(a => a.cat===cat).map(a => (
                  <div key={a.title} className="card hover-lift"
                    style={{ padding:'13px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
                    <div style={{ fontSize:14, fontWeight:500 }}>{a.title}</div>
                    <div style={{ display:'flex', gap:18, alignItems:'center', flexShrink:0, marginLeft:20 }}>
                      <span className="mono" style={{ fontSize:10 }}>{a.time} read</span>
                      <span className="mono" style={{ fontSize:10 }}>{a.reads} views</span>
                      <Ic name="arrow-r" size={13} color="var(--ink-4)"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact options */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:12 }}>
          <div className="card" style={{ padding:22, display:'flex', gap:16, alignItems:'flex-start', cursor:'pointer' }}
            onClick={() => setChatOpen(true)}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--accent-soft)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Ic name="sparkle" size={18} color="var(--accent-ink)"/>
            </div>
            <div>
              <div className="serif" style={{ fontSize:16, fontWeight:500 }}>Chat with support</div>
              <div style={{ fontSize:12.5, color:'var(--ink-3)', marginTop:3, lineHeight:1.5 }}>AI bot 24/7. Human backup in &lt;4h.</div>
            </div>
          </div>
          <div className="card" style={{ padding:22, display:'flex', gap:16, alignItems:'flex-start', cursor:'pointer' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--paper-2)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Ic name="mail" size={18} color="var(--ink-3)"/>
            </div>
            <div>
              <div className="serif" style={{ fontSize:16, fontWeight:500 }}>Email support</div>
              <div style={{ fontSize:12.5, color:'var(--ink-3)', marginTop:3 }}>help@onara.tech · reply in &lt;4h</div>
            </div>
          </div>
        </div>

        {/* Chat widget */}
        {chatOpen && (
          <div style={{ position:'fixed', bottom:24, right:24, width:340,
            background:'var(--paper)', borderRadius:8,
            border:'1px solid var(--ink)', boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
            display:'flex', flexDirection:'column', zIndex:200, overflow:'hidden' }}>
            <div style={{ padding:'13px 16px', background:'var(--ink)', color:'var(--paper)',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Ic name="sparkle" size={14} color="var(--accent)"/>
                <span style={{ fontSize:13.5, fontWeight:500 }}>Onara Support</span>
                <span className="sdot sdot-leaf"/>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background:'none', border:'none', cursor:'pointer' }}>
                <Ic name="close" size={15} color="var(--ink-4)"/>
              </button>
            </div>

            <div style={{ maxHeight:260, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
              {history.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth:'82%', padding:'9px 13px', fontSize:13, lineHeight:1.5,
                    borderRadius: m.role==='user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: m.role==='user' ? 'var(--ink)' : 'var(--paper-2)',
                    color:       m.role==='user' ? 'var(--paper)' : 'var(--ink)',
                  }}>{m.text}</div>
                </div>
              ))}
              {typing && (
                <div style={{ display:'flex', gap:5, padding:'9px 13px', background:'var(--paper-2)',
                  borderRadius:'12px 12px 12px 2px', width:54, alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--ink-3)',
                      animation:`chatDot 1.2s ${i*0.2}s ease-in-out infinite` }}/>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding:'10px 12px', borderTop:'1px solid var(--rule-2)', display:'flex', gap:8 }}>
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key==='Enter' && send()}
                placeholder="Type a message…"
                style={{ flex:1, padding:'9px 12px', border:'1px solid var(--rule)', borderRadius:100,
                  fontSize:13, outline:'none', background:'var(--paper)' }}/>
              <button className="btn btn-accent" onClick={send}
                style={{ width:36, height:36, padding:0, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Ic name="send" size={14} color="white"/>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes chatDot { 0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)} }
      `}</style>
    </DashShell>
  );
};

/* ════════════════════════════════════════════════════════════
   4. TEAM — invite collaborators
   ════════════════════════════════════════════════════════════ */
const MEMBERS_INIT = [
  { name:'Rosa Mendez', email:'rosa@bloomflorist.com', role:'Owner',  avatar:'oklch(0.62 0.13 50)',  you:true  },
  { name:'Jake Torres', email:'jake@bloomflorist.com', role:'Editor', avatar:'oklch(0.58 0.10 230)', you:false },
];

const Team = ({ go, user }) => {
  const [members, setMembers]     = uS_more(MEMBERS_INIT);
  const [showInvite, setShowInvite] = uS_more(false);
  const [email, setEmail]         = uS_more('');
  const [role, setRole]           = uS_more('Editor');

  const invite = () => {
    if (!email.trim()) return;
    setMembers(m => [...m, { name:email.split('@')[0], email:email.trim(), role, avatar:'oklch(0.60 0.12 160)', you:false }]);
    setEmail(''); setShowInvite(false);
  };

  return (
    <DashShell go={go} current="team" user={user}>
      <div style={{ padding:'40px 48px 60px', maxWidth:820 }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom:8 }}>Collaboration</div>
            <h1 className="serif" style={{ fontSize:40, fontWeight:400, margin:0 }}>
              Team <span style={{ color:'var(--ink-3)' }}>· {members.length} members</span>
            </h1>
          </div>
          <button className="btn btn-accent" onClick={() => setShowInvite(true)}>
            <Ic name="plus" size={14} color="white"/> Invite member
          </button>
        </div>

        <div className="card" style={{ marginBottom:22, padding:16, background:'var(--accent-softer)', borderColor:'transparent', display:'flex', gap:12, alignItems:'center' }}>
          <Ic name="sparkle" size={15} color="var(--accent-ink)"/>
          <div style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.5 }}>
            Team features are included in your Pro trial. Invite up to 5 collaborators per account.
          </div>
        </div>

        {/* table */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 160px 160px 40px',
            padding:'10px 20px', background:'var(--paper-2)', borderBottom:'1px solid var(--rule-2)' }}>
            {['Member','Role','Access',''].map((h,i) => (
              <div key={i} className="mono" style={{ fontSize:10, color:'var(--ink-3)' }}>{h}</div>
            ))}
          </div>

          {members.map((m,i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 160px 160px 40px',
              alignItems:'center', gap:8, padding:'14px 20px',
              borderTop: i===0 ? 'none' : '1px solid var(--rule-2)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:m.avatar,
                  color:'white', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:600, flexShrink:0 }}>
                  {initials(m.name)}
                </div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:500 }}>
                    {m.name}{m.you && <span className="badge" style={{ marginLeft:6, fontSize:9 }}>you</span>}
                  </div>
                  <div className="mono" style={{ fontSize:10 }}>{m.email}</div>
                </div>
              </div>
              <div>
                <span className="badge" style={{
                  background: m.role==='Owner' ? 'var(--ink)' : 'var(--paper-2)',
                  color:       m.role==='Owner' ? 'var(--paper)' : 'var(--ink-2)' }}>
                  {m.role}
                </span>
              </div>
              <div className="mono" style={{ fontSize:11, color:'var(--ink-3)' }}>All sites</div>
              <div>
                {!m.you && (
                  <button onClick={() => setMembers(ms => ms.filter((_,j) => j!==i))}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-4)' }}>
                    <Ic name="close" size={14} color="currentColor"/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Role definitions */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:20 }}>
          {[
            { role:'Owner',  desc:'Full access. Billing, deletion, all sites.' },
            { role:'Editor', desc:'View, edit, and request revisions. No billing.' },
            { role:'Viewer', desc:'Read-only. Analytics and site preview.' },
          ].map(r => (
            <div key={r.role} className="card" style={{ padding:16 }}>
              <div className="mono" style={{ marginBottom:6 }}>{r.role}</div>
              <div style={{ fontSize:12.5, color:'var(--ink-3)', lineHeight:1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {showInvite && (
          <Modal onClose={() => setShowInvite(false)} width={460}>
            <div style={{ padding:30 }}>
              <div className="eyebrow" style={{ marginBottom:10 }}>Invite member</div>
              <h2 className="serif" style={{ fontSize:26, fontWeight:500, margin:0 }}>Add a collaborator</h2>
              <div style={{ marginTop:20 }}>
                <label className="mono" style={{ display:'block', marginBottom:6 }}>Email address</label>
                <input className="input" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="colleague@yourcompany.com"
                  onKeyDown={e => e.key==='Enter' && invite()}/>
              </div>
              <div style={{ marginTop:16 }}>
                <label className="mono" style={{ display:'block', marginBottom:6 }}>Role</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['Editor','Viewer'].map(r => (
                    <button key={r} className={`chip ${role===r?'chip-active':''}`}
                      style={{ padding:'8px 16px' }} onClick={() => setRole(r)}>{r}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginTop:22, display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowInvite(false)}>Cancel</button>
                <button className="btn btn-accent" onClick={invite} disabled={!email.trim()}>
                  Send invite <Ic name="send" size={13} color="white"/>
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashShell>
  );
};

/* ════════════════════════════════════════════════════════════
   5. UPGRADE — plan picker → billing → confirmation
   ════════════════════════════════════════════════════════════ */
const PLANS_UP = {
  starter: { name:'Starter', monthly:12, yearly:8.25, sites:1, features:['1 website','10 revisions / month','Live public URL on .pages.dev','Custom domain ($10 one-time)','No Onara branding','Email support'] },
  pro:     { name:'Pro',     monthly:29, yearly:24,   sites:3, features:['3 websites','Unlimited revisions','Download code as .zip','Priority generation queue','Everything in Starter'] },
};

const Upgrade = ({ go, user }) => {
  const [plan,    setPlan]    = uS_more('starter');
  const [billing, setBilling] = uS_more('monthly');
  const [step,    setStep]    = uS_more(0);
  const [card,    setCard]    = uS_more('');
  const [exp,     setExp]     = uS_more('');
  const [cvc,     setCvc]     = uS_more('');

  const P   = PLANS_UP[plan];
  const price = billing==='yearly' ? P.yearly : P.monthly;

  /* ── success ── */
  if (step===2) return (
    <DashShell go={go} current="account" user={user}>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ textAlign:'center', maxWidth:460 }} className="fadein-up">
          <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--accent)',
            margin:'0 auto 22px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Ic name="check" size={28} color="white" strokeWidth={2.5}/>
          </div>
          <div className="eyebrow" style={{ marginBottom:10 }}>Welcome to {P.name}</div>
          <h1 className="serif" style={{ fontSize:52, fontWeight:400, margin:0, letterSpacing:'-0.025em' }}>
            You're all <span className="serif-italic">set</span>.
          </h1>
          <p style={{ fontSize:15, color:'var(--ink-3)', marginTop:16, lineHeight:1.6, maxWidth:380, margin:'16px auto 0' }}>
            Your sites are live, your custom domain is locked in, and {P.name} features are active.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:32 }}>
            <button className="btn btn-accent btn-lg" onClick={() => go('dashboard')}>
              Go to dashboard <Ic name="arrow-r" size={14} color="white"/>
            </button>
          </div>
        </div>
      </div>
    </DashShell>
  );

  return (
    <DashShell go={go} current="account" user={user}>
      <div style={{ padding:'40px 48px 60px', maxWidth:880 }}>
        <a onClick={() => step===0 ? go('account') : setStep(0)}
          style={{ fontSize:12, color:'var(--ink-3)', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}>
          <Ic name="arrow-l" size={12} color="currentColor"/> {step===0 ? 'Back' : 'Change plan'}
        </a>

        <div className="eyebrow" style={{ marginTop:20, marginBottom:10 }}>Upgrade</div>
        <h1 className="serif" style={{ fontSize:44, fontWeight:400, margin:0, letterSpacing:'-0.02em' }}>
          {step===0 ? <>Pick your <span className="serif-italic">plan</span>.</> : <>Add your <span className="serif-italic">card</span>.</>}
        </h1>

        {/* ── STEP 0: plan ── */}
        {step===0 && (
          <div className="fadein-up">
            <div style={{ display:'inline-flex', marginTop:26, padding:4,
              background:'var(--paper-2)', borderRadius:100, border:'1px solid var(--rule-2)' }}>
              {[['monthly','Monthly'],['yearly','Yearly · save 20%']].map(([k,l]) => (
                <button key={k} className={billing===k ? 'chip chip-active' : 'chip'}
                  style={{ padding:'7px 16px', fontSize:12, border:'none' }} onClick={() => setBilling(k)}>{l}</button>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:22 }}>
              {Object.entries(PLANS_UP).map(([key, p]) => {
                const active = plan===key;
                const pr = billing==='yearly' ? p.yearly : p.monthly;
                return (
                  <div key={key} className="card" style={{ padding:28, cursor:'pointer', transition:'all 0.15s',
                    borderColor: active ? 'var(--ink)' : 'var(--rule-2)',
                    background:  active ? 'var(--ink)' : 'var(--paper)',
                    color:       active ? 'var(--paper)' : 'var(--ink)' }}
                    onClick={() => setPlan(key)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div className="mono" style={{ color: active ? 'var(--accent-soft)' : 'var(--ink-3)' }}>{p.name}</div>
                      {active && <Ic name="check" size={14} color="var(--accent)"/>}
                    </div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:10 }}>
                      <div className="serif" style={{ fontSize:48, fontWeight:500, letterSpacing:'-0.03em' }}>${pr}</div>
                      <div style={{ fontSize:12, color: active ? 'var(--ink-4)' : 'var(--ink-3)' }}>
                        /mo{billing==='yearly' ? ', billed yearly' : ''}
                      </div>
                    </div>
                    <ul style={{ marginTop:18, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8 }}>
                      {p.features.map(f => (
                        <li key={f} style={{ display:'flex', gap:10, fontSize:13.5, alignItems:'flex-start' }}>
                          <Ic name="check" size={14} color={active ? 'var(--accent)' : 'var(--leaf)'}/>
                          <span style={{ color: active ? 'var(--paper)' : 'var(--ink-2)' }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ marginTop:18, padding:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:500 }}>You won't be charged today</div>
                <div style={{ fontSize:12.5, color:'var(--ink-3)', marginTop:3 }}>
                  {user.trial_days_left} days left on trial. Card charged Jun 2, 2026.
                </div>
              </div>
              <div className="serif" style={{ fontSize:24, fontWeight:500 }}>
                ${price}<span style={{ fontSize:13, color:'var(--ink-3)', fontWeight:400 }}>/mo</span>
              </div>
            </div>

            <button className="btn btn-accent btn-lg" style={{ marginTop:22 }} onClick={() => setStep(1)}>
              Continue <Ic name="arrow-r" size={14} color="white"/>
            </button>
          </div>
        )}

        {/* ── STEP 1: card ── */}
        {step===1 && (
          <div className="fadein-up">
            <div className="card" style={{ marginTop:28, padding:28, maxWidth:540 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div className="mono">Credit or debit card</div>
                <div style={{ display:'flex', gap:6 }}>
                  {['VISA','MC','AMEX'].map(b => (
                    <div key={b} style={{ padding:'3px 7px', border:'1px solid var(--rule-2)', borderRadius:3,
                      fontSize:9, fontFamily:'var(--mono)', color:'var(--ink-3)', letterSpacing:'0.04em' }}>{b}</div>
                  ))}
                </div>
              </div>

              <label className="mono" style={{ display:'block', marginBottom:6 }}>Card number</label>
              <input className="input" value={card}
                onChange={e => setCard(e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim())}
                placeholder="4242 4242 4242 4242" style={{ letterSpacing:'0.05em', fontFamily:'var(--mono)' }}/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>
                <div>
                  <label className="mono" style={{ display:'block', marginBottom:6 }}>Expiry</label>
                  <input className="input" value={exp} onChange={e => setExp(e.target.value)} placeholder="MM / YY"/>
                </div>
                <div>
                  <label className="mono" style={{ display:'block', marginBottom:6 }}>CVC</label>
                  <input className="input" value={cvc} onChange={e => setCvc(e.target.value.slice(0,4))} placeholder="•••"/>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="card" style={{ marginTop:14, padding:22, maxWidth:540 }}>
              <div className="mono" style={{ marginBottom:12 }}>Order summary</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:6 }}>
                <span>Onara {P.name} · {billing==='yearly' ? 'Yearly' : 'Monthly'}</span>
                <span>${billing==='yearly' ? P.yearly*12+'/yr' : P.monthly+'/mo'}</span>
              </div>
              {billing==='yearly' && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--leaf)' }}>
                  <span>Annual discount</span>
                  <span>−${(P.monthly-P.yearly)*12}/yr</span>
                </div>
              )}
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--rule-2)',
                display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:600 }}>
                <span>Due Jun 2, 2026</span>
                <div className="serif">${price}<span style={{ fontSize:12, fontWeight:400, color:'var(--ink-3)' }}>/mo</span></div>
              </div>
            </div>

            <div style={{ display:'flex', gap:12, marginTop:22, alignItems:'center' }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>
                <Ic name="arrow-l" size={14} color="currentColor"/> Back
              </button>
              <button className="btn btn-accent btn-lg" onClick={() => setStep(2)}>
                <Ic name="shield" size={14} color="white"/> Confirm & subscribe
              </button>
              <div style={{ fontSize:11.5, color:'var(--ink-4)', display:'flex', alignItems:'center', gap:5 }}>
                <Ic name="lock" size={12} color="currentColor"/> Secured by Stripe
              </div>
            </div>
          </div>
        )}
      </div>
    </DashShell>
  );
};

/* ════════════════════════════════════════════════════════════
   6. CHANGELOG — what's new
   ════════════════════════════════════════════════════════════ */
const RELEASES = [
  { version:'v1.8 · May 2026', badge:'Latest', items:[
    { type:'new',      text:'Booking widget — add a reservation or appointment form to any generated site.' },
    { type:'new',      text:'Multilingual generation — build your site in Spanish, French, or Japanese from the Style step.' },
    { type:'improved', text:'Generation is now 3× faster on average (41s vs 90s for most sites).' },
    { type:'improved', text:'Analytics now shows phone-call and directions clicks pulled from Google Business.' },
  ]},
  { version:'v1.7 · April 2026', items:[
    { type:'new',      text:'Leads inbox — contact form submissions from all your sites, in one place.' },
    { type:'new',      text:'Team collaboration — invite editors and viewers to manage your sites together.' },
    { type:'new',      text:'Google Sync — auto-detect hour and photo changes and offer to update your site.' },
    { type:'fixed',    text:'Fixed: custom domain not propagating on some Cloudflare accounts.' },
  ]},
  { version:'v1.6 · March 2026', items:[
    { type:'new',      text:'Mobile preview — phone, tablet, and desktop views side by side in the dashboard.' },
    { type:'improved', text:'SEO agent now generates FAQ schema automatically from your Google Q&A data.' },
    { type:'fixed',    text:'Fixed: reviews widget not rendering correctly on Safari 16.' },
  ]},
];

const BADGE_STYLE = {
  new:      { bg:'var(--accent-soft)',       color:'var(--accent-ink)' },
  improved: { bg:'oklch(0.88 0.06 145)',     color:'oklch(0.42 0.12 145)' },
  fixed:    { bg:'oklch(0.93 0.04 60)',      color:'oklch(0.50 0.10 60)' },
};

const Changelog = ({ go, user }) => (
  <DashShell go={go} current="help" user={user}>
    <div style={{ padding:'40px 48px 60px', maxWidth:760 }}>
      <a onClick={() => go('help')} style={{ fontSize:12, color:'var(--ink-3)', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}>
        <Ic name="arrow-l" size={12} color="currentColor"/> Help center
      </a>
      <div className="eyebrow" style={{ marginTop:20, marginBottom:10 }}>Product updates</div>
      <h1 className="serif" style={{ fontSize:44, fontWeight:400, margin:0, letterSpacing:'-0.02em' }}>
        What's <span className="serif-italic">new</span>
      </h1>

      <div style={{ marginTop:40, display:'flex', flexDirection:'column', gap:44 }}>
        {RELEASES.map((r, i) => (
          <div key={i}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
              <div className="mono" style={{ color:'var(--accent-ink)', fontSize:12 }}>{r.version}</div>
              {r.badge && <span className="badge badge-accent">{r.badge}</span>}
              <div style={{ flex:1, height:1, background:'var(--rule-2)' }}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {r.items.map((item, j) => (
                <div key={j} style={{ display:'flex', gap:12, alignItems:'flex-start',
                  padding:'12px 16px', background:'var(--paper)', border:'1px solid var(--rule-2)', borderRadius:4 }}>
                  <div style={{
                    flexShrink:0, padding:'2px 8px', borderRadius:100, fontSize:9,
                    fontFamily:'var(--mono)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:2,
                    ...BADGE_STYLE[item.type],
                  }}>{item.type}</div>
                  <div style={{ fontSize:13.5, lineHeight:1.5 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:48, padding:22, background:'var(--ink)', color:'var(--paper)', borderRadius:4, display:'flex', alignItems:'center', gap:18 }}>
        <Ic name="bell" size={18} color="var(--accent)"/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:500 }}>Get notified of new features</div>
          <div style={{ fontSize:12.5, color:'var(--ink-4)', marginTop:3 }}>We ship every few weeks. No noise — one email per release.</div>
        </div>
        <button className="btn btn-accent btn-sm">Subscribe</button>
      </div>
    </div>
  </DashShell>
);

/* ════════════════════════════════════════════════════════════
   7. NOT FOUND — 404
   ════════════════════════════════════════════════════════════ */
const NotFound = ({ go }) => (
  <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', background:'var(--paper)', padding:40, textAlign:'center', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:'50%', left:'50%', width:600, height:600, borderRadius:'50%',
      background:'radial-gradient(circle, var(--accent-softer), transparent 70%)',
      transform:'translate(-50%,-50%)', filter:'blur(40px)' }}/>
    <div style={{ position:'relative' }}>
      <Logo onClick={() => go('landing')}/>
      <div style={{ marginTop:52 }}>
        <div className="mono" style={{ fontSize:10, letterSpacing:'0.16em', color:'var(--ink-3)' }}>404 · PAGE NOT FOUND</div>
      </div>
      <h1 className="serif" style={{ fontSize:100, fontWeight:300, lineHeight:0.92, margin:'14px 0 0', letterSpacing:'-0.04em' }}>
        Lost?
      </h1>
      <p style={{ fontSize:16, color:'var(--ink-3)', marginTop:22, maxWidth:380, lineHeight:1.6, margin:'22px auto 0' }}>
        That page doesn't exist — or it moved. Try heading back home.
      </p>
      <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:36 }}>
        <button className="btn btn-accent btn-lg" onClick={() => go('dashboard')}>
          Go to dashboard
        </button>
        <button className="btn btn-soft btn-lg" onClick={() => go('landing')}>
          Back to home
        </button>
      </div>
    </div>
  </div>
);

Object.assign(window, { Leads, Notifications, Help, Team, Upgrade, Changelog, NotFound });
