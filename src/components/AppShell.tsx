import { useResume } from '../state/useResume';
import { Toolbar } from './Toolbar';
import { ResumeEditor } from './editor/ResumeEditor';
import { ResumePages } from './resume/ResumePages';

export function AppShell() {
  const store = useResume();

  return (
    <div className="flex h-screen flex-col bg-slate-950 print:h-auto print:bg-white">
      <Toolbar store={store} />

      <div className="flex min-h-0 flex-1 print:block">
        {/* Editor pane */}
        <div className="scroll-thin w-[44%] min-w-[360px] overflow-y-auto border-r border-slate-800 p-4 print:hidden">
          <ResumeEditor resume={store.resume} update={store.update} />
        </div>

        {/* Preview pane */}
        <div className="scroll-thin flex-1 overflow-y-auto bg-slate-800/40 p-6 print:overflow-visible print:bg-white print:p-0">
          <p className="mx-auto mb-3 max-w-[210mm] text-center text-xs text-slate-400 print:hidden">
            Live preview · click <span className="font-semibold text-sky-300">Export PDF</span> and
            choose <span className="font-semibold text-slate-200">“Save as PDF”</span>. Clean A4,
            no header/URL/timestamp, even margins on every page, and no block split across pages.
          </p>
          <ResumePages resume={store.resume} />
        </div>
      </div>
    </div>
  );
}
