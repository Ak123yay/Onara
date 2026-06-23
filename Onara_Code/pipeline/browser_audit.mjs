import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import lighthouse from "lighthouse";
import { chromium } from "playwright";

const [inputPath, outputDirectory, reportPath] = process.argv.slice(2);
if (!inputPath || !outputDirectory || !reportPath) {
  throw new Error("Usage: node browser_audit.mjs <input.html> <output-directory> <report.json>");
}

await mkdir(outputDirectory, { recursive: true });
const html = await readFile(inputPath, "utf8");
const server = createServer((request, response) => {
  if (request.url === "/" || request.url === "/index.html") {
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    });
    response.end(html);
    return;
  }
  response.writeHead(404);
  response.end("Not found");
});

await new Promise((resolvePromise, rejectPromise) => {
  server.once("error", rejectPromise);
  server.listen(0, "127.0.0.1", resolvePromise);
});

const address = server.address();
const port = typeof address === "object" && address ? address.port : null;
if (!port) {
  throw new Error("Browser audit server did not receive a port");
}

const url = `http://127.0.0.1:${port}/`;
const report = {
  available: true,
  accessibility_violations: 0,
  accessibility_issues: [],
  checks: {},
  console_errors: [],
  failed_requests: [],
  hard_blockers: [],
  lighthouse: {},
  screenshots: {},
  warnings: [],
};

