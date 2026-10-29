import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useJobApplications, ApplicationStatus, JobApplication } from '@/hooks/useJobApplications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  User,
  FileText,
  ExternalLink,
  Trash2,
  RefreshCw,
  Download,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Eye,
  Linkedin,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import AccessDenied from '@/components/admin/AccessDenied';
import { cn } from '@/lib/utils';

// Status configuration
const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: typeof Clock }> = {
  new: { label: 'New', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30', icon: Clock },
  reviewing: { label: 'Reviewing', color: 'bg-amber-500/20 text-amber-700 border-amber-500/30', icon: Eye },
  interviewed: { label: 'Interviewed', color: 'bg-purple-500/20 text-purple-700 border-purple-500/30', icon: Users },
  offered: { label: 'Offered', color: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30', icon: Star },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-700 border-red-500/30', icon: XCircle },
  hired: { label: 'Hired', color: 'bg-green-500/20 text-green-700 border-green-500/30', icon: CheckCircle },
};

export default function JobApplicationsAdmin() {
  const { user } = useAdminAuth();
  const { canViewLeads } = usePermissions();
  const { applications, isLoading, fetchApplications, updateStatus, updateNotes, deleteApplication } = useJobApplications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);

  // Fetch jobs for filter dropdown
  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from('job_openings')
        .select('id, title')
        .order('title');
      setJobs(data || []);
    };
    fetchJobs();
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('job-applications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
        },
        (payload) => {
          fetchApplications();
          if (payload.eventType === 'INSERT') {
            const newApp = payload.new as JobApplication;
            toast.info('New application received', {
              description: `${newApp.name} applied for a position`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApplications]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        app.name.toLowerCase().includes(searchLower) ||
        app.email.toLowerCase().includes(searchLower) ||
        app.job_title?.toLowerCase().includes(searchLower) ||
        app.areas_of_interest?.some(a => a.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

      // Job filter - includes 'general' option for general applications
      let matchesJob = true;
      if (jobFilter === 'general') {
        matchesJob = app.is_general_application === true;
      } else if (jobFilter !== 'all') {
        matchesJob = app.job_id === jobFilter;
      }

      return matchesSearch && matchesStatus && matchesJob;
    });
  }, [applications, searchQuery, statusFilter, jobFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: applications.length,
      new: applications.filter((a) => a.status === 'new').length,
      reviewing: applications.filter((a) => a.status === 'reviewing').length,
      interviewed: applications.filter((a) => a.status === 'interviewed').length,
      hired: applications.filter((a) => a.status === 'hired').length,
      general: applications.filter((a) => a.is_general_application).length,
    };
  }, [applications]);

  // Unique jobs from applications
  const uniqueJobs = useMemo(() => {
    const jobMap = new Map<string, string>();
    applications.forEach((app) => {
      if (app.job_id && app.job_title) {
        jobMap.set(app.job_id, app.job_title);
      }
    });
    return Array.from(jobMap.entries()).map(([id, title]) => ({ id, title }));
  }, [applications]);

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    await updateStatus(id, newStatus);
    if (selectedApplication?.id === id) {
      setSelectedApplication((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const success = await deleteApplication(deleteTarget.id);
    setIsDeleting(false);
    if (success) {
      setDeleteTarget(null);
      if (selectedApplication?.id === deleteTarget.id) {
        setSelectedApplication(null);
      }
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApplication) return;
    const success = await updateNotes(selectedApplication.id, notesValue);
    if (success) {
      setSelectedApplication((prev) => prev ? { ...prev, notes: notesValue } : null);
      setEditingNotes(false);
    }
  };

  const openApplicationDetail = (app: JobApplication) => {
    setSelectedApplication(app);
    setNotesValue(app.notes || '');
    setEditingNotes(false);
  };

  if (!canViewLeads) {
    return <AccessDenied message="You don't have permission to view job applications." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Applications</h1>
          <p className="text-muted-foreground">Manage and track candidate applications</p>
        </div>
        <Button onClick={() => fetchApplications()} variant="outline" size="sm" className="min-h-[44px]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-xs text-muted-foreground">New</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Eye className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.reviewing}</p>
                <p className="text-xs text-muted-foreground">Reviewing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.interviewed}</p>
                <p className="text-xs text-muted-foreground">Interviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.hired}</p>
                <p className="text-xs text-muted-foreground">Hired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="general">General Applications</SelectItem>
                {uniqueJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Resume</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => {
                    const StatusIcon = statusConfig[app.status]?.icon || Clock;
                    return (
                      <TableRow
                        key={app.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openApplicationDetail(app)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{app.name}</p>
                              <p className="text-sm text-muted-foreground">{app.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{app.job_title}</p>
                              {app.is_general_application && (
                                <Badge variant="secondary" className="text-xs">General</Badge>
                              )}
                            </div>
                            {app.is_general_application && app.areas_of_interest?.length ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {app.areas_of_interest.slice(0, 2).map((area) => (
                                  <Badge key={area} variant="outline" className="text-xs py-0">
                                    {area}
                                  </Badge>
                                ))}
                                {app.areas_of_interest.length > 2 && (
                                  <Badge variant="outline" className="text-xs py-0">
                                    +{app.areas_of_interest.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">{app.job_department}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('gap-1', statusConfig[app.status]?.color)}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[app.status]?.label || app.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(app.created_at), 'MMM d, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {app.resume_url ? (
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              View
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={app.status}
                              onValueChange={(value) => {
                                handleStatusChange(app.id, value as ApplicationStatus);
                              }}
                            >
                              <SelectTrigger
                                className="w-[130px] h-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(app);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{selectedApplication.name}</span>
                      {selectedApplication.is_general_application && (
                        <Badge variant="secondary">General</Badge>
                      )}
                    </div>
                    <p className="text-sm font-normal text-muted-foreground">
                      {selectedApplication.job_title}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* Areas of Interest for General Applications */}
              {selectedApplication.is_general_application && selectedApplication.areas_of_interest?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Interested in:</span>
                  {selectedApplication.areas_of_interest.map((area) => (
                    <Badge key={area} variant="outline">{area}</Badge>
                  ))}
                </div>
              )}

              <div className="space-y-6 mt-4">
                {/* Status */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select
                    value={selectedApplication.status}
                    onValueChange={(value) => handleStatusChange(selectedApplication.id, value as ApplicationStatus)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a href={`mailto:${selectedApplication.email}`} className="text-sm font-medium hover:text-primary">
                        {selectedApplication.email}
                      </a>
                    </div>
                  </div>
                  {selectedApplication.phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <a href={`tel:${selectedApplication.phone}`} className="text-sm font-medium hover:text-primary">
                          {selectedApplication.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedApplication.linkedin_url && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Linkedin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">LinkedIn</p>
                        <a
                          href={selectedApplication.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary flex items-center gap-1"
                        >
                          View Profile <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedApplication.portfolio_url && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Portfolio</p>
                        <a
                          href={selectedApplication.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary flex items-center gap-1"
                        >
                          View Portfolio <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resume */}
                {selectedApplication.resume_url && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium">Resume</span>
                      </div>
                      <a
                        href={selectedApplication.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedApplication.cover_letter && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Cover Letter
                    </h4>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Internal Notes</h4>
                    {!editingNotes && (
                      <Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)}>
                        Edit
                      </Button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Add notes about this candidate..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveNotes}>
                          Save Notes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingNotes(false);
                            setNotesValue(selectedApplication.notes || '');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/50 rounded-lg min-h-[80px]">
                      {selectedApplication.notes ? (
                        <p className="text-sm whitespace-pre-wrap">{selectedApplication.notes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No notes yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Applied: {format(new Date(selectedApplication.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the application from {deleteTarget?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
