import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import {
  Loader2,
  Send,
  MessageSquare,
  Phone,
  Voicemail,
  Mail,
  Sparkles,
  StickyNote,
  Play,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  ExternalLink,
  Paperclip,
  X,
  RefreshCw,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  MoreVertical,
  Reply,
  Forward,
  Info,
  ArrowUpDown,
  UserCircle,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { cn } from '@/lib/utils';
import { stripEmojis } from '@/lib/textFormatting';
import { parseEmailBody } from '@/lib/emailBodyFormat';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import {
  useGhlConversation,
  useGhlOpportunities,
  useGhlContact,
} from '@/hooks/useGhlLead';



// --- Types ------------------------------------------------------------------

/**
 * GHL v3 per-channel DND. `active` / `permanent` both mean "do not contact on
 * this channel"; `inactive` means sending is fine.
 */
export interface GhlDndChannelSetting {
  status?: 'active' | 'inactive' | 'permanent' | string;
  message?: string | null;
  code?: string | null;
}
export interface GhlDndSettings {
  call?: GhlDndChannelSetting;
  email?: GhlDndChannelSetting;
  sms?: GhlDndChannelSetting;
  whatsApp?: GhlDndChannelSetting;
  gmb?: GhlDndChannelSetting;
  fb?: GhlDndChannelSetting;
}

export interface GhlMessage {
  id: string;
  conversationId: string;
  type: 'SMS' | 'Email' | 'Call' | 'Voicemail' | 'Comment' | 'Activity' | 'Facebook' | 'Instagram' | 'WhatsApp' | 'Chat' | 'Other';
  rawType: string;
  direction: 'inbound' | 'outbound' | '';
  body: string;
  status: string | null;
  dateAdded: string | null;
  from: string | null;
  to: string | null;
  userName: string | null;
  source: string | null;
  call: { duration: number; status: string | null; recordingUrl: string | null } | null;
  transcriptAvailable: boolean;
  meta: any;
  altId: string | null;
}

export interface GhlOpportunity {
  id: string;
  name: string;
  monetaryValue: number;
  status: 'open' | 'won' | 'lost' | 'abandoned' | string;
  source: string | null;
  pipelineId: string;
  pipelineName: string | null;
  pipelineStageId: string;
  stages: { id: string; name: string; position: number }[];
  lastStageChangeAt: string | null;
  lastStatusChangeAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// --- Conversation tab -------------------------------------------------------

type Channel = 'SMS' | 'WhatsApp' | 'Email';

const CHANNEL_META: Record<Channel, { label: string; icon: typeof MessageSquare }> = {
  SMS: { label: 'SMS', icon: MessageSquare },
  WhatsApp: { label: 'WhatsApp', icon: Phone },
  Email: { label: 'Email', icon: Mail },
};

export function LeadConversationTab({
  contactId,
  hasPhone,
  hasEmail = true,
  contactName,
}: {
  contactId: string;
  hasPhone: boolean;
  hasEmail?: boolean;
  contactName?: string;
}) {
  const { data: fetched = [], isLoading, isFetching, error, refetch } = useGhlConversation(contactId);
  const [optimistic, setOptimistic] = useState<GhlMessage[]>([]);
  const [mode, setMode] = useState<'channel' | 'comment'>('channel');
  const [channel, setChannel] = useState<Channel>('SMS');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; to: string; subject: string } | null>(null);


  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const markedReadRef = useRef<Set<string>>(new Set());

  /** Reply to an email: switch the composer to Email, prefill Re: subject, focus. */
  const handleReplyEmail = (m: GhlMessage) => {
    if (!hasEmail) {
      toast.error('No email address on file for this contact');
      return;
    }
    const subj = String(m?.meta?.email?.subject || '').trim();
    const nextSubject = subj ? (/^re:/i.test(subj) ? subj : `Re: ${subj}`) : '';
    // Reply goes back to the contact: outbound messages were sent *to* them,
    // inbound messages came *from* them.
    const recipient = String(
      (m.direction === 'inbound' ? m.from : m.to) || m.to || m.from || '',
    ).trim();
    setMode('channel');
    setChannel('Email');
    setSubject(nextSubject);
    setReplyTo({ id: m.id, to: recipient, subject: subj });
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };


  /** Reply to an SMS/WhatsApp message: prefill the composer with the quoted message. */
  const handleReplyMessage = (m: GhlMessage) => {
    if (m.type === 'Email') {
      handleReplyEmail(m);
      return;
    }
    const channel = m.type === 'SMS' ? 'SMS' : m.type === 'WhatsApp' ? 'WhatsApp' : null;
    if (!channel) {
      toast.error('Reply is only supported for SMS, WhatsApp, and Email');
      return;
    }
    setMode('channel');
    setChannel(channel);
    const quoted = (m.body || '').trim();
    setText(quoted ? `> ${quoted.replace(/\n/g, '\n> ')}

` : '');
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  // Mark the contact's threads read in GHL once we've displayed them, so the
  // GHL inbox badge doesn't keep nagging about messages an admin has read here.
  useEffect(() => {
    if (!contactId || fetched.length === 0) return;
    const ids = Array.from(
      new Set(fetched.map((m) => m.conversationId).filter(Boolean)),
    ).filter((id) => !markedReadRef.current.has(id));
    if (ids.length === 0) return;
    ids.forEach((id) => markedReadRef.current.add(id));
    ids.forEach((id) => {
      supabase.functions
        .invoke('ghl-conversation-actions', {
          body: { action: 'mark_read', conversation_id: id },
        })
        .catch(() => {
          // Soft feature — never surface, never block the timeline.
          markedReadRef.current.delete(id);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, fetched.length]);

  // An optimistic bubble is considered "reconciled" once the server returns a
  // message with the same type + direction + body within a small time window
  // of when we sent it. Tmp ids never match real GHL ids, so id-equality alone
  // would leave the optimistic bubble on screen forever (duplicated SMS bug).
  const isReconciled = (opt: GhlMessage, server: GhlMessage[]) => {
    const optBody = (opt.body || '').trim();
    const optTime = opt.dateAdded ? new Date(opt.dateAdded).getTime() : Date.now();
    return server.some((s) => {
      if (s.type !== opt.type) return false;
      if (opt.direction && s.direction && s.direction !== opt.direction) return false;
      if ((s.body || '').trim() !== optBody) return false;
      const sTime = s.dateAdded ? new Date(s.dateAdded).getTime() : 0;
      // Server timestamp within 10 minutes of the optimistic send.
      return Math.abs(sTime - optTime) <= 10 * 60 * 1000;
    });
  };

  const messages = useMemo(() => {
    // Merge optimistic-only messages (not yet reflected on server) at the end.
    return [...fetched, ...optimistic.filter((m) => !isReconciled(m, fetched))];
  }, [fetched, optimistic]);

  /** Forward an email or an entire thread: prefill the composer with Fwd: and a quoted body. */
  const handleForwardEmail = (m: GhlMessage, scope: 'email' | 'thread') => {
    if (!hasEmail) {
      toast.error('No email address on file for this contact');
      return;
    }
    const subj = String(m?.meta?.email?.subject || '').trim();
    const fwdSubject = subj ? (/^fwd:/i.test(subj) ? subj : `Fwd: ${subj}`) : 'Fwd:';
    let quotedBody = '';
    if (scope === 'thread') {
      const threadBody = messages
        .filter((msg) => ['Email', 'SMS', 'WhatsApp', 'Comment'].includes(msg.type))
        .map((msg) => {
          const date = msg.dateAdded ? format(new Date(msg.dateAdded), 'd MMM yyyy, h:mma') : '';
          const from = msg.userName || msg.from || 'Unknown';
          const prefix = `${from}${date ? ` (${date})` : ''}`;
          return `--- ${prefix} ---\n${msg.body || ''}`;
        })
        .join('\n\n');
      quotedBody = `\n\n---------- Forwarded conversation ----------\n${threadBody}`;
    } else {
      quotedBody = `\n\n---------- Forwarded message ----------\n${m.body || ''}`;
    }
    setMode('channel');
    setChannel('Email');
    setSubject(fwdSubject);
    setText(quotedBody);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  // Auto-scroll to bottom after content updates.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, isLoading]);

  // Drop optimistic entries that server now knows about.
  useEffect(() => {
    if (optimistic.length === 0) return;
    setOptimistic((prev) => prev.filter((m) => !isReconciled(m, fetched)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetched]);

  // v3 contact carries per-channel DND, so we can block the composer up-front
  // with GHL's own reason instead of letting the send fail server-side.
  const { data: dndContact } = useGhlContact(contactId);
  const dndSettings = (dndContact?.dndSettings ?? null) as GhlDndSettings | null;
  const dndForChannel = (c: Channel): GhlDndChannelSetting | null => {
    const key = c === 'SMS' ? 'sms' : c === 'WhatsApp' ? 'whatsApp' : 'email';
    const setting = dndSettings?.[key];
    if (!setting) return null;
    const status = String(setting.status || '').toLowerCase();
    return status === 'active' || status === 'permanent' ? setting : null;
  };
  const dndBlock = mode === 'channel' ? dndForChannel(channel) : null;
  const dndReason = dndBlock
    ? `${channel} is blocked for this contact${
        dndBlock.status?.toLowerCase() === 'permanent' ? ' (permanent opt-out)' : ''
      }${dndBlock.message ? ` — ${dndBlock.message}` : ''}${
        dndBlock.code ? ` [code ${dndBlock.code}]` : ''
      }`
    : null;

  const missingDestination =
    mode === 'channel' &&
    ((channel === 'SMS' || channel === 'WhatsApp') ? !hasPhone : !hasEmail);
  const channelDisabled = missingDestination || !!dndBlock;

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result);
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const oversized = incoming.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error(`${oversized.name} is over the 5MB limit.`);
      return;
    }
    setFiles((prev) => {
      const next = [...prev, ...incoming].slice(0, 5);
      if (prev.length + incoming.length > 5) toast.error('Max 5 attachments per message.');
      return next;
    });
  };

  const send = async () => {
    const body = text.trim();
    if (!body && files.length === 0) return;
    if (dndReason) {
      toast.error(dndReason);
      return;
    }
    if (channelDisabled) {
      toast.error(
        channel === 'Email'
          ? "Can't send email — this contact has no email address."
          : `Can't send ${channel} — this contact has no phone number.`,
      );
      return;
    }
    setSending(true);

    // Attachments must live on GHL storage before the send call can reference
    // them, so upload first and abort the send if that fails.
    let attachmentUrls: string[] = [];
    if (mode === 'channel' && files.length > 0) {
      setUploading(true);
      try {
        const payload = await Promise.all(
          files.map(async (f) => ({
            name: f.name,
            type: f.type || 'application/octet-stream',
            data: await readFileAsBase64(f),
          })),
        );
        const { data: up, error: upErr } = await supabase.functions.invoke(
          'ghl-upload-attachments',
          { body: { files: payload, conversation_id: fetched[fetched.length - 1]?.conversationId || '' } },
        );
        if (upErr) throw upErr;
        if (up?.success === false) throw new Error(up.error || 'Attachment upload failed');
        attachmentUrls = (up?.urls ?? []) as string[];
      } catch (e) {
        setUploading(false);
        setSending(false);
        toast.error(e?.message || 'Attachment upload failed — message not sent.');
        return;
      }
      setUploading(false);
    }

    const tmpId = `tmp-${Math.random().toString(36).slice(2)}`;
    const optimisticMsg: GhlMessage = {
      id: tmpId,
      conversationId: '',
      type: mode === 'channel' ? channel : 'Comment',
      rawType: '',
      direction: mode === 'channel' ? 'outbound' : '',
      body: body || (attachmentUrls.length ? `(${attachmentUrls.length} attachment${attachmentUrls.length > 1 ? 's' : ''})` : ''),
      status: 'pending',
      dateAdded: new Date().toISOString(),
      from: null,
      to: null,
      userName: 'You',
      source: null,
      call: null,
      transcriptAvailable: false,
      meta: null,
      altId: null,
    };
    setOptimistic((prev) => [...prev, optimisticMsg]);
    setText('');
    try {
      const fn = mode === 'channel' ? 'ghl-send-message' : 'ghl-send-internal-comment';
      const { data, error: fnErr } = await supabase.functions.invoke(fn, {
        body:
          mode === 'channel'
            ? {
                contact_id: contactId,
                message: body,
                channel,
                ...(attachmentUrls.length ? { attachments: attachmentUrls } : {}),
                ...(channel === 'Email' ? { subject: subject.trim() } : {}),
              }
            : { contact_id: contactId, message: body },
      });
      if (fnErr) throw fnErr;
      if (data?.success === false) throw new Error(data.error || 'Send failed');
      toast.success(mode === 'channel' ? `${channel} sent` : 'Internal comment posted to GHL');
      if (mode === 'channel' && channel === 'Email') { setSubject(''); setReplyTo(null); }
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setOptimistic((prev) =>
        prev.map((m) => (m.id === tmpId ? { ...m, status: 'sent' } : m)),
      );
      // Silent background refetch after GHL indexes the record.
      setTimeout(() => { refetch(); }, 800);
    } catch (e) {
      setOptimistic((prev) => prev.filter((m) => m.id !== tmpId));
      setText(body);
      toast.error(e?.message || 'Send failed. Try again.');
    } finally {
      setSending(false);
    }
  };


  const errMsg = error ? (error as Error).message : null;
  const refreshing = isFetching && !isLoading;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Conversation
          {contactName && <span className="text-xs text-muted-foreground font-normal">— {contactName}</span>}
          {refreshing && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          ref={scrollRef}
          className="h-[420px] w-full overflow-y-auto overflow-x-hidden rounded-md border bg-muted/20 p-3 pr-4"
        >
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
            </div>
          ) : errMsg && messages.length === 0 ? (
            <div className="text-sm text-destructive">{errMsg}</div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages in this conversation yet.</p>
          ) : (
            <MessageList messages={messages} contactId={contactId} onRefetch={() => refetch()} onReply={handleReplyMessage} onReplyEmail={handleReplyEmail} onForwardEmail={handleForwardEmail} />
          )}
        </div>

        {/* Composer */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* Channel picker — SMS · WhatsApp · Email */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'channel' ? 'default' : 'outline'}
                  className="min-h-[36px]"
                >
                  {(() => {
                    const Icon = CHANNEL_META[channel].icon;
                    return <Icon className="h-3.5 w-3.5 mr-1.5" />;
                  })()}
                  {CHANNEL_META[channel].label}
                  <ChevronDown className="h-3.5 w-3.5 ml-1.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {(Object.keys(CHANNEL_META) as Channel[]).map((c) => {
                  const Icon = CHANNEL_META[c].icon;
                  const unavailable = c === 'Email' ? !hasEmail : !hasPhone;
                  return (
                    <DropdownMenuItem
                      key={c}
                      disabled={unavailable}
                      onSelect={() => { setChannel(c); setMode('channel'); }}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{CHANNEL_META[c].label}</span>
                      {mode === 'channel' && channel === c && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              size="sm"
              variant={mode === 'comment' ? 'default' : 'outline'}
              onClick={() => setMode('comment')}
              className="min-h-[36px]"
            >
              <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Internal comment
            </Button>

            {mode === 'channel' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => pickFiles(e.target.files)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploading || channelDisabled}
                  className="min-h-[36px]"
                  aria-label="Attach files"
                >
                  <Paperclip className="h-3.5 w-3.5 mr-1.5" /> Attach
                </Button>
              </>
            )}
          </div>

          {mode === 'channel' && files.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 pl-2 pr-1 py-0.5 text-[11px] max-w-[220px]"
                >
                  <Paperclip className="h-3 w-3 shrink-0 opacity-70" />
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {mode === 'channel' && channel === 'Email' && (
            <div className="rounded-md border bg-background">
              {replyTo && (
                <div className="flex items-center gap-2 border-b px-2 py-1.5">
                  <span className="text-xs text-muted-foreground shrink-0">To</span>
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px]">
                    <Mail className="h-3 w-3 shrink-0 opacity-70" />
                    <span className="truncate">{replyTo.to || 'contact on file'}</span>
                  </span>
                  <button
                    type="button"
                    aria-label="Discard reply"
                    onClick={() => { setReplyTo(null); setSubject(''); setText(''); }}
                    className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs text-muted-foreground shrink-0">Subject:</span>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  disabled={sending || !hasEmail}
                  className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
          )}


          {dndReason && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{dndReason}</span>
            </div>
          )}

          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === 'comment'
                ? 'Internal comment — visible to your team in GHL, never sent to the contact…'
                : dndReason
                  ? dndReason
                : channelDisabled
                  ? channel === 'Email'
                    ? 'No email address on file — email disabled.'
                    : `No phone number on file — ${channel} disabled.`
                  : `Type a${channel === 'Email' ? 'n email' : ` ${channel} message`} to send…`
            }
            rows={3}
            disabled={sending || channelDisabled}
          />
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {mode === 'comment'
                ? 'Team-only — posts into the GHL conversation'
                : channel === 'Email'
                  ? 'Sends from your GHL email channel'
                  : `${text.length}/1600`}
            </span>

            <Button
              size="sm"
              onClick={send}
              disabled={sending || uploading || (!text.trim() && files.length === 0) || channelDisabled}
              className="min-h-[40px]"
            >
              {sending || uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{uploading && <span className="ml-1.5">Uploading…</span>}</>
              ) : (
                <><Send className="h-3.5 w-3.5 mr-1.5" /> Send</>
              )}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

function MessageList({
  messages,
  contactId,
  onRefetch,
  onReply,
  onReplyEmail,
  onForwardEmail,
}: {
  messages: GhlMessage[];
  contactId: string;
  onRefetch: () => void;
  onReply?: (m: GhlMessage) => void;
  onReplyEmail?: (m: GhlMessage) => void;
  onForwardEmail?: (m: GhlMessage, scope: 'email' | 'thread') => void;
}) {
  const grouped = useMemo(() => {
    const groups: { day: Date; items: GhlMessage[] }[] = [];
    for (const m of messages) {
      const d = m.dateAdded ? new Date(m.dateAdded) : new Date(0);
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.day, d)) last.items.push(m);
      else groups.push({ day: d, items: [m] });
    }
    return groups;
  }, [messages]);

  return (
    <div className="space-y-4">
      {grouped.map((g, gi) => (
        <div key={gi} className="space-y-2">
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
              {format(g.day, 'EEEE d MMM yyyy')}
            </span>
          </div>
          {g.items.map((m) => (
            <MessageBubble key={m.id} m={m} contactId={contactId} onRefetch={onRefetch} onReply={onReply} onReplyEmail={onReplyEmail} onForwardEmail={onForwardEmail} />
          ))}
        </div>
      ))}
    </div>
  );
}


function MessageBubble({
  m,
  contactId,
  onReply,
  onReplyEmail,
  onForwardEmail,
}: {
  m: GhlMessage;
  contactId: string;
  onRefetch?: () => void;
  onReply?: (m: GhlMessage) => void;
  onReplyEmail?: (m: GhlMessage) => void;
  onForwardEmail?: (m: GhlMessage, scope: 'email' | 'thread') => void;
}) {

  if (m.type === 'Activity') {
    return (
      <div className="flex items-center gap-2 justify-center">
        <Sparkles className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground italic">
          {m.body || 'Activity'} · {m.dateAdded ? format(new Date(m.dateAdded), 'h:mma') : ''}
        </span>
      </div>
    );
  }
  if (m.type === 'Comment') {
    return (
      <div className="mx-auto max-w-[85%] rounded-md border border-amber-300/40 bg-amber-50 dark:bg-amber-950/20 p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 mb-1">
          <StickyNote className="h-3 w-3" /> Note
          {m.userName && <span>· {m.userName}</span>}
          {m.dateAdded && <span>· {format(new Date(m.dateAdded), 'h:mma')}</span>}
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
      </div>
    );
  }

  if (m.type === 'Call') return <CallCard m={m} contactId={contactId} />;
  if (m.type === 'Voicemail') return <VoicemailCard m={m} />;
  if (m.type === 'Email') return <EmailCard m={m} onReply={onReplyEmail} onForward={onForwardEmail} />;


  const outbound = m.direction === 'outbound';
  return (
    <div className={cn('flex w-full min-w-0', outbound ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex flex-col gap-0.5 max-w-[80%]', outbound ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'min-w-0 rounded-2xl px-3 py-2 shadow-sm text-sm break-words',
            outbound
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-background border rounded-bl-sm',
          )}
        >
          <div className={cn('flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] mb-0.5 opacity-80', outbound ? '' : 'text-muted-foreground')}>
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span>{m.type}</span>
            {m.userName && outbound && <span>· {m.userName}</span>}
          </div>
          <div className="whitespace-pre-wrap break-words">{m.body || <em className="opacity-70">(no content)</em>}</div>
        </div>
        <div className="flex items-center gap-1 text-[10px] leading-none text-muted-foreground px-0.5">
          {m.dateAdded && <span>{format(new Date(m.dateAdded), 'h:mma')}</span>}
          {outbound && <MessageStatusCheck m={m} />}
          <SmsWhatsAppMessageMenu m={m} onReply={onReply} />
        </div>
      </div>
    </div>
  );
}

/** Normalised delivery states we render as ticks. */
type TickState = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'unknown';

function toTickState(raw?: string | null): TickState {
  const s = String(raw || '').toLowerCase();
  if (!s) return 'unknown';
  if (['read', 'opened', 'clicked'].some((k) => s.includes(k))) return 'read';
  if (s.includes('deliver') && !s.includes('undeliver')) return 'delivered';
  if (['failed', 'undelivered', 'error', 'rejected', 'bounce'].some((k) => s.includes(k))) return 'failed';
  if (['pending', 'queued', 'scheduled', 'sending'].some((k) => s.includes(k))) return 'pending';
  if (s.includes('sent')) return 'sent';
  return 'unknown';
}

const TICK_LABEL: Record<TickState, string> = {
  pending: 'pending',
  sent: 'sent',
  delivered: 'delivered',
  read: 'read/seen',
  failed: 'failed',
  unknown: 'status unknown — tap to check',
};

/**
 * WhatsApp-style delivery ticks sitting under the message. Tapping re-checks
 * the live outcome in GHL (lazily, so a busy thread never polls everything).
 */
function MessageStatusCheck({ m }: { m: GhlMessage }) {
  const [live, setLive] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const state = toTickState(live ?? m.status);

  const check = async () => {
    if (loading || m.id.startsWith('tmp-')) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-conversation-actions', {
        body: { action: 'message_status', message_id: m.id },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Status unavailable');
      setLive(String(data?.status || 'unknown'));
      // Exact provider wording: reason ("[30008] Unknown error"), else raw error
      // object, else the provider status string itself.
      const exact =
        (data?.reason && String(data.reason)) ||
        (data?.error_message && String(data.error_message)) ||
        (data?.raw_error ? JSON.stringify(data.raw_error) : '') ||
        (data?.email_status ? `provider status: ${data.email_status}` : '') ||
        '';
      setDetail(exact || null);
      setChecked(true);
    } catch (e) {
      toast.error(e?.message || 'Could not check delivery status');
    } finally {
      setLoading(false);
    }
  };

  const icon = loading ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
  ) : state === 'pending' ? (
    <Clock className="h-3.5 w-3.5" />
  ) : state === 'failed' ? (
    <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
  ) : state === 'read' ? (
    <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
  ) : state === 'delivered' ? (
    <CheckCheck className="h-3.5 w-3.5" />
  ) : state === 'sent' ? (
    <Check className="h-3.5 w-3.5" />
  ) : (
    <RefreshCw className="h-3 w-3" />
  );

  // On hover of a failed message, lazily pull the reason from GHL once.
  const hydrateReason = () => {
    if (state !== 'failed' || detail || loading || checked) return;
    void check();
  };

  const reason =
    detail ||
    (state === 'failed'
      ? checked
        ? `GHL returned no reason for this message (status: ${String(live ?? m.status ?? 'failed')}).`
        : 'Fetching the provider reason…'
      : null);


  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={check}
          onMouseEnter={hydrateReason}
          onFocus={hydrateReason}
          aria-label={`Delivery status: ${TICK_LABEL[state]}${reason ? ` — ${reason}` : ''}`}
          className="inline-flex items-center gap-1 min-h-[24px] px-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          {icon}
          {state === 'failed' && <span className="normal-case">failed</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="end" className="max-w-[260px] text-xs">
        <p className="font-medium">{TICK_LABEL[state]}</p>
        {state === 'failed' && (
          <p className="mt-0.5 opacity-90 break-words">{loading ? 'Checking reason…' : reason}</p>
        )}
        <p className="mt-0.5 opacity-70">Tap to re-check</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Emails keep their addresses on `meta.email` (often arrays), while SMS and
 * WhatsApp use the top-level from/to. Read both so email details/headers are
 * never blank.
 */
function messageAddresses(m: GhlMessage): { from: string; to: string } {
  const join = (v: unknown): string =>
    Array.isArray(v) ? v.filter(Boolean).map(String).join(', ') : v ? String(v) : '';
  const e = (m as any)?.meta?.email || null;
  return {
    from: join(m.from) || join(e?.from) || join(e?.replyTo) || join(e?.fromEmail),
    to: join(m.to) || join(e?.to) || join(e?.recipients) || join(e?.toEmail),
  };
}

function MessageDetailsPanel({ m }: { m: GhlMessage }) {

  const outbound = m.direction === 'outbound';
  const state = toTickState(m.status);
  const failed = state === 'failed';
  // Always resolved from the viewer's own browser/OS timezone, e.g.
  // "GMT+10:00 Australia/Sydney (AEST)" — never a hardcoded zone.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzLine = useMemo(() => {
    if (!m.dateAdded) return null;
    const d = new Date(m.dateAdded);
    if (Number.isNaN(d.getTime())) return null;
    const mins = -d.getTimezoneOffset();
    const sign = mins < 0 ? '-' : '+';
    const abs = Math.abs(mins);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    // Prefer the localised zone abbreviation (AEST, PST, GMT+8…) for this date,
    // so DST is reflected automatically; fall back to the raw offset.
    let abbr = `GMT${sign}${Math.floor(abs / 60)}${abs % 60 ? `:${mm}` : ''}`;
    try {
      const part = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
        .formatToParts(d)
        .find((p) => p.type === 'timeZoneName')?.value;
      if (part) abbr = part;
    } catch {
      // Keep the offset fallback.
    }
    return `GMT${sign}${hh}:${mm}${tz ? ` ${tz}` : ''} (${abbr})`;
  }, [m.dateAdded, tz]);


  const statusIcon =
    state === 'failed' ? <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
      : state === 'read' ? <CheckCheck className="h-3.5 w-3.5 text-sky-500 shrink-0" />
      : state === 'delivered' ? <CheckCheck className="h-3.5 w-3.5 text-sky-500 shrink-0" />
      : state === 'sent' ? <Check className="h-3.5 w-3.5 shrink-0" />
      : <Clock className="h-3.5 w-3.5 shrink-0" />;

  // GHL labels its own channels "Lead Connector" and native WhatsApp/social
  // channels "Native Integrations" — fall back the same way when unreported.
  const provider =
    m?.meta?.provider ||
    m?.meta?.messageProvider ||
    (['WhatsApp', 'Facebook', 'Instagram'].includes(m.type) ? 'Native Integrations' : null) ||
    m.source ||
    'Lead Connector';

  const { from: fromAddr, to: toAddr } = messageAddresses(m);

  // For failed messages, pull the provider's exact wording from GHL once the
  // details panel opens — GHL only returns error codes on the single-message
  // (and email) endpoints, not in the thread listing.
  const [exactReason, setExactReason] = useState<string | null>(null);
  const [reasonLoading, setReasonLoading] = useState(false);
  useEffect(() => {
    if (!failed || m.id.startsWith('tmp-')) return;
    let cancelled = false;
    setReasonLoading(true);
    supabase.functions
      .invoke('ghl-conversation-actions', { body: { action: 'message_status', message_id: m.id } })
      .then(({ data }) => {
        if (cancelled || !data || data.success === false) return;
        const exact =
          (data.reason && String(data.reason)) ||
          (data.error_message && String(data.error_message)) ||
          (data.raw_error ? JSON.stringify(data.raw_error) : '') ||
          (data.email_status ? `provider status: ${data.email_status}` : '') ||
          '';
        setExactReason(exact || null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReasonLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [failed, m.id]);





  return (
    <div className="space-y-0">
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
        <span className="text-sm font-semibold text-foreground">Message details</span>
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="px-3 pb-3 space-y-1 text-xs">
        <p className="text-muted-foreground">From:</p>
        <p className="font-medium break-words break-all">{fromAddr || '—'}</p>
        <p className="pt-1 text-muted-foreground">To:</p>
        <p className="font-medium break-words flex items-center gap-1.5">
          <span className="break-all">{toAddr || '—'}</span>
          {outbound && statusIcon}
        </p>
      </div>


      <div className="border-t" />
      <div className="px-3 py-2.5 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium capitalize">
            {(m.direction || 'unknown')} ({m.type})
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <span className="font-medium">
            {m.dateAdded ? format(new Date(m.dateAdded), "EEE, d MMM yyyy, hh:mm a") : '—'}
            {tzLine && <span className="block text-muted-foreground">{tzLine}</span>}
          </span>
        </div>
        {m.userName && (
          <div className="flex items-center gap-2">
            <UserCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">{m.userName}</span>
          </div>
        )}
      </div>

      <div className="border-t" />
      <div className="px-3 py-2.5 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium capitalize">{provider}</span>
        </div>
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className={cn('font-medium capitalize', failed && 'text-rose-500')}>
            {TICK_LABEL[state]}
          </span>
        </div>
        {failed && (
          <div className="space-y-1">
            <p className="text-muted-foreground">Failure reason (from provider):</p>
            <p className="text-rose-500 text-[11px] break-words whitespace-pre-wrap">
              {reasonLoading
                ? 'Fetching exact reason…'
                : exactReason || `No reason returned by GHL (raw status: ${m.status || 'failed'}).`}
            </p>
            {m.status && <p className="text-[11px] text-muted-foreground break-words">Raw status: {m.status}</p>}
          </div>
        )}
      </div>

    </div>
  );
}


function EmailMessageMenu({
  m,
  onReply,
  onForward,
}: {
  m: GhlMessage;
  onReply?: (m: GhlMessage) => void;
  onForward?: (m: GhlMessage, scope: 'email' | 'thread') => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Email actions"
            className="inline-flex items-center justify-center min-h-[24px] min-w-[24px] rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-52">
          <DropdownMenuItem onSelect={() => setDetailsOpen(true)} className="gap-2">
            <Info className="h-4 w-4" /> Details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onForward?.(m, 'email')} className="gap-2">
            <Forward className="h-4 w-4" /> Forward Email
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onForward?.(m, 'thread')} className="gap-2">
            <Forward className="h-4 w-4" /> Forward Thread
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Message details</DialogTitle>
        </DialogHeader>
        <MessageDetailsPanel m={m} />
      </DialogContent>
    </Dialog>
  );
}

function SmsWhatsAppMessageMenu({
  m,
  onReply,
}: {
  m: GhlMessage;
  onReply?: (m: GhlMessage) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Message actions"
            className="inline-flex items-center justify-center min-h-[24px] min-w-[24px] rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={m.direction === 'outbound' ? 'end' : 'start'} side="top" className="w-44">
          <DropdownMenuItem onSelect={() => onReply?.(m)} className="gap-2">
            <Reply className="h-4 w-4" /> Reply
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDetailsOpen(true)} className="gap-2">
            <Info className="h-4 w-4" /> Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Message details</DialogTitle>
        </DialogHeader>
        <MessageDetailsPanel m={m} />
      </DialogContent>
    </Dialog>
  );
}



/**
 * Emails arrive from GHL as a plain-text dump full of `label\n[tracking-url]`
 * pairs plus an unsubscribe footer. Render them as a readable email card:
 * subject header, paragraphs with real links, collapse for long threads.
 */
function EmailCard({
  m,
  onReply,
  onForward,
}: {
  m: GhlMessage;
  onReply?: (m: GhlMessage) => void;
  onForward?: (m: GhlMessage, scope: 'email' | 'thread') => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const subject: string | null = m?.meta?.email?.subject || null;
  const parsed = useMemo(() => parseEmailBody(m.body || '', subject), [m.body, subject]);
  const outbound = m.direction === 'outbound';
  const long = parsed.paragraphs.length > 6;
  const shown = expanded || !long ? parsed.paragraphs : parsed.paragraphs.slice(0, 5);

  return (
    <div className="w-full min-w-0">
      <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b bg-muted/40 px-3 py-2">
          <Mail className={cn('h-3.5 w-3.5 shrink-0', outbound ? 'text-primary' : 'text-emerald-600')} />
          <span className="text-xs font-medium truncate max-w-full">{subject || '(no subject)'}</span>
          <Badge variant="outline" className="text-[10px]">{outbound ? 'Sent' : 'Received'}</Badge>
          <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">
            {m.userName || ''}
          </span>
        </div>
        {(() => {
          const addr = messageAddresses(m);
          if (!addr.from && !addr.to) return null;
          return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 pt-2 text-[10px] text-muted-foreground">
              {addr.from && <span className="truncate max-w-full">From: <span className="text-foreground">{addr.from}</span></span>}
              {addr.to && <span className="truncate max-w-full">To: <span className="text-foreground">{addr.to}</span></span>}
            </div>
          );
        })()}

        <div className="px-3 py-2.5 space-y-2 text-sm">
          {shown.length === 0 && <em className="text-muted-foreground">(no content)</em>}
          {shown.map((segs, i) => (
            <p key={i} className="break-words leading-relaxed">
              {segs.map((s, j) =>
                s.kind === 'link' ? (
                  <a
                    key={j}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 break-all inline-flex items-center gap-1"
                  >
                    {s.label}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span key={j} className="whitespace-pre-wrap">{s.text}</span>
                ),
              )}
            </p>
          ))}
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-primary hover:underline min-h-[32px]"
            >
              {expanded ? 'Show less' : 'Show full email'}
            </button>
          )}
          {parsed.footerTrimmed && (
            <p className="text-[10px] text-muted-foreground italic">Unsubscribe footer hidden</p>
          )}
        </div>
        {(onReply || onForward) && (
          <div className="border-t bg-muted/20 px-3 py-2 flex items-center gap-2">
            {onReply && (
              <Button
                size="sm"
                onClick={() => onReply(m)}
                className="h-8 min-h-[36px] px-3 text-xs"
              >
                <Reply className="h-3.5 w-3.5 mr-1.5" /> Reply
              </Button>
            )}
            {onForward && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onForward(m, 'email')}
                className="h-8 min-h-[36px] px-3 text-xs"
              >
                <Forward className="h-3.5 w-3.5 mr-1.5" /> Forward
              </Button>
            )}
          </div>
        )}
      </div>
      <div
        className={cn(
          'mt-1 flex items-center gap-1.5 text-[10px] leading-none text-muted-foreground px-0.5',
          outbound ? 'justify-end' : 'justify-start',
        )}
      >
        {m.dateAdded && <span>{format(new Date(m.dateAdded), 'h:mma')}</span>}
        {onReply && (
          <button
            type="button"
            aria-label="Reply to email"
            onClick={() => onReply(m)}
            className="inline-flex items-center justify-center rounded hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 min-h-[24px] min-w-[24px]"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
        )}
        {outbound && <MessageStatusCheck m={m} />}
        <EmailMessageMenu m={m} onReply={onReply} onForward={onForward} />
      </div>
    </div>
  );
}



