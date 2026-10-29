import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import OrderedList from '@tiptap/extension-ordered-list';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import SubScript from '@tiptap/extension-subscript';
import SuperScript from '@tiptap/extension-superscript';
import { supabase } from '@/integrations/supabase/client';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { cn } from '@/lib/utils';
import { useEffect, useCallback, useRef, useState } from 'react';
import { plainTextToHtml, cleanRawHtmlContent } from '@/utils/plainTextToHtml';
import { sanitizePastedHtml } from '@/utils/sanitizePastedHtml';
import { toast } from 'sonner';
import { GoogleDriveImporter } from './GoogleDriveImporter';
import { resolveImageUrl } from '@/lib/imageUtils';
import { EditorToolbar } from './editor/EditorToolbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/**
 * Decode HTML entities in a string (e.g. "&lt;h2&gt;" → "<h2>") using the
 * browser's own parser. Returns the raw string unchanged on any failure.
 */
function decodeHtmlEntities(input: string): string {
  if (!input) return input;
  try {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    // textContent of the parsed body yields the decoded characters.
    return doc.body.textContent ?? input;
  } catch {
    return input;
  }
}

/** True when a string looks like literal HTML markup (starts with a tag). */
function looksLikeHtmlSource(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith('<') &&
    /<(h[1-6]|p|ul|ol|li|img|a|blockquote|table|div|strong|em|figure|iframe|section|span)\b/i.test(trimmed)
  );
}

/**
 * Given the clipboard's text/plain and text/html payloads, return raw HTML
 * SOURCE markup when the user is pasting HTML source displayed as literal text.
 * Handles two shapes:
 *   (a) text/plain is itself the raw markup.
 *   (b) text/html wraps entity-ESCAPED markup (e.g. from a Google/Word doc that
 *       renders the source as text) — decode it and check again.
 * Returns null when this isn't an HTML-source paste (normal rich text / plain).
 */
function extractHtmlSource(plain: string, html: string): string | null {
  // (a) text/plain already contains the raw tags.
  const trimmedPlain = (plain || '').trim();
  if (trimmedPlain && looksLikeHtmlSource(trimmedPlain)) return trimmedPlain;

  // (b) text/html holds escaped source. Its visible text (textContent) is the
  // real markup once entities are decoded. Only treat it as source if the
  // DECODED text — not the wrapper tags — looks like HTML markup.
  if (html && html.trim()) {
    const decoded = decodeHtmlEntities(html).trim();
    if (decoded && looksLikeHtmlSource(decoded)) return decoded;
  }
  return null;
}

// Image extension extended to preserve a `data-graph` marker attribute on
// placeholders so an automated pipeline can deterministically swap the src
// for the matching generated graph (alt-text remains the primary matcher).
const GraphImage = Image.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      'data-graph': {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-graph'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs['data-graph'] ? { 'data-graph': attrs['data-graph'] as string } : {},
      },
    };
  },
});

