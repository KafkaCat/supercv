import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { Resume } from '../types';
import { useResumeStore } from '../store/useResumeStore';
import { X, Clock, RotateCcw, Trash2, Download } from 'lucide-react';

interface VersionHistoryProps {
  onClose: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ onClose }) => {
  const [history, setHistory] = useState<Resume[]>([]);
  const { setResume, exportAllData } = useResumeStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const all = await db.resumes.orderBy('updatedAt').reverse().toArray();
    setHistory(all);
  };

  const handleRestore = (resume: Resume) => {
    if (confirm('确定要恢复此版本吗？当前未保存的更改将丢失。')) {
      setResume(resume);
      onClose();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此版本吗？')) {
      await db.resumes.delete(id);
      loadHistory();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl transform transition-transform z-30 flex flex-col border-l border-gray-200">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Clock size={18} /> 版本历史
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
          <X size={20} />
        </button>
      </div>
      
      <div className="p-4 border-b bg-white">
        <button 
          onClick={exportAllData}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-900 transition-colors"
        >
          <Download size={16} /> 备份所有数据 (JSON)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {history.length === 0 ? (
          <div className="text-gray-500 text-center py-8 text-sm">暂无历史版本</div>
        ) : (
          history.map(ver => (
            <div key={ver.updatedAt} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white group">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-800 text-sm">{ver.title || '未命名简历'}</span>
                <button 
                  onClick={() => handleDelete(ver.id)}
                  className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                <Clock size={10} /> {new Date(ver.updatedAt).toLocaleString()}
              </div>
              <button 
                onClick={() => handleRestore(ver)}
                className="w-full py-2 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-100 flex items-center justify-center gap-1 transition-colors font-medium"
              >
                <RotateCcw size={12} /> 恢复此版本
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
