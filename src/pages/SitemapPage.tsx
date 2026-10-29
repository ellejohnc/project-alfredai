import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Sitemap page component that redirects to the dynamically generated sitemap.xml
 * This fetches the sitemap from the edge function and displays it
 */
const SitemapPage = () => {
  useEffect(() => {
    const fetchAndDisplaySitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-sitemap');
        
        if (error) {
          console.error('Error fetching sitemap:', error);
          return;
        }

        // Create a blob with the XML content and trigger download/display
        const blob = new Blob([data], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        // Redirect to the blob URL to display the XML
        window.location.href = url;
      } catch (err) {
        console.error('Failed to fetch sitemap:', err);
      }
    };

    fetchAndDisplaySitemap();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading sitemap...</p>
      </div>
    </div>
  );
};

export default SitemapPage;