/**
 * Fetches an auth-protected GHL recording via our proxy edge function and
 * returns a Blob object URL for the <audio> element. Returns null on failure.
 */
function useRecordingUrl(messageId: string, hasRecording: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const fetchIt = async () => {
    if (url || loading || failed || !hasRecording) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-get-recording', {
        body: { message_id: messageId },
      });
      if (error) throw error;
      // Edge function returns a Blob when the response is audio; a JSON error otherwise.
      if (data instanceof Blob) {
        if (data.type.startsWith('audio') || data.size > 1000) {
          setUrl(URL.createObjectURL(data));
        } else {
          // JSON error came back as a blob.
          const txt = await data.text();
          try {
            const parsed = JSON.parse(txt);
            if (parsed?.success === false) throw new Error(parsed.error || 'No recording');
          } catch {
            throw new Error('Recording unavailable');
          }
          setFailed(true);
        }
      } else if (data && typeof data === 'object' && (data as any).success === false) {
        setFailed(true);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [url]);

  return { url, loading, failed, fetchIt };
}

function RecordingPlayer({ messageId, hasRecording }: { messageId: string; hasRecording: boolean }) {
  const { url, loading, failed, fetchIt } = useRecordingUrl(messageId, hasRecording);
  if (!hasRecording || failed) return null;
  if (!url) {
    return (
      <button
        type="button"
        onClick={fetchIt}
        disabled={loading}
        className="mt-2 inline-flex items-center gap-1.5 text-xs rounded-md border px-2 py-1 hover:bg-muted transition-colors min-h-[32px]"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
        {loading ? 'Loading recording…' : 'Load recording'}
      </button>
    );
  }
  return (
    <audio controls className="mt-2 w-full max-w-full" src={url} preload="metadata" />
  );
}

