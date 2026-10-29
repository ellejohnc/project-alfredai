/**
 * Supabase storage URL helpers: detection, transform parameters, srcset and
 * the low-quality placeholder.
 *
 * These are plain functions, so they lived in lazy-image.tsx at the cost of
 * that component hot-reloading.
 */

// Supabase storage project ID for URL detection
export const SUPABASE_PROJECT_ID = 'rtsrodhymtxgkuvuhtpk';

export const getSupabaseOptimizedUrl = (src: string, width?: number, quality: number = 80): string => {
  if (!src || !width || !isSupabaseStorageUrl(src)) return src;
  
  try {
    const url = new URL(src);
    // Supabase storage supports image transformations via query params
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', String(quality));
    url.searchParams.set('format', 'origin'); // Preserve original format or use 'webp'
    return url.toString();
  } catch {
    return src;
  }
};


// Check if URL is from Supabase storage
export const isSupabaseStorageUrl = (src: string): boolean => {
  return src.includes(`${SUPABASE_PROJECT_ID}.supabase.co/storage`);
};

// Generate optimized image URL with size parameters for common CDNs
export const getOptimizedUrl = (src: string, width?: number): string => {
  if (!src || !width) return src;
  
  // Supabase storage optimization
  if (isSupabaseStorageUrl(src)) {
    return getSupabaseOptimizedUrl(src, width);
  }
  
  // Unsplash optimization
  if (src.includes('unsplash.com')) {
    const url = new URL(src);
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', '80');
    url.searchParams.set('auto', 'format');
    return url.toString();
  }
  
  // Cloudinary optimization
  if (src.includes('cloudinary.com')) {
    return src.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  }
  
  // Imgix optimization
  if (src.includes('imgix.net')) {
    const url = new URL(src);
    url.searchParams.set('w', String(width));
    url.searchParams.set('auto', 'format,compress');
    return url.toString();
  }
  
  return src;
};

// Generate low-quality placeholder URL for blur-up effect

// Generate low-quality placeholder URL for blur-up effect
export const getLqipUrl = (src: string): string | undefined => {
  if (!src) return undefined;
  
  // Supabase storage LQIP
  if (isSupabaseStorageUrl(src)) {
    return getSupabaseOptimizedUrl(src, 20, 30);
  }
  
  // Unsplash LQIP
  if (src.includes('unsplash.com')) {
    try {
      const url = new URL(src);
      url.searchParams.set('w', '20');
      url.searchParams.set('q', '30');
      url.searchParams.set('blur', '10');
      return url.toString();
    } catch {
      return undefined;
    }
  }
  
  // Cloudinary LQIP
  if (src.includes('cloudinary.com')) {
    return src.replace('/upload/', '/upload/w_20,q_30,e_blur:200/');
  }
  
  return undefined;
};

// Generate srcset for responsive images

// Generate srcset for responsive images
export const generateSrcSet = (src: string): string | undefined => {
  if (!src) return undefined;
  
  const widths = [320, 640, 768, 1024, 1280, 1920];
  
  // Supabase storage srcset
  if (isSupabaseStorageUrl(src)) {
    return widths
      .map(w => `${getSupabaseOptimizedUrl(src, w)} ${w}w`)
      .join(', ');
  }
  
  // Only for CDN-hosted images that support resizing
  if (src.includes('unsplash.com') || src.includes('cloudinary.com') || src.includes('imgix.net')) {
    return widths
      .map(w => `${getOptimizedUrl(src, w)} ${w}w`)
      .join(', ');
  }
  
  return undefined;
};
