import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye } from 'lucide-react';
import { resolveImageUrl } from '@/lib/imageUtils';
import DOMPurify from 'dompurify';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export type ContentType = 'blog' | 'guide' | 'webinar' | 'doc' | 'testimonial' | 'faq';

interface LivePreviewPanelProps {
  type: ContentType;
  data: Record<string, any>;
  publicUrl?: string | null;
}

const RICH_CONTENT_ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'img', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'code', 'pre', 'sub', 'sup', 'u', 's', 'span', 'mark', 'div'];
const RICH_CONTENT_ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'class', 'colspan', 'rowspan', 'scope', 'style', 'data-color', 'data-type', 'type', 'start'];

function sanitizePreviewRichContent(html?: string) {
  const safeHtml = DOMPurify.sanitize(html || '<em class="text-muted-foreground">Your content will appear here</em>', {
    ALLOWED_TAGS: RICH_CONTENT_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_CONTENT_ALLOWED_ATTR,
  });

  const wrapper = document.createElement('div');
  wrapper.innerHTML = safeHtml;

  wrapper.querySelectorAll('li').forEach((li) => {
    const text = (li.textContent || '').replace(/\u00a0/g, ' ').trim();
    const hasImage = li.querySelector('img');
    const hasTable = li.querySelector('table');
    const hasCode = li.querySelector('code, pre');

    if (!text && !hasImage && !hasTable && !hasCode) {
      li.remove();
    }
  });

  wrapper.querySelectorAll('ol, ul').forEach((list) => {
    if (!list.querySelector('li')) list.remove();
  });

  return wrapper.innerHTML;
}