let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const viewport of [
    { key: "desktop", width: 1440, height: 1000 },
    { key: "tablet", width: 768, height: 1024 },
    { key: "mobile", width: 390, height: 844 },
    { key: "reflow", width: 320, height: 800 },
  ]) {
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") {
        report.console_errors.push(`${viewport.key}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      report.console_errors.push(`${viewport.key}: ${error.message}`);
    });
    page.on("requestfailed", (request) => {
      const detail = `${viewport.key}: ${request.url()} ${request.failure()?.errorText ?? ""}`.trim();
      if (isOptionalFontRequest(request.url())) {
        report.warnings.push(`Optional web font failed: ${detail}`);
      } else {
        report.failed_requests.push(detail);
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && !response.url().startsWith(url)) {
        const detail = `${viewport.key}: ${response.status()} ${response.url()}`;
        if (isOptionalFontRequest(response.url())) {
          report.warnings.push(`Optional web font failed: ${detail}`);
        } else {
          report.failed_requests.push(detail);
        }
      }
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

    const dom = await page.evaluate(({ viewportWidth }) => {
      const lower = (value) => String(value ?? "").toLowerCase();
      const interactive = [...document.querySelectorAll("a,button,input,select,textarea,[role=button]")];
      const primary = [...document.querySelectorAll("a,button")].filter((element) => {
        const text = lower(element.textContent);
        return /call|estimate|book|contact|quote|schedule|emergency/.test(text);
      });
      const invalidTargets = interactive.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 24 || rect.height < 24);
      });
      const smallPrimaryTargets = primary.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      });
      const unlabeled = [...document.querySelectorAll("input,select,textarea")].filter((element) => {
        if (element.type === "hidden") return false;
        return !element.labels?.length && !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby");
      });
      const unsafeEventHandlers = [...document.querySelectorAll("*")].some((element) =>
        [...element.attributes].some((attribute) => lower(attribute.name).startsWith("on")),
      );
      const unsafeUrls = [...document.querySelectorAll("[href],[src]")].some((element) =>
        lower(element.getAttribute("href") || element.getAttribute("src")).startsWith("javascript:"),
      );
      const unsafeForms = [...document.forms].filter((form) => {
        const action = form.getAttribute("action") || "";
        if (!action || action.startsWith("#") || action.startsWith("/")) return false;
        return !/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/lead-email(?:[/?#]|$)/i.test(action)
          && !/^https:\/\/(?:www\.)?onara\.tech(?:[/?#]|$)/i.test(action);
      });
      const brokenImages = [...document.images].filter((image) => !image.complete || image.naturalWidth < 2);
      const contactForm = [...document.forms].find((form) => {
        const text = lower(form.textContent);
        const fields = form.querySelectorAll("input,select,textarea").length;
        return fields >= 2 && /contact|estimate|quote|message|service|phone|email/.test(text);
      });
      const hero = document.querySelector('[data-component="hero"],#hero,.hero,main > section');
      const header = document.querySelector('[data-component="site_header"],[data-component="header"],header');
      return {
        bodyPresent: Boolean(document.body),
        brokenImages: brokenImages.length,
        doctypePresent: Boolean(document.doctype),
        hasHeader: Boolean(header),
        hasHero: Boolean(hero),
        hasContactForm: Boolean(contactForm),
        hasPrimaryCta: primary.length > 0,
        headPresent: Boolean(document.head),
        horizontalOverflow: document.documentElement.scrollWidth > viewportWidth + 2,
        invalidTargets: invalidTargets.length,
        smallPrimaryTargets: smallPrimaryTargets.length,
        unlabeledFields: unlabeled.length,
        unsafeEventHandlers,
        unsafeForms: unsafeForms.length,
        unsafeFrames: document.querySelectorAll("iframe,object,embed").length,
        unsafeMetaRefresh: Boolean(document.querySelector('meta[http-equiv="refresh" i]')),
        unsafeScripts: document.querySelectorAll('script:not([type="application/ld+json"])').length,
        unsafeUrls,
      };
    }, { viewportWidth: viewport.width });

    report.checks[`${viewport.key}_reflow`] = !dom.horizontalOverflow;
    if (dom.horizontalOverflow) report.hard_blockers.push(`${viewport.key}: horizontal overflow`);
    if (dom.invalidTargets) report.hard_blockers.push(`${viewport.key}: ${dom.invalidTargets} controls below 24px`);
    if (dom.smallPrimaryTargets) report.warnings.push(`${viewport.key}: ${dom.smallPrimaryTargets} primary controls below Onara's 44px target`);
    if (dom.unlabeledFields) report.hard_blockers.push(`${viewport.key}: ${dom.unlabeledFields} unlabeled form controls`);
    if (dom.brokenImages) report.hard_blockers.push(`${viewport.key}: ${dom.brokenImages} broken images`);

    if (viewport.key === "desktop") {
      report.checks.html_structure = dom.doctypePresent && dom.headPresent && dom.bodyPresent;
      report.checks.header = dom.hasHeader;
      report.checks.hero = dom.hasHero;
      report.checks.contact_form = dom.hasContactForm;
      report.checks.primary_cta = dom.hasPrimaryCta;
      report.checks.safe_output = !dom.unsafeEventHandlers
        && !dom.unsafeForms
        && !dom.unsafeFrames
        && !dom.unsafeMetaRefresh
        && !dom.unsafeScripts
        && !dom.unsafeUrls;
      if (!report.checks.html_structure) report.hard_blockers.push("HTML document structure is incomplete");
      if (!dom.hasHeader) report.hard_blockers.push("Site header is missing");
      if (!dom.hasHero) report.hard_blockers.push("Hero section is missing");
      if (!dom.hasContactForm) report.hard_blockers.push("Contact form is missing");
      if (!dom.hasPrimaryCta) report.hard_blockers.push("Primary conversion CTA is missing");
      if (!report.checks.safe_output) report.hard_blockers.push("Generated output contains unsafe executable or navigation behavior");
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      report.accessibility_violations = accessibility.violations.length;
      const seriousAccessibility = accessibility.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious",
      );
      report.accessibility_issues = seriousAccessibility.slice(0, 8).map((violation) => ({
        help: violation.help,
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.slice(0, 4).map((node) => ({
          failureSummary: node.failureSummary,
          html: node.html,
          selectors: node.target.map(String),
        })),
        selectors: violation.nodes.slice(0, 4).flatMap((node) => node.target.map(String)),
      }));
      for (const violation of report.accessibility_issues) {
        report.hard_blockers.push(`Axe ${violation.impact}: ${violation.id} - ${violation.help}`);
      }
    }

    if (viewport.key !== "reflow") {
      const screenshotPath = resolve(outputDirectory, `${viewport.key}.jpg`);
      const screenshot = await page.screenshot({
        fullPage: false,
        path: screenshotPath,
        quality: 68,
        type: "jpeg",
      });
      report.screenshots[viewport.key] = screenshotPath;
      if (viewport.key === "desktop") {
        report.screenshot_hash = createHash("sha256").update(screenshot).digest("hex");
      }
    }
    await context.close();
  }
} finally {
  if (browser) await browser.close();
}

