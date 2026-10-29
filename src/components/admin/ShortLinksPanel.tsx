import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Link2, Trash2, MousePointerClick, Copy, RefreshCw,
  ExternalLink, Pencil, Check, X, Plus,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ShortLink {
  id: string;
  code: string;
  destination_url: string;
  click_count: number;
  created_at: string;
}

interface ShortLinksPanelProps {
  postId: string | undefined;
}

const BASE_URL = 'https://new.alfredai.bot';

function generateCode() {
  return Math.random().toString(36).slice(2, 8);
}

export function ShortLinksPanel({ postId }: ShortLinksPanelProps) {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Editing state per-link: { [id]: { code, destination_url } }
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editDest, setEditDest] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Add new link state
  const [showAdd, setShowAdd] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDest, setNewDest] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('short_links' as any)
        .select('id, code, destination_url, click_count, created_at')
        .eq('blog_post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks((data as unknown as ShortLink[]) ?? []);
    } catch (err) {
      console.error('[ShortLinksPanel] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('short_links' as any).delete().eq('id', id);
      if (error) throw error;
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success('Short link deleted.');
    } catch {
      toast.error('Failed to delete short link.');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Copy ── */
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(`${BASE_URL}/go/${code}`).then(() =>
      toast.success('Short link copied!')
    );
  };

  /* ── Start edit ── */
  const startEdit = (link: ShortLink) => {
    setEditingId(link.id);
    setEditCode(link.code);
    setEditDest(link.destination_url);
  };

  const cancelEdit = () => { setEditingId(null); setEditCode(''); setEditDest(''); };

  /* ── Save edit ── */
  const saveEdit = async (link: ShortLink) => {
    const code = editCode.trim();
    const dest = editDest.trim();
    if (!code || !dest) { toast.error('Both code and destination URL are required.'); return; }
    if (!/^https?:\/\/.+/.test(dest)) { toast.error('Destination must be a valid URL starting with http:// or https://'); return; }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('short_links' as any)
        .update({ code, destination_url: dest })
        .eq('id', link.id);
      if (error) throw error;
      setLinks((prev) => prev.map((l) => l.id === link.id ? { ...l, code, destination_url: dest } : l));
      toast.success('Short link updated.');
      cancelEdit();
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('unique') || msg.includes('duplicate')) {
        toast.error(`Code "${code}" is already in use. Choose a different one.`);
      } else {
        toast.error('Failed to update short link.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Add new ── */
  const handleAdd = async () => {
    const code = newCode.trim() || generateCode();
    const dest = newDest.trim();
    if (!dest) { toast.error('Destination URL is required.'); return; }
    if (!/^https?:\/\/.+/.test(dest)) { toast.error('Destination must be a valid URL starting with http:// or https://'); return; }

    setIsAdding(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('short_links' as any)
        .insert({
          code,
          destination_url: dest,
          blog_post_id: postId,
          content_type: 'blog_post',
          created_by: userData.user?.id ?? null,
          click_count: 0,
        })
        .select('id, code, destination_url, click_count, created_at')
        .single();
      if (error) throw error;
      setLinks((prev) => [data as unknown as ShortLink, ...prev]);
      setNewCode('');
      setNewDest('');
      setShowAdd(false);
      toast.success('Short link created.');
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('unique') || msg.includes('duplicate')) {
        toast.error(`Code "${code}" is already in use. Try a different one.`);
      } else {
        toast.error('Failed to create short link.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const truncate = (url: string, max = 40) =>
    url.length > max ? url.slice(0, max) + '…' : url;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Short Links</span>
          {links.length > 0 && (
            <Badge variant="secondary" className="text-xs">{links.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { setShowAdd((v) => !v); setNewCode(''); setNewDest(''); }}
            title="Add short link manually"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchLinks}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">Add short link</p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-mono shrink-0">/go/</span>
            <Input
              className="h-7 text-xs font-mono"
              placeholder="auto"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.replace(/\s/g, '-').toLowerCase())}
            />
          </div>
          <Input
            className="h-7 text-xs"
            placeholder="https://destination-url.com"
            value={newDest}
            onChange={(e) => setNewDest(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <div className="flex gap-2 pt-0.5">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAdd} disabled={isAdding}>
              {isAdding ? 'Adding…' : 'Add Link'}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : links.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground">
            No short links yet. Publish this post to auto-generate them, or add one manually.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {links.map((link) => {
            const shortUrl = `${BASE_URL}/go/${link.code}`;
            const isEditing = editingId === link.id;

            return (
              <div
                key={link.id}
                className="group bg-muted/40 hover:bg-muted/70 border border-border rounded-lg p-2.5 transition-colors"
              >
                {isEditing ? (
                  /* ── Edit mode ── */
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-mono shrink-0">/go/</span>
                      <Input
                        className="h-6 text-xs font-mono py-0"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.replace(/\s/g, '-').toLowerCase())}
                        placeholder="short-code"
                        autoFocus
                      />
                    </div>
                    <Input
                      className="h-6 text-xs py-0"
                      value={editDest}
                      onChange={(e) => setEditDest(e.target.value)}
                      placeholder="https://destination-url.com"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(link);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <div className="flex gap-1.5 pt-0.5">
                      <Button
                        size="sm"
                        className="h-6 text-xs flex-1 gap-1"
                        onClick={() => saveEdit(link)}
                        disabled={isSaving}
                      >
                        <Check className="w-3 h-3" />
                        {isSaving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs gap-1"
                        onClick={cancelEdit}
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-primary hover:underline flex items-center gap-1 min-w-0 truncate"
                      >
                        /go/{link.code}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className="text-xs gap-1 py-0 h-5">
                          <MousePointerClick className="w-3 h-3" />
                          {link.click_count}
                        </Badge>
                        {/* Copy */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(link.code)}
                          title="Copy short link"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEdit(link)}
                          title="Edit short link"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {/* Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              disabled={deletingId === link.id}
                              title="Delete short link"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete short link?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <span className="font-mono text-foreground">/go/{link.code}</span> will stop working immediately. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(link.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {/* Destination URL */}
                    <p
                      className="text-xs text-muted-foreground truncate select-text cursor-text"
                      title={link.destination_url}
                    >
                      {truncate(link.destination_url)}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
