import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@/components/admin/AccessDenied';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  MapPin,
  RefreshCw,
  ExternalLink,
  Clock,
  FileText,
  BookOpen,
  Newspaper,
  Calendar,
  Code,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { PRODUCTION_URL } from '@/lib/siteConfig';

interface SitemapStats {
  totalUrls: number;
  staticPages: number;
  blogPosts: number;
  guides: number;
  documentation: number;
  webinars: number;
  lastGenerated: Date | null;
  status: 'success' | 'error' | 'loading' | 'idle';
  error?: string;
}

interface ParsedUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export default function SitemapAdmin() {
  const { canManageScheduledJobs } = usePermissions();
  const [stats, setStats] = useState<SitemapStats>({
    totalUrls: 0,
    staticPages: 0,
    blogPosts: 0,
    guides: 0,
    documentation: 0,
    webinars: 0,
    lastGenerated: null,
    status: 'idle',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [sitemapContent, setSitemapContent] = useState<string | null>(null);
  const [parsedUrls, setParsedUrls] = useState<ParsedUrl[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSitemapStatus();
  }, []);

  const fetchSitemapStatus = async () => {
    setStats(prev => ({ ...prev, status: 'loading' }));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-sitemap');
      
      if (error) {
        throw error;
      }

      if (typeof data === 'string') {
        setSitemapContent(data);
        const urls = parseSitemapXml(data);
        setParsedUrls(urls);
        
        // Count URLs by type
        const blogPosts = urls.filter(u => u.loc.includes('/resources/blog/')).length;
        const guides = urls.filter(u => u.loc.includes('/resources/guides/')).length;
        const documentation = urls.filter(u => u.loc.includes('/documentation/') && !u.loc.endsWith('/documentation')).length;
        const webinars = urls.filter(u => u.loc.includes('/resources/webinars/')).length;
        const staticPages = urls.length - blogPosts - guides - documentation - webinars;

        setStats({
          totalUrls: urls.length,
          staticPages,
          blogPosts,
          guides,
          documentation,
          webinars,
          lastGenerated: new Date(),
          status: 'success',
        });
      }
    } catch (error) {
      console.error('Error fetching sitemap:', error);
      setStats(prev => ({ 
        ...prev, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch sitemap'
      }));
    }
  };

  const parseSitemapXml = (xml: string): ParsedUrl[] => {
    const urls: ParsedUrl[] = [];
    const urlMatches = xml.matchAll(/<url>([\s\S]*?)<\/url>/g);
    
    for (const match of urlMatches) {
      const urlContent = match[1];
      const loc = urlContent.match(/<loc>(.*?)<\/loc>/)?.[1] || '';
      const lastmod = urlContent.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] || '';
      const changefreq = urlContent.match(/<changefreq>(.*?)<\/changefreq>/)?.[1] || '';
      const priority = urlContent.match(/<priority>(.*?)<\/priority>/)?.[1] || '';
      
      urls.push({ loc, lastmod, changefreq, priority });
    }
    
