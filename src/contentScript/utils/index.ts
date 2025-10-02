export const extractRootDomain = (url: string) => {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.toLowerCase();
  const parts = hostname.split('.');

  if (parts.length > 2) {
    return parts[1];
  }
  return parts[0];
};

export const extractCategory = (category) => {
  if (category?.includes('Back to result') || !category || category === '<') return null;
  return category?.replace(/\s+/g, ' ').trim();
};
