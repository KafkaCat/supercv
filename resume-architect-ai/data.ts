import { ResumeData, VersionLog } from './types';

const DEFAULT_LAYOUT = {
  fontSize: 10.5,
  lineHeight: 1.5,
  margin: 40,
  fontFamily: 'sans' as const
};

export const INITIAL_DATA_EN: ResumeData = {
  language: 'en',
  layout: DEFAULT_LAYOUT,
  order: ['header', 'summary', 'experience', 'projects', 'education', 'skills'],
  sections: {
    header: {
      id: 'header',
      type: 'header',
      title: 'ALEXANDER RIVERA',
      content: 'Senior Product Designer & UI Architect',
      contacts: [
        { type: 'email', value: 'alex@rivera.design', icon: 'email' },
        { type: 'website', value: 'rivera.design', icon: 'public' },
        { type: 'location', value: 'San Francisco, CA', icon: 'location_on' },
      ]
    },
    summary: {
      id: 'summary',
      type: 'summary',
      title: 'Professional Summary',
      content: 'Results-oriented Product Designer with over 8 years of experience in creating intuitive digital experiences. Expert in user-centered design principles, rapid prototyping, and cross-functional collaboration. Proven track record of delivering high-impact solutions for enterprise-level clients and leading design teams to success.'
    },
    experience: {
      id: 'experience',
      type: 'experience',
      title: 'Experience',
      items: [
        {
          id: 'exp-1',
          title: 'Lead Product Designer',
          subtitle: 'TechFlow Solutions',
          date: '2021 — Present',
          location: 'San Francisco, CA',
          description: [
            'Spearheaded the redesign of the core SaaS platform, resulting in a 35% increase in user retention.',
            'Established a comprehensive design system that reduced development handoff time by 20%.',
            'Led a cross-functional team of 8 designers to launch the mobile application (v2.0) across iOS and Android.',
            'Conducted user research and usability testing to validate design decisions and improve product-market fit.'
          ]
        },
        {
          id: 'exp-2',
          title: 'Senior UI/UX Designer',
          subtitle: 'Creative Pulse Agency',
          date: '2018 — 2021',
          location: 'New York, NY',
          description: [
            'Designed award-winning marketing websites for Fortune 500 clients including Nike and Spotify.',
            'Mentored junior designers and implemented a new collaborative workflow using Figma.',
            'Increased conversion rates by 15% for e-commerce clients through A/B testing and checkout optimization.'
          ]
        }
      ]
    },
    projects: {
      id: 'projects',
      type: 'projects',
      title: 'Key Projects',
      items: [
        {
          id: 'proj-1',
          title: 'EcoTrack Mobile App',
          subtitle: 'Sustainability Tracking Platform',
          date: '2023',
          description: [
            'Conceptualized and designed a mobile app helping users track their carbon footprint.',
            'Achieved 50k+ downloads in the first month with a 4.8-star rating on the App Store.'
          ]
        },
        {
          id: 'proj-2',
          title: 'FinDash Design System',
          subtitle: 'Internal Financial Dashboard',
          date: '2022',
          description: [
            'Built a scalable design system for a complex financial data visualization tool.',
            'Standardized 50+ components ensuring consistency across 12 different product modules.'
          ]
        }
      ]
    },
    education: {
      id: 'education',
      type: 'education',
      title: 'Education',
      items: [
        {
          id: 'edu-1',
          title: 'Master of Interaction Design',
          subtitle: 'California College of the Arts',
          date: '2016 — 2018',
          location: 'San Francisco, CA'
        },
        {
          id: 'edu-2',
          title: 'B.F.A. in Graphic Design',
          subtitle: 'Rhode Island School of Design',
          date: '2012 — 2016',
          location: 'Providence, RI'
        }
      ]
    },
    skills: {
      id: 'skills',
      type: 'skills',
      title: 'Expertise',
      items: [
        {
          id: 'skill-1',
          title: 'Design',
          tags: ['UI/UX Design', 'Prototyping', 'Visual Design', 'Interaction Design', 'User Research', 'Wireframing']
        },
        {
          id: 'skill-2',
          title: 'Tools',
          tags: ['Figma', 'Adobe CC', 'Webflow', 'Principle', 'Jira', 'Notion', 'HTML/CSS']
        }
      ]
    }
  }
};

// Initial logs with snapshots for restore functionality
export const MOCK_HISTORY_LOGS: VersionLog[] = [
  {
    id: 'current',
    title: 'Current Draft',
    timestamp: 'Just now',
    author: 'You',
    isActive: true,
    color: 'bg-green-500',
    details: 'Latest edits to TechFlow Solutions experience.',
    snapshot: JSON.parse(JSON.stringify(INITIAL_DATA_EN))
  },
  {
    id: 'v-update-1',
    title: 'Experience Refinement',
    timestamp: 'Today, 14:22',
    author: 'Alexander R.',
    isActive: false,
    color: 'bg-blue-400',
    details: 'Updated team size metrics and specific outcomes.',
    snapshot: JSON.parse(JSON.stringify(INITIAL_DATA_EN)), // In real app this would be different
    diff: [
      {
        sectionTitle: 'Experience',
        changes: [
          { type: 'unchanged', value: 'Established a comprehensive design system that reduced development handoff time by 20%.' },
          { type: 'removed', value: 'Led a cross-functional team of 5 designers...' },
          { type: 'added', value: 'Led a cross-functional team of 8 designers to launch the mobile application (v2.0) across iOS and Android.' },
        ]
      }
    ]
  },
  {
    id: 'v-init',
    title: 'Initial Generation',
    timestamp: 'Yesterday',
    author: 'System',
    isActive: false,
    color: 'bg-slate-400',
    details: 'Generated from Job Description.',
    snapshot: JSON.parse(JSON.stringify(INITIAL_DATA_EN)) // In real app this would be initial state
  }
];