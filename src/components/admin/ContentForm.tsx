import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Send, Upload, X, FileText, Image as ImageIcon, Sparkles, Clock, RotateCcw, EyeOff, Globe, Plus, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from './RichTextEditor';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveImageUrl } from '@/lib/imageUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const STORAGE_PREFIX = 'alfred-autosave:';

interface AutoSaveData {
  formData: Record<string, any>;
  savedAt: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'richtext' | 'select' | 'number' | 'datetime-local' | 'url' | 'tags' | 'checkbox' | 'image' | 'file' | 'category-combobox';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  accept?: string;
  /** Conditionally show this field when another field has a specific value */
  showWhen?: { field: string; value: string };
  /** For category-combobox: callback when user adds a brand new category */
  onAddOption?: (newValue: string) => void;
}

interface ContentFormProps {
  title: string;
  fields: FormField[];
  /**
   * Which content type this is, so the draft comes back in the right shape.
   * It used to be read off `storageKey`, which ONLY BlogAdmin passes — so
   * every other content type silently asked for a blog article.
   */
  contentType?: string;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>, status: 'draft' | 'published') => Promise<void>;
  onValuesChange?: (data: Record<string, any>) => void;
  backPath: string;
  isLoading?: boolean;
  autoDetectCategory?: boolean;
  /** Unique key for auto-save storage (e.g., 'guide:123' or 'blog:new') */
  storageKey?: string;
}

// Detect if content is a playbook or guide based on text
const detectContentType = (text: string): 'Playbook' | 'Implementation' | null => {
  const lower = text.toLowerCase();
  const playbookKeywords = ['playbook', 'framework', 'strategy', 'blueprint', 'methodology', 'roadmap', 'handbook'];
  const guideKeywords = ['guide', 'how-to', 'tutorial', 'step-by-step', 'walkthrough', 'best practices', 'checklist', 'template'];
  
  if (playbookKeywords.some(k => lower.includes(k))) return 'Playbook';
  if (guideKeywords.some(k => lower.includes(k))) return 'Implementation';
  return null;
};

// Deep comparison to check if form has changed
const hasFormChanged = (current: Record<string, any>, initial: Record<string, any>): boolean => {
  const currentKeys = Object.keys(current).filter(k => current[k] !== undefined && current[k] !== '');
  const initialKeys = Object.keys(initial).filter(k => initial[k] !== undefined && initial[k] !== '');
  
  const allKeys = new Set([...currentKeys, ...initialKeys]);
  
  for (const key of allKeys) {
    const currentVal = current[key];
    const initialVal = initial[key];
    
    // Handle arrays (like tags)
    if (Array.isArray(currentVal) && Array.isArray(initialVal)) {
      if (currentVal.length !== initialVal.length) return true;
      if (currentVal.some((v, i) => v !== initialVal[i])) return true;
    } else if (currentVal !== initialVal) {
      // Skip if both are falsy (empty string vs undefined)
      if (!currentVal && !initialVal) continue;
      return true;
    }
  }
  return false;
};

