import { Resume, Profile, Education, Experience } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';

// Use standard import which Vite handles better for worker files
import * as pdfjsLib from 'pdfjs-dist';

// Use a base-aware path to the public worker file to support subpath deployments.
const normalizeBaseUrl = (base: string) => (base.endsWith('/') ? base : `${base}/`);
const assetBaseUrl = normalizeBaseUrl(import.meta.env.BASE_URL || '/');
pdfjsLib.GlobalWorkerOptions.workerSrc = `${assetBaseUrl}pdf.worker.min.mjs`;

const getDocumentWithLocalCMaps = (data: ArrayBuffer) => {
  return pdfjsLib.getDocument({
    data,
    // Use local CMaps so import works without network access.
    cMapUrl: `${assetBaseUrl}cmaps/`,
    cMapPacked: true,
  }).promise;
};

const performOCR = async (pdf: any): Promise<string> => {
    console.log('Starting OCR fallback...');
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (!context) continue;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Convert canvas to blob/url
            const dataUrl = canvas.toDataURL('image/png');
            
            console.log(`OCR processing page ${i}...`);
            const result = await Tesseract.recognize(
                dataUrl,
                'eng+chi_sim', // Support English and Simplified Chinese
                { 
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`OCR Progress (Page ${i}):`, Math.round(m.progress * 100) + '%');
                        }
                    },
                    errorHandler: (err) => console.error('Tesseract Error:', err)
                }
            );
            
            fullText += result.data.text + '\n';
        } catch (e) {
            console.error(`Error processing page ${i} for OCR:`, e);
        }
    }
    return fullText;
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  console.log('Starting PDF extraction for:', file.name);
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load document with local CMaps for consistent offline behavior.
    const pdf = await getDocumentWithLocalCMaps(arrayBuffer);
    console.log(`PDF loaded, pages: ${pdf.numPages}`);
    
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => {
          if (!item.str) return '';
          // If the item has EOL or ends with space, we might not need to add space
          // But for simplicity, we join with space and then normalize spaces later
          return item.str;
        })
        .join(' ');
        
      console.log(`Page ${i} text length: ${pageText.length}`);
      if (pageText.length > 0) {
        console.log('Sample text:', pageText.substring(0, 50));
      }
        
      fullText += pageText + '\n';
    }

    // Post-process to remove excessive spaces
    // Normalize spaces: replace multiple spaces with single space, but keep newlines
    fullText = fullText.replace(/[ \t]+/g, ' ').trim();

    console.log('Extraction complete, text length:', fullText.length);
    console.log('Full extracted text for debugging:', fullText);
    
    // If text extraction failed (empty or very short), try OCR
    if (fullText.length < 50) {
        console.warn('Text extraction minimal or empty. Attempting OCR fallback...');
        try {
            const ocrText = await performOCR(pdf);
            if (ocrText.trim().length > fullText.length) {
                console.log('OCR successful, text length:', ocrText.length);
                console.log('Full OCR text for debugging:', ocrText);
                return ocrText.replace(/[ \t]+/g, ' ').trim();
            }
        } catch (ocrError) {
            console.error('OCR failed:', ocrError);
            // If OCR fails, we return the original (likely empty) text and let the caller handle the error
        }
    }

    if (fullText.length === 0) {
        console.error('Text extraction resulted in empty string. PDF might be scanned or encrypted.');
    } else if (fullText.length < 50) {
        console.warn('Extracted text is very short, might be an image PDF or encoding issue.');
    }
    return fullText;
  } catch (error) {
    console.error('Error in extractTextFromPdf:', error);
    throw error;
  }
};

const cleanText = (text: string) => {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Fix common OCR issues
        .replace(/\|/g, 'I') // Pipe often confused with I
        .replace(/—/g, '-') // Em dash to hyphen
        .trim();
};

