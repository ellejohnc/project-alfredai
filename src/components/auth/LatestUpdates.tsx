import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Sparkles, RefreshCw, Megaphone, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface PlatformUpdate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  link_url: string | null;
  published_at: string | null;
}

// Fallback updates when database is empty or unavailable
const FALLBACK_UPDATES: Omit<PlatformUpdate, 'id'>[] = [
  {
    title: 'Workflow Automation 2.0',
    description: 'Build complex multi-step workflows with our enhanced automation engine.',
    category: 'new_feature',
    link_url: null,
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Enhanced Dashboard Analytics',
    description: 'Real-time insights and performance metrics at your fingertips.',
    category: 'improvement',
    link_url: null,
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const categoryConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  new_feature: {
    label: 'New Feature',
    icon: Sparkles,
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  update: {
    label: 'Update',
    icon: RefreshCw,
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  announcement: {
    label: 'Announcement',
    icon: Megaphone,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  improvement: {
    label: 'Improvement',
    icon: TrendingUp,
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function LatestUpdates() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_updates')
          .select('id, title, description, category, link_url, published_at')
          .eq('is_active', true)
          .lte('published_at', new Date().toISOString())
          .order('display_order', { ascending: true })
          .order('published_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        if (data && data.length > 0) {
          setUpdates(data);
        } else {
          // Use fallback if no updates in database
          setUpdates(FALLBACK_UPDATES.map((u, i) => ({ ...u, id: `fallback-${i}` })));
        }
      } catch (err) {
        console.warn('Failed to fetch platform updates:', err);
        setHasError(true);
        // Use fallback on error
        setUpdates(FALLBACK_UPDATES.map((u, i) => ({ ...u, id: `fallback-${i}` })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  // Don't render anything if loading takes too long or complete failure
  if (isLoading) {
    return (
      <div className="mt-10 pt-6 border-t border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-border/50 bg-card/50">
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (updates.length === 0 && hasError) {
    return null; // Graceful degradation - hide section entirely
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mt-10 pt-6 border-t border-border/50"
    >
      <motion.h3 
        variants={itemVariants}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4"
      >
        Latest Updates
      </motion.h3>

      <motion.div variants={containerVariants} className="space-y-3">
        {updates.map((update) => {
          const config = categoryConfig[update.category] || categoryConfig.update;
          const Icon = config.icon;
          const Wrapper = update.link_url ? 'a' : 'div';
          const wrapperProps = update.link_url
            ? { href: update.link_url, target: '_blank', rel: 'noopener noreferrer' }
            : {};

          return (
            <motion.div key={update.id} variants={itemVariants}>
              <Wrapper
                {...wrapperProps}
                className={`block p-4 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-200 ${
                  update.link_url
                    ? 'hover:border-primary/30 hover:bg-card/50 hover:shadow-md cursor-pointer group min-h-[44px]'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 ${config.className}`}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  {update.link_url && (
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                  )}
                </div>

                <h4 className="font-medium text-sm text-foreground mb-1 line-clamp-1">
                  {update.title}
                </h4>

                {update.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {update.description}
                  </p>
                )}

                {update.published_at && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(new Date(update.published_at), { addSuffix: true })}
                  </p>
                )}
              </Wrapper>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
