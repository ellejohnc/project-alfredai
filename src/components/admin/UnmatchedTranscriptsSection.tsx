import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Link2, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatName } from '@/lib/textFormatting';
import { DragScrollArea } from '@/components/ui/drag-scroll-area';

interface UnmatchedDocument {
  id: string;
  file_name: string;
  file_url: string;
  source: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface MeetingOption {
  id: string;
  type: 'demo' | 'investor';
  name: string;
  email: string;
  company: string | null;
  meet_link: string | null;
  start_time: string | null;
  created_at: string;
}

interface UnmatchedTranscriptsSectionProps {
  onReprocessComplete?: () => void;
}

export function UnmatchedTranscriptsSection({ onReprocessComplete }: UnmatchedTranscriptsSectionProps = {}) {
  const [documents, setDocuments] = useState<UnmatchedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<UnmatchedDocument | null>(null);
  const [meetings, setMeetings] = useState<MeetingOption[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [selectedMeetingType, setSelectedMeetingType] = useState<'demo' | 'investor' | 'discovery' | 'solution' | 'personal' | ''>('');
  const [isLinking, setIsLinking] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  useEffect(() => {
    fetchUnmatchedDocuments();
  }, []);

  const fetchUnmatchedDocuments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('meeting_documents')
      .select('id, file_name, file_url, source, created_at, metadata')
      .eq('meeting_type', 'pending_match')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch unmatched documents:', error);
      toast.error('Failed to load unmatched transcripts');
    } else if (data) {
      setDocuments(data as UnmatchedDocument[]);
    }
    setIsLoading(false);
  };

