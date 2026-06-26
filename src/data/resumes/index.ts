import type { Resume, ResumeVersion } from '../../types/resume';

// Eagerly load every JSON resume in this folder at build time.
const modules = import.meta.glob<{ default: Resume }>('./*.json', { eager: true });

function idFromPath(path: string): string {
  // './rajib-default.json' -> 'rajib-default'
  return path.replace(/^\.\//, '').replace(/\.json$/, '');
}

function titleCase(s: string): string {
  return s
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function labelFromId(id: string): string {
  // Saved versions: '<name>-<YYYY-MM-DD>-v<N>' -> 'Name · YYYY-MM-DD · vN'
  const m = id.match(/^(.*)-(\d{4}-\d{2}-\d{2})-v(\d+)$/);
  if (m) return `${titleCase(m[1])} · ${m[2]} · v${m[3]}`;
  return titleCase(id);
}

export const seedVersions: ResumeVersion[] = Object.entries(modules)
  .map(([path, mod]) => {
    const id = idFromPath(path);
    return { id, label: labelFromId(id), resume: mod.default };
  })
  .sort((a, b) => a.id.localeCompare(b.id));
