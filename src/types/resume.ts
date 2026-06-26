export interface ExperienceEntry {
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  period: string;
}

export interface Resume {
  name: string;
  title: string;
  location: string;
  contact: {
    phone: string;
    email: string;
    links: string[];
  };
  about: string;
  experience: ExperienceEntry[];
  skills: SkillGroup[];
  education: EducationEntry[];
  certifications: string[];
  achievements: string[];
  languages: string[];
}

export interface ResumeVersion {
  id: string;
  label: string;
  resume: Resume;
}

export function emptyResume(): Resume {
  return {
    name: '',
    title: '',
    location: '',
    contact: { phone: '', email: '', links: [] },
    about: '',
    experience: [],
    skills: [],
    education: [],
    certifications: [],
    achievements: [],
    languages: [],
  };
}
