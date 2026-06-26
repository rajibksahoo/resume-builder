import type { Resume } from '../../types/resume';
import {
  AddButton,
  Field,
  IconButton,
  SectionCard,
  TextArea,
  TextInput,
} from './fields';
import { ListEditor } from './ListEditor';

interface Props {
  resume: Resume;
  update: (updater: (draft: Resume) => void) => void;
}

export function ResumeEditor({ resume, update }: Props) {
  return (
    <div className="space-y-4">
      {/* Header / identity */}
      <SectionCard title="Header">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <TextInput value={resume.name} onChange={(v) => update((d) => (d.name = v))} />
          </Field>
          <Field label="Title">
            <TextInput value={resume.title} onChange={(v) => update((d) => (d.title = v))} />
          </Field>
          <Field label="Location">
            <TextInput value={resume.location} onChange={(v) => update((d) => (d.location = v))} />
          </Field>
          <Field label="Phone">
            <TextInput
              value={resume.contact.phone}
              onChange={(v) => update((d) => (d.contact.phone = v))}
            />
          </Field>
          <Field label="Email">
            <TextInput
              value={resume.contact.email}
              onChange={(v) => update((d) => (d.contact.email = v))}
            />
          </Field>
          <Field label="Links">
            <ListEditor
              items={resume.contact.links}
              onChange={(items) => update((d) => (d.contact.links = items))}
              placeholder="linkedin.com/in/you"
              addLabel="Add link"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Summary */}
      <SectionCard title="Summary">
        <TextArea
          rows={5}
          value={resume.about}
          onChange={(v) => update((d) => (d.about = v))}
          placeholder="2-4 sentence professional summary"
        />
      </SectionCard>

      {/* Experience */}
      <SectionCard title="Experience">
        <div className="space-y-4">
          {resume.experience.map((job, i) => (
            <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Role {i + 1}</span>
                <div className="flex gap-1">
                  <IconButton
                    title="Move up"
                    onClick={() =>
                      update((d) => {
                        if (i > 0)
                          [d.experience[i - 1], d.experience[i]] = [d.experience[i], d.experience[i - 1]];
                      })
                    }
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    title="Move down"
                    onClick={() =>
                      update((d) => {
                        if (i < d.experience.length - 1)
                          [d.experience[i + 1], d.experience[i]] = [d.experience[i], d.experience[i + 1]];
                      })
                    }
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    danger
                    title="Remove role"
                    onClick={() => update((d) => d.experience.splice(i, 1))}
                  >
                    ✕
                  </IconButton>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Role">
                  <TextInput value={job.role} onChange={(v) => update((d) => (d.experience[i].role = v))} />
                </Field>
                <Field label="Company">
                  <TextInput
                    value={job.company}
                    onChange={(v) => update((d) => (d.experience[i].company = v))}
                  />
                </Field>
                <Field label="Location">
                  <TextInput
                    value={job.location}
                    onChange={(v) => update((d) => (d.experience[i].location = v))}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Start">
                    <TextInput
                      value={job.start}
                      onChange={(v) => update((d) => (d.experience[i].start = v))}
                    />
                  </Field>
                  <Field label="End">
                    <TextInput
                      value={job.end}
                      onChange={(v) => update((d) => (d.experience[i].end = v))}
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-3">
                <Field label="Bullets">
                  <ListEditor
                    items={job.bullets}
                    onChange={(items) => update((d) => (d.experience[i].bullets = items))}
                    placeholder="Describe an achievement or responsibility"
                    addLabel="Add bullet"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <AddButton
          label="Add role"
          onClick={() =>
            update((d) =>
              d.experience.push({
                role: '',
                company: '',
                location: '',
                start: '',
                end: '',
                bullets: [''],
              }),
            )
          }
        />
      </SectionCard>

      {/* Skills */}
      <SectionCard title="Skills">
        <div className="space-y-3">
          {resume.skills.map((g, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[180px_1fr]">
                <TextInput
                  value={g.category}
                  placeholder="Category"
                  onChange={(v) => update((d) => (d.skills[i].category = v))}
                />
                <TextInput
                  value={g.items.join(', ')}
                  placeholder="Comma, separated, items"
                  onChange={(v) =>
                    update((d) => (d.skills[i].items = v.split(',').map((s) => s.trim())))
                  }
                />
              </div>
              <IconButton danger title="Remove" onClick={() => update((d) => d.skills.splice(i, 1))}>
                ✕
              </IconButton>
            </div>
          ))}
        </div>
        <AddButton
          label="Add skill group"
          onClick={() => update((d) => d.skills.push({ category: '', items: [] }))}
        />
      </SectionCard>

      {/* Education */}
      <SectionCard title="Education">
        <div className="space-y-3">
          {resume.education.map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="grid flex-1 grid-cols-1 gap-2">
                <TextInput
                  value={e.degree}
                  placeholder="Degree"
                  onChange={(v) => update((d) => (d.education[i].degree = v))}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px]">
                  <TextInput
                    value={e.institution}
                    placeholder="Institution"
                    onChange={(v) => update((d) => (d.education[i].institution = v))}
                  />
                  <TextInput
                    value={e.period}
                    placeholder="Period"
                    onChange={(v) => update((d) => (d.education[i].period = v))}
                  />
                </div>
              </div>
              <IconButton danger title="Remove" onClick={() => update((d) => d.education.splice(i, 1))}>
                ✕
              </IconButton>
            </div>
          ))}
        </div>
        <AddButton
          label="Add education"
          onClick={() => update((d) => d.education.push({ degree: '', institution: '', period: '' }))}
        />
      </SectionCard>

      {/* Simple list sections */}
      <SectionCard title="Certifications">
        <ListEditor
          items={resume.certifications}
          onChange={(items) => update((d) => (d.certifications = items))}
          placeholder="Certification name"
          addLabel="Add certification"
        />
      </SectionCard>

      <SectionCard title="Achievements">
        <ListEditor
          items={resume.achievements}
          onChange={(items) => update((d) => (d.achievements = items))}
          placeholder="Achievement"
          addLabel="Add achievement"
        />
      </SectionCard>

      <SectionCard title="Languages">
        <ListEditor
          items={resume.languages}
          onChange={(items) => update((d) => (d.languages = items))}
          placeholder="Language"
          addLabel="Add language"
        />
      </SectionCard>
    </div>
  );
}
