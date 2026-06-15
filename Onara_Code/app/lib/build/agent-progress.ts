export type AgentStepId =
  | "analyst"
  | "writer"
  | "style"
  | "planner"
  | "prompt"
  | "code"
  | "debug"
  | "seo"
  | "qa"
  | "mobile";

export type AgentStep = {
  id: AgentStepId;
  model: string;
  name: string;
  task: string;
};

export type AgentStatus = "pending" | "active" | "retry" | "done";

export const AGENT_STEPS: AgentStep[] = [
  {
    id: "analyst",
    model: "GLM 5.1",
    name: "Business Analyst",
    task: "Reading Google facts, services, and service area",
  },
  {
    id: "writer",
    model: "Qwen local",
    name: "Content Writer",
    task: "Drafting contractor-specific headlines and service copy",
  },
  {
    id: "style",
    model: "GLM 5.1",
    name: "Style Agent",
    task: "Choosing palette, type scale, sections, and trust layout",
  },
  {
    id: "planner",
    model: "GLM 5.1",
    name: "Planner",
    task: "Turning copy and style into a component blueprint",
  },
  {
    id: "prompt",
    model: "GLM 5.1",
    name: "Prompt Engineer",
    task: "Writing exact build instructions for the code agent",
  },
  {
    id: "code",
    model: "Model picker",
    name: "Code Generator",
    task: "Generating HTML, CSS, and interaction hooks",
  },
  {
    id: "debug",
    model: "GLM 5.1 + RAG",
    name: "Debugger",
    task: "Fixing broken markup, spacing, and responsive bugs",
  },
  {
    id: "seo",
    model: "Qwen local",
    name: "SEO Agent",
    task: "Adding title tags, schema, and local service metadata",
  },
  {
    id: "qa",
    model: "GLM 5.1",
    name: "QA Agent",
    task: "Checking calls to action, missing data, and launch blockers",
  },
  {
    id: "mobile",
    model: "Qwen local",
    name: "Mobile Optimizer",
    task: "Testing tap targets, stack order, and mobile readability",
  },
];

export const MOCK_QUEUE_MS = 700;
export const MOCK_STEP_MS = 1250;

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
      ${show(8) ? `<div class="seo fade">SEO meta added · LocalBusiness schema embedded · service-area copy ready</div>` : ""}
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