export function ContentForm({
  title,
  fields: incomingFields,
  contentType,
  initialData = {},
  onSubmit,
  onValuesChange,
  backPath,
  isLoading = false,
  autoDetectCategory = false,
  storageKey
}: ContentFormProps) {
  /**
   * SEARCH & SOCIAL, added once here rather than seven times.
   *
   * Every content type now carries seo_title and seo_description, so the fields
   * belong to the shared editor rather than to each page's own field list —
   * seven copies of the same two fields is how the peek and the record drifted
   * apart, and how the chat button and the chat ended up with two lists of
   * routes. One list.
   *
   * They are OVERRIDES, not replacements, and the placeholders say so. The blog
   * post page already feeds `post.title` and `post.excerpt` to the SEO
   * component, so leaving both blank keeps exactly today's behaviour and
   * filling one takes precedence. That matters because 84 posts exist right now
   * with both columns null: the feature has to be additive on day one or it
   * silently blanks every meta description on the site.
   */
  const fields: FormField[] = [
    ...incomingFields,
    {
      name: 'seo_title',
      label: 'SEO title',
      type: 'text',
      placeholder: 'Leave blank to use the title above',
    },
    {
      name: 'seo_description',
      label: 'SEO description',
      type: 'textarea',
      placeholder: 'Leave blank to use the excerpt. Around 155 characters shows in full.',
    },
    {
      // Scheduling, added 8 Sep. Deliberately worded as what it DOES rather
      // than as a date field: it only ever applies to a draft, and it is easy
      // to set a date on something already published and assume it moved.
      name: 'scheduled_for',
      label: 'Publish automatically at',
      type: 'datetime-local',
      placeholder: 'Leave blank to publish by hand',
    },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagsInput, setTagsInput] = useState<Record<string, string>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [autoDetectedCategory, setAutoDetectedCategory] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const savedInitialData = useRef(initialData);
  const hasSubmitted = useRef(false);
  // Snapshot of initialData at mount + one-shot guard so the recovery dialog
  // check runs EXACTLY once and never re-fires when the parent re-creates
  // `initialData` on ordinary edits (e.g. image uploads).
  const initialDataRef = useRef(initialData);
  const hasCheckedRecovery = useRef(false);

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveredData, setRecoveredData] = useState<AutoSaveData | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate storage key from backPath and URL params
  const getStorageKey = useCallback(() => {
    if (storageKey) return `${STORAGE_PREFIX}${storageKey}`;
    // Extract content type from backPath (e.g., /admin/guides -> guide)
    const pathParts = backPath.split('/');
    const contentType = pathParts[pathParts.length - 1]?.replace(/s$/, '') || 'content';
    // Extract id from URL if editing
    const urlParams = new URLSearchParams(location.search);
    const id = urlParams.get('id') || 'new';
    return `${STORAGE_PREFIX}${contentType}:${id}`;
  }, [storageKey, backPath, location.search]);

  // Save to localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      const key = getStorageKey();
      const data: AutoSaveData = {
        formData,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
      setLastAutoSave(new Date());
      setAutoSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Storage might be full, show a warning but don't block
      toast.warning('Auto-save failed - storage may be full');
    }
  }, [formData, getStorageKey]);

  // Clear localStorage
  const clearLocalStorage = useCallback(() => {
    try {
      const key = getStorageKey();
      localStorage.removeItem(key);
      setAutoSaveStatus('idle');
      setLastAutoSave(null);
    } catch (error) {
      console.error('Failed to clear auto-save:', error);
    }
  }, [getStorageKey]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): AutoSaveData | null => {
    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      return JSON.parse(stored) as AutoSaveData;
    } catch (error) {
      console.error('Failed to load auto-save:', error);
      return null;
    }
  }, [getStorageKey]);

  // Track if form is dirty (has unsaved changes)
  const isDirty = useCallback(() => {
    if (hasSubmitted.current) return false;
    return hasFormChanged(formData, savedInitialData.current);
  }, [formData]);

  // Check for recovered data on mount — EXACTLY ONCE. The parent re-creates
  // `initialData` as a new object on every render (e.g. an image upload updates
  // formData → parent re-renders), so listing it (or the localStorage
  // callbacks that close over it) in deps would re-fire this and re-open the
  // dialog mid-edit. We guard with a one-shot ref, read initialData from a
  // mount-time snapshot, and pass an empty dependency array.
  useEffect(() => {
    if (hasCheckedRecovery.current) return;
    hasCheckedRecovery.current = true;

    const saved = loadFromLocalStorage();
    if (saved && saved.formData && Object.keys(saved.formData).length > 0) {
      // Expire drafts older than 24 hours
      const savedTime = new Date(saved.savedAt).getTime();
      const isExpired = Date.now() - savedTime > 24 * 60 * 60 * 1000;
      if (isExpired) {
        clearLocalStorage();
        return;
      }
      // Check if saved data is different from the initial data captured at mount
      if (hasFormChanged(saved.formData, initialDataRef.current)) {
        setRecoveredData(saved);
        setShowRecoveryDialog(true);
      } else {
        // Same data, just clear it
        clearLocalStorage();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Auto-save interval
  useEffect(() => {
    // Only start auto-save after initial data is loaded and form is dirty
    if (isLoading) return;

    autoSaveIntervalRef.current = setInterval(() => {
      if (isDirty() && !hasSubmitted.current) {
        setAutoSaveStatus('saving');
        saveToLocalStorage();
      }
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isDirty, saveToLocalStorage, isLoading]);

  // Handle browser back/refresh with beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Update formData when initialData changes (e.g., when editing item is loaded)
  useEffect(() => {
    if (Object.keys(initialData).length === 0) return;
    // Only adopt a new baseline when it actually differs from what the user
    // currently has. In create mode the parent feeds the live values back in as
    // `initialData`; without this guard every keystroke re-set formData, which
    // reset the rich-text editor's content prop and made typing impossible
    // (caret jump / lost input). Comparing against current values breaks that loop.
    setFormData((prev) => {
      if (!hasFormChanged(initialData, prev)) return prev;
      savedInitialData.current = initialData;
      return initialData;
    });
  }, [initialData]);

  // Notify parent of value changes for live preview. Done in an effect (not
  // inside the setState updater) so we never call the parent's setState during
  // render — that caused a render loop that blocked rich-text input.
  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;
  const hasNotified = useRef(false);
  useEffect(() => {
    // Skip the very first run so we don't echo the initial data straight back.
    if (!hasNotified.current) {
      hasNotified.current = true;
      return;
    }
    onValuesChangeRef.current?.(formData);
  }, [formData]);



  // Handle recovery dialog actions
  const handleRestoreRecovery = () => {
    if (recoveredData) {
      setFormData(recoveredData.formData);
      savedInitialData.current = recoveredData.formData; // Update baseline so isDirty() returns false
      onValuesChange?.(recoveredData.formData);
      toast.success('Draft restored successfully');
    }
    clearLocalStorage(); // Clear the stored draft so it won't pop up again
    setShowRecoveryDialog(false);
    setRecoveredData(null);
  };

  const handleDiscardRecovery = () => {
    clearLocalStorage();
    setShowRecoveryDialog(false);
    setRecoveredData(null);
  };

  // Format relative time for auto-save indicator
  const getAutoSaveTimeAgo = () => {
    if (!lastAutoSave) return null;
    const seconds = Math.floor((Date.now() - lastAutoSave.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const [isDrafting, setIsDrafting] = useState(false);

  /**
   * Ask the model for a draft.
   *
   * FILLS EMPTY FIELDS ONLY. If there is already a title, an excerpt or any
   * content, that text stays exactly as it is and the draft is reported as
   * skipped for that field. Overwriting an editor's half-written paragraph with
   * generated prose is not a feature, and "it replaced what I had written" is
   * the one complaint that would retire this button permanently.
   *
   * Nothing is saved here either — the edge function writes to no table, and
   * this only moves text into the form. Publishing stays a person pressing
   * publish.
   */
  /**
   * The draft can only fill fields this content type actually HAS.
   *
   * It used to write title, excerpt and content unconditionally. Only
   * blog_posts has all three: guides, webinars and documentation have no
   * `excerpt`, job_openings has neither `excerpt` nor `content` (it uses
   * description/responsibilities), and testimonials and faqs have no `title`.
   * The page hands the whole formData to insert/update, so a drafted excerpt
   * on a guide made the row unsaveable — an editor could write a full guide
   * and then be unable to save it, with a raw PostgREST error about an unknown
   * column. Worse than the feature not existing.
   *
   * `fields` is the page's own declaration of what it has, so it is the honest
   * source for this rather than a hardcoded list kept in step by hand — which
   * is the same two-copies-of-one-fact shape as the chat route lists.
   */
  const fieldNames = new Set(fields.map((f) => f.name));
  const draftable = (['title', 'excerpt', 'content'] as const).filter((k) => fieldNames.has(k));
  /** What the model drafts FROM. Title where there is one, else the first text field. */
  const topicField =
    fieldNames.has('title')
      ? 'title'
      : fields.find((f) => f.type === 'text' || f.type === 'textarea')?.name ?? null;
  const canDraft = draftable.length > 0 && topicField !== null;

  const handleAiDraft = async () => {
    if (!canDraft || !topicField) return;
    const topic = String(formData[topicField] ?? '').trim();
    if (!topic) {
      const label = fields.find((f) => f.name === topicField)?.label ?? topicField;
      toast.error(`Give it a ${label.toLowerCase()} first — that is the topic it drafts from.`);
      return;
    }
    setIsDrafting(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content-draft', {
        body: { contentType: contentType ?? storageKey?.split(':')[0] ?? 'blog', topic },
      });
      if (error) throw error;
      const draft = (data as { draft?: Record<string, string> } | null)?.draft;
      if (!draft) throw new Error('No draft came back.');

      const filled: string[] = [];
      const kept: string[] = [];
      for (const key of draftable) {
        const incoming = draft[key]?.trim();
        if (!incoming) continue;
        if (String(formData[key] ?? '').trim()) { kept.push(key); continue; }
        handleChange(key, incoming);
        filled.push(key);
      }

      if (filled.length === 0) {
        toast.info('Nothing was empty, so nothing was replaced.');
      } else {
        toast.success(
          `Drafted ${filled.join(', ')}.` +
          (kept.length ? ` Left your ${kept.join(' and ')} alone.` : '') +
          ' Nothing is saved until you save it.',
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Draft failed: ${message}`);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleChange = (name: string, value: any) => {
    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-detect category from title if enabled and category not already set
      if (autoDetectCategory && name === 'title' && typeof value === 'string') {
        const detected = detectContentType(value);
        if (detected && !prev.category) {
          updated.category = detected;
          setAutoDetectedCategory(detected);
        }
      }
      
      // Clear auto-detected indicator if user manually changes category
      if (name === 'category') {
        setAutoDetectedCategory(null);
      }
      
      return updated;
    });
  };

  const handleTagsKeyDown = (e: React.KeyboardEvent, fieldName: string) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagsInput[fieldName]?.trim();
      if (tag) {
        const currentTags = formData[fieldName] || [];
        if (!currentTags.includes(tag)) {
          handleChange(fieldName, [...currentTags, tag]);
        }
        setTagsInput((prev) => ({ ...prev, [fieldName]: '' }));
      }
    }
  };

  const removeTag = (fieldName: string, tagToRemove: string) => {
    const currentTags = formData[fieldName] || [];
    handleChange(fieldName, currentTags.filter((t: string) => t !== tagToRemove));
  };

  const handleFileUpload = async (fieldName: string, file: File, isImage: boolean) => {
    setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${isImage ? 'images' : 'files'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      handleChange(fieldName, publicUrl);
      toast.success(`${isImage ? 'Image' : 'File'} uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    // Validate required fields
    const missingRequired = fields.filter((field) => {
      if (!field.required) return false;
      const value = formData[field.name];

      // Treat whitespace-only strings as empty
      if (typeof value === 'string') {
        return value.trim() === '';
      }

      return value === undefined || value === null || value === '';
    });

    // Validate select fields have valid values (not empty strings or placeholder values)
    const invalidSelects = fields.filter((field) => {
      if (field.type !== 'select' || !field.required) return false;
      const value = formData[field.name];
      // Check if value is empty, undefined, or a placeholder value like 'none' or 'auto' when it shouldn't be
      return !value || value === '' || value === 'none';
    });

    const allErrors = [...missingRequired, ...invalidSelects.filter(f => !missingRequired.includes(f))];

    if (allErrors.length > 0) {
      // Set error state for missing/invalid fields
      const errors: Record<string, boolean> = {};
      allErrors.forEach(field => {
        errors[field.name] = true;
      });
      setFieldErrors(errors);
      
      const fieldNames = allErrors.map(f => f.label).join(', ');
      toast.error(`Please fill in required fields: ${fieldNames}`);
      return;
    }

    // Clear errors on successful validation
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      await onSubmit(formData, status);
      hasSubmitted.current = true; // Mark as submitted to prevent blocking navigation
      clearLocalStorage(); // Clear auto-saved data on successful submit
      toast.success(status === 'published' ? 'Published successfully!' : 'Saved as draft');
      navigate(backPath);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    if (isDirty()) {
      setShowUnsavedDialog(true);
      setPendingNavigation(() => () => navigate(backPath));
    } else {
      navigate(backPath);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    hasSubmitted.current = true; // Prevent blocking navigation
    clearLocalStorage(); // Clear auto-saved data when discarding
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleKeepEditing = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  const handleQuickSave = async (status: 'draft' | 'published') => {
    setShowUnsavedDialog(false);
    await handleSubmit(status);
  };

  const renderFileUpload = (field: FormField, isImage: boolean) => {
    const currentValue = formData[field.name];
    const isUploading = uploadingFields[field.name];

    return (
      <div className="space-y-3">
        {currentValue && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
            {isImage ? (
              <img src={resolveImageUrl(currentValue)} alt="Preview" className="w-16 h-16 object-cover rounded-md" loading="lazy" decoding="async" />
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {isImage ? 'Image uploaded' : 'File uploaded'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{currentValue}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear this field"
              onClick={() => handleChange(field.name, '')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            ref={el => fileInputRefs.current[field.name] = el}
            type="file"
            accept={isImage ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(field.name, file, isImage);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRefs.current[field.name]?.click()}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isImage ? (
              <ImageIcon className="w-4 h-4 mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? 'Uploading...' : `Upload ${isImage ? 'Image' : 'File'}`}
          </Button>
          <Input
            placeholder={field.placeholder || `Or enter ${isImage ? 'image' : 'file'} URL`}
            value={currentValue || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
    );
  };

  // Show loading skeleton while fetching data
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.slice(0, 5).map((field) => (
              <div key={field.name} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" aria-label="Go back" onClick={handleBackClick}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {/* Hidden, not disabled, where there is nothing it could fill —
                  a testimonial and an FAQ have no title, excerpt or content
                  column at all, so the button could only ever error. A
                  disabled control still advertises a feature that does not
                  apply here. */}
              {canDraft && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAiDraft}
                disabled={isDrafting}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {isDrafting ? 'Drafting…' : 'Draft with AI'}
              </Button>
              )}
            </div>
            {/* Auto-save status indicator */}
            {autoSaveStatus !== 'idle' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {autoSaveStatus === 'saving' ? (
                  <span>Saving...</span>
                ) : (
                  <span>Auto-saved {getAutoSaveTimeAgo()}</span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((field) => {
            // Check conditional visibility
            if (field.showWhen) {
              const conditionMet = formData[field.showWhen.field] === field.showWhen.value;
              if (!conditionMet) return null;
            }

            return (
            <div key={field.name} className={field.type === 'checkbox' ? 'flex items-center gap-3' : 'space-y-2'}>
              {field.type === 'checkbox' ? (
                <>
                  <Checkbox
                    id={field.name}
                    checked={!!formData[field.name]}
                    onCheckedChange={(checked) => handleChange(field.name, checked)}
                  />
                  <Label htmlFor={field.name} className="cursor-pointer">
                    {field.label}
                  </Label>
                </>
              ) : (
                <>
                  <Label htmlFor={field.name} className={fieldErrors[field.name] ? 'text-destructive' : ''}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
              
                  {field.type === 'text' && (
                    <Input
                      id={field.name}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className={fieldErrors[field.name] ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                  )}
              
              {field.type === 'url' && (
                <Input
                  id={field.name}
                  type="url"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder || 'https://...'}
                  className={fieldErrors[field.name] ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
              )}

              {field.type === 'image' && renderFileUpload(field, true)}
              
              {field.type === 'file' && renderFileUpload(field, false)}
              
              {field.type === 'number' && (
                <Input
                  id={field.name}
                  type="number"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, parseInt(e.target.value) || 0)}
                  placeholder={field.placeholder}
                  className={fieldErrors[field.name] ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
              )}
              
              {field.type === 'datetime-local' && (
                <Input
                  id={field.name}
                  type="datetime-local"
                  value={formData[field.name] ? new Date(formData[field.name]).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleChange(field.name, e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className={fieldErrors[field.name] ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
              )}
              
              {field.type === 'textarea' && (
                <Textarea
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className={fieldErrors[field.name] ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
              )}

              {field.type === 'richtext' && (
                <RichTextEditor
                  content={formData[field.name] || ''}
                  onChange={(content) => handleChange(field.name, content)}
                  placeholder={field.placeholder}
                />
              )}
              
              {field.type === 'select' && field.options && (
                <div className="space-y-2">
                  <Select
                    value={formData[field.name] || ''}
                    onValueChange={(value) => handleChange(field.name, value)}
                  >
                    <SelectTrigger className={fieldErrors[field.name] ? 'border-destructive focus:ring-destructive' : ''}>
                      <SelectValue placeholder={field.placeholder || 'Select...'} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      {field.options
                        .filter(option => option.value !== '') // Filter out empty string values
                        .map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {autoDetectedCategory && field.name === 'category' && formData.category === autoDetectedCategory && (
                    <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                      <Sparkles className="w-3 h-3" />
                      Auto-detected from title
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Category Combobox: dropdown with existing options + "Add new" */}
              {field.type === 'category-combobox' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Select
                        value={formData[field.name] || ''}
                        onValueChange={(value) => {
                          if (value === '__add_new__') return;
                          handleChange(field.name, value);
                        }}
                      >
                        <SelectTrigger className={fieldErrors[field.name] ? 'border-destructive focus:ring-destructive' : ''}>
                          <SelectValue placeholder={field.placeholder || 'Select category...'} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border z-50">
                          {(field.options || []).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                          {/* Divider + add new inline */}
                          {(field.options || []).length > 0 && (
                            <div className="my-1 border-t border-border" />
                          )}
                          <div className="px-2 pb-1">
                            <div className="flex gap-1.5">
                              <Input
                                className="h-7 text-xs"
                                placeholder="New category..."
                                value={tagsInput[`${field.name}__new`] || ''}
                                onChange={(e) => setTagsInput(prev => ({ ...prev, [`${field.name}__new`]: e.target.value }))}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = (tagsInput[`${field.name}__new`] || '').trim();
                                    if (val) {
                                      handleChange(field.name, val);
                                      field.onAddOption?.(val);
                                      setTagsInput(prev => ({ ...prev, [`${field.name}__new`]: '' }));
                                    }
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const val = (tagsInput[`${field.name}__new`] || '').trim();
                                  if (val) {
                                    handleChange(field.name, val);
                                    field.onAddOption?.(val);
                                    setTagsInput(prev => ({ ...prev, [`${field.name}__new`]: '' }));
                                  }
                                }}
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData[field.name] && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        aria-label="Clear category"
                        onClick={() => handleChange(field.name, '')}
                        title="Clear category"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {formData[field.name] && (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {formData[field.name]}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {field.type === 'tags' && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(formData[field.name] || []).map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(field.name, tag)}
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    value={tagsInput[field.name] || ''}
                    onChange={(e) => setTagsInput((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    onKeyDown={(e) => handleTagsKeyDown(e, field.name)}
                    placeholder="Type and press Enter to add tags"
                  />
                </div>
              )}
              </>
              )}
            </div>
            );
          })}

          {(() => {
            const isAlreadyPublished = initialData?.status === 'published';
            return (
              <div className="flex gap-3 pt-4">
                {isAlreadyPublished ? (
                  /* Already published — offer Unpublish + Update Published */
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleSubmit('draft')}
                      disabled={isSubmitting || isLoading}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <EyeOff className="h-4 w-4 mr-2" />
                      )}
                      Unpublish
                    </Button>
                    <Button
                      onClick={() => handleSubmit('published')}
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Globe className="h-4 w-4 mr-2" />
                      )}
                      Update Published
                    </Button>
                  </>
                ) : (
                  /* Draft / new — offer Save Draft + Publish */
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleSubmit('draft')}
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Draft
                    </Button>
                    <Button
                      onClick={() => handleSubmit('published')}
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Publish
                    </Button>
                  </>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {formContent}
      
      {/* Recovery Dialog */}
      <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Recovered Unsaved Work
            </AlertDialogTitle>
            <AlertDialogDescription>
              We found an auto-saved draft from{' '}
              <span className="font-medium text-foreground">
                {recoveredData?.savedAt
                  ? new Date(recoveredData.savedAt).toLocaleString()
                  : 'earlier'}
              </span>
              . Would you like to restore it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleDiscardRecovery} className="mt-0">
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreRecovery}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-4">
            {initialData?.status === 'published' ? (
              <>
                <Button
                  onClick={() => handleQuickSave('draft')}
                  variant="outline"
                  className="w-full justify-start border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={isSubmitting}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Unpublish
                </Button>
                <Button
                  onClick={() => handleQuickSave('published')}
                  className="w-full justify-start"
                  disabled={isSubmitting}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Update Published
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => handleQuickSave('draft')}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={isSubmitting}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleQuickSave('published')}
                  className="w-full justify-start"
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </>
            )}
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleKeepEditing} className="mt-0">
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDiscardChanges} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
