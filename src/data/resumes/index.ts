import type { Resume, ResumeVersion } from '../../types/resume';

// Eagerly load every JSON resume in this folder at build time.
const modules = import.meta.glob<{ default: Resume }>('./*.json', { eager: true });

function idFromPath(path: string): string {
  // './rajib-default.json' -> 'rajib-default'
  return path.replace(/^\.\//, '').replace(/\.json$/, '');
}

function labelFromId(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const seedVersions: ResumeVersion[] = Object.entries(modules)
  .map(([path, mod]) => {
    const id = idFromPath(path);
    return { id, label: labelFromId(id), resume: mod.default };
  })
  .sort((a, b) => a.id.localeCompare(b.id));