export function LivePreviewPanel({ type, data, publicUrl }: LivePreviewPanelProps) {
  const isPublished = data?.status === 'published';

  return (
    <div className="h-full flex flex-col bg-muted/30 rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Live Preview</span>
        </div>
        {isPublished && publicUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(publicUrl, '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-1.5" />
            View Live
          </Button>
        )}
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {isPublished 
              ? 'This is how the content appears on the public page.' 
              : 'This is how the content will appear when published.'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          {type === 'blog' && <BlogPreviewContent data={data} />}
          {type === 'guide' && <GuidePreviewContent data={data} />}
          {type === 'webinar' && <WebinarPreviewContent data={data} />}
          {type === 'doc' && <DocPreviewContent data={data} />}
          {type === 'testimonial' && <TestimonialPreviewContent data={data} />}
          {type === 'faq' && <FAQPreviewContent data={data} />}
        </div>

        {/* Status Footer */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge 
              variant={isPublished ? 'default' : 'secondary'}
              className={isPublished ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
            >
              {data.status === 'published' ? 'Published' : data.status === 'archived' ? 'Archived' : 'Draft'}
            </Badge>
          </div>
          {!isPublished && (
            <span className="text-xs text-muted-foreground italic">
              Not visible on public page
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function BlogPreviewContent({ data }: { data: Record<string, any> }) {
  return (
    <>
      {data.featured_image_url && (
        <img 
          src={resolveImageUrl(data.featured_image_url)} 
          alt={data.title}
          className="w-full h-40 object-cover rounded-lg mb-4"
        />
      )}
      
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {data.category && <Badge variant="secondary">{data.category}</Badge>}
        {data.tags?.map((tag: string, i: number) => (
          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
        ))}
      </div>
      
      <h2 className="text-xl font-bold text-foreground mb-2">
        {data.title || <span className="text-muted-foreground italic">Your title will appear here</span>}
      </h2>
      
      {data.excerpt && (
        <p className="text-sm text-muted-foreground mb-4">{data.excerpt}</p>
      )}
      
      <div 
        className="prose prose-sm dark:prose-invert max-w-none [&_p:empty]:min-h-[1em] [&_p:empty]:before:content-['\00a0']"
        dangerouslySetInnerHTML={{ 
          __html: sanitizePreviewRichContent(data.content)
        }}
      />
    </>
  );
}

function GuidePreviewContent({ data }: { data: Record<string, any> }) {
  return (
    <>
      {data.featured_image_url && (
        <img 
          src={resolveImageUrl(data.featured_image_url)} 
          alt={data.title}
          className="w-full h-40 object-cover rounded-lg mb-4"
        />
      )}
      
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {data.category && <Badge variant="secondary">{data.category}</Badge>}
        {data.difficulty_level && (
          <Badge variant="outline">{data.difficulty_level}</Badge>
        )}
        {data.estimated_read_time && (
          <Badge variant="outline">{data.estimated_read_time} min read</Badge>
        )}
      </div>
      
      <h2 className="text-xl font-bold text-foreground mb-2">
        {data.title || <span className="text-muted-foreground italic">Your title will appear here</span>}
      </h2>
      
      {data.description && (
        <p className="text-sm text-muted-foreground mb-4">{data.description}</p>
      )}
      
      <div 
        className="prose prose-sm dark:prose-invert max-w-none [&_p:empty]:min-h-[1em] [&_p:empty]:before:content-['\00a0']"
        dangerouslySetInnerHTML={{ 
          __html: sanitizePreviewRichContent(data.content)
        }}
      />
    </>
  );
}

function WebinarPreviewContent({ data }: { data: Record<string, any> }) {
  return (
    <>
      {data.featured_image_url && (
        <img 
          src={resolveImageUrl(data.featured_image_url)} 
          alt={data.title}
          className="w-full h-40 object-cover rounded-lg mb-4"
        />
      )}
      
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {data.event_type && <Badge variant="secondary">{data.event_type}</Badge>}
        {data.event_date && (
          <Badge variant="outline">
            {new Date(data.event_date).toLocaleDateString('en-AU', {
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
            })}
          </Badge>
        )}
      </div>
      
      <h2 className="text-xl font-bold text-foreground mb-2">
        {data.title || <span className="text-muted-foreground italic">Your title will appear here</span>}
      </h2>
      
      {data.description && (
        <p className="text-sm text-muted-foreground mb-4">{data.description}</p>
      )}

      {data.presenter_name && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
          {data.presenter_image_url && (
            <img src={resolveImageUrl(data.presenter_image_url)} alt={data.presenter_name} className="w-10 h-10 rounded-full object-cover" />
          )}
          <div>
            <p className="font-medium text-sm">{data.presenter_name}</p>
            {data.presenter_title && <p className="text-xs text-muted-foreground">{data.presenter_title}</p>}
          </div>
        </div>
      )}
      
      <div 
        className="prose prose-sm dark:prose-invert max-w-none [&_p:empty]:min-h-[1em] [&_p:empty]:before:content-['\00a0']"
        dangerouslySetInnerHTML={{ 
          __html: sanitizePreviewRichContent(data.content)
        }}
      />
    </>
  );
}

function DocPreviewContent({ data }: { data: Record<string, any> }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {data.category && <Badge variant="secondary">{data.category}</Badge>}
      </div>
      
      <h2 className="text-xl font-bold text-foreground mb-4">
        {data.title || <span className="text-muted-foreground italic">Your title will appear here</span>}
      </h2>
      
      <div 
        className="prose prose-sm dark:prose-invert max-w-none [&_p:empty]:min-h-[1em] [&_p:empty]:before:content-['\00a0']"
        dangerouslySetInnerHTML={{ 
          __html: sanitizePreviewRichContent(data.content)
        }}
      />
    </>
  );
}

function TestimonialPreviewContent({ data }: { data: Record<string, any> }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {data.client_avatar_url && (
          <img 
            src={resolveImageUrl(data.client_avatar_url)} 
            alt={data.client_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
          />
        )}
        <div className="flex-1">
          <h3 className="font-bold text-foreground">
            {data.client_name || <span className="text-muted-foreground italic">Client name</span>}
          </h3>
          {data.client_title && (
            <p className="text-sm text-muted-foreground">{data.client_title}</p>
          )}
          {data.client_company && (
            <p className="text-sm text-primary">{data.client_company}</p>
          )}
        </div>
      </div>

      <blockquote className="border-l-4 border-primary/30 pl-4 py-2 italic text-foreground">
        "{data.quote || <span className="text-muted-foreground">Quote will appear here</span>}"
      </blockquote>

      <div className="flex items-center gap-2 flex-wrap">
        {data.industry && <Badge variant="secondary">{data.industry}</Badge>}
        {data.rating && (
          <Badge variant="outline">
            {'★'.repeat(data.rating)}{'☆'.repeat(5 - data.rating)}
          </Badge>
        )}
        {data.is_featured && (
          <Badge className="bg-primary/10 text-primary border-primary/20">Featured</Badge>
        )}
      </div>

      {data.video_url && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Video testimonial: {data.video_url}</p>
        </div>
      )}
    </div>
  );
}

function FAQPreviewContent({ data }: { data: Record<string, any> }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {data.category && <Badge variant="secondary">{data.category}</Badge>}
      </div>

      <Accordion type="single" collapsible defaultValue="faq-preview">
        <AccordionItem value="faq-preview" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
            {data.question || <span className="text-muted-foreground italic">Your question will appear here</span>}
          </AccordionTrigger>
          <AccordionContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none pt-2"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(data.answer || '<em class="text-muted-foreground">Your answer will appear here</em>', {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
                  ALLOWED_ATTR: ['href', 'target', 'rel']
                })
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
