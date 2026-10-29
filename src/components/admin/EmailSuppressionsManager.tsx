import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Ban, Search, RefreshCw, Plus, Trash2, AlertTriangle, Clock, Mail, XCircle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailSuppression {
  id: string;
  email: string;
  reason: 'hard_bounce' | 'soft_bounce' | 'spam_complaint' | 'unsubscribe' | 'manual';
  bounce_type: string | null;
  bounce_message: string | null;
  suppressed_at: string;
  expires_at: string | null;
  created_by: string | null;
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  hard_bounce: { label: 'Hard Bounce', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  soft_bounce: { label: 'Soft Bounce', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  spam_complaint: { label: 'Spam Complaint', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  unsubscribe: { label: 'Unsubscribed', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  manual: { label: 'Manual', color: 'bg-muted text-muted-foreground' },
};

export default function EmailSuppressionsManager() {
  const [suppressions, setSuppressions] = useState<EmailSuppression[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<EmailSuppression | null>(null);
  
  // Add form state
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState<string>('manual');
  const [newMessage, setNewMessage] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSuppressions();
  }, [reasonFilter, searchQuery]);

  const fetchSuppressions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('email_suppressions')
        .select('*')
        .order('suppressed_at', { ascending: false });

      if (reasonFilter !== 'all') {
        query = query.eq('reason', reasonFilter);
      }

      if (searchQuery) {
        query = query.ilike('email', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setSuppressions((data || []) as EmailSuppression[]);
    } catch (error) {
      console.error('Failed to fetch suppressions:', error);
      toast.error('Failed to load suppressions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuppression = async () => {
    if (!newEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('email_suppressions')
        .insert({
          email: newEmail.toLowerCase(),
          reason: newReason,
          bounce_message: newMessage || null,
          created_by: 'admin',
        });

      if (error) throw error;

      toast.success('Email suppressed successfully');
      setShowAddDialog(false);
      setNewEmail('');
      setNewReason('manual');
      setNewMessage('');
      fetchSuppressions();
    } catch (error: unknown) {
      console.error('Failed to add suppression:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('duplicate')) {
        toast.error('This email is already suppressed');
      } else {
        toast.error('Failed to suppress email');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSuppression = async (suppression: EmailSuppression) => {
    try {
      const { error } = await supabase
        .from('email_suppressions')
        .delete()
        .eq('id', suppression.id);

      if (error) throw error;

      toast.success(`Removed suppression for ${suppression.email}`);
      setShowDeleteDialog(null);
      fetchSuppressions();
    } catch (error) {
      console.error('Failed to remove suppression:', error);
      toast.error('Failed to remove suppression');
    }
  };

  const stats = {
    total: suppressions.length,
    hardBounce: suppressions.filter(s => s.reason === 'hard_bounce').length,
    softBounce: suppressions.filter(s => s.reason === 'soft_bounce').length,
    manual: suppressions.filter(s => s.reason === 'manual').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Email Suppressions
          </h3>
          <p className="text-sm text-muted-foreground">Manage bounced and suppressed email addresses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSuppressions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Suppression
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Email Suppression</DialogTitle>
                <DialogDescription>
                  Manually suppress an email address to prevent future sends.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={newReason} onValueChange={setNewReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Block</SelectItem>
                      <SelectItem value="hard_bounce">Hard Bounce</SelectItem>
                      <SelectItem value="soft_bounce">Soft Bounce</SelectItem>
                      <SelectItem value="spam_complaint">Spam Complaint</SelectItem>
                      <SelectItem value="unsubscribe">Unsubscribe Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Reason for suppression..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddSuppression} disabled={adding || !newEmail}>
                  {adding ? 'Adding...' : 'Add Suppression'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Ban className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Suppressed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.hardBounce}</p>
                <p className="text-xs text-muted-foreground">Hard Bounces</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.softBounce}</p>
                <p className="text-xs text-muted-foreground">Soft Bounces</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.manual}</p>
                <p className="text-xs text-muted-foreground">Manual Blocks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Reasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="hard_bounce">Hard Bounce</SelectItem>
                <SelectItem value="soft_bounce">Soft Bounce</SelectItem>
                <SelectItem value="spam_complaint">Spam Complaint</SelectItem>
                <SelectItem value="unsubscribe">Unsubscribed</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppressions Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Suppressed</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : suppressions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Shield className="h-8 w-8 text-emerald-500" />
                        <p>No suppressed emails</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppressions.map((suppression) => {
                    const reasonInfo = REASON_LABELS[suppression.reason] || REASON_LABELS.manual;
                    return (
                      <TableRow key={suppression.id}>
                        <TableCell className="font-medium">{suppression.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={reasonInfo.color}>
                            {reasonInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {suppression.bounce_message || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(suppression.suppressed_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {suppression.expires_at 
                            ? format(new Date(suppression.expires_at), 'MMM d, yyyy')
                            : <span className="text-destructive">Never</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setShowDeleteDialog(suppression)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Remove Suppression
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the suppression for <strong>{showDeleteDialog?.email}</strong>? 
              This email address will be able to receive emails again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDeleteDialog && handleRemoveSuppression(showDeleteDialog)}>
              Remove Suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
