import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AddButton } from './fields';

interface Props {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel: string;
}

const rowInput =
  'min-h-[34px] flex-1 resize-none overflow-hidden rounded-md border border-slate-700 bg-slate-900/60 ' +
  'px-2.5 py-1.5 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 ' +
  'focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40';

/** Single-line textarea that grows with its content. */
function AutoGrowTextArea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  inputRef: (el: HTMLTextAreaElement | null) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        inputRef(el);
      }}
      className={rowInput}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
    />
  );
}

/**
 * Edits a string[] as individual rows: drag to reorder, Enter to add the next
 * item, Backspace on an empty row to remove it. Replaces the old
 * "one item per newline" textarea pattern.
 */
export function ListEditor({ items, onChange, placeholder, addLabel }: Props) {
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [grabbing, setGrabbing] = useState<number | null>(null);

  useEffect(() => {
    if (focusIndex === null) return;
    refs.current[focusIndex]?.focus();
    setFocusIndex(null);
  }, [focusIndex, items]);

  const setAt = (i: number, v: string) => {
    const next = items.slice();
    next[i] = v;
    onChange(next);
  };

  const insertAfter = (i: number) => {
    const next = items.slice();
    next.splice(i + 1, 0, '');
    onChange(next);
    setFocusIndex(i + 1);
  };

  const removeAt = (i: number) => {
    const next = items.slice();
    next.splice(i, 1);
    onChange(next);
    setFocusIndex(Math.max(0, i - 1));
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, i: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      insertAfter(i);
    } else if (e.key === 'Backspace' && items[i] === '' && items.length > 1) {
      e.preventDefault();
      removeAt(i);
    }
  };

  return (
    <div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            draggable={grabbing === i}
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => {
              e.preventDefault();
              if (overIndex !== i) setOverIndex(i);
            }}
            onDrop={() => {
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
              setOverIndex(null);
              setGrabbing(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
              setGrabbing(null);
            }}
            className={
              'flex items-start gap-1.5 rounded-md ' +
              (dragIndex !== null && overIndex === i && dragIndex !== i
                ? 'ring-1 ring-sky-500/60'
                : '') +
              (dragIndex === i ? ' opacity-50' : '')
            }
          >
            <button
              type="button"
              title="Drag to reorder"
              aria-label="Drag to reorder"
              onMouseDown={() => setGrabbing(i)}
              onMouseUp={() => setGrabbing(null)}
              className="mt-0.5 flex h-7 w-5 cursor-grab items-center justify-center text-slate-500 hover:text-slate-300 active:cursor-grabbing"
            >
              ⠿
            </button>
            <AutoGrowTextArea
              value={item}
              placeholder={placeholder}
              onChange={(v) => setAt(i, v)}
              onKeyDown={(e) => onKeyDown(e, i)}
              inputRef={(el) => (refs.current[i] = el)}
            />
            <button
              type="button"
              title="Remove"
              aria-label="Remove item"
              onClick={() => removeAt(i)}
              className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-rose-900/60 text-sm text-rose-300 transition hover:bg-rose-950/60"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <AddButton
        label={addLabel}
        onClick={() => {
          onChange([...items, '']);
          setFocusIndex(items.length);
        }}
      />
    </div>
  );
}
