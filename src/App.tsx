import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { ResumePages } from './components/resume/ResumePages';
import type { Resume } from './types/resume';

/**
 * Bare print view used by the headless-Chrome PDF renderer:
 * fetches a saved resume by id and renders only the A4 sheets.
 */
function PrintView({ id }: { id: string }) {
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    fetch(`/api/resume?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data: Resume) => setResume(data))
      .catch(() => setResume(null));
  }, [id]);

  if (!resume) return null;
  return <ResumePages resume={resume} />;
}

export default function App() {
  const printId = new URLSearchParams(window.location.search).get('print');
  if (printId) return <PrintView id={printId} />;
  return <AppShell />;
}
