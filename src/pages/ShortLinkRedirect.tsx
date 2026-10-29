import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Home, Mail } from 'lucide-react';

export default function ShortLinkRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setNotFound(true);
      return;
    }

    async function redirect() {
      try {
        // Use SECURITY DEFINER RPC: increments click_count and returns destination_url.
        // This avoids exposing UPDATE on short_links to the public.
        const { data, error: rpcError } = await supabase
          .rpc('increment_short_link_click' as any, { p_code: code });

        if (rpcError) {
          console.error('[ShortLinkRedirect] RPC error:', rpcError);
          setError('Something went wrong looking up this link.');
          return;
        }

        const row = Array.isArray(data) ? data[0] : data;
        const destination = row?.destination_url;

        if (!destination) {
          setNotFound(true);
          return;
        }

        // Redirect immediately
        window.location.replace(destination);
      } catch (err) {
        console.error('[ShortLinkRedirect] Unexpected error:', err);
        setError('An unexpected error occurred.');
      }
    }

    redirect();
  }, [code]);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const mailtoHref = `mailto:support@alfredai.bot?subject=Broken Short Link&body=Hi,%0A%0AI found a broken short link:%0A${encodeURIComponent(pageUrl)}%0A%0APlease investigate.`;

  // Redirecting state (default, fast path)
  if (!notFound && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Redirecting you…</p>
        </div>
      </div>
    );
  }

  // Error or not-found fallback
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg space-y-6 text-center">
          {/* Icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">
              {notFound ? 'Link Not Found' : 'Something Went Wrong'}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {notFound
                ? 'This short link is not valid or may have expired. If you believe this is an error, please let us know.'
                : (error ?? 'We encountered an unexpected error. Please try again or contact support.')}
            </p>
          </div>

          {/* Short code badge */}
          {code && (
            <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground font-mono">
              /go/{code}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full min-h-[48px] text-base"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>

            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] px-4 rounded-lg border border-border bg-background text-foreground text-sm hover:bg-muted transition-colors"
            >
              <Mail className="w-4 h-4" />
              Report This Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
