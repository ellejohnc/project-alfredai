import { useMemo } from 'react';
import { usePublishedBlogs, usePublishedGuides, usePublishedDocs, type PublishedBlogPost, type PublishedGuide, type PublishedDoc } from './usePublishedContent';

export interface RelatedContentItem {
  id: string;
  type: 'blog' | 'guide' | 'documentation';
  title: string;
  description: string | null;
  category: string | null;
  tags?: string[] | null;
  slug?: string | null;
  imageUrl?: string | null;
  difficulty?: string | null;
  readTime?: number | null;
  url: string;
  score: number;
}

interface UseRelatedContentOptions {
  currentId: string;
  currentType: 'blog' | 'guide' | 'documentation';
  category?: string | null;
  tags?: string[] | null;
  limit?: number;
  excludeTypes?: Array<'blog' | 'guide' | 'documentation'>;
}

// Calculate similarity score between two items
function calculateScore(
  item: { category?: string | null; tags?: string[] | null },
  targetCategory: string | null | undefined,
  targetTags: string[] | null | undefined
): number {
  let score = 0;
  
  // Category match (strongest signal)
  if (item.category && targetCategory && item.category.toLowerCase() === targetCategory.toLowerCase()) {
    score += 3;
  }
  
  // Tag matches
  if (item.tags && targetTags) {
    const itemTagsLower = item.tags.map(t => t.toLowerCase());
    const targetTagsLower = targetTags.map(t => t.toLowerCase());
    const matchingTags = itemTagsLower.filter(tag => targetTagsLower.includes(tag)).length;
    score += matchingTags * 2;
  }
  
  // Partial category match (category contains or is contained in target)
  if (item.category && targetCategory) {
    const catLower = item.category.toLowerCase();
    const targetCatLower = targetCategory.toLowerCase();
    if (catLower !== targetCatLower && (catLower.includes(targetCatLower) || targetCatLower.includes(catLower))) {
      score += 1;
    }
  }
  
  return score;
}

export function useRelatedContent(options: UseRelatedContentOptions): {
  items: RelatedContentItem[];
  isLoading: boolean;
} {
  const { currentId, currentType, category, tags, limit = 6, excludeTypes = [] } = options;
  
  const { items: blogs, isLoading: blogsLoading } = usePublishedBlogs();
  const { items: guides, isLoading: guidesLoading } = usePublishedGuides();
  const { items: docs, isLoading: docsLoading } = usePublishedDocs();
  
  const relatedItems = useMemo(() => {
    const allItems: RelatedContentItem[] = [];
    
    // Add blog posts
    if (!excludeTypes.includes('blog')) {
      blogs.forEach((blog: PublishedBlogPost) => {
        if (currentType === 'blog' && blog.id === currentId) return;
        
        const score = calculateScore(
          { category: blog.category, tags: blog.tags },
          category,
          tags
        );
        
        if (score > 0) {
          allItems.push({
            id: blog.id,
            type: 'blog',
            title: blog.title,
            description: blog.excerpt,
            category: blog.category,
            tags: blog.tags,
            slug: blog.slug,
            imageUrl: blog.featured_image_url,
            url: `/resources/blog/${blog.slug || blog.id}`,
            score,
          });
        }
      });
    }
    
    // Add guides
    if (!excludeTypes.includes('guide')) {
      guides.forEach((guide: PublishedGuide) => {
        if (currentType === 'guide' && guide.id === currentId) return;
        
        const score = calculateScore(
          { category: guide.category, tags: null },
          category,
          tags
        );
        
        if (score > 0) {
          allItems.push({
            id: guide.id,
            type: 'guide',
            title: guide.title,
            description: guide.description,
            category: guide.category,
            imageUrl: guide.featured_image_url,
            difficulty: guide.difficulty_level,
            readTime: guide.estimated_read_time,
            url: `/resources/guides/${guide.id}`,
            score,
          });
        }
      });
    }
    
    // Add documentation
    if (!excludeTypes.includes('documentation')) {
      docs.forEach((doc: PublishedDoc) => {
        if (currentType === 'documentation' && doc.id === currentId) return;
        
        const score = calculateScore(
          { category: doc.category, tags: null },
          category,
          tags
        );
        
        if (score > 0) {
          allItems.push({
            id: doc.id,
            type: 'documentation',
            title: doc.title,
            description: null,
            category: doc.category,
            slug: doc.slug,
            url: `/documentation/${doc.slug || doc.id}`,
            score,
          });
        }
      });
    }
    
    // Sort by score (descending) and take top N
    return allItems
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [blogs, guides, docs, currentId, currentType, category, tags, limit, excludeTypes]);
  
  return {
    items: relatedItems,
    isLoading: blogsLoading || guidesLoading || docsLoading,
  };
}

// Hook for getting related content specifically for blogs
export function useRelatedBlogs(blogId: string, category?: string | null, tags?: string[] | null, limit = 3) {
  const { items: blogs, isLoading } = usePublishedBlogs();
  
  const relatedBlogs = useMemo(() => {
    return blogs
      .filter(blog => blog.id !== blogId)
      .map(blog => {
        const score = calculateScore({ category: blog.category, tags: blog.tags }, category, tags);
        return { blog, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.blog);
  }, [blogs, blogId, category, tags, limit]);
  
  return { items: relatedBlogs, isLoading };
}

// Hook for getting related guides
export function useRelatedGuides(guideId: string, category?: string | null, limit = 3) {
  const { items: guides, isLoading } = usePublishedGuides();
  
  const relatedGuides = useMemo(() => {
    return guides
      .filter(guide => guide.id !== guideId)
      .map(guide => {
        const score = calculateScore({ category: guide.category, tags: null }, category, null);
        return { guide, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.guide);
  }, [guides, guideId, category, limit]);
  
  return { items: relatedGuides, isLoading };
}
