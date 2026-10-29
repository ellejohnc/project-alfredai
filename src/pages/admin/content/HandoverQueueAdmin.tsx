import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  User, 
  Building2, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Mail,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DistributorAssignment } from '@/components/admin/DistributorAssignment';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/pricingEngine';
import { PRODUCTION_URL } from '@/lib/siteConfig';

interface HandoverRequest {
  id: string;
  quote_id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  workflows: any;
  setup_fee_min: number | null;
  setup_fee_max: number | null;
  monthly_retainer_min: number | null;
  monthly_retainer_max: number | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  quote?: {
    quote_id: string;
    signed_at: string | null;
  };
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700'
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed'
};

export default function HandoverQueueAdmin() {
  const navigate = useNavigate();
  const [handovers, setHandovers] = useState<HandoverRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHandover, setSelectedHandover] = useState<HandoverRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<HandoverRequest | null>(null);

  const fetchHandovers = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('handover_requests')
        .select(`
          *,
          quote:quotes(quote_id, signed_at)
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHandovers((data as any) || []);
    } catch (err) {
      console.error('Error fetching handovers:', err);
      toast.error('Failed to load handover queue');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchHandovers();
  }, [fetchHandovers]);

  const handleStatusChange = async (handoverId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('handover_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', handoverId);

      if (error) throw error;
      
      toast.success(`Status updated to ${statusLabels[newStatus]}`);
      fetchHandovers();
      
      if (selectedHandover?.id === handoverId) {
        setSelectedHandover(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async (handoverId: string, assignee: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('handover_requests')
        .update({ 
          assigned_to: assignee,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', handoverId);

      if (error) throw error;
      
      toast.success(`Assigned to ${assignee}`);
      fetchHandovers();
    } catch (err) {
      console.error('Error assigning:', err);
      toast.error('Failed to assign');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedHandover) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('handover_requests')
        .update({ 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedHandover.id);

      if (error) throw error;
      
      toast.success('Notes saved');
      fetchHandovers();
      setSelectedHandover(prev => prev ? { ...prev, notes } : null);
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Failed to save notes');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (handover: HandoverRequest) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('handover_requests')
        .delete()
        .eq('id', handover.id);

      if (error) throw error;

      toast.success(`Deleted handover for ${handover.company_name}`);
      setDeleteTarget(null);
      if (selectedHandover?.id === handover.id) setSelectedHandover(null);
      fetchHandovers();
    } catch (err) {
      console.error('Error deleting handover:', err);
      toast.error('Failed to delete. Please try again or email support with a screenshot.');
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingCount = handovers.filter(h => h.status === 'pending').length;
  const inProgressCount = handovers.filter(h => ['assigned', 'in_progress'].includes(h.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Handover Queue
          </h1>
          <p className="text-muted-foreground">
            Manage signed proposals ready for implementation
          </p>
        </div>
        <Button variant="outline" onClick={fetchHandovers} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">{inProgressCount}</p>
              </div>
              <ArrowRight className="w-8 h-8 text-purple-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {handovers.filter(h => h.status === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{handovers.length}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Handover List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : handovers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No handover requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {handovers.map((handover) => (
            <Card 
              key={handover.id} 
              className={`cursor-pointer hover:border-primary/50 transition-colors ${
                handover.priority === 'urgent' ? 'border-red-300' : 
                handover.priority === 'high' ? 'border-orange-300' : ''
              }`}
              onClick={() => {
                setSelectedHandover(handover);
                setNotes(handover.notes || '');
              }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{handover.company_name}</h3>
                      <Badge variant="outline" className="font-mono text-xs">
                        {(handover.quote as any)?.quote_id || 'N/A'}
                      </Badge>
                      <Badge className={priorityColors[handover.priority]}>
                        {handover.priority}
                      </Badge>
                      <Badge className={statusColors[handover.status]}>
                        {statusLabels[handover.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {handover.contact_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {handover.contact_name}
                        </span>
                      )}
                      {handover.assigned_to && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {handover.assigned_to}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(handover.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={handover.status} 
                      onValueChange={(value) => handleStatusChange(handover.id, value)}
                    >
                      <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`${PRODUCTION_URL}/proposal/${(handover.quote as any)?.quote_id}`, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(handover);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedHandover} onOpenChange={() => setSelectedHandover(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedHandover?.company_name}
            </DialogTitle>
            <DialogDescription>
              Handover request details
            </DialogDescription>
          </DialogHeader>

          {selectedHandover && (
            <div className="space-y-6 pt-4">
              {/* Status & Priority */}
              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[selectedHandover.status]}>
                  {statusLabels[selectedHandover.status]}
                </Badge>
                <Badge className={priorityColors[selectedHandover.priority]}>
                  {selectedHandover.priority}
                </Badge>
                {(selectedHandover.quote as any)?.signed_at && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Signed
                  </Badge>
                )}
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedHandover.contact_name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a 
                    href={`mailto:${selectedHandover.contact_email}`}
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    {selectedHandover.contact_email || 'Not specified'}
                  </a>
                </div>
              </div>

              {/* Investment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Setup Fee</p>
                  <p className="font-semibold">
                    {formatCurrency(selectedHandover.setup_fee_min || 0)} - {formatCurrency(selectedHandover.setup_fee_max || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Monthly Retainer</p>
                  <p className="font-semibold">
                    {formatCurrency(selectedHandover.monthly_retainer_min || 0)} - {formatCurrency(selectedHandover.monthly_retainer_max || 0)}
                  </p>
                </div>
              </div>

              {/* Workflows */}
              {selectedHandover.workflows && Array.isArray(selectedHandover.workflows) && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Workflows</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedHandover.workflows.map((w: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{w}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Assigned To</p>
                <Select 
                  value={selectedHandover.assigned_to || ''} 
                  onValueChange={(value) => handleAssign(selectedHandover.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dev-team">Dev Team</SelectItem>
                    <SelectItem value="integration-lead">Integration Lead</SelectItem>
                    <SelectItem value="senior-dev">Senior Developer</SelectItem>
                    <SelectItem value="project-manager">Project Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Distributor access */}
              <DistributorAssignment
                entityType="handover"
                entityId={selectedHandover.id}
                tableName="handover_requests"
              />



              {/* Notes */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Notes</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add implementation notes..."
                  rows={4}
                />
                <Button 
                  className="mt-2" 
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Save Notes
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`${PRODUCTION_URL}/proposal/${(selectedHandover.quote as any)?.quote_id}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Proposal
                </Button>
                {selectedHandover.status !== 'completed' && (
                  <Button
                    className="flex-1"
                    onClick={() => handleStatusChange(selectedHandover.id, 'completed')}
                    disabled={isUpdating}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Handover Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the handover for <strong>{deleteTarget?.company_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
