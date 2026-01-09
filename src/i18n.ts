export const translations = {
  zh: {
    summary: '个人总结',
    education: '教育经历',
    experience: '工作经历',
    skills: '技能专长',
    phone: '电话',
    email: '邮箱',
    location: '地点',
    link: '链接',
    new_resume: '新简历',
    copy_suffix: ' (副本)'
  },
  en: {
    summary: 'SUMMARY',
    education: 'EDUCATION',
    experience: 'EXPERIENCE',
    skills: 'SKILLS',
    phone: 'Phone',
    email: 'Email',
    location: 'Location',
    link: 'Link',
    new_resume: 'New Resume',
    copy_suffix: ' (Copy)'
  }
};

export type Language = keyof typeof translations;