    return urls;
  };

  const handleRegenerate = async (bustCache = false) => {
    setIsGenerating(true);
    
    try {
      // Add cache bust parameter if requested
      const timestamp = bustCache ? `?t=${Date.now()}` : '';
      const { data, error } = await supabase.functions.invoke(`generate-sitemap${timestamp}`);
      
      if (error) {
        throw error;
      }

      if (typeof data === 'string') {
        setSitemapContent(data);
        const urls = parseSitemapXml(data);
        setParsedUrls(urls);
        
        const blogPosts = urls.filter(u => u.loc.includes('/resources/blog/')).length;
        const guides = urls.filter(u => u.loc.includes('/resources/guides/')).length;
        const documentation = urls.filter(u => u.loc.includes('/documentation/') && !u.loc.endsWith('/documentation')).length;
        const webinars = urls.filter(u => u.loc.includes('/resources/webinars/')).length;
        const staticPages = urls.length - blogPosts - guides - documentation - webinars;

        setStats({
          totalUrls: urls.length,
          staticPages,
          blogPosts,
          guides,
          documentation,
          webinars,
          lastGenerated: new Date(),
          status: 'success',
        });
        
        toast.success(`Sitemap regenerated with ${urls.length} URLs`);
      }
    } catch (error) {
      console.error('Error regenerating sitemap:', error);
      toast.error('Failed to regenerate sitemap');
      setStats(prev => ({ 
        ...prev, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to regenerate sitemap'
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const copySitemapUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${PRODUCTION_URL}/sitemap.xml`);
      toast.success('Sitemap URL copied to clipboard');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const downloadSitemap = () => {
    if (!sitemapContent) return;
    
    const blob = new Blob([sitemapContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Sitemap downloaded');
  };

  if (!canManageScheduledJobs) {
    return <AccessDenied />;
  }

  const getTypeIcon = (url: string) => {
    if (url.includes('/resources/blog/')) return <Newspaper className="h-4 w-4 text-blue-500" />;
    if (url.includes('/resources/guides/')) return <BookOpen className="h-4 w-4 text-emerald-500" />;
    if (url.includes('/documentation/')) return <Code className="h-4 w-4 text-purple-500" />;
    if (url.includes('/resources/webinars/')) return <Calendar className="h-4 w-4 text-amber-500" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const getTypeLabel = (url: string) => {
    if (url.includes('/resources/blog/')) return 'Blog';
    if (url.includes('/resources/guides/')) return 'Guide';
    if (url.includes('/documentation/') && !url.endsWith('/documentation')) return 'Docs';
    if (url.includes('/resources/webinars/')) return 'Webinar';
    return 'Page';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sitemap Management</h1>
          <p className="text-muted-foreground">
            View and regenerate the dynamic XML sitemap for search engines
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleRegenerate(false)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            onClick={() => handleRegenerate(true)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            Force Regenerate
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Sitemap Status
              </CardTitle>
              <CardDescription>
                Current sitemap configuration and statistics
              </CardDescription>
            </div>
            {stats.status === 'success' && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Active
              </Badge>
            )}
            {stats.status === 'error' && (
              <Badge variant="destructive">
                <XCircle className="mr-1 h-3 w-3" />
                Error
              </Badge>
            )}
            {stats.status === 'loading' && (
              <Badge variant="secondary">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Loading
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Sitemap URL */}
            <div className="col-span-full">
              <label className="text-sm font-medium text-muted-foreground">Sitemap URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                  {PRODUCTION_URL}/sitemap.xml
                </code>
                <Button variant="ghost" size="icon" onClick={copySitemapUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={`${PRODUCTION_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <Separator className="col-span-full" />

            {/* Stats */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Total URLs</label>
              <p className="text-2xl font-bold">{stats.totalUrls}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Last Generated</label>
              <p className="text-sm">
                {stats.lastGenerated 
                  ? format(stats.lastGenerated, 'PPpp')
                  : 'Never'
                }
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Cache Duration</label>
              <p className="text-sm">1 hour</p>
            </div>
          </div>

          {stats.error && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{stats.error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL Breakdown */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.staticPages}</p>
                <p className="text-sm text-muted-foreground">Static Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Newspaper className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.blogPosts}</p>
                <p className="text-sm text-muted-foreground">Blog Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.guides}</p>
                <p className="text-sm text-muted-foreground">Guides</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Code className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.documentation}</p>
                <p className="text-sm text-muted-foreground">Documentation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.webinars}</p>
                <p className="text-sm text-muted-foreground">Webinars</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URL Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">URL Preview</CardTitle>
              <CardDescription>
                All URLs included in the current sitemap
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSitemap} disabled={!sitemapContent}>
                Download XML
              </Button>
            </div>
          </div>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 space-y-2">
                {parsedUrls.map((url, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {getTypeIcon(url.loc)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate">{url.loc.replace(PRODUCTION_URL, '')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(url.loc)}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {url.changefreq}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Priority: {url.priority}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={url.loc} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* SEO Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              <span>Submit your sitemap to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Search Console</a></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              <span>Submit to <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bing Webmaster Tools</a></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              <span>The sitemap is automatically cached for 1 hour to reduce server load</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              <span>robots.txt references this sitemap for automatic discovery by search engines</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
