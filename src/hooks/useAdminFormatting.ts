import { useMemo, useCallback } from 'react';
import { 
  capitalizeText, 
  formatSource, 
  formatCampaign, 
  formatStatus 
} from '@/lib/textFormatting';

/**
 * Configuration for badge styling based on value patterns
 */
interface BadgeConfig {
  label: string;
  color: string;
  icon?: string;
}

type BadgeConfigMap = Record<string, BadgeConfig>;

/**
 * Default status badge configurations
 */
const defaultStatusConfig: BadgeConfigMap = {
  // Common statuses
  draft: { label: 'Draft', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  published: { label: 'Published', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground border-border' },
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  pending_review: { label: 'Pending Review', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  approved: { label: 'Approved', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  submitted: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  canceled: { label: 'Canceled', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  no_show: { label: 'No Show', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  booking_shown: { label: 'Booking Shown', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  active: { label: 'Active', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  inactive: { label: 'Inactive', color: 'bg-muted text-muted-foreground border-border' },
};

/**
 * Default source/medium badge configurations
 */
const defaultMediumConfig: BadgeConfigMap = {
  lead_chatbot: { label: 'Chatbot', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  lead_form: { label: 'Form', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  chatbot: { label: 'Chatbot', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  form: { label: 'Form', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  booking_modal: { label: 'Booking', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  webhook: { label: 'Webhook', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  email: { label: 'Email', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  api: { label: 'API', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
};

/**
 * Default campaign badge configurations
 */
const defaultCampaignConfig: BadgeConfigMap = {
  demo_request: { label: 'Demo', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  contact_inquiry: { label: 'Contact', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  contact_form: { label: 'Contact', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  support_request: { label: 'Support', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  partnership_inquiry: { label: 'Partnership', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  newsletter: { label: 'Newsletter', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
};

/**
 * Default type badge configurations
 */
const defaultTypeConfig: BadgeConfigMap = {
  webinar: { label: 'Webinar', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  workshop: { label: 'Workshop', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  conference: { label: 'Conference', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  meetup: { label: 'Meetup', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
  demo: { label: 'Demo', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  training: { label: 'Training', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  zoom: { label: 'Zoom', color: 'bg-blue-600/10 text-blue-600 border-blue-600/20' },
  calendly: { label: 'Calendly', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  online: { label: 'Online', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  in_person: { label: 'In Person', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
};

interface UseAdminFormattingOptions {
  /** Custom status configurations to merge with defaults */
  statusConfig?: BadgeConfigMap;
  /** Custom medium configurations to merge with defaults */
  mediumConfig?: BadgeConfigMap;
  /** Custom campaign configurations to merge with defaults */
  campaignConfig?: BadgeConfigMap;
  /** Custom type configurations to merge with defaults */
  typeConfig?: BadgeConfigMap;
}

interface BadgeInfo {
  label: string;
  color: string;
}

/**
 * Hook for consistent text formatting across admin panels
 * Provides formatting functions and badge configurations
 */
export function useAdminFormatting(options: UseAdminFormattingOptions = {}) {
  // Merge custom configs with defaults
  const statusConfig = useMemo(
    () => ({ ...defaultStatusConfig, ...options.statusConfig }),
    [options.statusConfig]
  );

  const mediumConfig = useMemo(
    () => ({ ...defaultMediumConfig, ...options.mediumConfig }),
    [options.mediumConfig]
  );

  const campaignConfig = useMemo(
    () => ({ ...defaultCampaignConfig, ...options.campaignConfig }),
    [options.campaignConfig]
  );

  const typeConfig = useMemo(
    () => ({ ...defaultTypeConfig, ...options.typeConfig }),
    [options.typeConfig]
  );

  /**
   * Get badge info for a status value
   */
  const getStatusBadge = useCallback((status: string | null | undefined): BadgeInfo => {
    if (!status) return { label: '', color: 'bg-muted text-muted-foreground border-border' };
    const config = statusConfig[status.toLowerCase()];
    return config 
      ? { label: config.label, color: config.color }
      : { label: formatStatus(status), color: 'bg-muted text-muted-foreground border-border' };
  }, [statusConfig]);

  /**
   * Get badge info for a source/medium value
   */
  const getMediumBadge = useCallback((medium: string | null | undefined): BadgeInfo => {
    if (!medium) return { label: '', color: 'bg-muted text-muted-foreground border-border' };
    const config = mediumConfig[medium.toLowerCase()];
    return config 
      ? { label: config.label, color: config.color }
      : { label: formatSource(medium), color: 'bg-muted text-muted-foreground border-border' };
  }, [mediumConfig]);

  /**
   * Get badge info for a campaign value
   */
  const getCampaignBadge = useCallback((campaign: string | null | undefined): BadgeInfo => {
    if (!campaign) return { label: '', color: 'bg-muted text-muted-foreground border-border' };
    const config = campaignConfig[campaign.toLowerCase()];
    return config 
      ? { label: config.label, color: config.color }
      : { label: formatCampaign(campaign), color: 'bg-muted text-muted-foreground border-border' };
  }, [campaignConfig]);

  /**
   * Get badge info for a type value (event type, lead type, etc.)
   */
  const getTypeBadge = useCallback((type: string | null | undefined): BadgeInfo => {
    if (!type) return { label: '', color: 'bg-muted text-muted-foreground border-border' };
    const config = typeConfig[type.toLowerCase()];
    return config 
      ? { label: config.label, color: config.color }
      : { label: capitalizeText(type), color: 'bg-muted text-muted-foreground border-border' };
  }, [typeConfig]);

  /**
   * Format any text value for display (auto-capitalize)
   */
  const formatText = useCallback((text: string | null | undefined): string => {
    return capitalizeText(text);
  }, []);

  /**
   * Format for table cell display
   */
  const formatCell = useCallback((value: string | null | undefined, fallback = '—'): string => {
    if (!value) return fallback;
    return capitalizeText(value);
  }, []);

  /**
   * Format for CSV export
   */
  const formatForExport = useCallback((value: string | null | undefined): string => {
    return capitalizeText(value);
  }, []);

  return {
    // Text formatting utilities
    formatText,
    formatCell,
    formatForExport,
    capitalizeText,
    formatSource,
    formatCampaign,
    formatStatus,
    
    // Badge getters
    getStatusBadge,
    getMediumBadge,
    getCampaignBadge,
    getTypeBadge,
    
    // Config objects for custom rendering
    statusConfig,
    mediumConfig,
    campaignConfig,
    typeConfig,
  };
}

// Re-export formatting utilities for direct use
export { capitalizeText, formatSource, formatCampaign, formatStatus } from '@/lib/textFormatting';
