import slugify from "slugify";

export const cleanTitleForSlug = (title: string): string => {
  return title.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
};

export const generateProductSlug = (
  title: string,
  fallback: string
): string => {
  const clean = cleanTitleForSlug(title);

  if (!clean || clean.length < 3) {
    return `product-${fallback}`;
  }

  const slug = slugify(clean, {
    lower: true,
    strict: true,
    trim: true,
  });

  return slug.substring(0, 60); // SEO safe length
};