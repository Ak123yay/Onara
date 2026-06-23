export type AgentStepId =
  | "understanding"
  | "writing"
  | "concepts"
  | "building"
  | "testing"
  | "polishing"
  | "publishing";

export type AgentStep = {
  id: AgentStepId;
  model: string;
  name: string;
  task: string;
};

export type AgentStatus = "pending" | "active" | "retry" | "done";

export const AGENT_STEPS: AgentStep[] = [
  {
    id: "understanding",
    model: "Business brief",
    name: "Understanding your business",
    task: "Checking the business facts, services, service area, and conversion goal",
  },
  {
    id: "writing",
    model: "Content",
    name: "Writing your content",
    task: "Writing specific headlines, services, proof, and contact copy",
  },
  {
    id: "concepts",
    model: "3 directions",
    name: "Designing your concepts",
    task: "Creating three directions and selecting the strongest two to build",
  },
  {
    id: "building",
    model: "Component build",
    name: "Building your websites",
    task: "Building two websites from independently checked components",
  },
  {
    id: "testing",
    model: "Browser QA",
    name: "Testing desktop and mobile",
    task: "Rendering both concepts and checking layout, accessibility, assets, and performance",
  },
  {
    id: "polishing",
    model: "Focused repair",
    name: "Polishing the strongest version",
    task: "Applying one focused repair and final SEO, contact, and responsive safeguards",
  },
  {
    id: "publishing",
    model: "Cloudflare",
    name: "Publishing your site",
    task: "Publishing the tested website and saving its project record",
  },
];

export const MOCK_QUEUE_MS = 700;
export const MOCK_STEP_MS = 1250;

