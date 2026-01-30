import ParentProduct from "../models/ParentProduct";
import CombinationProduct from "../models/CombinationProduct";
import Product from "../models/Product";
import eventBus from "../events/index";


// Variant Attribute Soft Delete Listener
eventBus.on(
  "variantAttributeSoftDeleted",
  async ({ attributeId }: { attributeId: string }) => {
    try {
      const parents = await ParentProduct.find(
        {
          variant_attribute_id: attributeId,
          isDeleted: false,
        },
        { _id: 1 }
      ).lean();

      if (!parents.length) return;

      const parentIds = parents.map(p => p._id);

      await ParentProduct.updateMany(
        { _id: { $in: parentIds } },
        {
          $pull: {
             "product_variants.$[pv].variant_attributes": { _id: attributeId }
          }
        },
        {
          arrayFilters: [
            { "pv.variant_attributes._id": attributeId }
          ]
        }
      );

      const combinations = await CombinationProduct.find(
        {
          product_id: { $in: parentIds },
          combination_id: attributeId
        },
        { sku_code: 1 }
      ).lean();

      if (!combinations.length) return;

      const skuCodes = combinations.map(c => c.sku_code).filter(Boolean);

      if (!skuCodes.length) return;

      await ParentProduct.updateMany(
        { _id: { $in: parentIds } },
        {
          $pull: {
            sku: { $in: skuCodes }
          }
        }
      );

      await CombinationProduct.deleteMany({
        product_id: { $in: parentIds },
        combination_id: attributeId,
        sku_code: { $in: skuCodes }
      });

      await Product.updateMany(
        {
           sku_code: { $in: skuCodes },
           parent_id: { $ne: null }
        },
        { $set: { parent_id: null } }
      );

    } catch (err) {
      console.error(
        "variantAttributeSoftDeleted listener failed:",
        err
      );
    }
  }
);


// Variant Attribute Value Update Listener
eventBus.on(
  "variantAttributeValueUpdated",
  async ({
    attributeId,
    oldValue,
    newValue
  }: {
    attributeId: string;
    oldValue: string;
    newValue: string;
  }) => {
    try {
      await ParentProduct.updateMany(
        {
          variant_attribute_id: attributeId,
          "product_variants.variant_attributes._id": attributeId
        },
        {
          $set: {
            "product_variants.$[pv].variant_attributes.$[va].attribute": newValue
          }
        },
        {
          arrayFilters: [
            { "pv.variant_attributes._id": attributeId },
            { "va._id": attributeId }
          ],
          strict: false
        }
      );

      console.log(
        `ParentProduct attribute renamed: ${oldValue} → ${newValue} (${attributeId})`
      );
    } catch (err) {
      console.error(
        "variantAttributeValueUpdated listener failed:",
        err
      );
    }
  }
);

