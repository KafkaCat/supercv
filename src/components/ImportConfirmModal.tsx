import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { Resume, Profile } from '../types';

interface ImportConfirmModalProps {
  parsedResume: Partial<Resume>;
  onConfirm: (finalResume: Partial<Resume>) => void;
  onCancel: () => void;
}

export const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({ parsedResume, onConfirm, onCancel }) => {
  const [profile, setProfile] = useState<Partial<Profile>>({ ...parsedResume.profile });
  const skills = parsedResume.skills?.content || '';

  const handleSave = () => {
    onConfirm({
      ...parsedResume,
      profile: profile as Profile,
      skills: { content: skills }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Check size={20} className="text-green-600"/> 
            确认导入内容
          </h3>
          <button onClick={onCancel} className="text-gray-500 hover:bg-gray-100 p-1 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded p-3 flex gap-2 items-start text-sm text-blue-800">
             <AlertCircle size={16} className="mt-0.5 shrink-0" />
             <p>系统已从 PDF 中提取以下信息，请在导入前核对并修正。未提取到的信息（如具体工作经历）需要您后续手动补充。</p>
          </div>

          {/* Profile Section */}
          <section>
            <h4 className="font-bold text-gray-700 mb-3 border-b pb-1">基本信息</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
                <input 
                  type="text" 
                  value={profile.fullName || ''} 
                  onChange={e => setProfile({...profile, fullName: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">电话</label>
                <input 
                  type="text" 
                  value={profile.phone || ''} 
                  onChange={e => setProfile({...profile, phone: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">邮箱</label>
                <input 
                  type="text" 
                  value={profile.email || ''} 
                  onChange={e => setProfile({...profile, email: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">链接</label>
                <input 
                  type="text" 
                  value={profile.link || ''} 
                  onChange={e => setProfile({...profile, link: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Skills Section */}
          <section>
            <h4 className="font-bold text-gray-700 mb-3 border-b pb-1">技能/关键词提取结果</h4>
            <div className="border rounded-md p-2 bg-gray-50">
               <div dangerouslySetInnerHTML={{ __html: skills }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">* 技能部分将在导入后支持富文本编辑</p>
          </section>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors">
            取消导入
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
          >
            确认并导入
          </button>
        </div>
      </div>
    </div>
  );
};