function CallCard({ m, contactId }: { m: GhlMessage; contactId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [tLoading, setTLoading] = useState(false);
  const [tError, setTError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<any[] | null>(null);
  const outbound = m.direction === 'outbound';

  const loadTranscript = async () => {
    if (transcript || tLoading) return;
    setTLoading(true);
    setTError(null);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-get-conversation', {
        body: { contact_id: contactId, transcript_for: m.id },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'No transcript');
      setTranscript(data?.transcript || []);
    } catch (e) {
      setTError(e?.message || 'Transcript unavailable');
    } finally {
      setTLoading(false);
    }
  };

  const durMin = Math.floor((m.call?.duration || 0) / 60);
  const durSec = (m.call?.duration || 0) % 60;
  const hasRecording = !!m.call?.recordingUrl;

  return (
    <div className={cn('flex w-full min-w-0', outbound ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[80%] min-w-0 rounded-lg border bg-background p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Phone className={cn('h-4 w-4 shrink-0', outbound ? 'text-primary' : 'text-emerald-600')} />
          <span className="font-medium">{outbound ? 'Outbound call' : 'Inbound call'}</span>
          <Badge variant="outline" className="text-[10px]">
            {m.call?.status || 'unknown'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {durMin}m {durSec}s
          </span>
          {m.dateAdded && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(m.dateAdded), 'h:mma')}
            </span>
          )}
        </div>
        <RecordingPlayer messageId={m.id} hasRecording={hasRecording} />
        <button
          type="button"
          onClick={() => { setExpanded((v) => !v); if (!expanded) loadTranscript(); }}
          className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          View transcript
        </button>
        {expanded && (
          <div className="mt-2 border-t pt-2 text-xs space-y-1">
            {tLoading && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading transcript…
              </div>
            )}
            {tError && <div className="text-muted-foreground italic">{tError}</div>}
            {transcript && transcript.length === 0 && (
              <div className="text-muted-foreground italic">No transcript captured for this call.</div>
            )}
            {transcript && transcript.length > 0 && (
              <div className="space-y-0.5 max-h-64 overflow-y-auto pr-2">
                {transcript.map((row: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <span className={cn('font-medium shrink-0', row.speaker === 0 ? 'text-primary' : 'text-emerald-600')}>
                      {row.speaker === 0 ? 'Agent' : 'Contact'}:
                    </span>
                    <span className="break-words">{row.transcript}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VoicemailCard({ m }: { m: GhlMessage }) {
  const outbound = m.direction === 'outbound';
  const hasRecording = !!(m.call?.recordingUrl || m?.meta?.voicemail?.recordingUrl);
  return (
    <div className={cn('flex w-full min-w-0', outbound ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[80%] min-w-0 rounded-lg border bg-background p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Voicemail className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium">Voicemail</span>
          {m.dateAdded && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(m.dateAdded), 'h:mma')}
            </span>
          )}
        </div>
        {hasRecording ? (
          <RecordingPlayer messageId={m.id} hasRecording />
        ) : (
          <div className="mt-1 text-xs text-muted-foreground italic">Recording unavailable</div>
        )}
        {m.body && <p className="mt-2 text-sm whitespace-pre-wrap break-words">{m.body}</p>}
      </div>
    </div>
  );
}

// --- Opportunity tab --------------------------------------------------------

export function LeadOpportunityTab({ contactId }: { contactId: string }) {
  const { data: opps = [], isLoading, isFetching, error, refetch } = useGhlOpportunities(contactId);
  const errMsg = error ? (error as Error).message : null;
  const refreshing = isFetching && !isLoading;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Opportunities
          {refreshing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && opps.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading opportunities…
          </div>
        ) : errMsg && opps.length === 0 ? (
          <div className="text-sm text-destructive">{errMsg}</div>
        ) : opps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No opportunities for this contact.</p>
        ) : (
          opps.map((o) => <OpportunityRow key={o.id} o={o} />)
        )}
      </CardContent>
    </Card>
  );
}

function currency(n: number) {
  try {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n || 0);
  } catch {
    return `$${(n || 0).toFixed(0)}`;
  }
}

/**
 * Horizontal pipeline stepper. Each stage is a fixed-width column with the
 * circle centred over its label; connectors sit between circles, vertically
 * aligned to circle centre. The whole track is horizontally scrollable so long
 * pipelines don't clip, and the current stage auto-scrolls into view.
 */
function OpportunityRow({ o }: { o: GhlOpportunity }) {
  const currentIdx = Math.max(0, o.stages.findIndex((s) => s.id === o.pipelineStageId));
  const isWon = o.status === 'won';
  const isLost = o.status === 'lost' || o.status === 'abandoned';
  const scrollerRef = useRef<HTMLDivElement>(null);

  const COL = 104;  // px, stage column width (label wraps within this)
  const CIRC = 28;  // px, circle diameter
  const PAD = 32;   // px, horizontal breathing room inside the scroll track

  // Center the current stage in the scroller. Computed from geometry so it
  // works even before the DOM measures (tab mounts hidden). Re-run a few times
  // + on resize so it lands once the Opportunity tab actually becomes visible.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const position = () => {
      const w = scroller.clientWidth;
      if (!w) return;
      const target =
        currentIdx <= 0
          ? 0
          : Math.max(0, PAD + currentIdx * COL + COL / 2 - w / 2);
      scroller.scrollLeft = target;
    };

    position();
    const raf = requestAnimationFrame(position);
    const t1 = setTimeout(position, 80);
    const t2 = setTimeout(position, 250);
    const ro = new ResizeObserver(() => position());
    ro.observe(scroller);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
    };
  }, [currentIdx, o.stages.length]);

  return (
    <div className="rounded-lg border p-3 space-y-3 bg-muted/20">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-sm">{stripEmojis(o.name).trim() || o.name}</span>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] uppercase',
            isWon && 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400',
            isLost && 'border-rose-500/50 text-rose-700 dark:text-rose-400',
            o.status === 'open' && 'border-primary/50 text-primary',
          )}
        >
          {isWon ? <><Trophy className="h-3 w-3 mr-1" /> Won</> :
           isLost ? <><XCircle className="h-3 w-3 mr-1" /> Closed Lost</> :
           <>Open</>}
        </Badge>
        {o.pipelineName && <span className="text-xs text-muted-foreground">· {o.pipelineName}</span>}
        <span className="text-xs text-muted-foreground ml-auto">{currency(o.monetaryValue)}</span>
      </div>

      {o.stages.length > 0 && (
        <div ref={scrollerRef} className="overflow-x-auto overflow-y-hidden">
          {/* py-3 gives the current circle's ring (ring-2 + ring-offset-2 = 4px)
              room top & bottom so it is never clipped by overflow-y-hidden. */}
          <div
            className="grid py-3"
            style={{
              gridTemplateColumns: `repeat(${o.stages.length}, ${COL}px)`,
              rowGap: 10,
              paddingLeft: PAD,
              paddingRight: PAD,
            }}
          >
            {/* Row 1: circles + connectors on one baseline */}
            {o.stages.map((s, i) => {
              const active = isWon ? true : isLost ? false : i <= currentIdx;
              const current = !isWon && !isLost && i === currentIdx;
              const nextActive =
                i < o.stages.length - 1
                  ? (isWon ? true : isLost ? false : i + 1 <= currentIdx)
                  : false;
              const isLast = i === o.stages.length - 1;
              return (
                <div
                  key={`c-${s.id}`}
                  className="relative flex items-center justify-center"
                  style={{ height: CIRC }}
                >
                  {!isLast && (
                    <div
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full',
                        nextActive && !isLost ? 'bg-emerald-500' : 'bg-muted-foreground/25',
                      )}
                      style={{ left: `calc(50% + ${CIRC / 2}px)`, width: `calc(${COL}px - ${CIRC}px)` }}
                    />
                  )}
                  <div
                    className={cn(
                      'relative z-10 rounded-full flex items-center justify-center text-[11px] font-medium border-2',
                      active && !isLost && 'bg-emerald-500 border-emerald-500 text-white',
                      current && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      isLost && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                      !active && !isLost && 'bg-background border-muted-foreground/30 text-muted-foreground',
                    )}
                    style={{ width: CIRC, height: CIRC }}
                  >
                    {active && !isLost ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="leading-none tabular-nums translate-y-[0.5px]">{i + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Row 2: labels aligned under each circle */}
            {o.stages.map((s, i) => {
              const current = !isWon && !isLost && i === currentIdx;
              return (
                <span
                  key={`l-${s.id}`}
                  className={cn(
                    'text-center text-[10px] leading-tight px-1 line-clamp-2 break-words',
                    current ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                  title={s.name}
                >
                  {s.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {o.source && <span>Source: {o.source}</span>}
        {o.lastStageChangeAt && (
          <span>Last stage change: {format(new Date(o.lastStageChangeAt), 'd MMM yyyy, h:mma')}</span>
        )}
      </div>
    </div>
  );
}

