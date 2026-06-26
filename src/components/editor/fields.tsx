import type { ReactNode } from 'react';

const inputBase =
  'w-full rounded-md border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-sm text-slate-100 ' +
  'placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className={inputBase}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className={inputBase + ' resize-y leading-relaxed'}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function IconButton({
  onClick,
  title,
  children,
  danger,
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={
        'inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm transition ' +
        (danger
          ? 'border-rose-900/60 text-rose-300 hover:bg-rose-950/60'
          : 'border-slate-700 text-slate-300 hover:bg-slate-800')
      }
    >
      {children}
    </button>
  );
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-sky-600 hover:text-sky-300"
    >
      <span className="text-base leading-none">+</span> {label}
    </button>
  );
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-200">{title}</h3>
      {children}
    </section>
  );
}
