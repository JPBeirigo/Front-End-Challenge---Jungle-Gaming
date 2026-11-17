import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const reportsDir = path.join(root, 'lighthouse-reports');
const baseUrl = process.env.LH_BASE_URL || 'http://127.0.0.1:4173';

const pages = [
  { name: 'home', path: '/' },
  { name: 'detail-nft', path: '/nfts/nft_1' },
];
const profiles = ['mobile', 'desktop'];
const runsPerCase = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.ok || res.status === 404) return;
    } catch { /* ignore */ }
    await sleep(1000);
  }
  throw new Error(`Servidor não respondeu em ${url} dentro de ${timeoutMs}ms`);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function runLighthouseOnce(url, profile, outBase) {
  const args = [
    'lighthouse',
    url,
    '--output=json',
    '--output=html',
    `--output-path=${outBase}`,
    '--only-categories=performance,accessibility,best-practices,seo',
    '--quiet',
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage',
  ];
  if (profile === 'desktop') {
    args.push('--preset=desktop');
  } else {
    args.push('--form-factor=mobile', '--screenEmulation.mobile=true');
  }
  const env = { ...process.env };
  if (!env.CHROME_PATH && process.platform === 'linux' && await exists('/usr/bin/google-chrome')) {
    env.CHROME_PATH = '/usr/bin/google-chrome';
  }

  await new Promise((resolve, reject) => {
    const child = spawn('npx', args, { cwd: root, env, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Lighthouse falhou (${code}) para ${url} ${profile}`));
    });
  });

  const jsonPath = `${outBase}.report.json`;
  const json = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  const categories = json.categories || {};
  const audits = json.audits || {};
  const score = (k) => Math.round((categories[k]?.score ?? 0) * 100);
  return {
    scores: {
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
    },
    metrics: {
      lcp: audits['largest-contentful-paint']?.numericValue ?? null,
      cls: audits['cumulative-layout-shift']?.numericValue ?? null,
      tbt: audits['total-blocking-time']?.numericValue ?? null,
      fcp: audits['first-contentful-paint']?.numericValue ?? null,
      si: audits['speed-index']?.numericValue ?? null,
    },
    finalUrl: json.finalDisplayedUrl || json.finalUrl || url,
    fetchTime: json.fetchTime,
    userAgent: json.environment?.hostUserAgent,
    lighthouseVersion: json.lighthouseVersion,
    jsonPath,
    htmlPath: `${outBase}.report.html`,
  };
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function main() {
  await fs.mkdir(reportsDir, { recursive: true });
  const server = spawn('node', ['scripts/preview-spa.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: '4173', HOST: '127.0.0.1' },
    stdio: 'inherit',
  });

  let results;
  try {
    await waitForServer(`${baseUrl}/`);
    results = [];

    for (const page of pages) {
      for (const profile of profiles) {
        const caseRuns = [];
        for (let i = 1; i <= runsPerCase; i++) {
          const slug = `${page.name}-${profile}-run${i}`;
          const outBase = path.join(reportsDir, slug);
          const url = `${baseUrl}${page.path}`;
          console.log(`\n==> Lighthouse ${slug}: ${url}`);
          const r = await runLighthouseOnce(url, profile, outBase);
          caseRuns.push(r);
        }
        const medians = {
          performance: median(caseRuns.map((r) => r.scores.performance)),
          accessibility: median(caseRuns.map((r) => r.scores.accessibility)),
          bestPractices: median(caseRuns.map((r) => r.scores.bestPractices)),
          seo: median(caseRuns.map((r) => r.scores.seo)),
        };
        const metricsMedian = {
          lcp: median(caseRuns.map((r) => r.metrics.lcp ?? 0)),
          cls: median(caseRuns.map((r) => r.metrics.cls ?? 0)),
          tbt: median(caseRuns.map((r) => r.metrics.tbt ?? 0)),
        };
        results.push({ page: page.name, path: page.path, profile, runs: caseRuns, medians, metricsMedian });
      }
    }
  } finally {
    server.kill('SIGTERM');
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    tool: { lighthouse: results[0]?.runs?.[0]?.lighthouseVersion ?? null },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    targets: { performance: 90, accessibility: 95, bestPractices: 95, seo: 90 },
    conditions: 'Build otimizado (vite build) servido via vite preview com VITE_ENABLE_MOCKS=true e cenário padrão dos mocks. 3 medições por página/perfil; valores reportados como mediana.',
    results,
  };
  await fs.writeFile(path.join(reportsDir, 'summary.json'), JSON.stringify(summary, null, 2));

  const lines = [];
  lines.push('# Lighthouse - Resumo (medianas de 3 medições)');
  lines.push('');
  lines.push(`Gerado em: ${summary.generatedAt}`);
  lines.push('');
  lines.push('| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |');
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of results) {
    lines.push(`| ${r.page} | ${r.profile} | ${r.medians.performance} | ${r.medians.accessibility} | ${r.medians.bestPractices} | ${r.medians.seo} | ${r.metricsMedian.lcp.toFixed(1)} | ${r.metricsMedian.cls.toFixed(3)} | ${r.metricsMedian.tbt.toFixed(1)} |`);
  }
  await fs.writeFile(path.join(reportsDir, 'summary.md'), lines.join('\n') + '\n');

  console.log('\nRelatórios Lighthouse gerados em', reportsDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
