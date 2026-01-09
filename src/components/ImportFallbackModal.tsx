import React, { useState } from 'react';
import { X, Clipboard, ArrowRight } from 'lucide-react';
import { parseResumeFromText } from '../utils/pdfImport';
import { useResumeStore } from '../store/useResumeStore';

interface ImportFallbackModalProps {
  onClose: () => void;
  initialText?: string;
}

export const ImportFallbackModal: React.FC<ImportFallbackModalProps> = ({ onClose, initialText = '' }) => {
  const [text, setText] = useState(initialText);
  const { currentResume, setResume } = useResumeStore();

  const handleParse = () => {
    if (!text.trim()) return;
    
    try {
      const partialResume = parseResumeFromText(text);
      const newResume = {
        ...currentResume,
        ...partialResume,
        // Preserve some existing IDs if needed, but usually we want to overwrite with new data
        // Here we do a smart merge: keep old ID but take new content
        id: currentResume.id,
        updatedAt: Date.now(),
        profile: { ...currentResume.profile, ...partialResume.profile }
      };
      
      setResume(newResume as any);
      alert('已根据输入内容提取信息。');
      onClose();
    } catch (e) {
      alert('解析出错，请重试');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Clipboard size={20} className="text-blue-600"/> 
            手动提取内容
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-1 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-hidden flex flex-col gap-2">
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            自动导入似乎遇到了问题（或内容不完整）。您可以直接将简历文本粘贴到下方，我们将尝试再次解析。
          </p>
          <textarea 
            className="flex-1 w-full border border-gray-300 rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="请在此处粘贴简历文本..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors">
            取消
          </button>
          <button 
            onClick={handleParse}
            disabled={!text.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            解析并填入 <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
