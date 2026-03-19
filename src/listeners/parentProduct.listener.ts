import eventBus from "../events";
import ParentProduct from "../models/ParentProduct";
import Product from "../models/Product";
import CombinationProduct from "../models/CombinationProduct";

eventBus.on(
  "parentProductAttributeCleanup",
  async ({ attributeId }: { attributeId: string }) => {
    try {
      console.log("ParentProduct FULL cleanup:", attributeId);

      const parents = await ParentProduct.find(
        {
          variant_attribute_id: attributeId,
          isDeleted: false
        },
        { _id: 1 }
      ).lean();

      if (!parents.length) return;

      const parentIds = parents.map(p => p._id);

      await ParentProduct.updateMany(
        { _id: { $in: parentIds } },
        {
          $pull: {
            variant_attribute_id: attributeId,
            "product_variants.$[].variant_attributes": {
              _id: attributeId
            }
          }
        }
      );

      const combinations = await CombinationProduct.find(
        {
          product_id: { $in: parentIds },
          combination_id: attributeId
        },
        { sku_code: 1, product_id: 1 }
      ).lean();

      if (!combinations.length) return;

      for (const comb of combinations) {
        if (!comb.sku_code) continue;

        const product = await Product.findOne({
          sku_code: comb.sku_code,
          parent_id: comb.product_id
        });

        if (product) {
          await Product.updateOne(
            { _id: product._id },
            { $set: { parent_id: null } }
          );
        }
      }

      await CombinationProduct.deleteMany({
        product_id: { $in: parentIds },
        combination_id: attributeId
      });

      console.log("✅ Cleanup done");

    } catch (err) {
      console.error("parentProductAttributeCleanup error:", err);
    }
  }
);
