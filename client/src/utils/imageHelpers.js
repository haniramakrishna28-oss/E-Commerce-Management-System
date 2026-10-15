export const CATEGORY_DEFAULT_IMAGES = {
  'Audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  'Desk Setup': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
  'Wearables': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  'Photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  'Home Living': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
};

/**
 * Returns a high-res category-specific fallback image
 */
export const getFallbackImage = (category) => {
  if (category && CATEGORY_DEFAULT_IMAGES[category]) {
    return CATEGORY_DEFAULT_IMAGES[category];
  }
  return CATEGORY_DEFAULT_IMAGES['Audio'];
};

/**
 * Extracts clean direct image URL from Google Images, Bing, or search links
 */
export const cleanImageUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();

  // If already a Data URL or Blob URL, return as-is
  if (str.startsWith('data:image/') || str.startsWith('blob:')) {
    return str;
  }

  // Remove surrounding quotes if pasted
  str = str.replace(/^["']|["']$/g, '');

  try {
    const parsed = new URL(str);

    // 1. Google Images 'Copy link address' format (e.g. google.com/imgres?imgurl=https%3A%2F%2F... )
    if (parsed.searchParams.has('imgurl')) {
      const extracted = parsed.searchParams.get('imgurl');
      if (extracted) {
        return decodeURIComponent(extracted);
      }
    }

    // 2. Bing Images format
    if (parsed.searchParams.has('mediaurl')) {
      const extracted = parsed.searchParams.get('mediaurl');
      if (extracted) {
        return decodeURIComponent(extracted);
      }
    }

    // 3. Google redirect format with target url
    if (parsed.searchParams.has('url')) {
      const extracted = parsed.searchParams.get('url');
      if (extracted && /\.(jpe?g|png|webp|gif|svg|avif)/i.test(extracted)) {
        return decodeURIComponent(extracted);
      }
    }
  } catch (e) {
    // Not a valid URL string yet, return as-is
  }

  return str;
};

/**
 * Checks if a URL looks like an HTML webpage rather than a direct image
 */
export const isLikelyWebpageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const str = url.trim().toLowerCase();

  // Data URLs and blob URLs are valid images
  if (str.startsWith('data:image/') || str.startsWith('blob:')) {
    return false;
  }

  // Google Search results page
  if (str.includes('google.') && (str.includes('/search') || str.includes('tbm=isch'))) {
    return true;
  }

  // E-commerce and webpage links that users commonly copy by mistake
  const webpagePatterns = [
    '/dp/', '/gp/product/', '/product/', '/products/', '/item/', '/p/', '/ip/',
    '.html', '.htm', '.php', '.asp', '.aspx', '/search/'
  ];
  const hasWebpagePattern = webpagePatterns.some((pattern) => str.includes(pattern));
  const hasImageExtension = /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico)($|\?)/i.test(str);

  return hasWebpagePattern && !hasImageExtension;
};

/**
 * Converts a browser File to a Base64 data URL
 */
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image. Please choose a JPG, PNG, or WEBP image.'));
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
