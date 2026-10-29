import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SafeAnimatePresence } from '@/components/ui/safe-animate-presence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, GripVertical, ChevronDown, ChevronRight, Save, Loader2, Pencil, Trash2, FolderCog, Check, X, HelpCircle } from 'lucide-react';
import { ContentTable } from '@/components/admin/ContentTable';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminContentFilters } from '@/components/admin/AdminContentFilters';
import { AdminFilters, getDefaultFilters, filterItems } from '@/components/admin/adminFilters';
import { ContentForm, FormField } from '@/components/admin/ContentForm';
import { LivePreviewPanel } from '@/components/admin/LivePreviewPanel';
import { useAdminContent } from '@/hooks/useAdminContent';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

const NEW_CATEGORY_VALUE = '__new__';

// Generate form fields dynamically based on existing categories
const getFormFields = (existingCategories: string[]): FormField[] => {
  const categoryOptions = [
    ...existingCategories.map(cat => ({ value: cat, label: cat })),
    { value: NEW_CATEGORY_VALUE, label: '+ Create new category' }
  ];

  return [
    { name: 'question', label: 'Question', type: 'text', required: true, placeholder: 'What is your question?' },
    { name: 'answer', label: 'Answer', type: 'richtext', required: true, placeholder: 'Detailed answer to the question' },
    { 
      name: 'category', 
      label: 'Category', 
      type: 'select', 
      options: categoryOptions,
      placeholder: 'Select a category'
    },
    { 
      name: 'new_category', 
      label: 'New Category Name', 
      type: 'text', 
      placeholder: 'Enter new category name',
      required: true,
      showWhen: { field: 'category', value: NEW_CATEGORY_VALUE }
    },
    { name: 'sort_order', label: 'Sort Order', type: 'number', placeholder: '0' }
  ];
};

// Sortable FAQ Item Component
function SortableFAQItem({ 
  faq, 
  onEdit, 
  onPreview,
  onStatusChange 
}: { 
  faq: FAQ; 
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
  onStatusChange: (id: string, status: 'draft' | 'published' | 'archived') => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-all ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{faq.question}</p>
        <p className="text-xs text-muted-foreground">Order: {faq.sort_order}</p>
      </div>
      
      <Badge 
        variant={faq.status === 'published' ? 'default' : 'secondary'}
        className={faq.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
      >
        {faq.status}
      </Badge>
      
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onPreview(faq.id)}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(faq.id)}>
          Edit
        </Button>
      </div>
    </div>
  );
}

