import AdminCategoryModel from "../models/AdminCategory";
import UrlRedirect from "../models/UrlRedirect";

export const buildAdminCategoryFullSlug = async (category: any) => {
  let parts: string[] = [category.slug.trim()];
  let current = category;

  while (current.parent_id) {
    const parent = await AdminCategoryModel.findById(current.parent_id)
      .select("slug parent_id")
      .lean();

    if (!parent) break;

    parts.unshift(parent.slug.trim());
    current = parent;
  }

  return parts.join("/");
};


export const updateAdminCategoryChildrenSlugs = async (parentId: any) => {
  const children = await AdminCategoryModel.find({ parent_id: parentId });

  for (const child of children) {

    const fullSlug = await buildAdminCategoryFullSlug(child);

    const oldFullSlug = child.fullSlug;

    if (oldFullSlug !== fullSlug) {

      // 🔥 create redirect
      await UrlRedirect.create({
        oldSlug: oldFullSlug,
        newSlug: fullSlug,
        entityType: "admin-category",
        entityId: child._id
      });

      // 🔥 update child
      child.fullSlug = fullSlug;
      await child.save();

      // 🔥 recursive update
      await updateAdminCategoryChildrenSlugs(child._id);
    }
  }
};