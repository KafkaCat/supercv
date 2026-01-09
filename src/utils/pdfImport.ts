import { Resume, Profile } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Use standard import which Vite handles better for worker files
import * as pdfjsLib from 'pdfjs-dist';

// Use a direct path to the public worker file we copied
// This avoids dynamic import issues in Vite dev mode
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export const extractTextFromPdf = async (file: File): Promise<string> => {
  console.log('Starting PDF extraction for:', file.name);
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load document with CMap configuration for Chinese character support
    // Use standard CDN URL for CMaps to avoid local path issues in production/preview
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    console.log(`PDF loaded, pages: ${pdf.numPages}`);
    
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str || '') // Handle items without str (like marks)
        .join(' ');
        
      fullText += pageText + '\n';
    }

    console.log('Extraction complete, text length:', fullText.length);
    if (fullText.length < 50) {
        console.warn('Extracted text is very short, might be an image PDF or encoding issue.');
    }
    return fullText;
  } catch (error) {
    console.error('Error in extractTextFromPdf:', error);
    throw error;
  }
};

export const parseResumeFromText = (text: string): Partial<Resume> => {
  console.log('Parsing text content...');
  const profile: Partial<Profile> = {};
  
  // Basic Regex Patterns
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  // Enhanced phone regex for more formats
  const phoneRegex = /(\+?86)?(1[3-9]\d{9})|(\d{3,4}-\d{7,8})|(\d{3}-\d{4}-\d{4})/; 
  const linkRegex = /(https?:\/\/[^\s]+)|(github\.com\/[^\s]+)|(linkedin\.com\/in\/[^\s]+)/i;
  
  // Extract Email
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    profile.email = emailMatch[0];
  }

  // Extract Phone
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    profile.phone = phoneMatch[0];
  }

  // Extract Link
  const linkMatch = text.match(linkRegex);
  if (linkMatch) {
    profile.link = linkMatch[0];
  }

  // Attempt to guess name (very naive: first non-empty line usually)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    // Iterate first few lines to find something that looks like a name (short, no numbers)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        if (line.length > 1 && line.length < 20 && !/\d/.test(line) && !line.includes('@')) {
            profile.fullName = line;
            break;
        }
    }
  }

  // Keywords for language detection
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const detectedLanguage = hasChinese ? 'zh' : 'en';

  // Keyword matching for skills (Enhanced)
  const skillKeywords = [
      'Java', 'Python', 'React', 'Vue', 'Node.js', 'JavaScript', 'TypeScript', 'SQL', 'Docker', 'AWS', 'Go', 'C++',
      'HTML', 'CSS', 'Git', 'Linux', 'Spring', 'Django', 'Flask', 'Kubernetes'
  ];
  const skillsMatch = text.match(new RegExp(`(${skillKeywords.join('|').replace(/\+/g, '\\+')})`, 'gi'));
  const uniqueSkills = skillsMatch ? Array.from(new Set(skillsMatch)).join(', ') : '';

  // Try to find summary/intro
  // Naive: look for "Summary" or "个人总结"
  // ... (Implementing robust section parsing is complex, we stick to basic extraction for now)

  return {
    id: uuidv4(),
    updatedAt: Date.now(),
    title: `导入的简历 (${new Date().toLocaleDateString()})`,
    language: detectedLanguage,
    profile: profile as Profile,
    educations: [], 
    experiences: [],
    skills: { content: uniqueSkills ? `<p>${hasChinese ? '自动提取技能' : 'Extracted Skills'}: ${uniqueSkills}</p>` : '' },
    customSections: []
  };
};
