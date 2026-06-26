import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Resume } from '../../types/resume';
import { buildResumeBlocks } from './blocks';
import './resume.css';

const PX_PER_MM = 96 / 25.4;
// A4 content height = 297mm minus top+bottom margins (14mm each), minus a small
// safety margin so a block is never packed right up to the page edge.
const PAGE_CONTENT_MM = 297 - 14 * 2 - 6;
const PAGE_BUDGET_PX = PAGE_CONTENT_MM * PX_PER_MM;

/**
 * Renders the résumé as real A4 sheets. Blocks are measured off-screen and
 * packed whole into pages (never split). Each sheet carries its own margins as
 * padding, and the print CSS uses `@page { margin: 0 }`, so Chrome prints no
 * header/footer (date, URL, page number) and every page keeps its border.
 */
export function ResumePages({ resume }: { resume: Resume }) {
  const blocks = useMemo(() => buildResumeBlocks(resume), [resume]);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>(() => [blocks.map((_, i) => i)]);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) {
      setPages([]);
      return;
    }

    const result: number[][] = [];
    let current: number[] = [];
    let pageTop = children[0].offsetTop;

    children.forEach((child, i) => {
      const bottom = child.offsetTop + child.offsetHeight;
      if (current.length > 0 && bottom - pageTop > PAGE_BUDGET_PX) {
        result.push(current);
        current = [];
        pageTop = child.offsetTop;
      }
      current.push(i);
    });
    if (current.length > 0) result.push(current);

    // Avoid pointless re-render churn if assignment is unchanged.
    setPages((prev) =>
      JSON.stringify(prev) === JSON.stringify(result) ? prev : result,
    );
  }, [blocks]);

  return (
    <>
      {/* Off-screen measurer: same content width as a page's text column. */}
      <div ref={measureRef} className="resume resume--measure" aria-hidden="true">
        {blocks.map((b) => (
          <div className="resume__block" key={b.key}>
            {b.node}
          </div>
        ))}
      </div>

      {/* Visible / printable A4 sheets. */}
      <div className="resume-pages">
        {pages.map((idxs, p) => (
          <article className="resume resume-page" key={p}>
            {idxs.map((i) => (
              <div className="resume__block" key={blocks[i].key}>
                {blocks[i].node}
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}