export function loadingPreviewHtml(businessName: string) {
  const safeBusinessName = escapeHtml(businessName || "Your Contractor Site");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body {
        display: grid;
        min-height: 100vh;
        margin: 0;
        place-items: center;
        background:
          radial-gradient(circle at 18% 12%, rgba(202,113,52,.12), transparent 34%),
          #f7f2e9;
        color: #1a1815;
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      main { width: min(560px, calc(100% - 48px)); }
      .label {
        color: #9a5427;
        font: 600 11px ui-monospace, monospace;
        letter-spacing: .16em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 10px;
        font: 400 clamp(34px, 8vw, 58px) Georgia, serif;
        letter-spacing: -.045em;
        line-height: .98;
      }
      p { max-width: 440px; color: #686159; line-height: 1.65; }
      .lines { display: grid; gap: 9px; margin-top: 30px; }
      .lines span {
        height: 8px;
        background: linear-gradient(90deg, #dfd6c9, #f7f2e9, #dfd6c9);
        background-size: 220% 100%;
        animation: loading 1.8s ease-in-out infinite;
      }
      .lines span:nth-child(2) { width: 78%; animation-delay: 120ms; }
      .lines span:nth-child(3) { width: 54%; animation-delay: 240ms; }
      @keyframes loading { 50% { background-position: 100% 0; } }
      @media (prefers-reduced-motion: reduce) { .lines span { animation: none; } }
    </style>
  </head>
  <body>
    <main>
      <div class="label">Onara build studio</div>
      <h1>${safeBusinessName}</h1>
      <p>Your real preview will appear after a structurally valid concept passes the first browser check.</p>
      <div class="lines" aria-hidden="true"><span></span><span></span><span></span></div>
    </main>
  </body>
</html>`;
}

export function progressForElapsed(elapsedMs: number) {
  if (elapsedMs <= MOCK_QUEUE_MS) {
    return {
      complete: false,
      currentStepIndex: 0,
      progress: 0,
      queued: true,
    };
  }

  const activeElapsed = elapsedMs - MOCK_QUEUE_MS;
  const rawStep = activeElapsed / MOCK_STEP_MS;
  const currentStepIndex = Math.min(Math.floor(rawStep), AGENT_STEPS.length);
  const stepProgress = rawStep - Math.floor(rawStep);
  const complete = currentStepIndex >= AGENT_STEPS.length;
  const progress = complete
    ? 100
    : Math.round(((currentStepIndex + stepProgress) / AGENT_STEPS.length) * 100);

  return {
    complete,
    currentStepIndex: Math.min(currentStepIndex, AGENT_STEPS.length - 1),
    progress,
    queued: false,
  };
}

export function previewHtmlForStep(stepIndex: number, businessName: string) {
  const safeBusinessName = escapeHtml(businessName || "Your Contractor Site");
  const show = (index: number) => stepIndex >= index;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: light;
        --ink: #10263a;
        --accent: #ea5b0c;
        --paper: #fff8ef;
        --muted: #5d6873;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #f8f2e8;
        color: var(--ink);
        font-family: Georgia, "Times New Roman", serif;
      }
      .site {
        min-height: 100vh;
        background: var(--paper);
      }
      .bar {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        background: var(--accent);
        color: white;
        font: 700 14px Arial, sans-serif;
        padding: 16px 22px;
      }
      .nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgb(16 38 58 / 12%);
        padding: 18px 22px;
      }
      .logo {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
      .links {
        display: flex;
        gap: 16px;
        color: var(--muted);
        font: 600 12px Arial, sans-serif;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 240px;
        gap: 24px;
        background: var(--ink);
        color: white;
        padding: 46px 32px;
      }
      .tag {
        display: inline-flex;
        border: 1px solid rgb(255 255 255 / 18%);
        color: rgb(255 255 255 / 72%);
        font: 700 10px Arial, sans-serif;
        letter-spacing: 0.16em;
        margin-bottom: 18px;
        padding: 8px 10px;
        text-transform: uppercase;
      }
      h1 {
        max-width: 520px;
        margin: 0;
        font-size: clamp(42px, 7vw, 70px);
        letter-spacing: -0.06em;
        line-height: 0.92;
      }
      .copy {
        max-width: 460px;
        color: rgb(255 255 255 / 70%);
        font: 16px/1.6 Arial, sans-serif;
        margin-top: 20px;
      }
      .cta {
        display: inline-flex;
        background: var(--accent);
        color: white;
        font: 800 14px Arial, sans-serif;
        margin-top: 24px;
        padding: 14px 18px;
      }
      .service-list {
        display: grid;
        gap: 10px;
      }
      .service {
        border: 1px solid rgb(255 255 255 / 16%);
        background: rgb(255 255 255 / 7%);
        border-radius: 3px;
        font: 700 14px Arial, sans-serif;
        padding: 16px;
      }
      .proof {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        padding: 18px 22px;
      }
      .proof div {
        border: 1px solid rgb(16 38 58 / 12%);
        background: white;
        padding: 18px;
      }
      .proof strong {
        display: block;
        font-size: 28px;
        letter-spacing: -0.04em;
      }
      .proof span {
        color: var(--muted);
        font: 700 10px Arial, sans-serif;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .seo {
        background: #e8f1e8;
        color: #315b39;
        font: 700 12px Arial, sans-serif;
        margin: 0 22px 22px;
        padding: 12px 14px;
      }
      .skeleton {
        display: grid;
        gap: 14px;
        padding: 44px;
      }
      .skeleton span {
        display: block;
        height: 18px;
        background: linear-gradient(90deg, #eee7dc, #faf8f3, #eee7dc);
        border-radius: 2px;
      }
      .fade { animation: fade 360ms ease both; }
      @keyframes fade {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 760px) {
        .hero { grid-template-columns: 1fr; padding: 34px 22px; }
        .proof { grid-template-columns: 1fr; }
        .links { display: none; }
      }
    </style>
  </head>
  <body>
    <main class="site">
      ${
        show(1)
          ? `<div class="bar fade"><span>Burst pipe? We can be there today.</span><strong>24 / 7 emergency</strong></div>`
          : ""
      }
      ${
        show(0)
          ? `<nav class="nav fade"><div class="logo">${safeBusinessName}</div><div class="links"><span>Services</span><span>Reviews</span><span>Call</span></div></nav>`
          : `<div class="skeleton"><span style="width:35%"></span><span style="width:76%"></span><span style="width:60%"></span><span style="height:220px;width:100%"></span></div>`
      }
      ${
        show(2)
          ? `<section class="hero fade"><div><span class="tag">4.8 from 127 Google reviews</span><h1>Fast local help from ${safeBusinessName}.</h1><p class="copy">Professional, proof-led service copy for homeowners who need the phone number before they need a paragraph.</p><a class="cta">Free estimate</a></div>${
              show(3)
                ? `<div class="service-list"><div class="service">Emergency repair</div><div class="service">Water heaters</div><div class="service">Drain cleaning</div><div class="service">Leak detection</div></div>`
                : ""
            }</section>`
          : ""
      }
      ${
        show(5)
          ? `<section class="proof fade"><div><strong>90 sec</strong><span>Search to draft</span></div><div><strong>No code</strong><span>Built for owners</span></div><div><strong>Phone-first</strong><span>Made for local calls</span></div></section>`
          : ""
      }
      ${show(5) ? `<div class="seo fade">SEO meta added · LocalBusiness schema embedded · service-area copy ready</div>` : ""}
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