  const fetchMeetings = async () => {
    setMeetingsLoading(true);
    
    // Fetch GHL submissions (demo meetings)
    const { data: ghlData } = await supabase
      .from('ghl_submissions')
      .select('id, lead_email, lead_name, lead_first_name, lead_last_name, lead_company, meet_link, ghl_response, created_at')
      .or('ghl_status.in.(confirmed,cancelled,rescheduled),lead_source.eq.calendar_widget,source_medium.eq.ghl_direct_booking')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch investor bookings
    const { data: investorData } = await supabase
      .from('investor_bookings')
      .select(`
        id, start_time, created_at, location,
        investor:investor_leads(full_name, email, firm_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    const meetingOptions: MeetingOption[] = [];

    // Add GHL meetings
    (ghlData || []).forEach((m) => {
      const response = m.ghl_response as { start_time?: string; meet_link?: string } | null;
      const displayName = m.lead_name || 
        (m.lead_first_name && m.lead_last_name 
          ? `${m.lead_first_name} ${m.lead_last_name}` 
          : m.lead_first_name || m.lead_email.split('@')[0]);
      
      meetingOptions.push({
        id: m.id,
        type: 'demo',
        name: displayName,
        email: m.lead_email,
        company: m.lead_company,
        meet_link: m.meet_link || response?.meet_link || null,
        start_time: response?.start_time || null,
        created_at: m.created_at,
      });
    });

    // Add investor meetings
    (investorData || []).forEach((m) => {
      const investor = m.investor as { full_name: string; email: string; firm_name: string } | null;
      if (investor) {
        meetingOptions.push({
          id: m.id,
          type: 'investor',
          name: investor.full_name,
          email: investor.email,
          company: investor.firm_name,
          meet_link: extractMeetLink(m.location),
          start_time: m.start_time,
          created_at: m.created_at,
        });
      }
    });

    setMeetings(meetingOptions);
    setMeetingsLoading(false);
  };

  const extractMeetLink = (location: string | null): string | null => {
    if (!location) return null;
    const meetMatch = location.match(/https:\/\/meet\.google\.com\/[a-z-]+/i);
    return meetMatch ? meetMatch[0] : null;
  };

  const openLinkDialog = (doc: UnmatchedDocument) => {
    setSelectedDoc(doc);
    setSearchQuery('');
    setSelectedMeetingId('');
    setSelectedMeetingType('');
    fetchMeetings();
  };

  const handleLink = async () => {
    if (!selectedDoc || !selectedMeetingId || !selectedMeetingType) return;

    setIsLinking(true);
    try {
      // Get the selected meeting for email
      const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
      
      // STEP 1: Sync to GHL FIRST (GHL-first approach for manual linking too)
      let ghlSyncSuccess = false;
      let ghlSyncResponse: Record<string, unknown> | null = null;
      
      if (selectedMeeting?.email) {
        try {
          const { data, error: syncError } = await supabase.functions.invoke('sync-document-to-ghl', {
            body: { document_id: selectedDoc.id, contact_email: selectedMeeting.email },
          });

          if (!syncError && data?.success) {
            ghlSyncSuccess = true;
            ghlSyncResponse = {
              contact_id: data.contact_id,
              sync_type: 'auto_on_import', // Treat manual link + sync as auto-sync
              synced_at: new Date().toISOString(),
            };
            toast.success('Synced to GHL', {
              description: 'Transcript has been attached to the contact in GHL.',
            });
          } else {
            ghlSyncResponse = {
              error: syncError?.message || data?.error || 'Sync failed',
              attempted_at: new Date().toISOString(),
              sync_type: 'auto_on_import_failed',
            };
            console.warn('GHL sync failed during manual link:', syncError || data?.error);
          }
        } catch (syncErr) {
          console.error('GHL sync error during manual link:', syncErr);
          ghlSyncResponse = {
            error: syncErr instanceof Error ? syncErr.message : 'Unknown error',
            attempted_at: new Date().toISOString(),
            sync_type: 'auto_on_import_failed',
          };
        }
      }

      // STEP 2: Update the document with the meeting reference + sync status
      const { error } = await supabase
        .from('meeting_documents')
        .update({
          meeting_id: selectedMeetingId,
          meeting_type: selectedMeetingType,
          ghl_synced: ghlSyncSuccess,
          ghl_synced_at: ghlSyncSuccess ? new Date().toISOString() : null,
          ghl_sync_response: ghlSyncResponse as unknown as Record<string, never>,
          metadata: {
            ...selectedDoc.metadata,
            match_method: 'manual',
            match_confidence: 'high',
            confidence: 'high',
            matched_at: new Date().toISOString(),
            contact_email: selectedMeeting?.email || null,
          } as unknown as Record<string, never>,
        })
        .eq('id', selectedDoc.id);

      if (error) throw error;

      toast.success('Transcript linked successfully', {
        description: ghlSyncSuccess 
          ? 'Linked to meeting and synced to GHL.' 
          : 'Linked to meeting. GHL sync can be retried from the meeting details.',
      });

      // Remove from unmatched list
      setDocuments(prev => prev.filter(d => d.id !== selectedDoc.id));
      setSelectedDoc(null);
    } catch (error) {
      console.error('Failed to link transcript:', error);
      toast.error('Failed to link transcript');
    } finally {
      setIsLinking(false);
    }
  };

  const syncToGHL = async (docId: string, contactEmail: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-document-to-ghl', {
        // Must match backend function contract
        body: { document_id: docId, contact_email: contactEmail },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Synced to GHL', {
          description: 'Transcript has been attached to the contact in GHL.',
        });
      } else {
        throw new Error(data?.error || 'Sync failed');
      }
    } catch (error) {
      console.error('GHL sync failed:', error);
      toast.error('GHL sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleReprocessAll = async () => {
    setIsReprocessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('reprocess-unmatched-documents');

      if (error) {
        throw new Error(error.message || 'Reprocess failed');
      }

      if (data?.success) {
        const { matched, total } = data;
        if (matched > 0) {
          toast.success(`Matched ${matched} of ${total} transcripts`, {
            description: 'Transcripts have been linked to their meetings.',
          });
          // Refresh the list
          await fetchUnmatchedDocuments();
          // Notify parent to refresh document counts
          onReprocessComplete?.();
        } else {
          toast.info('No new matches found', {
            description: 'All transcripts remain unmatched. Try linking them manually.',
          });
        }
      } else {
        throw new Error(data?.error || 'Reprocess failed');
      }
    } catch (error) {
      console.error('Reprocess failed:', error);
      toast.error('Failed to reprocess transcripts', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  const filteredMeetings = meetings.filter(m => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      (m.company?.toLowerCase().includes(query)) ||
      (m.meet_link?.toLowerCase().includes(query))
    );
  });

  // Extract company hint from filename
  const extractCompanyFromFilename = (filename: string): string | null => {
    // Pattern: "Discovery Meeting: alfred ai & COMPANY_NAME – DATE"
    const match = filename.match(/(?:Alfred\s*Ai?\s*&\s*)([^–-]+)/i);
    if (match) return match[1].trim();
    
    // Fallback: look for company patterns
    const fallback = filename.match(/(?:with|&)\s+([A-Z][a-zA-Z\s&]+?)(?:\s*[–-]|\s*$)/);
    return fallback ? fallback[1].trim() : null;
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading unmatched transcripts...</span>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return null; // Don't show section if no unmatched documents
  }

  return (
    <>
      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <AlertCircle className="h-4 w-4" />
            Unmatched Transcripts ({documents.length})
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 min-h-[44px] touch-manipulation bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              onClick={handleReprocessAll}
              disabled={isReprocessing}
            >
              {isReprocessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Re-process All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 min-h-[44px] touch-manipulation"
              onClick={fetchUnmatchedDocuments}
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          These transcripts from Google Drive couldn't be automatically matched to a meeting. 
          Click "Link" to manually associate them.
        </p>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {documents.map((doc) => {
            const companyHint = extractCompanyFromFilename(doc.file_name);
            
            return (
              <div
                key={doc.id}
                className="p-3 bg-background border border-border rounded-lg space-y-2"
              >
                <div className="flex items-start gap-2 min-w-0 w-full">
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1" style={{ maxWidth: 'calc(100% - 40px)' }}>
                    <DragScrollArea showArrows={true} arrowSize="sm" alwaysShowArrows={true} className="w-full">
                      <p className="text-sm font-medium whitespace-nowrap pr-2">{doc.file_name}</p>
                    </DragScrollArea>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>{doc.source}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.created_at), 'MMM d, h:mm a')}</span>
                      {companyHint && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs py-0">
                            Hint: {companyHint}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 min-h-[44px] touch-manipulation"
                    onClick={() => window.open(doc.file_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs gap-1.5 min-h-[44px] touch-manipulation"
                    onClick={() => openLinkDialog(doc)}
                  >
                    <Link2 className="h-3 w-3" />
                    Link
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Link Transcript to Meeting</DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block truncate">{selectedDoc?.file_name}</span>
              <span className="block text-xs text-muted-foreground">
                Select the meeting this transcript belongs to
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, company, or meet link..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Meeting List */}
            {meetingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[350px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredMeetings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No meetings found</p>
                      {searchQuery && <p className="text-xs mt-1">Try a different search term</p>}
                    </div>
                  ) : (
                    filteredMeetings.map((meeting) => (
                      <button
                        key={meeting.id}
                        onClick={() => {
                          setSelectedMeetingId(meeting.id);
                          setSelectedMeetingType(meeting.type);
                        }}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-colors",
                          selectedMeetingId === meeting.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 select-text">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{formatName(meeting.name)}</span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {meeting.type === 'demo' ? 'Demo' : 'Investor'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{meeting.email}</p>
                            {meeting.company && (
                              <p className="text-xs text-muted-foreground truncate">{formatName(meeting.company)}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {meeting.start_time && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(meeting.start_time), 'MMM d, h:mm a')}
                              </div>
                            )}
                            {meeting.meet_link && (
                              <p className="text-xs text-blue-600 truncate max-w-[150px]">
                                {meeting.meet_link.replace('https://meet.google.com/', '')}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedMeetingId === meeting.id && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                            <CheckCircle2 className="h-3 w-3" />
                            Selected
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDoc(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={!selectedMeetingId || isLinking}
            >
              {isLinking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Link & Sync to GHL
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}