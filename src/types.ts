export interface Resume {
  id: string;
  updatedAt: number;
  title: string;
  language: 'zh' | 'en';
  translationGroupId?: string;
  layout?: {
    fontSize: string;
    lineHeight: string;
    margin: string;
  };
  layoutByLanguage?: {
    zh?: Resume['layout'];
    en?: Resume['layout'];
  };
  profile: Profile;
  educations: Education[];
  experiences: Experience[];
  skills: SkillSection;
  customSections: CustomSection[];
}

export interface Profile {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  link?: string;
  summary?: string; // HTML content
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  description?: string; // HTML content
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description?: string; // HTML content
}

export interface SkillSection {
  content: string; // HTML content
}

export interface CustomSection {
  id: string;
  title: string;
  content: string; // HTML content
}
