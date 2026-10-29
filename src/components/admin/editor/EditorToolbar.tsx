import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, 
  List, ListOrdered, Quote, Undo, Redo, 
  Link as LinkIcon, Image as ImageIcon, Minus, 
  Table as TableIcon, Plus, Trash2, Columns, Rows,
  Wand2, FolderOpen, Upload, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, Type, Highlighter,
  Subscript, Superscript, Palette, ChevronDown,
  MoreHorizontal, Paperclip, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface EditorToolbarProps {
  editor: Editor;
  onAutoFormat: () => void;
  onOpenDrive: () => void;
  onUploadClick: () => void;
  onAddImageUrl: () => void;
  onAddGraphPlaceholder: () => void;
  onAddLink: () => void;
  onToggleBulletList: () => void;
  onToggleOrderedList: () => void;
  onImportHtml: () => void;
  isUploading?: boolean;
}

const HEADING_OPTIONS = [
  { level: 0, label: 'Normal text', shortLabel: 'Normal' },
  { level: 1, label: 'Heading 1', shortLabel: 'H1' },
  { level: 2, label: 'Heading 2', shortLabel: 'H2' },
  { level: 3, label: 'Heading 3', shortLabel: 'H3' },
] as const;

const TEXT_COLORS = [
  { color: null, label: 'Default', className: 'bg-foreground' },
  { color: '#dc2626', label: 'Red', className: 'bg-red-500' },
  { color: '#ea580c', label: 'Orange', className: 'bg-orange-500' },
  { color: '#ca8a04', label: 'Yellow', className: 'bg-yellow-600' },
  { color: '#16a34a', label: 'Green', className: 'bg-green-600' },
  { color: '#2563eb', label: 'Blue', className: 'bg-blue-600' },
  { color: '#7c3aed', label: 'Purple', className: 'bg-purple-600' },
  { color: '#db2777', label: 'Pink', className: 'bg-pink-500' },
  { color: '#64748b', label: 'Gray', className: 'bg-slate-500' },
];

const HIGHLIGHT_COLORS = [
  { color: null, label: 'None', className: 'bg-transparent border border-border' },
  { color: '#fef08a', label: 'Yellow', className: 'bg-yellow-200' },
  { color: '#bbf7d0', label: 'Green', className: 'bg-green-200' },
  { color: '#bfdbfe', label: 'Blue', className: 'bg-blue-200' },
  { color: '#fbcfe8', label: 'Pink', className: 'bg-pink-200' },
  { color: '#e9d5ff', label: 'Purple', className: 'bg-purple-200' },
  { color: '#fed7aa', label: 'Orange', className: 'bg-orange-200' },
];

function ToolbarBtn({ 
  onClick, isActive = false, children, title, disabled = false, className: extraClass
}: { 
  onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string; disabled?: boolean; className?: string;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-7 w-7 p-0 rounded-sm hover:bg-muted",
              isActive && "bg-accent text-accent-foreground",
              extraClass
            )}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ToolbarDivider() {
  return <Separator orientation="vertical" className="h-5 mx-0.5" />;
}

