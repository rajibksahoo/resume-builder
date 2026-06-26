import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const JSON_DIR = path.resolve(ROOT, 'src/data/resumes');
const PDF_DIR = path.resolve(ROOT, 'resumes/pdf');

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'resume'
  );
}

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Next free version number for a given name + date. */
function nextVersion(slug: string, date: string): number {
  if (!existsSync(JSON_DIR)) return 1;
  const re = new RegExp(`^${slug}-${date}-v(\\d+)\\.json$`);
  let max = 0;
  for (const file of readdirSync(JSON_DIR)) {
    const m = file.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: ROOT }, (err, _stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve();
    });
  });
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

/** Locate an installed Chrome/Chromium for puppeteer-core (no bundled browser). */
function findChrome(): string | null {
  const env = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (env && existsSync(env)) return env;
  const local = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')
    : '';
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    local,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

/** Render the resume's print view to a PDF via headless Chrome. */
async function renderPdf(host: string, id: string, pdfPath: string): Promise<void> {
  const executablePath = findChrome();
  if (!executablePath) throw new Error('No Chrome/Edge install found for PDF rendering');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const url = `http://${host}/?print=${encodeURIComponent(id)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('.resume-page', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 350)); // let pagination/layout settle
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true, // honor @page { size: A4; margin: 0 } => no header/footer
    });
  } finally {
    await browser.close();
  }
}

/**
 * Dev-only endpoints:
 *   GET  /api/resume?id=<id>        -> the saved resume JSON (used by print view)
 *   POST /api/save-resume {name,resume} -> writes JSON + PDF and commits both
 * Registered only on the dev server, so production builds are unaffected.
 */
export function saveResumePlugin(): Plugin {
  return {
    name: 'save-resume-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // --- GET the saved JSON for the print view ---
        if (url.startsWith('/api/resume')) {
          const id = (new URL(url, 'http://x').searchParams.get('id') || '').replace(
            /[^a-zA-Z0-9._-]/g,
            '',
          );
          const file = path.join(JSON_DIR, `${id}.json`);
          if (!id || !existsSync(file)) {
            sendJson(res, 404, { ok: false, error: 'Resume not found' });
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(readFileSync(file, 'utf8'));
          return;
        }

        // --- POST save (JSON + PDF + commit) ---
        if (url.startsWith('/api/save-resume')) {
          if (req.method !== 'POST') {
            sendJson(res, 405, { ok: false, error: 'Method not allowed' });
            return;
          }
          try {
            const body = JSON.parse((await readBody(req)) || '{}') as {
              name?: string;
              resume?: unknown;
            };
            if (!body.resume || typeof body.resume !== 'object') {
              sendJson(res, 400, { ok: false, error: 'Missing resume payload' });
              return;
            }

            const slug = slugify(body.name ?? '');
            const date = today();
            const version = nextVersion(slug, date);
            const base = `${slug}-${date}-v${version}`;
            const id = base;
            const jsonPath = path.join(JSON_DIR, `${base}.json`);
            const pdfPath = path.join(PDF_DIR, `${base}.pdf`);

            writeFileSync(jsonPath, JSON.stringify(body.resume, null, 2) + '\n', 'utf8');

            // PDF (best effort — JSON is still saved/committed if this fails).
            mkdirSync(PDF_DIR, { recursive: true });
            let pdf = false;
            let pdfError: string | undefined;
            try {
              await renderPdf(req.headers.host ?? 'localhost:5173', id, pdfPath);
              pdf = true;
            } catch (e) {
              pdfError = e instanceof Error ? e.message : String(e);
            }

            // Commit just these file(s).
            let committed = false;
            let gitError: string | undefined;
            const paths = pdf ? [jsonPath, pdfPath] : [jsonPath];
            try {
              await run('git', ['add', '--', ...paths]);
              await run('git', ['commit', '-m', `Save resume: ${base}`, '--', ...paths]);
              committed = true;
            } catch (e) {
              gitError = e instanceof Error ? e.message : String(e);
            }

            sendJson(res, 200, {
              ok: true,
              id,
              jsonFile: `${base}.json`,
              pdfFile: pdf ? `${base}.pdf` : null,
              pdf,
              pdfError,
              committed,
              gitError,
            });
          } catch (e) {
            sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
          return;
        }

        next();
      });
    },
  };
}
