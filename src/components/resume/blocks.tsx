import type { ReactNode } from 'react';
import type { ExperienceEntry, Resume } from '../../types/resume';

export interface ResumeBlock {
  key: string;
  node: ReactNode;
}

function Job({ job }: { job: ExperienceEntry }) {
  return (
    <div className="resume__job">
      <div className="resume__job-head">
        <h3 className="resume__role">
          {job.role}
          {job.company && (
            <>
              {', '}
              <span className="resume__role-company">{job.company}</span>
            </>
          )}
        </h3>
        {(job.start || job.end) && (
          <span className="resume__dates">{[job.start, job.end].filter(Boolean).join(' - ')}</span>
        )}
      </div>
      {job.location && <p className="resume__job-sub">{job.location}</p>}
      {job.bullets.filter(Boolean).length > 0 && (
        <ul className="resume__bullets">
          {job.bullets.filter(Boolean).map((b, j) => (
            <li key={j}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Flatten a résumé into ordered, atomic blocks. Each block is kept whole on a
 * page (never split). The Experience heading is bundled with the first role so
 * it never sits alone at a page bottom.
 */
export function buildResumeBlocks(r: Resume): ResumeBlock[] {
  const blocks: ResumeBlock[] = [];
  const contactParts = [r.contact.phone, r.contact.email, ...r.contact.links].filter(Boolean);

  // Header (always first, page 1 only by construction)
  blocks.push({
    key: 'header',
    node: (
      <header>
        <h1 className="resume__name">{r.name || 'Your Name'}</h1>
        {r.title && <p className="resume__title">{r.title}</p>}
        <p className="resume__contact">
          {r.location && <span>{r.location}</span>}
          {contactParts.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </p>
        <hr className="resume__rule" />
      </header>
    ),
  });

  if (r.about) {
    blocks.push({
      key: 'summary',
      node: (
        <section className="resume__section">
          <h2 className="resume__h2">Summary</h2>
          <p className="resume__about">{r.about}</p>
        </section>
      ),
    });
  }

  if (r.experience.length > 0) {
    // First experience block carries the section heading + first role.
    blocks.push({
      key: 'exp-head',
      node: (
        <section className="resume__section">
          <h2 className="resume__h2">Experience</h2>
          <Job job={r.experience[0]} />
        </section>
      ),
    });
    // Remaining roles are individual blocks.
    r.experience.slice(1).forEach((job, i) => {
      blocks.push({ key: `exp-${i + 1}`, node: <Job job={job} /> });
    });
  }

  if (r.skills.length > 0) {
    blocks.push({
      key: 'skills',
      node: (
        <section className="resume__section">
          <h2 className="resume__h2">Skills</h2>
          <div className="resume__skills">
            {r.skills.map((g, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <span className="resume__skill-cat">{g.category}:</span>
                <span className="resume__skill-items">{g.items.filter(Boolean).join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      ),
    });
  }

  if (r.education.length > 0) {
    blocks.push({
      key: 'education',
      node: (
        <section className="resume__section">
          <h2 className="resume__h2">Education</h2>
          {r.education.map((e, i) => (
            <p className="resume__edu" key={i}>
              <span className="resume__edu-degree">{e.degree}</span>
              {e.institution && `, ${e.institution}`}
              {e.period && ` | ${e.period}`}
            </p>
          ))}
        </section>
      ),
    });
  }

  if (r.certifications.filter(Boolean).length > 0) {
    blocks.push({
      key: 'certifications',
      node: (
        <section className="resume__section">
          <h2 className="resume__h2">Certifications</h2>
          <p className="resume__inline-csv">{r.certifications.filter(Boolean).join(' · ')}</p>
        </section>
      ),
    });
  }

  if (r.achievements.filter(Boolean).length > 0) {
    blocks.push({
      key: 'achievements',
      node: (
        <section className="resume__section">
          <h2 className="resume__h2">Achievements</h2>
          <ul className="resume__bullets">
            {r.achievements.filter(Boolean).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      ),
    });
  }

  if (r.languages.filter(Boolean).length > 0) {
    blocks.push({
      key: 'languages',
      node: (
        <section className="resume__section">
          <h2 className="resume__h2">Languages</h2>
          <p className="resume__inline-csv">{r.languages.filter(Boolean).join(' · ')}</p>
        </section>
      ),
    });
  }

  return blocks;
}