function HeadingDropdown({ editor }: { editor: Editor }) {
  const currentLevel = HEADING_OPTIONS.find(
    h => h.level > 0 && editor.isActive('heading', { level: h.level })
  );
  const label = currentLevel?.shortLabel || 'Normal';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button" variant="ghost" size="sm"
          className="h-7 px-2 gap-0.5 text-xs font-medium rounded-sm min-w-[70px] justify-between"
        >
          <Type className="h-3.5 w-3.5 mr-1 shrink-0" />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {HEADING_OPTIONS.map((h) => (
          <DropdownMenuItem
            key={h.level}
            onClick={() => {
              if (h.level === 0) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: h.level as 1 | 2 | 3 }).run();
              }
            }}
            className={cn(
              h.level === 0 && !currentLevel && "bg-accent",
              h.level > 0 && editor.isActive('heading', { level: h.level }) && "bg-accent",
              h.level === 1 && "text-lg font-bold",
              h.level === 2 && "text-base font-semibold",
              h.level === 3 && "text-sm font-medium",
            )}
          >
            {h.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TextColorPicker({ editor }: { editor: Editor }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-sm" title="Text color">
          <div className="flex flex-col items-center">
            <Palette className="h-3.5 w-3.5" />
            <div className="w-3.5 h-0.5 rounded-full bg-foreground mt-px" 
              style={{ backgroundColor: editor.getAttributes('textStyle')?.color || undefined }}
            />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">Text color</p>
        <div className="flex gap-1">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.label}
              onClick={() => {
                if (c.color) editor.chain().focus().setColor(c.color).run();
                else editor.chain().focus().unsetColor().run();
              }}
              title={c.label}
              className={cn("w-5 h-5 rounded-full border border-border/50 hover:scale-110 transition-transform", c.className)}
            />
          ))}
        </div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5 mt-2 px-1">Highlight</p>
        <div className="flex gap-1">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.label}
              onClick={() => {
                if (c.color) editor.chain().focus().toggleHighlight({ color: c.color }).run();
                else editor.chain().focus().unsetHighlight().run();
              }}
              title={c.label}
              className={cn("w-5 h-5 rounded-full border border-border/50 hover:scale-110 transition-transform", c.className)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ListStyleDropdown({ editor, onToggleOrderedList }: { editor: Editor; onToggleOrderedList: () => void }) {
  const listStyles = [
    { type: '1', label: '1, 2, 3 (Numeric)', example: '1.' },
    { type: 'a', label: 'a, b, c (Alpha)', example: 'a.' },
    { type: 'A', label: 'A, B, C (Alpha)', example: 'A.' },
    { type: 'i', label: 'i, ii, iii (Roman)', example: 'i.' },
    { type: 'I', label: 'I, II, III (Roman)', example: 'I.' },
  ] as const;

  const setOrderedListType = (listType: '1' | 'a' | 'A' | 'i' | 'I') => {
    return editor
      .chain()
      .focus()
      .command(({ state, tr, dispatch }) => {
        let changed = false;
        const processedPositions = new Set<number>();

        for (const range of state.selection.ranges) {
          state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
            if (node.type.name !== 'orderedList' || processedPositions.has(pos)) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, type: listType });
            processedPositions.add(pos);
            changed = true;
          });
        }

        if (!changed) {
          for (let depth = state.selection.$from.depth; depth > 0; depth--) {
            const node = state.selection.$from.node(depth);
            if (node.type.name !== 'orderedList') continue;
            const pos = state.selection.$from.before(depth);
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, type: listType });
            changed = true;
            break;
          }
        }

        if (changed && dispatch) dispatch(tr.scrollIntoView());
        return changed;
      })
      .run();
  };

  const applyListStyle = (listType: '1' | 'a' | 'A' | 'i' | 'I') => {
    const { from, to } = editor.state.selection;

    const ensuredList = editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .command(({ state, commands }) => {
        let inOrderedList = false;
        for (let depth = state.selection.$from.depth; depth > 0; depth--) {
          if (state.selection.$from.node(depth).type.name === 'orderedList') {
            inOrderedList = true;
            break;
          }
        }
        return inOrderedList || commands.toggleOrderedList();
      })
      .run();

    if (!ensuredList) return;

    const updated = editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .updateAttributes('orderedList', { type: listType })
      .run();

    if (!updated) {
      setOrderedListType(listType);
    }
  };

  const activeType = (editor.getAttributes('orderedList')?.type as '1' | 'a' | 'A' | 'i' | 'I' | undefined) || '1';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            "h-7 px-1.5 gap-0.5 rounded-sm hover:bg-muted",
            editor.isActive('orderedList') && "bg-accent text-accent-foreground"
          )}
          title="Numbered list styles"
        >
          <ListOrdered className="h-3.5 w-3.5" />
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {listStyles.map((s) => (
          <DropdownMenuItem
            key={s.type}
            onPointerDown={(e) => e.preventDefault()}
            className={cn(editor.isActive('orderedList') && activeType === s.type && 'bg-accent')}
            onClick={() => applyListStyle(s.type)}
          >
            <span className="w-6 text-xs font-mono text-muted-foreground mr-2">{s.example}</span>
            {s.label}
          </DropdownMenuItem>
        ))}
        {editor.isActive('orderedList') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPointerDown={(e) => e.preventDefault()}
              onClick={onToggleOrderedList}
              className="text-destructive focus:text-destructive"
            >
              <ListOrdered className="h-4 w-4 mr-2" />
              Remove numbered list
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AlignmentDropdown({ editor }: { editor: Editor }) {
  const alignments = [
    { value: 'left', icon: AlignLeft, label: 'Align left' },
    { value: 'center', icon: AlignCenter, label: 'Align center' },
    { value: 'right', icon: AlignRight, label: 'Align right' },
    { value: 'justify', icon: AlignJustify, label: 'Justify' },
  ] as const;

  const current = alignments.find(a => editor.isActive({ textAlign: a.value })) || alignments[0];
  const Icon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-sm" title="Text alignment">
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {alignments.map((a) => (
          <DropdownMenuItem
            key={a.value}
            onClick={() => editor.chain().focus().setTextAlign(a.value).run()}
            className={cn(editor.isActive({ textAlign: a.value }) && "bg-accent")}
          >
            <a.icon className="h-4 w-4 mr-2" />
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InsertDropdown({ 
  editor, onAddImageUrl, onAddGraphPlaceholder, onUploadClick, onOpenDrive, onAutoFormat, onImportHtml 
}: { 
  editor: Editor; onAddImageUrl: () => void; onAddGraphPlaceholder: () => void; onUploadClick: () => void; onOpenDrive: () => void; onAutoFormat: () => void; onImportHtml: () => void; 
}) {
  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs rounded-sm">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Insert</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem onClick={onAddImageUrl}>
          <ImageIcon className="h-4 w-4 mr-2" /> Image by URL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onUploadClick}>
          <Upload className="h-4 w-4 mr-2" /> Upload from device
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenDrive}>
          <FolderOpen className="h-4 w-4 mr-2" /> Google Drive image
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddGraphPlaceholder}>
          <BarChart3 className="h-4 w-4 mr-2" /> Graph placeholder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <TableIcon className="h-4 w-4 mr-2" /> Table
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuItem onClick={() => insertTable(3, 3)}>
              <Plus className="h-4 w-4 mr-2" /> 3×3 Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertTable(4, 2)}>
              <Plus className="h-4 w-4 mr-2" /> 4×2 Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertTable(2, 4)}>
              <Plus className="h-4 w-4 mr-2" /> 2×4 Table
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4 mr-2" /> Horizontal rule
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4 mr-2" /> Code block
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onImportHtml}>
          <Code className="h-4 w-4 mr-2" /> Import HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAutoFormat}>
          <Wand2 className="h-4 w-4 mr-2" /> Auto-format content
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableActions({ editor }: { editor: Editor }) {
  if (!editor.isActive('table')) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs rounded-sm border-primary/30 text-primary">
          <TableIcon className="h-3.5 w-3.5" /> Table
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
          <Columns className="h-4 w-4 mr-2" /> Add column after
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
          <Columns className="h-4 w-4 mr-2" /> Add column before
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete column
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
          <Rows className="h-4 w-4 mr-2" /> Add row after
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
          <Rows className="h-4 w-4 mr-2" /> Add row before
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete row
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
          <TableIcon className="h-4 w-4 mr-2" /> Toggle header
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EditorToolbar({
  editor,
  onAutoFormat,
  onOpenDrive,
  onUploadClick,
  onAddImageUrl,
  onAddGraphPlaceholder,
  onAddLink,
  onToggleBulletList,
  onToggleOrderedList,
  onImportHtml,
  isUploading,
}: EditorToolbarProps) {
  return (
    <div className="border-b bg-muted/20">
      {/* Row 1: Undo/Redo + Heading + Text formatting + Alignment */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 flex-wrap">
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
          <Undo className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
          <Redo className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        <HeadingDropdown editor={editor} />

        <ToolbarDivider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <TextColorPicker editor={editor} />

        <ToolbarDivider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript">
          <Subscript className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript">
          <Superscript className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        <AlignmentDropdown editor={editor} />

        <ToolbarDivider />

        <ToolbarBtn onClick={onToggleBulletList} isActive={editor.isActive('bulletList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ListStyleDropdown editor={editor} onToggleOrderedList={onToggleOrderedList} />
        <ToolbarBtn
          onClick={() => {
            const ok = editor.chain().focus().toggleBlockquote().run();
            if (!ok) {
              editor.chain().focus().setParagraph().toggleBlockquote().run();
            }
          }}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline code">
          <Code className="h-3.5 w-3.5" />
        </ToolbarBtn>
      </div>

      {/* Row 2: Insert + Link + Drive + Table actions */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-t border-border/30 flex-wrap">
        <InsertDropdown 
          editor={editor} 
          onAddImageUrl={onAddImageUrl} 
          onAddGraphPlaceholder={onAddGraphPlaceholder} 
          onUploadClick={onUploadClick} 
          onOpenDrive={onOpenDrive}
          onAutoFormat={onAutoFormat} 
          onImportHtml={onImportHtml}
        />

        <ToolbarDivider />

        <ToolbarBtn onClick={onAddLink} isActive={editor.isActive('link')} title="Insert link (Ctrl+K)">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={onUploadClick} disabled={isUploading} title="Upload image from device">
          <Upload className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={onOpenDrive} title="Browse Google Drive">
          <FolderOpen className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <TableActions editor={editor} />

        {/* Word count - right aligned */}
        <div className="ml-auto text-[10px] text-muted-foreground tabular-nums pr-1 hidden sm:block">
          {editor.storage.characterCount?.words?.() || editor.getText().split(/\s+/).filter(Boolean).length} words
        </div>
      </div>
    </div>
  );
}
