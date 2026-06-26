import { useRef } from 'react';
import type { Resume } from '../types/resume';
import { emptyResume } from '../types/resume';
import type { UseResume } from '../state/useResume';
import { seedVersions } from '../data/resumes';

const SEED_IDS = new Set(seedVersions.map((v) => v.id));

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Shallow-merge an unknown object onto an empty resume so imports never crash. */
function coerceResume(input: unknown): Resume {
  const base = emptyResume();
  if (input && typeof input === 'object') {
    return { ...base, ...(input as Partial<Resume>) } as Resume;
  }
  return base;
}

const btn =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/70 px-3 py-1.5 ' +
  'text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed';
const btnPrimary =
  'inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-sm font-semibold ' +
  'text-white shadow hover:bg-sky-500 transition';

export function Toolbar({ store }: { store: UseResume }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { versions, activeId, resume, isDirty } = store;
  const activeLabel = versions.find((v) => v.id === activeId)?.label ?? activeId;
  const isSeed = SEED_IDS.has(activeId);

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const label = file.name.replace(/\.json$/i, '') || 'Imported';
      store.importResume(coerceResume(parsed), label);
    } catch {
      alert('Could not read that file. Make sure it is a valid resume JSON.');
    }
  };

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950/80 px-4 py-2.5 backdrop-blur print:hidden">
      <div className="mr-1 flex items-center gap-2">
        <span className="text-base font-bold tracking-tight text-white">Résumé Builder</span>
      </div>

      {/* Version switcher */}
      <div className="flex items-center gap-1.5">
        <select
          className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none"
          value={activeId}
          onChange={(e) => store.setActiveId(e.target.value)}
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        {isDirty && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
            ● modified
          </span>
        )}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          className={btn}
          onClick={() => {
            const label = prompt('Name for new (blank) version:', 'New Version');
            if (label) store.newVersion(label);
          }}
        >
          New
        </button>
        <button
          className={btn}
          onClick={() => {
            const label = prompt('Name for the duplicate:', `${activeLabel} copy`);
            if (label) store.duplicateVersion(label);
          }}
        >
          Duplicate
        </button>
        <button className={btn} disabled={!isDirty} onClick={() => store.resetToBaseline()}>
          Revert
        </button>
        <button
          className={btn}
          disabled={isSeed}
          title={isSeed ? 'Seed versions cannot be deleted' : 'Delete this version'}
          onClick={() => {
            if (confirm(`Delete version "${activeLabel}"? This cannot be undone.`)) store.deleteVersion();
          }}
        >
          Delete
        </button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button className={btn} onClick={() => fileRef.current?.click()}>
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
            e.target.value = '';
          }}
        />
        <button className={btn} onClick={() => download(`${activeId}.json`, resume)}>
          Export JSON
        </button>

        <button className={btnPrimary} onClick={() => window.print()}>
          ⬇ Export PDF
        </button>
      </div>
    </header>
  );
}
