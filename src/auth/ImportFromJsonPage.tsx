import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { importResumesFromJson, type ImportResult } from '../utils/importFromJson';

type Status = 'idle' | 'working' | 'done' | 'error';

export function ImportFromJsonPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('working');
    setError('');
    setResult(null);

    try {
      const text = await file.text();
      const r = await importResumesFromJson(text);
      setResult(r);
      setStatus('done');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">← 返回 / Back</Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">一次性导入 / One-time Import</h1>
          <p className="text-sm text-slate-400">
            选择从旧版 WonderCV 导出的 JSON 文件（通过"导出全部数据"按钮生成）。
            所有简历会以批量 upsert 写入 Supabase。相同 id 的行会被覆盖。
          </p>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="block text-sm text-slate-300 mb-1">JSON 文件</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleFile}
              disabled={status === 'working'}
              className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
          </label>
        </div>

        {status === 'working' && (
          <div className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
            导入中 / Importing...
          </div>
        )}

        {status === 'done' && result && (
          <div className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 space-y-1">
            <div>✓ 导入完成 / Done</div>
            <div>成功 / Imported: {result.imported}</div>
            {result.failed > 0 && (
              <details className="text-amber-200">
                <summary>跳过 / Skipped: {result.failed}</summary>
                <ul className="mt-1 text-xs list-disc list-inside">
                  {result.failedDetails.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            导入失败 / Error: {error}
          </div>
        )}

        <div className="pt-4 text-xs text-slate-500 border-t border-slate-800">
          该页面可以在数据迁移完成后删除。对应路由 <code>/admin/import</code>。
        </div>
      </div>
    </div>
  );
}