export const parseResumeFromText = (rawText: string, uiLanguage: 'en' | 'zh' = 'en'): Partial<Resume> => {
  console.log('Parsing text content...', { length: rawText.length, uiLanguage });
  const text = cleanText(rawText);
  
  const profile: Partial<Profile> = {};
  
  // Basic Regex Patterns
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  // Enhanced phone regex: Support +86, dashes, dots, spaces
  // Matches: 13812345678, +86 138..., 123-456-7890, 123.456.7890
  const phoneRegex = /(?:\+?86)?\s*1[3-9]\d{9}|(?:\d{3,4}[-.\s]\d{7,8})|(?:\d{3}[-.\s]\d{3}[-.\s]\d{4})/; 
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

  // Attempt to guess name
  // Strategy: Look at the first few lines. 
  // Exclude lines that are just email, phone, or very short/long.
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        // Name heuristics:
        // 1. Not an email
        // 2. Not a phone number
        // 3. Length reasonable (2-30 chars)
        // 4. Usually no numbers (unless OCR error)
        // 5. Not a common keyword (Resume, Curriculum Vitae)
        if (
            line.length > 1 && 
            line.length < 30 && 
            !line.includes('@') && 
            !/\d/.test(line) &&
            !/resume|curriculum|vitae|简历|个人/i.test(line)
        ) {
            profile.fullName = line;
            break;
        }
    }
  }

  // Keywords for language detection of CONTENT
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const detectedLanguage = hasChinese ? 'zh' : 'en';

  // Section Parsing
  // We try to identify blocks of text belonging to sections.
  const sections: Record<string, string> = {
      education: '',
      experience: '',
      skills: '',
      projects: ''
  };

  let currentSection = '';
  
  // Regex for section headers (case insensitive)
  const headerPatterns: Record<string, RegExp> = {
      education: /^(education|educational|academic|教育|学历|毕业院校)/i,
      experience: /^(experience|work|employment|career|job|工作|经历|履历|职业)/i,
      skills: /^(skills|technologies|technical|stack|技能|技术|专长)/i,
      projects: /^(projects|personal projects|项目|作品)/i
  };

  for (const line of lines) {
      let isHeader = false;
      for (const [section, pattern] of Object.entries(headerPatterns)) {
          // Check if line matches header pattern and is short (likely a title)
          if (pattern.test(line) && line.length < 50) {
              currentSection = section;
              isHeader = true;
              break;
          }
      }

      if (!isHeader && currentSection) {
          sections[currentSection] += line + '\n';
      }
  }

  // Helper to parse dates and identify company/school
  const parseGenericSection = (text: string): { items: any[] } => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const items: any[] = [];
    let currentItem: any = {};

    // Regex for Date Ranges: e.g. "2020.01 - 2021.02", "Sep 2020 - Present", "2020/01 - 2021/01"
    // Also matches just years: "2019 - 2021"
    const dateRegex = /((19|20)\d{2}|Present|Current|Now|至今)/i;
    const dateRangeRegex = /((19|20)\d{2}.*[-–to].*|Present|Current|Now|至今)/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Strategy: 
        // 1. Identify a date line. This usually marks the start of a new item OR the metadata of the current item.
        // 2. If we find a date, we look at the PREVIOUS line for the Title/Company if not yet set.
        
        const hasDate = dateRangeRegex.test(line);

        if (hasDate) {
            // If we already have a substantial item, push it
            if (currentItem.title || currentItem.subtitle) {
                items.push({ ...currentItem });
                currentItem = {};
            }
            
            currentItem.date = line;
            
            // Look backward for title/company
            if (i > 0) {
                const prevLine = lines[i-1];
                // Heuristic: If previous line is short and looks like a name
                if (prevLine.length < 100) {
                    currentItem.title = prevLine;
                }
            }
        } 
        else {
             // If no date, maybe it's the title (if we don't have one and it's short)
             // Special case: "Tonbo" (User feedback).
             // If we are at the start of the section (items.length === 0) and no title set, first line is title.
             if (!currentItem.title && items.length === 0 && i === 0 && line.length < 50) {
                 currentItem.title = line;
             }
             // If we already have a title, append to description
             else if (currentItem.title) {
                 currentItem.description = (currentItem.description || '') + `<p>${line}</p>`;
             }
             // If we don't have a title yet, but this line looks like one (short, capitalized?)
             // This is risky, might be description. 
             // Let's assume if we haven't found a date yet, lines are part of the title/subtitle.
             else if (!currentItem.title) {
                 // Buffer it? Or set as title?
                 // Let's set as title for now if empty
                 currentItem.title = line;
             }
        }
    }
    
    // Push last item
    if (currentItem.title || currentItem.date) {
        items.push(currentItem);
    }

    return { items };
  };

  // Parse Education
  const educations: Education[] = [];
  if (sections.education) {
      const parsed = parseGenericSection(sections.education);
      parsed.items.forEach(item => {
          educations.push({
              id: uuidv4(),
              school: item.title || 'Unknown School',
              degree: '',
              startDate: item.date || '',
              endDate: '',
              description: item.description || ''
          });
      });
      
      // Fallback if generic parsing failed to produce items but we have text
      if (educations.length === 0 && sections.education.trim()) {
           educations.push({
              id: uuidv4(),
              school: 'Extracted Education',
              degree: '',
              startDate: '',
              endDate: '',
              description: `<p>${sections.education.replace(/\n/g, '<br/>')}</p>`
          });
      }
  }

  // Parse Experience
  const experiences: Experience[] = [];
  if (sections.experience) {
      const parsed = parseGenericSection(sections.experience);
      parsed.items.forEach(item => {
          experiences.push({
              id: uuidv4(),
              company: item.title || 'Unknown Company',
              position: '', // Hard to distinguish company vs position without more context
              startDate: item.date || '',
              endDate: '',
              description: item.description || ''
          });
      });

      // Fallback
      if (experiences.length === 0 && sections.experience.trim()) {
          experiences.push({
              id: uuidv4(),
              company: 'Extracted Experience',
              position: '',
              startDate: '',
              endDate: '',
              description: `<p>${sections.experience.replace(/\n/g, '<br/>')}</p>`
          });
      }
  }

  // Keyword matching for skills (Enhanced)
  const skillKeywords = [
      'Java', 'Python', 'React', 'Vue', 'Node.js', 'JavaScript', 'TypeScript', 'SQL', 'Docker', 'AWS', 'Go', 'C++',
      'HTML', 'CSS', 'Git', 'Linux', 'Spring', 'Django', 'Flask', 'Kubernetes', 'Redis', 'MongoDB',
      'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS', 'C#', '.NET', 'PHP', 'Ruby', 'Rust',
      'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'NLP', 'CV'
  ];
  // Case insensitive match
  const skillsMatch = text.match(new RegExp(`\\b(${skillKeywords.join('|').replace(/\+/g, '\\+')})\\b`, 'gi'));
  // Normalize case (e.g. java -> Java) by mapping back to original list if possible
  const normalizedSkills = skillsMatch ? Array.from(new Set(
      skillsMatch.map(s => {
          const original = skillKeywords.find(k => k.toLowerCase() === s.toLowerCase());
          return original || s;
      })
  )).join(', ') : '';
  
  const skillContent = sections.skills 
      ? `<p>${sections.skills.replace(/\n/g, '<br/>')}</p>` 
      : (normalizedSkills ? `<p>${hasChinese ? '自动提取技能' : 'Extracted Skills'}: ${normalizedSkills}</p>` : '');

  // Parse Projects into Custom Section
  const customSections: any[] = [];
  if (sections.projects && sections.projects.trim()) {
      const parsedProjects = parseGenericSection(sections.projects);
      let projectContent = '';
      
      if (parsedProjects.items.length > 0) {
          parsedProjects.items.forEach(item => {
              projectContent += `<p><strong>${item.title || 'Project'}</strong> ${item.date ? `(${item.date})` : ''}</p>`;
              if (item.description) {
                  projectContent += `${item.description}`;
              }
          });
      } else {
          projectContent = `<p>${sections.projects.replace(/\n/g, '<br/>')}</p>`;
      }

      customSections.push({
          id: uuidv4(),
          title: uiLanguage === 'zh' ? '项目经历' : 'Projects',
          content: projectContent
      });
  }

  // Default Title based on UI Language
  const defaultTitle = uiLanguage === 'zh' 
      ? `导入的简历 (${new Date().toLocaleDateString()})` 
      : `Imported Resume (${new Date().toLocaleDateString()})`;

  return {
    id: uuidv4(),
    updatedAt: Date.now(),
    title: defaultTitle,
    language: detectedLanguage,
    profile: profile as Profile,
    educations: educations, 
    experiences: experiences,
    skills: { content: skillContent },
    customSections: customSections
  };
};
