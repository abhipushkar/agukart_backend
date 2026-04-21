import Category from "../models/Category";


export const buildCategoryMeta = async (category: any) => {
  let fullSlug = category.slug;
  let parentSlug = null;

  let current = category;

  while (current.parent_id) {
    const parent = await Category.findById(current.parent_id);
    if (!parent) break;

    // only first parent for parent_slug
    if (!parentSlug) {
      parentSlug = parent.slug;
    }

    fullSlug = `${parent.slug}/${fullSlug}`;
    current = parent;
  }

  return {
    fullSlug,
    parentSlug
  };
};