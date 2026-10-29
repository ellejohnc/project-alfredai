import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Edit, Trash2, MoreHorizontal, Eye, EyeOff, Archive, FileText, Star, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title?: string;
  question?: string;
  client_name?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  file_url?: string | null;
  is_featured?: boolean;
  is_gated?: boolean;
}

interface ContentTableProps {
  items: ContentItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<boolean> | void;
  onStatusChange: (id: string, status: 'draft' | 'published' | 'archived') => Promise<boolean> | void;
  onPreview?: (id: string) => void;
  titleKey?: 'title' | 'question' | 'client_name';
  isLoading?: boolean;
  extraBadges?: Record<string, React.ReactNode>;
  showAttachmentColumn?: boolean;
}

export function ContentTable({
  items,
  onEdit,
  onDelete,
  onStatusChange,
  onPreview,
  titleKey = 'title',
  isLoading = false,
  extraBadges = {},
  showAttachmentColumn = false
}: ContentTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      setIsDeleting(true);
      setProcessingItems(prev => new Set(prev).add(itemToDelete));
      try {
        await onDelete(itemToDelete);
      } finally {
        setProcessingItems(prev => {
          const next = new Set(prev);
          next.delete(itemToDelete);
          return next;
        });
        setIsDeleting(false);
      }
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleStatusChange = async (id: string, status: 'draft' | 'published' | 'archived') => {
    const item = items.find((i) => i.id === id);
    const currentTitle = (item?.[titleKey] as string | undefined) ?? '';

    // Prevent status actions if required title is missing
    if (typeof currentTitle === 'string' && currentTitle.trim() === '') {
      toast.error('Title is required before saving or publishing.');
      return;
    }

    setProcessingItems((prev) => new Set(prev).add(id));
    try {
      await onStatusChange(id, status);
    } finally {
      setProcessingItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /**
   * Status through the shared tokens, not a hand-picked colour.
   *
   * This used to be a switch returning `bg-green-500/10 text-green-500` for
   * Published — a green chosen here and nowhere else, so a published post and a
   * confirmed booking were two different greens on two pages meaning the same
   * thing. The Standard is explicit that green, amber and red are STATES, and a
   * state has to look the same everywhere or it stops carrying meaning.
   *
   * AdminStatusChip resolves the colour from the same map every lead surface
   * uses, which is also why it now knows about `published` and `draft`.
   */
  const getStatusBadge = (status: string) => <AdminStatusChip status={status} />;

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center text-muted-foreground">No items found. Create your first one!</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={showAttachmentColumn ? "w-[35%]" : "w-[40%]"}>Title</TableHead>
              {showAttachmentColumn && <TableHead className="w-[100px]">Attachments</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isProcessing = processingItems.has(item.id);
              return (
                <TableRow key={item.id} className={isProcessing ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      <button
                        onClick={() => onEdit(item.id)}
                        className="text-left hover:text-primary hover:underline transition-colors cursor-pointer"
                      >
                        {item[titleKey] || 'Untitled'}
                      </button>
                      {item.is_featured && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>Featured</TooltipContent>
                        </Tooltip>
                      )}
                      {extraBadges[item.id]}
                    </div>
                  </TableCell>
                  {showAttachmentColumn && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.file_url ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600">
                                <FileText className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">PDF</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>PDF attached</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {item.is_gated && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                Gated
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Requires email to access</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(item.updated_at), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open row actions" disabled={isProcessing}>
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onPreview && (
                          <DropdownMenuItem onClick={() => onPreview(item.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(item.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {item.status !== 'published' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'published')}>
                            <Eye className="h-4 w-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {item.status === 'published' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'draft')}>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        {item.status !== 'archived' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'archived')}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(item.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
