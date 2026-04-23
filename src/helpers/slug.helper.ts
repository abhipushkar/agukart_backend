import UrlRedirect from "../models/UrlRedirect";
import { generateSlug } from "../utils/slugify";

export const createOrUpdateSlug = async ({
  model,
  entity,
  title,
  entityType
}: any) => {

  const baseSlug = generateSlug(title);
  let newSlug = baseSlug;
  let count = 1;

  while (await model.findOne({ slug: newSlug, parent_id: entity.parent_id, _id: { $ne: entity._id } })) {
    newSlug = `${baseSlug}-${count++}`;
  }

  return newSlug;
};