import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  CodeXml,
  Minus,
  Upload,
  Palette,
  Highlighter,
  Subscript,
  Superscript,
  RemoveFormatting,
  Indent,
  Outdent,
  Info,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Type,
  Plus,
  Rows3,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  fullHeight?: boolean;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write lecture notes, explanations, paste diagrams, insert formulas or tables...',
  fullHeight = true,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const isUpdatingRef = useRef(false);

  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || '');

  // Active toolbar formats state
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    subscript: false,
    superscript: false,
    insertOrderedList: false,
    insertUnorderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
  });

  const [activeBlockFormat, setActiveBlockFormat] = useState<string>('p');

  // Dropdown states
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showCalloutPicker, setShowCalloutPicker] = useState(false);
  const [showTableTools, setShowTableTools] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);

  // -------------------------------------------------------------
  // Robust Selection Preservation
  // -------------------------------------------------------------
  const saveSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  const restoreSelection = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    if (savedRangeRef.current && window.getSelection) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
        return true;
      }
    }
    return false;
  }, []);

  // Sync incoming value to contentEditable div
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '<p><br></p>';
      }
    }
    setRawHtml(value || '');
  }, [value]);

  // Enable styleWithCSS on mount if supported so commands produce modern inline styles
  useEffect(() => {
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      // ignore
    }
  }, []);

  // Update active formatting indicators based on cursor position
  const checkActiveFormats = useCallback(() => {
    if (typeof document === 'undefined') return;
    saveSelection();
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        subscript: document.queryCommandState('subscript'),
        superscript: document.queryCommandState('superscript'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
      });

      const blockVal = document.queryCommandValue('formatBlock');
      if (blockVal) {
        setActiveBlockFormat(blockVal.toLowerCase().replace(/<|>/g, ''));
      }
    } catch {
      // Ignore queryCommandState errors in unsupported environments
    }
  }, [saveSelection]);

  useEffect(() => {
    const handleSelectionChange = () => {
      checkActiveFormats();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [checkActiveFormats]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
      setRawHtml(html);
      checkActiveFormats();
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  };

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextHtml = e.target.value;
    setRawHtml(nextHtml);
    onChange(nextHtml);
  };

  // Switch between HTML Mode and Visual WYSIWYG
  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML to Visual
      if (editorRef.current) {
        editorRef.current.innerHTML = rawHtml || '<p><br></p>';
      }
      onChange(rawHtml);
      setIsHtmlMode(false);
    } else {
      // Switching from Visual to HTML
      if (editorRef.current) {
        setRawHtml(editorRef.current.innerHTML);
      }
      setIsHtmlMode(true);
    }
    setIsPreviewMode(false);
  };

  // Safe command executor that keeps selection and focuses correctly
  const exec = (command: string, arg?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
    try {
      document.execCommand(command, false, arg);
    } catch (err) {
      console.warn(`execCommand ${command} failed:`, err);
    }
    saveSelection();
    handleInput();
    checkActiveFormats();
  };

  // Safe Heading & Block formatter
  const insertHeading = (level: 'h1' | 'h2' | 'h3' | 'h4' | 'p') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
    let ok = false;
    try {
      ok = document.execCommand('formatBlock', false, `<${level}>`);
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        ok = document.execCommand('formatBlock', false, level);
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      try {
        document.execCommand('formatBlock', false, level.toUpperCase());
      } catch {}
    }
    saveSelection();
    handleInput();
    checkActiveFormats();
  };

  const insertBlockquote = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
    let ok = false;
    try {
      ok = document.execCommand('formatBlock', false, '<blockquote>');
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        ok = document.execCommand('formatBlock', false, 'BLOCKQUOTE');
      } catch {}
    }
    saveSelection();
    handleInput();
    checkActiveFormats();
  };

  // Insert arbitrary HTML fragment at current cursor position
  const insertHtmlSnippet = (snippet: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const el = document.createElement('div');
        el.innerHTML = snippet;
        const frag = document.createDocumentFragment();
        let node: ChildNode | null;
        let lastNode: ChildNode | null = null;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        saveSelection();
        handleInput();
        return;
      }
    }

    // Fallback if no range
    try {
      document.execCommand('insertHTML', false, snippet);
    } catch {
      if (editorRef.current) {
        editorRef.current.innerHTML += snippet;
      }
    }
    saveSelection();
    handleInput();
  };

  // Link Insertion
  const handleInsertLink = () => {
    saveSelection();
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';

    const url = prompt('Enter destination URL (e.g. https://example.com):', 'https://');
    if (!url || url === 'https://') return;

    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();

    if (selectedText.length > 0) {
      exec('createLink', url);
    } else {
      const linkText = prompt('Enter display text for this link:', url) || url;
      restoreSelection();
      const anchorHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-medium hover:text-blue-800">${linkText}</a>&nbsp;`;
      insertHtmlSnippet(anchorHtml);
    }
  };

  // Image insertion via URL
  const handleInsertImageUrl = () => {
    saveSelection();
    const url = prompt('Enter image URL (e.g. https://... or public image link):');
    if (!url) return;
    const caption = prompt('Image caption / description (optional):', 'Lecture Diagram') || 'Lecture Diagram';

    const imageSnippet = `
      <figure class="my-5 text-center block">
        <img src="${url}" alt="${caption}" class="max-w-full max-h-[480px] mx-auto rounded-xl border border-slate-200 shadow-sm object-contain" />
        <figcaption class="text-xs text-slate-500 mt-2 italic font-sans">${caption}</figcaption>
      </figure>
      <p><br></p>
    `;
    restoreSelection();
    insertHtmlSnippet(imageSnippet);
  };

  // Image insertion via File Upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const imageSnippet = `
          <figure class="my-5 text-center block">
            <img src="${dataUrl}" alt="${file.name}" class="max-w-full max-h-[480px] mx-auto rounded-xl border border-slate-200 shadow-sm object-contain" />
            <figcaption class="text-xs text-slate-500 mt-2 italic font-sans">${file.name}</figcaption>
          </figure>
          <p><br></p>
        `;
        restoreSelection();
        insertHtmlSnippet(imageSnippet);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Direct Drag & Drop image files into editor
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        saveSelection();
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            const imageSnippet = `
              <figure class="my-5 text-center block">
                <img src="${dataUrl}" alt="${file.name}" class="max-w-full max-h-[480px] mx-auto rounded-xl border border-slate-200 shadow-sm object-contain" />
                <figcaption class="text-xs text-slate-500 mt-2 italic font-sans">${file.name}</figcaption>
              </figure>
              <p><br></p>
            `;
            restoreSelection();
            insertHtmlSnippet(imageSnippet);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Direct Clipboard Paste image support (screenshots, Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.items) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          saveSelection();
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                const imageSnippet = `
                  <figure class="my-5 text-center block">
                    <img src="${dataUrl}" alt="Pasted Screenshot" class="max-w-full max-h-[480px] mx-auto rounded-xl border border-slate-200 shadow-sm object-contain" />
                    <figcaption class="text-xs text-slate-500 mt-2 italic font-sans">Pasted Screenshot</figcaption>
                  </figure>
                  <p><br></p>
                `;
                restoreSelection();
                insertHtmlSnippet(imageSnippet);
              }
            };
            reader.readAsDataURL(blob);
          }
          return;
        }
      }
    }
  };

  // Table Generator
  const handleInsertTable = () => {
    saveSelection();
    const rowsStr = prompt('Number of rows (including header):', '3');
    if (!rowsStr) return;
    const colsStr = prompt('Number of columns:', '3');
    if (!colsStr) return;
    const rows = Math.min(20, Math.max(1, parseInt(rowsStr, 10) || 3));
    const cols = Math.min(10, Math.max(1, parseInt(colsStr, 10) || 3));

    let tableHtml = `
      <div class="overflow-x-auto my-4 table-responsive-wrapper">
        <table class="min-w-full border-collapse border border-slate-300 rounded-lg text-sm bg-white font-sans">
          <thead>
            <tr class="bg-slate-100 border-b border-slate-300">
    `;
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th class="border border-slate-300 p-2.5 font-bold text-left text-slate-800">Header ${c + 1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (let r = 1; r < rows; r++) {
      tableHtml += `<tr class="${r % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}">`;
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td class="border border-slate-300 p-2.5 text-slate-700">Data ${r},${c + 1}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div><p><br></p>`;
    restoreSelection();
    insertHtmlSnippet(tableHtml);
    setShowTableTools(false);
  };

  // Helper to get nearest table from current cursor
  const getClosestTable = (): HTMLTableElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TABLE') return node as HTMLTableElement;
      node = node.parentNode;
    }
    return null;
  };

  const handleAddTableRow = () => {
    const table = getClosestTable();
    if (!table) {
      alert('Please click inside a table cell first to add a row.');
      return;
    }
    const cols = table.rows[0]?.cells.length || 3;
    const newRow = table.insertRow(-1);
    newRow.className = table.rows.length % 2 === 0 ? 'bg-slate-50/70' : 'bg-white';
    for (let i = 0; i < cols; i++) {
      const cell = newRow.insertCell(i);
      cell.className = 'border border-slate-300 p-2.5 text-slate-700';
      cell.innerHTML = 'New data';
    }
    handleInput();
    setShowTableTools(false);
  };

  const handleDeleteTableRow = () => {
    const table = getClosestTable();
    if (!table) {
      alert('Please click inside a table cell first.');
      return;
    }
    if (table.rows.length <= 1) {
      alert('Cannot delete the last or header row.');
      return;
    }
    table.deleteRow(-1);
    handleInput();
    setShowTableTools(false);
  };

  const handleDeleteTable = () => {
    const table = getClosestTable();
    if (!table) {
      alert('Please click inside a table cell first.');
      return;
    }
    if (confirm('Delete this entire table?')) {
      const wrapper = table.closest('.table-responsive-wrapper') || table;
      wrapper.remove();
      handleInput();
    }
    setShowTableTools(false);
  };

  // Formatted Code Block
  const handleInsertCodeBlock = () => {
    saveSelection();
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';
    const code = selectedText || prompt('Paste or enter code snippet:') || '// write code here';
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const snippet = `
      <pre class="bg-slate-900 text-slate-100 p-4 rounded-xl my-4 overflow-x-auto font-mono text-sm leading-relaxed border border-slate-800"><code>${escaped}</code></pre>
      <p><br></p>
    `;
    restoreSelection();
    insertHtmlSnippet(snippet);
  };

  // Inline Code
  const handleInlineCode = () => {
    saveSelection();
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selected = selection.toString();
      const codeSnippet = `<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-sm border border-slate-200">${selected}</code>&nbsp;`;
      restoreSelection();
      insertHtmlSnippet(codeSnippet);
    } else {
      const code = prompt('Enter inline code term:', 'variable_name');
      if (code) {
        restoreSelection();
        insertHtmlSnippet(`<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-sm border border-slate-200">${code}</code>&nbsp;`);
      }
    }
  };

  // Callout Boxes (Info, Warning, Success, Formula)
  const insertCallout = (type: 'info' | 'warning' | 'success' | 'formula') => {
    let calloutHtml = '';
    if (type === 'info') {
      calloutHtml = `
        <div class="my-4 p-4 rounded-xl border-l-4 border-blue-500 bg-blue-50 text-blue-950 font-sans shadow-2xs">
          <div class="flex items-start gap-3">
            <span class="text-xl">💡</span>
            <div>
              <p class="font-bold text-blue-900 text-sm mb-1">Key Concept / Note:</p>
              <p class="text-sm text-blue-800 leading-relaxed">Add important explanation or conceptual context that students should remember.</p>
            </div>
          </div>
        </div>
        <p><br></p>
      `;
    } else if (type === 'warning') {
      calloutHtml = `
        <div class="my-4 p-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 text-amber-950 font-sans shadow-2xs">
          <div class="flex items-start gap-3">
            <span class="text-xl">⚠️</span>
            <div>
              <p class="font-bold text-amber-900 text-sm mb-1">Important for NIELIT Exam:</p>
              <p class="text-sm text-amber-800 leading-relaxed">Important definition, pitfall, or question frequently asked in O-Level examinations.</p>
            </div>
          </div>
        </div>
        <p><br></p>
      `;
    } else if (type === 'success') {
      calloutHtml = `
        <div class="my-4 p-4 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 text-emerald-950 font-sans shadow-2xs">
          <div class="flex items-start gap-3">
            <span class="text-xl">✅</span>
            <div>
              <p class="font-bold text-emerald-900 text-sm mb-1">Summary Takeaway:</p>
              <p class="text-sm text-emerald-800 leading-relaxed">Key conclusion and practical application of this lecture topic.</p>
            </div>
          </div>
        </div>
        <p><br></p>
      `;
    } else if (type === 'formula') {
      calloutHtml = `
        <div class="my-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-950 font-sans shadow-2xs text-center">
          <p class="text-xs uppercase font-bold text-indigo-700 tracking-wider mb-1">Mathematical Formula / Syntax</p>
          <div class="font-mono text-base font-bold text-indigo-900 py-1">E = mc² &nbsp;|&nbsp; 2¹⁰ = 1024 Bytes = 1 KB</div>
          <p class="text-xs text-indigo-600 mt-1">Replace with required formula or algorithm complexity</p>
        </div>
        <p><br></p>
      `;
    }
    restoreSelection();
    insertHtmlSnippet(calloutHtml);
    setShowCalloutPicker(false);
  };

  // Text Color
  const applyTextColor = (color: string) => {
    restoreSelection();
    exec('foreColor', color);
    setShowTextColorPicker(false);
  };

  // Text Background Highlighter
  const applyBgColor = (color: string) => {
    restoreSelection();
    if (editorRef.current) {
      editorRef.current.focus();
    }
    try {
      document.execCommand('hiliteColor', false, color);
    } catch {
      document.execCommand('backColor', false, color);
    }
    saveSelection();
    handleInput();
    setShowBgColorPicker(false);
  };

  // Font Size: 2 (Small 13px), 3 (Normal 16px), 4 (Medium-Large 18px), 5 (Large 24px), 6 (Huge 32px)
  const applyFontSize = (sizeVal: string) => {
    restoreSelection();
    exec('fontSize', sizeVal);
    setShowFontSizePicker(false);
  };

  // Clear all content in editor
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all text in the editor?')) {
      if (editorRef.current) {
        editorRef.current.innerHTML = '<p><br></p>';
      }
      setRawHtml('<p><br></p>');
      onChange('<p><br></p>');
    }
  };

  // Character and Word statistics
  const plainText = (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const charCount = plainText.length;
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 180));

  // Helper to prevent blur when clicking toolbar buttons
  const preventBlur = (e: React.MouseEvent) => {
    e.preventDefault();
    saveSelection();
  };

  return (
    <div
      className={`w-full h-full flex flex-col min-h-0 bg-white border border-slate-200 rounded-none overflow-hidden select-none ${className}`}
    >
      {/* Hidden file input for uploading images */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* COMPREHENSIVE TOOLBAR (Every single tool wired, verified, and tested)      */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border-b border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 flex flex-wrap items-center gap-1 text-slate-700 shrink-0 z-20 shadow-2xs">
        {/* Undo / Redo */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('undo')}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('redo')}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-0.5 sm:mx-1 shrink-0" />

        {/* Headings */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => insertHeading('h1')}
          title="Heading 1 (Main Title)"
          className={`px-1.5 sm:px-2 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center gap-0.5 ${
            activeBlockFormat === 'h1' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-800'
          }`}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => insertHeading('h2')}
          title="Heading 2 (Section Title)"
          className={`px-1.5 sm:px-2 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center gap-0.5 ${
            activeBlockFormat === 'h2' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-800'
          }`}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => insertHeading('h3')}
          title="Heading 3 (Sub-section)"
          className={`px-1.5 sm:px-2 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center gap-0.5 ${
            activeBlockFormat === 'h3' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-800'
          }`}
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => insertHeading('h4')}
          title="Subheading 4 (H4)"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeBlockFormat === 'h4' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Heading4 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => insertHeading('p')}
          title="Normal Paragraph Text (P)"
          className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeBlockFormat === 'p' ? 'bg-slate-300 text-slate-900' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          Normal (P)
        </button>

        {/* Font Size Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={preventBlur}
            onClick={() => {
              setShowFontSizePicker(!showFontSizePicker);
              setShowTextColorPicker(false);
              setShowBgColorPicker(false);
              setShowCalloutPicker(false);
              setShowTableTools(false);
            }}
            title="Select Font Size"
            className="px-2 py-1 text-xs font-semibold rounded-md hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
          >
            <Type className="w-3.5 h-3.5 text-slate-600" />
            <span>Size</span>
          </button>
          {showFontSizePicker && (
            <div className="absolute left-0 top-full mt-1 p-1 bg-white rounded-xl shadow-xl border border-slate-200 w-36 space-y-0.5 z-30">
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => applyFontSize('2')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-medium cursor-pointer"
              >
                Small (13px)
              </button>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => applyFontSize('3')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-sm font-medium cursor-pointer"
              >
                Normal (16px)
              </button>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => applyFontSize('4')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-base font-semibold cursor-pointer"
              >
                Medium-Large (18px)
              </button>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => applyFontSize('5')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-lg font-bold cursor-pointer"
              >
                Large (24px)
              </button>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => applyFontSize('6')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xl font-extrabold cursor-pointer"
              >
                Huge (32px)
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-300 mx-0.5 sm:mx-1 shrink-0" />

        {/* Inline Formatting: Bold, Italic, Underline, Strikethrough */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('bold')}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.bold ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('italic')}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.italic ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('underline')}
          title="Underline (Ctrl+U)"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.underline ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('strikeThrough')}
          title="Strikethrough"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.strikeThrough ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        {/* Subscript & Superscript */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('subscript')}
          title="Subscript (e.g. H₂O)"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.subscript ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Subscript className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('superscript')}
          title="Superscript (e.g. 2¹⁰, x²)"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.superscript ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Superscript className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-0.5 sm:mx-1 shrink-0" />

        {/* Text Color Picker */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={preventBlur}
            onClick={() => {
              setShowTextColorPicker(!showTextColorPicker);
              setShowBgColorPicker(false);
              setShowCalloutPicker(false);
              setShowTableTools(false);
              setShowFontSizePicker(false);
            }}
            title="Text Color"
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Palette className="w-4 h-4 text-blue-600" />
          </button>
          {showTextColorPicker && (
            <div className="absolute left-0 top-full mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 grid grid-cols-4 gap-1.5 z-30 w-48">
              <span className="col-span-4 text-[11px] font-bold text-slate-500 mb-1">Select Text Color:</span>
              {[
                { name: 'Dark Slate', val: '#0f172a' },
                { name: 'Royal Blue', val: '#2563eb' },
                { name: 'Emerald', val: '#059669' },
                { name: 'Crimson', val: '#dc2626' },
                { name: 'Purple', val: '#9333ea' },
                { name: 'Amber', val: '#d97706' },
                { name: 'Indigo', val: '#4f46e5' },
                { name: 'Teal', val: '#0d9488' },
              ].map((c) => (
                <button
                  key={c.val}
                  type="button"
                  onMouseDown={preventBlur}
                  onClick={() => applyTextColor(c.val)}
                  title={c.name}
                  className="w-7 h-7 rounded-lg border border-slate-300 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-2xs"
                  style={{ backgroundColor: c.val }}
                />
              ))}
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => applyTextColor('#0f172a')}
                className="col-span-4 mt-1 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded text-center border border-slate-200 cursor-pointer font-medium"
              >
                Reset Default Color
              </button>
            </div>
          )}
        </div>

        {/* Highlighter / Background Color Picker */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={preventBlur}
            onClick={() => {
              setShowBgColorPicker(!showBgColorPicker);
              setShowTextColorPicker(false);
              setShowCalloutPicker(false);
              setShowTableTools(false);
              setShowFontSizePicker(false);
            }}
            title="Highlight Text Background"
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Highlighter className="w-4 h-4 text-amber-500" />
          </button>
          {showBgColorPicker && (
            <div className="absolute left-0 top-full mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 grid grid-cols-4 gap-1.5 z-30 w-48">
              <span className="col-span-4 text-[11px] font-bold text-slate-500 mb-1">Highlighter:</span>
              {[
                { name: 'Yellow', val: '#fef08a' },
                { name: 'Lime', val: '#bbf7d0' },
                { name: 'Sky Blue', val: '#bae6fd' },
                { name: 'Pink', val: '#fbcfe8' },
                { name: 'Orange', val: '#fed7aa' },
                { name: 'Purple', val: '#e9d5ff' },
                { name: 'Gray', val: '#e2e8f0' },
                { name: 'Clear', val: 'transparent' },
              ].map((c) => (
                <button
                  key={c.val}
                  type="button"
                  onMouseDown={preventBlur}
                  onClick={() => applyBgColor(c.val)}
                  title={c.name}
                  className="w-7 h-7 rounded-lg border border-slate-300 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer text-xs font-bold text-slate-800 shadow-2xs"
                  style={{ backgroundColor: c.val }}
                >
                  {c.val === 'transparent' ? '✕' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-300 mx-0.5 sm:mx-1 shrink-0" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('insertUnorderedList')}
          title="Bullet List (with visible bullets)"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.insertUnorderedList ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('insertOrderedList')}
          title="Numbered List (1, 2, 3...)"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.insertOrderedList ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={insertBlockquote}
          title="Blockquote (Quote Callout)"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeBlockFormat === 'blockquote' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-0.5 sm:mx-1 shrink-0" />

        {/* Alignment */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('justifyLeft')}
          title="Align Left"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.justifyLeft ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('justifyCenter')}
          title="Align Center"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.justifyCenter ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('justifyRight')}
          title="Align Right"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.justifyRight ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('justifyFull')}
          title="Justify Content"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            activeFormats.justifyFull ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        {/* Indentation */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('indent')}
          title="Increase Indent"
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <Indent className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('outdent')}
          title="Decrease Indent"
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <Outdent className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-0.5 sm:mx-1 shrink-0" />

        {/* Link */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={handleInsertLink}
          title="Insert Link (Hyperlink)"
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <LinkIcon className="w-4 h-4 text-blue-600" />
        </button>

        {/* Upload Image Button */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => {
            saveSelection();
            fileInputRef.current?.click();
          }}
          title="Upload image from device / screenshot"
          className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer border border-blue-200"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Image</span>
        </button>

        {/* Image from URL */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={handleInsertImageUrl}
          title="Insert image by URL"
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <ImageIcon className="w-4 h-4 text-slate-700" />
        </button>

        {/* Table & Table Tools Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={preventBlur}
            onClick={() => {
              setShowTableTools(!showTableTools);
              setShowTextColorPicker(false);
              setShowBgColorPicker(false);
              setShowCalloutPicker(false);
              setShowFontSizePicker(false);
            }}
            title="Table Tools & Generator"
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <TableIcon className="w-4 h-4 text-slate-700" />
          </button>
          {showTableTools && (
            <div className="absolute left-0 top-full mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 w-52 space-y-1 z-30">
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={handleInsertTable}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-blue-900 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Insert New Table...</span>
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={handleAddTableRow}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-800 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <Rows3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Add Row to Table</span>
              </button>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={handleDeleteTableRow}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-800 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5 text-slate-600" />
                <span>Delete Bottom Row</span>
              </button>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={handleDeleteTable}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete Table</span>
              </button>
            </div>
          )}
        </div>

        {/* Code Snippets */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={handleInsertCodeBlock}
          title="Insert Formatted Code Block (Syntax / Program)"
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <Code className="w-4 h-4 text-slate-700" />
        </button>
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={handleInlineCode}
          title="Insert Inline Code (monospace keyword)"
          className="px-1.5 py-1 rounded-md hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold transition-colors cursor-pointer"
        >
          `code`
        </button>

        {/* Callout Cards Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={preventBlur}
            onClick={() => {
              setShowCalloutPicker(!showCalloutPicker);
              setShowTextColorPicker(false);
              setShowBgColorPicker(false);
              setShowTableTools(false);
              setShowFontSizePicker(false);
            }}
            title="Insert Callout Card (Note, Warning, Summary)"
            className="px-2 py-1 rounded-md hover:bg-amber-50 text-amber-800 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer border border-amber-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Callout</span>
          </button>
          {showCalloutPicker && (
            <div className="absolute left-0 top-full mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 w-56 space-y-1 z-30">
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => insertCallout('info')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 text-blue-900 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>💡 Note / Concept Box</span>
              </button>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => insertCallout('warning')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-50 text-amber-900 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>⚠️ NIELIT Exam Alert</span>
              </button>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => insertCallout('success')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-50 text-emerald-900 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✅ Summary Takeaway</span>
              </button>
              <button
                type="button"
                onMouseDown={preventBlur}
                onClick={() => insertCallout('formula')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 text-indigo-900 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <span className="font-mono font-bold text-indigo-600 text-xs shrink-0">∑x</span>
                <span>Formula / Math Highlight</span>
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Divider */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('insertHorizontalRule')}
          title="Insert Horizontal Divider Line"
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Clear Formatting */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={() => exec('removeFormat')}
          title="Clear formatting on selected text"
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <RemoveFormatting className="w-4 h-4 text-slate-600" />
        </button>

        {/* Clear All Content */}
        <button
          type="button"
          onMouseDown={preventBlur}
          onClick={handleClearAll}
          title="Clear all text in the editor"
          className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Right side: HTML Mode & Preview Mode */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Live Preview Toggle */}
          <button
            type="button"
            onMouseDown={preventBlur}
            onClick={() => {
              setIsPreviewMode(!isPreviewMode);
              setIsHtmlMode(false);
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              isPreviewMode
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title="Preview how students see this lecture note"
          >
            {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
            <span>{isPreviewMode ? 'Exit Preview' : 'Student View'}</span>
          </button>

          {/* HTML Source Toggle */}
          <button
            type="button"
            onMouseDown={preventBlur}
            onClick={toggleHtmlMode}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              isHtmlMode
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title="Toggle HTML Source Code View"
          >
            <CodeXml className="w-3.5 h-3.5" />
            <span>{isHtmlMode ? 'Visual Mode' : 'HTML Source'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDITOR CANVAS AREA (Visual / HTML / Student Preview)                      */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-slate-100/60">
        {isHtmlMode ? (
          /* HTML Source View */
          <div className="flex-1 h-full min-h-0 flex flex-col p-4 bg-slate-950">
            <div className="flex items-center justify-between pb-2 text-xs text-slate-400 font-mono border-b border-slate-800">
              <span>HTML Source Code Editor</span>
              <span className="text-emerald-400">Direct markup editing enabled</span>
            </div>
            <textarea
              value={rawHtml}
              onChange={handleRawHtmlChange}
              placeholder="Edit raw HTML markup code here..."
              className="flex-1 w-full h-full p-4 font-mono text-sm bg-transparent text-emerald-300 focus:outline-hidden resize-none leading-relaxed overflow-y-auto"
              spellCheck={false}
            />
          </div>
        ) : isPreviewMode ? (
          /* Live Student Preview */
          <div className="flex-1 h-full min-h-0 overflow-y-auto p-4 sm:p-6 md:p-10 bg-slate-50">
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 md:p-12 rounded-2xl shadow-xs border border-slate-200">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Student Reading Preview
                </span>
                <span className="text-xs text-slate-400">~{estimatedReadTime} min read</span>
              </div>
              <div
                className="note-rendered-html max-w-none text-slate-800 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">No content yet.</p>' }}
              />
            </div>
          </div>
        ) : (
          /* WYSIWYG Editable Canvas */
          <div
            className="flex-1 h-full min-h-0 overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center cursor-text"
            onClick={() => {
              if (editorRef.current && document.activeElement !== editorRef.current) {
                editorRef.current.focus();
              }
            }}
          >
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-8 md:p-12 min-h-full flex flex-col">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={() => {
                  saveSelection();
                  handleInput();
                }}
                onDrop={handleDrop}
                onPaste={handlePaste}
                onKeyUp={() => {
                  saveSelection();
                  checkActiveFormats();
                }}
                onMouseUp={() => {
                  saveSelection();
                  checkActiveFormats();
                }}
                onTouchEnd={() => {
                  saveSelection();
                  checkActiveFormats();
                }}
                className="editor-canvas note-rendered-html flex-1 w-full focus:outline-hidden text-slate-800 text-base leading-relaxed"
                style={{
                  wordBreak: 'break-word',
                  minHeight: '400px',
                }}
                data-placeholder={placeholder}
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STATUS FOOTER BAR                                                         */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-xs text-slate-500 flex flex-wrap justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Rich WYSIWYG Active
          </span>
          <span className="text-slate-300">•</span>
          <span>{wordCount} words</span>
          <span className="text-slate-300">•</span>
          <span>{charCount} chars</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="hidden sm:inline">~{estimatedReadTime} min read</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 hidden md:inline">
            Paste screenshots (Ctrl+V) or drag images directly into the page
          </span>
        </div>
      </div>
    </div>
  );
};