// Inline SVG used as the visible placeholder until a real graph is generated.
function graphPlaceholderSrc(label: string): string {
  const safe = (label || 'Graph').replace(/[<>&"]/g, '').slice(0, 60);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="8 6"/><text x="320" y="150" font-family="Inter,sans-serif" font-size="20" fill="#64748b" text-anchor="middle">Graph placeholder</text><text x="320" y="182" font-family="Inter,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}


// Keep ordered list support (toolbar/commands) but disable auto-conversion like typing "1. "
const NoAutoOrderedList = OrderedList.extend({
  addInputRules() {
    return [];
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      type: {
        default: null,
        parseHTML: (element) => element.getAttribute('type'),
        renderHTML: (attributes) => (attributes.type ? { type: attributes.type } : {}),
      },
    };
  },
});

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start writing...',
  className 
}: RichTextEditorProps) {
  const [showDriveImporter, setShowDriveImporter] = useState(false);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImportHtml, setShowImportHtml] = useState(false);
  const [importHtmlValue, setImportHtmlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialContentRef = useRef(content);
  const placeholderRef = useRef(placeholder);
  const lastEmittedHtml = useRef(content);
  

  const importDriveUrl = useCallback(async (url: string) => {
    setIsDriveLoading(true);
    const loadingToastId = toast.loading('Importing from Google Drive…');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.dismiss(loadingToastId);
        toast.error('You must be logged in to import from Google Drive.');
        return;
      }
      const params = new URLSearchParams({ action: 'fetch', url });
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-gdrive-doc?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const result = await response.json();
      toast.dismiss(loadingToastId);

      if (!response.ok || result?.ok === false || result?.error) {
        toast.error(result?.error || 'Failed to import. Make sure the doc is shared.');
        return;
      }

      const editorInstance = (window as any).__tiptapEditorRef;
      if (editorInstance && result.content) {
        editorInstance.commands.setContent(result.content, { emitUpdate: true });
        toast.success(`Imported "${result.title}" from Google Drive!`, { duration: 4000 });
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error(`Drive import failed: ${err.message || 'Unknown error'}. Email support with screenshot + page URL.`);
    } finally {
      setIsDriveLoading(false);
    }
  }, []);

  const editorRef = useCallback((editorInstance: any) => {
    if (editorInstance) {
      (window as any).__tiptapEditorRef = editorInstance;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: false,
      } as any),
      NoAutoOrderedList.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
      }),
      GraphImage.configure({
        HTMLAttributes: { class: 'max-w-full rounded-lg' },
      }),
      Placeholder.configure({ placeholder: placeholderRef.current }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      SubScript,
      SuperScript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'border-collapse border border-border w-full' },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: { class: 'border border-border bg-muted/50 px-4 py-2 text-left font-bold' },
      }),
      TableCell.configure({
        HTMLAttributes: { class: 'border border-border px-4 py-2 align-top' },
      }),
    ],
    content: initialContentRef.current,
    immediatelyRender: false,
    onCreate: ({ editor: e }) => editorRef(e),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedHtml.current = html;
      onChangeRef.current(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[250px] px-4 py-3',
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData('text/plain') || '';
        const clipboardHtml = event.clipboardData?.getData('text/html') || '';

        // Drive IMAGE/FILE URL → insert as image
        const driveFileMatch = text.trim().match(
          /^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?)[a-zA-Z0-9_-]+/
        );
        if (driveFileMatch && !text.includes('docs.google.com') && text.trim().split('\n').length <= 2) {
          event.preventDefault();
          const resolvedUrl = resolveImageUrl(text.trim());
          if (resolvedUrl) {
            const editorInstance = (window as any).__tiptapEditorRef;
            if (editorInstance) {
              editorInstance.chain().focus().setImage({ src: resolvedUrl }).run();
              toast.success('Google Drive image inserted!', { duration: 3000 });
            }
          }
          return true;
        }

        // Google Docs URL → import content
        const driveMatch = text.trim().match(
          /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+/
        );
        if (driveMatch && text.trim().split('\n').length <= 2) {
          event.preventDefault();
          importDriveUrl(text.trim());
          return true;
        }
        
        // Raw HTML SOURCE pasted from a Word / Google Doc that DISPLAYS the
        // markup as literal text. Two clipboard shapes occur in the wild:
        //  (a) text/plain holds the raw tags ("<h2 ...>…") and there is no
        //      meaningful text/html.
        //  (b) text/html holds the SAME markup but HTML-ESCAPED inside a
        //      wrapper (e.g. "<meta><span>&lt;h2&gt;…&lt;/h2&gt;</span>"), and
        //      text/plain also holds the raw tags. Previously a non-empty
        //      text/html short-circuited to `return false`, so TipTap rendered
        //      the escaped entities as literal text — nothing usable landed.
        // Detect HTML source in EITHER MIME part and insert it as parsed nodes.
        const htmlSource = extractHtmlSource(text, clipboardHtml);
        if (htmlSource) {
          event.preventDefault();
          let cleaned = '';
          try {
            cleaned = sanitizePastedHtml(htmlSource);
          } catch {
            cleaned = '';
          }
          const html = cleaned && cleaned.trim().length > 0 ? cleaned : htmlSource;
          const editorInstance = (window as any).__tiptapEditorRef;
          if (editorInstance) {
            const isEmpty = editorInstance.state.doc.textContent.trim() === '';
            editorInstance.commands.focus();
            if (isEmpty) {
              editorInstance.commands.setContent(html, {
                emitUpdate: true,
                parseOptions: { preserveWhitespace: false },
              });
            } else {
              editorInstance.commands.insertContent(html, {
                parseOptions: { preserveWhitespace: false },
              });
            }
            toast.success('HTML imported and formatted!', { duration: 3000 });
          }
          return true;
        }

        // Proper HTML clipboard → let TipTap handle it (transformPastedHTML
        // runs the same sanitizer below).
        if (clipboardHtml && clipboardHtml.trim().length > 10) return false;

        // Plain text auto-format
        if (text && text.trim().length > 50 && text.includes('\n')) {
          const formatted = plainTextToHtml(text);
          if (formatted !== text && /<(h[1-3]|ul|ol|blockquote|img|a\s)/i.test(formatted)) {
            event.preventDefault();
            const editorInstance = (window as any).__tiptapEditorRef;
            if (editorInstance) {
              editorInstance.commands.insertContent(formatted, { parseOptions: { preserveWhitespace: false } });
              toast.success('Content auto-formatted!', { duration: 3000 });
            }
            return true;
          }
        }

        return false;

      },
      transformPastedHTML(html) {
        // Clean messy Word / Google Docs markup (mso styles, span soup,
        // <o:p>, comments, xml/style tags, class junk) into schema-safe HTML
        // while preserving structure (headings, lists, bold/italic/underline,
        // links, blockquotes). Falls back to the original HTML if cleaning
        // somehow yields nothing, so the paste is never silently dropped.
        try {
          const cleaned = sanitizePastedHtml(html);
          return cleaned && cleaned.trim().length > 0 ? cleaned : html;
        } catch {
          return html;
        }
      },
    },
  }, []);
  
  useEffect(() => {
    if (!editor) return;
    if (content === lastEmittedHtml.current) return;
    if (content !== editor.getHTML()) {
      lastEmittedHtml.current = content;
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);




  const uploadLocalImage = useCallback(async (file: File) => {
    if (!editor) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB.');
      return;
    }
    setIsUploading(true);
    const loadingId = toast.loading('Uploading image…');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file, { cacheControl: '31536000', upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);
      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');
      const altText = (window.prompt('Describe this image for alt-text (improves accessibility & SEO):', file.name.replace(/\.[^.]+$/, '')) || '').trim();
      editor.chain().focus().setImage({ src: urlData.publicUrl, alt: altText || undefined }).run();
      toast.dismiss(loadingId);
      toast.success('Image uploaded successfully!');
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error(`Upload failed: ${err.message || 'Unknown error'}. Try again or use an image URL instead.`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      const resolved = resolveImageUrl(url);
      const altText = (window.prompt('Describe this image for alt-text (improves accessibility & SEO):') || '').trim();
      editor.chain().focus().setImage({ src: resolved, alt: altText || undefined }).run();
    }
  };

  // Inserts an <img> placeholder carrying descriptive alt-text so an automated
  // graph pipeline can deterministically locate and replace it later.
  const addGraphPlaceholder = () => {
    const desc = (window.prompt('Describe the graph that goes here.\nThis becomes the alt-text used to generate and place the graph automatically (e.g. "Bar chart of revenue by quarter 2024"):') || '').trim();
    if (!desc) return;
    editor
      .chain()
      .focus()
      .insertContent({ type: 'image', attrs: { src: graphPlaceholderSrc(desc), alt: desc, 'data-graph': desc } })
      .run();
    toast.success('Graph placeholder inserted with alt-text.');
  };


  const autoFormatContent = () => {
    const textContent = editor.getText();
    if (!textContent || textContent.trim().length < 50) {
      toast.error('Not enough content to auto-format. Paste your text first.');
      return;
    }
    const hasVisibleHtmlTags = /<(h[1-6]|p|ul|ol|li|a |img |blockquote)\b/i.test(textContent);
    if (hasVisibleHtmlTags) {
      const cleaned = cleanRawHtmlContent(textContent);
      editor.commands.setContent(cleaned);
      toast.success('HTML content detected, cleaned and formatted!', { duration: 4000 });
      return;
    }
    const formatted = plainTextToHtml(textContent);
    if (formatted !== textContent && /<(h[1-3]|ul|ol|blockquote|img|a\s)/i.test(formatted)) {
      editor.commands.setContent(formatted);
      toast.success('Content auto-formatted! Headings, lists, and links detected.', { duration: 4000 });
    } else {
      toast.info('Content appears to already be formatted, or no structure was detected.');
    }
  };

  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  const toggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  // Reliable fallback for importing raw HTML (e.g. Tely blog export): paste
  // the markup into a textarea, sanitize it, and set it as the content.
  const applyImportHtml = () => {
    const raw = importHtmlValue.trim();
    if (!raw) {
      toast.error('Paste some HTML first.');
      return;
    }
    let cleaned = '';
    try {
      cleaned = sanitizePastedHtml(raw);
    } catch {
      cleaned = '';
    }
    const html = cleaned && cleaned.trim().length > 0 ? cleaned : raw;
    editor.commands.setContent(html, { emitUpdate: true });
    setShowImportHtml(false);
    setImportHtmlValue('');
    toast.success('HTML imported! Images, headings and lists preserved.', { duration: 4000 });
  };


  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background shadow-sm", className)}>
      <EditorToolbar
        editor={editor}
        onAutoFormat={autoFormatContent}
        onOpenDrive={() => setShowDriveImporter(true)}
        onUploadClick={() => fileInputRef.current?.click()}
        onAddImageUrl={addImage}
        onAddGraphPlaceholder={addGraphPlaceholder}
        onAddLink={addLink}
        onToggleBulletList={toggleBulletList}
        onToggleOrderedList={toggleOrderedList}
        onImportHtml={() => setShowImportHtml(true)}
        isUploading={isUploading}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadLocalImage(file);
        }}
      />

      <EditorContent editor={editor} />

      <GoogleDriveImporter
        open={showDriveImporter}
        onClose={() => setShowDriveImporter(false)}
        onImport={(data) => {
          if (data.content) {
            editor.commands.setContent(data.content, { emitUpdate: true });
            toast.success(`Imported "${data.title}" from Google Drive!`, { duration: 3000 });
          }
          setShowDriveImporter(false);
        }}
      />

      <Dialog open={showImportHtml} onOpenChange={setShowImportHtml}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import HTML</DialogTitle>
            <DialogDescription>
              Paste raw HTML (e.g. a Tely blog export). It will be cleaned and inserted — headings,
              paragraphs, lists, links and images are kept; scripts and embeds are removed.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={importHtmlValue}
            onChange={(e) => setImportHtmlValue(e.target.value)}
            placeholder="<h2>Introduction</h2>&#10;<p>Paste your HTML here…</p>"
            className="min-h-[240px] font-mono text-xs"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowImportHtml(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={applyImportHtml}>
              Import &amp; Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