if (report.console_errors.length) {
  report.hard_blockers.push(`Browser console reported ${report.console_errors.length} error(s)`);
}
if (report.failed_requests.length) {
  report.hard_blockers.push(`Browser reported ${report.failed_requests.length} failed request(s)`);
}

let chromeProcess;
let lighthouseProfile;
try {
  const debuggingPort = await availablePort();
  lighthouseProfile = await mkdtemp(resolve(tmpdir(), "onara-lighthouse-"));
  chromeProcess = spawn(
    chromium.executablePath(),
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      `--remote-debugging-port=${debuggingPort}`,
      `--user-data-dir=${lighthouseProfile}`,
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );
  let chromeLaunchError;
  chromeProcess.once("error", (error) => {
    chromeLaunchError = error;
  });
  await waitForChrome(debuggingPort, chromeProcess, () => chromeLaunchError);
  const result = await lighthouse(url, {
    logLevel: "silent",
    output: "json",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    port: debuggingPort,
  });
  const lhr = result?.lhr;
  if (lhr) {
    report.lighthouse = {
      accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
      best_practices: Math.round((lhr.categories["best-practices"]?.score ?? 0) * 100),
      cls: lhr.audits["cumulative-layout-shift"]?.numericValue ?? 0,
      lcp_ms: lhr.audits["largest-contentful-paint"]?.numericValue ?? 0,
      performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
      seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
      tbt_ms: lhr.audits["total-blocking-time"]?.numericValue ?? 0,
    };
  }
} catch (error) {
  report.warnings.push(`Lighthouse unavailable: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  if (chromeProcess && !chromeProcess.killed) {
    try {
      chromeProcess.kill();
      await Promise.race([
        new Promise((resolvePromise) => chromeProcess.once("exit", resolvePromise)),
        new Promise((resolvePromise) => setTimeout(resolvePromise, 1500)),
      ]);
    } catch (error) {
      report.warnings.push(
        `Lighthouse cleanup warning: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (lighthouseProfile) {
    try {
      await rm(lighthouseProfile, {
        force: true,
        maxRetries: 8,
        recursive: true,
        retryDelay: 250,
      });
    } catch (error) {
      report.warnings.push(
        `Lighthouse profile cleanup delayed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  await new Promise((resolvePromise) => server.close(resolvePromise));
}

report.hard_blockers = [...new Set(report.hard_blockers)];
report.warnings = [...new Set(report.warnings)];
await writeFile(reportPath, JSON.stringify(report), "utf8");

function isOptionalFontRequest(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "fonts.googleapis.com" || host === "fonts.gstatic.com";
  } catch {
    return false;
  }
}

async function availablePort() {
  const portServer = createServer();
  await new Promise((resolvePromise, rejectPromise) => {
    portServer.once("error", rejectPromise);
    portServer.listen(0, "127.0.0.1", resolvePromise);
  });
  const portAddress = portServer.address();
  const port = typeof portAddress === "object" && portAddress ? portAddress.port : null;
  await new Promise((resolvePromise) => portServer.close(resolvePromise));
  if (!port) throw new Error("Could not reserve a Lighthouse debugging port");
  return port;
}

async function waitForChrome(port, processHandle, launchError) {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (launchError()) {
      throw launchError();
    }
    if (processHandle.exitCode !== null) {
      throw new Error(`Chromium exited before Lighthouse connected (${processHandle.exitCode})`);
    }
    try {
      const response = await fetch(endpoint);
      if (response.ok) return;
    } catch {
      // Chromium has not opened the debugging port yet.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error("Chromium did not open its Lighthouse debugging port");
}
