# SuperCV 本地简约版

[![English](https://img.shields.io/badge/README-English-blue)](README.md)

一个基于 React + Vite + Tailwind CSS 开发的本地简历编辑器，支持实时预览、PDF 导出和多版本管理。

## 功能特性
- **所见即所得**：左侧编辑，右侧实时预览 A4 排版效果。
- **本地存储**：所有数据存储在浏览器 IndexedDB 中，安全隐私，支持离线使用。
- **多版本管理**：随时保存简历快照，支持查看历史版本并恢复。
- **PDF 导出**：一键生成高清 PDF 简历。
- **智能一页**：一键排版，自动调整字体大小和行间距，适应一整页。
- **简约设计**：专注于内容，无干扰的编辑体验。

## 技术栈
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (状态管理)
- Dexie.js (IndexedDB)
- React-Quill (富文本)
- html2pdf.js (PDF生成)

## 安装与运行
1. 安装依赖
```bash
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

3. 构建生产版本
```bash
npm run build
```

## 使用说明
1. **编辑**：在左侧各个模块输入内容，支持富文本格式。
2. **保存**：点击右上角“保存”按钮，当前状态将作为一个新版本存储。
3. **新建**：点击“新建”清空当前内容（建议先保存）。
4. **版本恢复**：点击“版本”按钮打开侧边栏，查看历史记录并恢复任意版本。
5. **导出**：点击“导出 PDF”下载简历文件。
