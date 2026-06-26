import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Resume, ResumeVersion } from '../types/resume';
import { emptyResume } from '../types/resume';
import { seedVersions } from '../data/resumes';

const LS_VERSIONS = 'resume:versions'; // user-created version metadata
const LS_ACTIVE = 'resume:active';
const wkKey = (id: string) => `resume:working:${id}`;
const baseKey = (id: string) => `resume:baseline:${id}`;

interface VersionMeta {
  id: string;
  label: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'version';
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export interface UseResume {
  versions: ResumeVersion[];
  activeId: string;
  resume: Resume;
  isDirty: boolean;
  setActiveId: (id: string) => void;
  update: (updater: (draft: Resume) => void) => void;
  resetToBaseline: () => void;
  newVersion: (label: string) => void;
  duplicateVersion: (label: string) => void;
  renameVersion: (label: string) => void;
  deleteVersion: () => void;
  importResume: (resume: Resume, label: string) => void;
  markSaved: () => void;
}

export function useResume(): UseResume {
  // Merge seed versions with user-created ones; seeds always present.
  const [userMeta, setUserMeta] = useState<VersionMeta[]>(
    () => read<VersionMeta[]>(LS_VERSIONS) ?? [],
  );

  const seedIds = useMemo(() => new Set(seedVersions.map((v) => v.id)), []);

  const baselineFor = useCallback(
    (id: string): Resume => {
      // A stored baseline (written on Save) overrides the build-time seed.
      const stored = read<Resume>(baseKey(id));
      if (stored) return stored;
      const seed = seedVersions.find((v) => v.id === id);
      if (seed) return clone(seed.resume);
      return emptyResume();
    },
    [],
  );

  const workingFor = useCallback(
    (id: string): Resume => read<Resume>(wkKey(id)) ?? baselineFor(id),
    [baselineFor],
  );

  const allMeta = useMemo<VersionMeta[]>(() => {
    const seeds = seedVersions.map((v) => ({ id: v.id, label: v.label }));
    return [...seeds, ...userMeta.filter((m) => !seedIds.has(m.id))];
  }, [userMeta, seedIds]);

  const [activeId, setActiveIdState] = useState<string>(() => {
    const saved = read<string>(LS_ACTIVE);
    const ids = new Set([...seedVersions.map((v) => v.id), ...(read<VersionMeta[]>(LS_VERSIONS) ?? []).map((m) => m.id)]);
    return saved && ids.has(saved) ? saved : seedVersions[0]?.id ?? '';
  });

  const [resume, setResume] = useState<Resume>(() => workingFor(activeId));

  // Persist active id.
  useEffect(() => write(LS_ACTIVE, activeId), [activeId]);

  // Persist working copy whenever it changes.
  useEffect(() => {
    if (activeId) write(wkKey(activeId), resume);
  }, [activeId, resume]);

  const setActiveId = useCallback(
    (id: string) => {
      setActiveIdState(id);
      setResume(workingFor(id));
    },
    [workingFor],
  );

  const update = useCallback((updater: (draft: Resume) => void) => {
    setResume((prev) => {
      const draft = clone(prev);
      updater(draft);
      return draft;
    });
  }, []);

  // Bumped when the stored baseline changes (e.g. after Save) so isDirty recomputes.
  const [baselineTick, setBaselineTick] = useState(0);
  const baseline = useMemo(
    () => baselineFor(activeId),
    [baselineFor, activeId, baselineTick],
  );
  const isDirty = useMemo(
    () => JSON.stringify(resume) !== JSON.stringify(baseline),
    [resume, baseline],
  );

  const resetToBaseline = useCallback(() => {
    setResume(baselineFor(activeId));
  }, [activeId, baselineFor]);

  // Record the current resume as the active version's baseline (clears "modified").
  const markSaved = useCallback(() => {
    write(baseKey(activeId), resume);
    setBaselineTick((t) => t + 1);
  }, [activeId, resume]);

  const uniqueId = useCallback(
    (label: string): string => {
      const taken = new Set(allMeta.map((m) => m.id));
      const base = slugify(label);
      let id = base;
      let n = 2;
      while (taken.has(id)) id = `${base}-${n++}`;
      return id;
    },
    [allMeta],
  );

  const createVersion = useCallback(
    (label: string, source: Resume) => {
      const id = uniqueId(label);
      const data = clone(source);
      write(baseKey(id), data);
      write(wkKey(id), data);
      const meta = { id, label };
      setUserMeta((prev) => {
        const next = [...prev, meta];
        write(LS_VERSIONS, next);
        return next;
      });
      setActiveIdState(id);
      setResume(data);
    },
    [uniqueId],
  );

  const newVersion = useCallback(
    (label: string) => createVersion(label, emptyResume()),
    [createVersion],
  );

  const duplicateVersion = useCallback(
    (label: string) => createVersion(label, resume),
    [createVersion, resume],
  );

  const importResume = useCallback(
    (incoming: Resume, label: string) => createVersion(label, incoming),
    [createVersion],
  );

  const renameVersion = useCallback(
    (label: string) => {
      if (seedIds.has(activeId)) return; // seed labels are fixed
      setUserMeta((prev) => {
        const next = prev.map((m) => (m.id === activeId ? { ...m, label } : m));
        write(LS_VERSIONS, next);
        return next;
      });
    },
    [activeId, seedIds],
  );

  const deleteVersion = useCallback(() => {
    if (seedIds.has(activeId)) return; // cannot delete seeds
    const removeId = activeId;
    localStorage.removeItem(wkKey(removeId));
    localStorage.removeItem(baseKey(removeId));
    setUserMeta((prev) => {
      const next = prev.filter((m) => m.id !== removeId);
      write(LS_VERSIONS, next);
      return next;
    });
    const fallback = seedVersions[0]?.id ?? '';
    setActiveIdState(fallback);
    setResume(workingFor(fallback));
  }, [activeId, seedIds, workingFor]);

  const versions = useMemo<ResumeVersion[]>(
    () => allMeta.map((m) => ({ id: m.id, label: m.label, resume: workingFor(m.id) })),
    [allMeta, workingFor],
  );

  return {
    versions,
    activeId,
    resume,
    isDirty,
    setActiveId,
    update,
    resetToBaseline,
    newVersion,
    duplicateVersion,
    renameVersion,
    deleteVersion,
    importResume,
    markSaved,
  };
}
