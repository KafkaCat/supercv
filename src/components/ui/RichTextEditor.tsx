import React from 'react';
import ReactQuill from 'react-quill';
import { useResumeStore } from '../../store/useResumeStore';
import { Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  label?: string;
  className?: string;
}

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    ['clean']
  ],
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, label, className }) => {
  const { t } = useTranslation();
  const { openAIAnalysis } = useResumeStore();

  const handleEnhance = () => {
    // Strip HTML for analysis? Or keep it?
    // For simple regex analysis, stripping is safer to avoid breaking HTML.
    // But we want to preserve formatting.
    // Our simple analyzer just returns text.
    // If we replace text, we lose formatting.
    // For now, let's pass plain text for analysis, and if accepted, replace the whole thing.
    // To do it right, we should use a proper parser.
    // But for this "text" field enhancement, maybe we just pass raw HTML text?
    // The "simple heuristics" (regex) might break HTML tags if not careful.
    // Let's strip tags for analysis, but returning "Improved" text will be plain text.
    // The user can re-format. Or we try to keep tags.
    // Given it's a "grammar" check, usually applied to text content.
    // I'll extract text content using a temp div.
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (!textContent.trim()) return;

    openAIAnalysis(textContent, (newText) => {
        // When applying, we wrap in <p> or just return text?
        // ReactQuill expects HTML.
        // If we return plain text, we should probably wrap in <p>.
        onChange(`<p>${newText}</p>`);
    });
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex justify-between items-center">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        {value && value.length > 10 && (
          <button 
            onClick={handleEnhance}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1 rounded hover:bg-purple-50 transition-colors"
            title={t('ai.enhance')}
          >
            <Wand2 size={12} /> {t('ai.enhance')}
          </button>
        )}
      </div>
      <div className="bg-white rounded-md overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <ReactQuill 
          theme="snow" 
          value={value} 
          onChange={onChange} 
          modules={modules}
          className="resume-quill"
        />
      </div>
    </div>
  );
};