// Category Section with Drag & Drop
function CategorySection({
  category,
  faqs,
  onEdit,
  onPreview,
  onStatusChange,
  onReorder,
  isExpanded,
  onToggle,
}: {
  category: string;
  faqs: FAQ[];
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
  onStatusChange: (id: string, status: 'draft' | 'published' | 'archived') => void;
  onReorder: (categoryFaqs: FAQ[]) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = faqs.findIndex(f => f.id === active.id);
      const newIndex = faqs.findIndex(f => f.id === over.id);
      const newOrder = arrayMove(faqs, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">{category}</CardTitle>
            <Badge variant="secondary">{faqs.length} FAQs</Badge>
          </div>
          <Badge 
            className={faqs.every(f => f.status === 'published') 
              ? 'bg-green-500/10 text-green-500 border-green-500/20' 
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }
          >
            {faqs.filter(f => f.status === 'published').length}/{faqs.length} published
          </Badge>
        </div>
      </CardHeader>
      
      <SafeAnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 pb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop to reorder FAQs within this category
              </p>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={faqs.map(f => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {faqs.map((faq) => (
                      <SortableFAQItem
                        key={faq.id}
                        faq={faq}
                        onEdit={onEdit}
                        onPreview={onPreview}
                        onStatusChange={onStatusChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </motion.div>
        )}
      </SafeAnimatePresence>
    </Card>
  );
}

// FAQ Preview Component
function FAQPreview({ faq, isOpen, onClose }: { faq: FAQ | null; isOpen: boolean; onClose: () => void }) {
  if (!faq) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            FAQ Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This is how the FAQ will appear on the public FAQ page.
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all">
            {faq.category && (
              <Badge variant="secondary" className="mb-3">
                {faq.category}
              </Badge>
            )}
            
            <Accordion type="single" collapsible defaultValue="faq-0" className="w-full">
              <AccordionItem value="faq-0" className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-primary transition-colors duration-200">
                  {faq.question || 'Your question will appear here'}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(faq.answer || '<em>Your answer will appear here</em>', {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
                        ALLOWED_ATTR: ['href', 'target', 'rel']
                      })
                    }}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge 
                variant={faq.status === 'published' ? 'default' : 'secondary'}
                className={faq.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
              >
                {faq.status === 'published' ? 'Published' : faq.status === 'draft' ? 'Draft' : 'Archived'}
              </Badge>
            </div>
            {faq.status !== 'published' && (
              <span className="text-muted-foreground italic">
                This FAQ is not yet visible on the public page
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sortable Category Item for ordering
function SortableCategoryItem({
  category,
  faqCount,
  onEdit,
  onDelete,
  isEditing,
  editName,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  isRenaming,
}: {
  category: string;
  faqCount: number;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  editName: string;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isRenaming: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      {isEditing ? (
        <>
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={onSaveEdit}
            disabled={isRenaming}
          >
            {isRenaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-green-500" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancelEdit}
            disabled={isRenaming}
          >
            <X className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1">
            <p className="font-medium text-foreground">{category}</p>
            <p className="text-xs text-muted-foreground">
              {faqCount} FAQ{faqCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}

// Manage Categories Component with ordering
function ManageCategories({
  categories,
  faqCounts,
  onRename,
  onDelete,
  onReorderCategories,
  isOpen,
  onClose,
}: {
  categories: string[];
  faqCounts: Map<string, number>;
  onRename: (oldName: string, newName: string) => Promise<void>;
  onDelete: (category: string, action: 'uncategorize' | 'delete') => Promise<void>;
  onReorderCategories: (newOrder: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync local state when categories prop changes
  useEffect(() => {
    setLocalCategories(categories);
    setHasOrderChanges(false);
  }, [categories]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = localCategories.indexOf(active.id as string);
      const newIndex = localCategories.indexOf(over.id as string);
      const newOrder = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(newOrder);
      setHasOrderChanges(true);
    }
  };

  const handleSaveOrder = () => {
    onReorderCategories(localCategories);
    setHasOrderChanges(false);
    toast.success('Category order saved!');
  };

  const handleStartEdit = (category: string) => {
    setEditingCategory(category);
    setNewName(category);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewName('');
  };

  const handleSaveRename = async () => {
    if (!editingCategory || !newName.trim() || newName.trim() === editingCategory) {
      handleCancelEdit();
      return;
    }
    
    setIsRenaming(true);
    try {
      await onRename(editingCategory, newName.trim());
      handleCancelEdit();
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async (action: 'uncategorize' | 'delete') => {
    if (!deleteCategory) return;
    
    setIsDeleting(true);
    try {
      await onDelete(deleteCategory, action);
      setDeleteCategory(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderCog className="w-5 h-5 text-primary" />
              Manage Categories
            </DialogTitle>
            <DialogDescription>
              Drag to reorder how categories appear on the public FAQ page. Rename or delete categories as needed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {localCategories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No categories found. Categories are created when you add FAQs.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localCategories}
                  strategy={verticalListSortingStrategy}
                >
                  {localCategories.map((category) => (
                    <SortableCategoryItem
                      key={category}
                      category={category}
                      faqCount={faqCounts.get(category) || 0}
                      onEdit={() => handleStartEdit(category)}
                      onDelete={() => setDeleteCategory(category)}
                      isEditing={editingCategory === category}
                      editName={newName}
                      onEditNameChange={setNewName}
                      onSaveEdit={handleSaveRename}
                      onCancelEdit={handleCancelEdit}
                      isRenaming={isRenaming}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {hasOrderChanges && (
              <Button onClick={handleSaveOrder} className="sm:mr-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Category Order
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category: {deleteCategory}</AlertDialogTitle>
            <AlertDialogDescription>
              This category has {faqCounts.get(deleteCategory || '') || 0} FAQ(s). What would you like to do with them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleDelete('uncategorize')}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Move to Uncategorized
            </Button>
            <AlertDialogAction
              onClick={() => handleDelete('delete')}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete All FAQs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Storage key for category order
const CATEGORY_ORDER_KEY = 'faq-category-order';

export default function FAQsAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { items, isLoading, getItem, createItem, updateItem, deleteItem, updateStatus, fetchItems } = useAdminContent<FAQ>('faqs');
  const [editingItem, setEditingItem] = useState<FAQ | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [previewItem, setPreviewItem] = useState<FAQ | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'organize'>('list');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map());
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [liveFormData, setLiveFormData] = useState<Partial<FAQ>>({});
  // No tiles on this page, by design (see contentBands.test.ts): re-checked
  // 25 Oct, all 15 FAQs are published, none edited since 30 Dec, and they sit
  // three to a category, so every possible tile reads 15 or 3.
  const [filters, setFilters] = useState<AdminFilters>(getDefaultFilters());

  const isCreating = location.pathname.endsWith('/new');
  const isEditing = !!id && !isCreating;

  // Reset form state when switching to create mode
  useEffect(() => {
    if (isCreating) {
      setEditingItem(null);
      setLiveFormData({});
    }
  }, [isCreating]);

  // Reset liveFormData when editing a different item
  useEffect(() => {
    if (editingItem) {
      setLiveFormData({});
    }
  }, [editingItem?.id]);

  // Load category order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(CATEGORY_ORDER_KEY);
    if (savedOrder) {
      try {
        setCategoryOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error('Failed to parse category order:', e);
      }
    }
  }, []);

  // Get unique categories from existing FAQs, sorted by custom order
  const existingCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(faq => {
      if (faq.category) {
        categories.add(faq.category);
      }
    });
    
    const allCategories = Array.from(categories);
    
    // Sort by custom order, putting new categories at the end
    return allCategories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [items, categoryOrder]);

  // Handler to save category order
  const handleReorderCategories = (newOrder: string[]) => {
    setCategoryOrder(newOrder);
    localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(newOrder));
  };

  // Generate form fields with dynamic category options
  const formFields = useMemo(() => getFormFields(existingCategories), [existingCategories]);

  // Count FAQs per category
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach(faq => {
      const category = faq.category || 'Uncategorized';
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return counts;
  }, [items]);

  // Group FAQs by category
  const faqsByCategory = useMemo(() => {
    const grouped = new Map<string, FAQ[]>();
    
    items.forEach(faq => {
      const category = faq.category || 'Uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(faq);
    });
    
    // Sort each category by sort_order
    grouped.forEach((faqs, category) => {
      grouped.set(category, faqs.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    });
    
    return grouped;
  }, [items]);

  // Expand all categories by default
  useEffect(() => {
    if (faqsByCategory.size > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(faqsByCategory.keys()));
    }
  }, [faqsByCategory]);

  useEffect(() => {
    if (id && isEditing) {
      setIsLoadingItem(true);
      getItem(id).then((item) => {
        setEditingItem(item);
        setIsLoadingItem(false);
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (data: Record<string, any>, status: 'draft' | 'published') => {
    // Handle new category creation
    const submitData = { ...data };
    if (submitData.category === NEW_CATEGORY_VALUE && submitData.new_category) {
      submitData.category = submitData.new_category.trim();
    }
    delete submitData.new_category;

    if (isEditing && id) {
      await updateItem(id, submitData as Partial<FAQ>, status);
    } else {
      await createItem(submitData as Partial<FAQ>, status);
    }
  };

  const handlePreview = (faqId: string) => {
    const faq = items.find(item => item.id === faqId);
    if (faq) {
      setPreviewItem(faq);
      setIsPreviewOpen(true);
    }
  };

  const handlePreviewFromForm = () => {
    if (editingItem) {
      setPreviewItem(editingItem);
      setIsPreviewOpen(true);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleReorder = (category: string, reorderedFaqs: FAQ[]) => {
    // Update pending changes
    const newPending = new Map(pendingChanges);
    reorderedFaqs.forEach((faq, index) => {
      newPending.set(faq.id, index + 1);
    });
    setPendingChanges(newPending);
  };

  const saveOrder = async () => {
    if (pendingChanges.size === 0) return;
    
    setIsSavingOrder(true);
    try {
      // Update each FAQ's sort_order
      const updates = Array.from(pendingChanges.entries()).map(([id, sort_order]) => 
        supabase
          .from('faqs')
          .update({ sort_order, updated_at: new Date().toISOString() })
          .eq('id', id)
      );
      
      await Promise.all(updates);
      toast.success('Order saved successfully!');
      setPendingChanges(new Map());
      fetchItems();
    } catch (error) {
      toast.error('Failed to save order');
      console.error(error);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ category: newName, updated_at: new Date().toISOString() })
        .eq('category', oldName);
      
      if (error) throw error;
      
      toast.success(`Category renamed to "${newName}"`);
      fetchItems();
    } catch (error) {
      toast.error('Failed to rename category');
      console.error(error);
      throw error;
    }
  };

  const handleDeleteCategory = async (category: string, action: 'uncategorize' | 'delete') => {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('faqs')
          .delete()
          .eq('category', category);
        
        if (error) throw error;
        toast.success(`Deleted all FAQs in "${category}"`);
      } else {
        const { error } = await supabase
          .from('faqs')
          .update({ category: null, updated_at: new Date().toISOString() })
          .eq('category', category);
        
        if (error) throw error;
        toast.success(`Moved FAQs to Uncategorized`);
      }
      
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete category');
      console.error(error);
      throw error;
    }
  };

  if (isCreating || isEditing) {
    const currentPreviewData = { ...editingItem, ...liveFormData };
    const isPublished = currentPreviewData.status === 'published';
    const publicUrl = isPublished ? '/faq' : null;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div>
          <ContentForm
            contentType="faq"
            key={isCreating ? 'new' : (id || 'edit')}
            title={isCreating ? 'Create FAQ' : 'Edit FAQ'}
            fields={formFields}
            initialData={isCreating ? {} : (editingItem || {})}
            onSubmit={handleSubmit}
            onValuesChange={(data) => setLiveFormData(data)}
            backPath="/admin/faqs"
            isLoading={isLoadingItem}
          />
        </div>
        
        {/* Live Preview Panel */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <LivePreviewPanel 
              type="faq" 
              data={currentPreviewData} 
              publicUrl={publicUrl}
            />
          </div>
        </div>
      </div>
    );
  }

  const listItems = filterItems(items, filters, ['question', 'answer', 'category']);

  return (
    <div className="space-y-6">
      {/* Band 1 — title. Save Order and Manage Categories act on the whole
          set, so they sit with the title beside Add New. */}
      <AdminPageHeader
        title="FAQs"
        description="Manage frequently asked questions"
        icon={<HelpCircle className="h-5 w-5 text-primary" />}
        onAdd={() => {
          setEditingItem(null);
          setLiveFormData({});
          navigate('/admin/faqs/new');
        }}
        addLabel="Add New"
        actions={
          <>
            {pendingChanges.size > 0 && (
              <Button size="sm" onClick={saveOrder} disabled={isSavingOrder} variant="outline">
                {isSavingOrder ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Order ({pendingChanges.size})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setIsManageCategoriesOpen(true)}>
              <FolderCog className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
          </>
        }
      />

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'list' | 'organize')}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="organize">Organize by Category</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4 space-y-4">
          {/* The shared content toolbar. No tiles band, by design. */}
          <AdminContentFilters filters={filters} onFiltersChange={setFilters} />
          <ContentTable
            items={listItems}
            onEdit={(id) => navigate(`/admin/faqs/${id}`)}
            onDelete={deleteItem}
            onStatusChange={updateStatus}
            onPreview={handlePreview}
            titleKey="question"
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="organize" className="mt-4">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : faqsByCategory.size === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No FAQs found. Create your first one!
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> Drag and drop FAQs within each category to reorder them. 
                  Changes are saved when you click "Save Order".
                </p>
              </div>
              
              {Array.from(faqsByCategory.entries()).map(([category, faqs]) => (
                <CategorySection
                  key={category}
                  category={category}
                  faqs={faqs.map(f => ({
                    ...f,
                    sort_order: pendingChanges.has(f.id) ? pendingChanges.get(f.id)! : f.sort_order
                  }))}
                  onEdit={(id) => navigate(`/admin/faqs/${id}`)}
                  onPreview={handlePreview}
                  onStatusChange={updateStatus}
                  onReorder={(reordered) => handleReorder(category, reordered)}
                  isExpanded={expandedCategories.has(category)}
                  onToggle={() => toggleCategory(category)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <FAQPreview 
        faq={previewItem} 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
      />

      <ManageCategories
        categories={existingCategories}
        faqCounts={categoryCounts}
        onRename={handleRenameCategory}
        onDelete={handleDeleteCategory}
        onReorderCategories={handleReorderCategories}
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
      />
    </div>
  );
}
