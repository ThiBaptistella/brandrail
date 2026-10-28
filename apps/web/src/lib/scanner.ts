import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { checkRendered, collectRenderedNodes, isPrivateAddress, type BrandrailConfig, type RenderedPage, type Report } from "@brandrail/engine";
import type { Browser } from "playwright-core";

/**
 * Hosted live-URL scanner. On Vercel it runs @sparticuz/chromium (downloaded once per cold start
 * into /tmp); locally it uses Playwright's own Chromium (`npx playwright install chromium`).
 */
const CHROMIUM_PACK = "https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar";
const USER_AGENT = "Mozilla/5.0 (compatible; BrandrailBot/1.0; +https://web-phi-nine-77.vercel.app)";

export class ScanError extends Error {}

const hostCache = new Map<string, Promise<boolean>>();

/** Resolves a hostname and refuses anything that lands on a private, loopback or metadata address. */
function isPublicHost(hostname: string): Promise<boolean> {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostCache.has(h)) {
    hostCache.set(
      h,
      (async () => {
        if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".") && !isIP(h)) return false;
        if (isIP(h)) return !isPrivateAddress(h);
        try {
          const addrs = await lookup(h, { all: true, verbatim: true });
          return addrs.length > 0 && addrs.every((a) => !isPrivateAddress(a.address));
        } catch {
          return false;
        }
      })(),
    );
  }
  return hostCache.get(h)!;
}

export async function normaliseScanUrl(input: string): Promise<URL> {
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new ScanError("That doesn't look like a web address.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new ScanError("Only http and https pages can be scanned.");
  if (u.username || u.password) throw new ScanError("Remove the username and password from the address.");
  if (u.port && !["80", "443", "8080", "8443"].includes(u.port)) throw new ScanError("Only standard web ports can be scanned.");
  if (!(await isPublicHost(u.hostname))) {
    throw new ScanError("That address isn't reachable from the internet (localhost and private networks can't be scanned here). Use `brandrail scan <url>` from your machine instead.");
  }
  u.hash = "";
  return u;
}

async function launch(): Promise<Browser> {
  const { chromium } = await import("playwright-core");
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const Sparticuz = (await import("@sparticuz/chromium-min")).default;
    return chromium.launch({ executablePath: await Sparticuz.executablePath(CHROMIUM_PACK), args: Sparticuz.args, headless: true });
  }
  const executablePath = process.env.BRANDRAIL_CHROMIUM_PATH || undefined;
  try {
    return await chromium.launch({ executablePath, headless: true });
  } catch (e) {
    throw new ScanError(`Couldn't start Chromium locally. Run \`npx playwright install chromium\` (or set BRANDRAIL_CHROMIUM_PATH). ${(e as Error).message.split("\n")[0]}`);
  }
}

export interface ScanResult {
  report: Report;
  pages: Array<{ url: string; title: string; nodes: number }>;
  url: string;
  /** Things that may make results less accurate, e.g. stylesheets that failed to load */
  notes: string[];
}

/** Loads the page (and up to `maxPages - 1` same-site pages it links to) and runs the rendered-page rules. */
export async function scanUrl(start: URL, config: BrandrailConfig, opts: { maxPages?: number; budgetMs?: number } = {}): Promise<ScanResult> {
  const maxPages = Math.min(Math.max(opts.maxPages ?? 1, 1), 5);
  const deadline = Date.now() + (opts.budgetMs ?? 45_000);
  const browser = await launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: USER_AGENT,
      serviceWorkers: "block",
      acceptDownloads: false,
      ignoreHTTPSErrors: false,
    });
    // Every request (redirects, subresources) is re-checked, so a public page can't pull the browser into a private network.
    await context.route("**/*", async (route) => {
      const req = route.request();
      const type = req.resourceType();
      if (type === "image" || type === "media" || type === "websocket") return route.abort();
      let host: string;
      try {
        const u = new URL(req.url());
        if (u.protocol !== "http:" && u.protocol !== "https:") return route.abort();
        host = u.hostname;
      } catch {
        return route.abort();
      }
      return (await isPublicHost(host)) ? route.continue() : route.abort("blockedbyclient");
    });

    let failedCss = 0;
    context.on("requestfailed", (r) => {
      if (r.resourceType() === "stylesheet") failedCss++;
    });
    context.on("response", (r) => {
      if (r.request().resourceType() === "stylesheet" && r.status() >= 400) failedCss++;
    });

    const queue = [start.toString()];
    const seen = new Set<string>();
    const pages: RenderedPage[] = [];
    const meta: ScanResult["pages"] = [];
    while (queue.length && pages.length < maxPages && Date.now() < deadline - 4000) {
      const url = queue.shift()!;
      const key = url.replace(/\/$/, "");
      if (seen.has(key)) continue;
      seen.add(key);
      const page = await context.newPage();
      try {
        const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: Math.min(20_000, deadline - Date.now()) });
        if (!res) throw new ScanError(`No response from ${url}`);
        if (res.status() >= 400) {
          if (pages.length === 0) throw new ScanError(`${new URL(url).host} answered ${res.status()} ${res.statusText()}.`);
          continue;
        }
        await page.waitForLoadState("networkidle", { timeout: Math.max(1000, Math.min(5000, deadline - Date.now() - 3000)) }).catch(() => {});
        const finalUrl = page.url();
        if (!(await isPublicHost(new URL(finalUrl).hostname))) throw new ScanError("The page redirected to a private address.");
        const data = await page.evaluate(collectRenderedNodes, 3000);
        pages.push({ url: finalUrl, title: data.title, nodes: data.nodes });
        meta.push({ url: finalUrl, title: data.title, nodes: data.nodes.length });
        if (pages.length === 1) {
          const origin = new URL(finalUrl).origin;
          const links = data.links.filter((l) => l.startsWith(origin)).sort((a, b) => a.length - b.length);
          queue.push(...links);
        }
      } catch (e) {
        if (pages.length === 0) {
          if (e instanceof ScanError) throw e;
          const msg = (e as Error).message.split("\n")[0] ?? "";
          if (/timeout/i.test(msg)) throw new ScanError("The page took too long to load.");
          if (/ERR_NAME_NOT_RESOLVED/.test(msg)) throw new ScanError("That domain doesn't resolve.");
          if (/ERR_BLOCKED_BY_CLIENT/.test(msg)) throw new ScanError("That address points to a private network and can't be scanned.");
          throw new ScanError(`Couldn't load the page: ${msg.replace(/^page\.goto: /, "")}`);
        }
      } finally {
        await page.close().catch(() => {});
      }
    }
    if (!pages.length) throw new ScanError("Couldn't load the page.");
    const notes = failedCss ? [`${failedCss} stylesheet${failedCss === 1 ? "" : "s"} didn't load, so some elements may show browser defaults (e.g. #0000ee links, Times New Roman).`] : [];
    return { report: checkRendered(pages, config), pages: meta, url: pages[0]!.url, notes };
  } finally {
    await browser.close().catch(() => {});
  }
}
