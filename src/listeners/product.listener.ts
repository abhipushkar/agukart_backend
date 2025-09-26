import eventBus from "../events";
import Product from "../models/Product";
import mongoose from "mongoose";

/// Variant update listener
eventBus.on("variantUpdated", async (variant) => {
  try {
    console.log("Variant updated:", variant);

    // 1. Update variant_name
    await Product.updateMany(
      { "combinationData.variant_name": variant.oldName },
      {
        $set: { "combinationData.$[var].variant_name": variant.name },
      },
      {
        arrayFilters: [
          { "var.variant_name": variant.oldName },
          { "comb.name1": variant.oldName }, // nested filter for name1
        ],
        strict: false,
        strictArrayFilters: false,
      }
    );
    
    // 2. Update nested name1 in combinations
    await Product.updateMany(
      { "combinationData.combinations.name1": variant.oldName },
      {
        $set: {
          "combinationData.$[].combinations.$[comb].name1": variant.name,
        },
      },
      {
        arrayFilters: [{ "comb.name1": variant.oldName }],
        strict: false,
        strictArrayFilters: false,
      }
    );
  } catch (err) {
    console.error("variantUpdated listener error:", err);
  }
});

// Attribute update listener
eventBus.on("attributeUpdated", async (attr) => {
  try {
    console.log("Attribute updated event received:", attr);

    // 1. Update combinationData value1 + name1
    const result1 = await Product.updateMany(
      { "combinationData.combinations.combIds": attr.id },
      {
        $set: {
          "combinationData.$[].combinations.$[comb].value1": attr.value,
          "combinationData.$[].combinations.$[comb].name1": attr.variantName,
        },
      },
      {
        arrayFilters: [{ "comb.combIds": attr.id }],
        strict: false,
        strictArrayFilters: false,
      }
    );
    console.log("combinationData update:", result1);

    // 2. Update variations_data values
    if (attr.oldValue && attr.oldValue !== attr.value) {
      await Product.updateMany(
        { "variations_data.name": attr.variantName },
        { $pull: { "variations_data.$.values": attr.oldValue } }
      );
      await Product.updateMany(
        { "variations_data.name": attr.variantName },
        { $addToSet: { "variations_data.$.values": attr.value } }
      );
    } else {
      await Product.updateMany(
        { "variations_data.name": attr.variantName },
        { $addToSet: { "variations_data.$.values": attr.value } }
      );
    }

    console.log(
      `✅ Attribute '${attr.oldValue || "[missing oldValue]"}' → '${
        attr.value
      }' updated in combinationData + variations_data`
    );
  } catch (err) {
    console.error("attributeUpdated listener error:", err);
  }
});

// Attribute soft delete listener
eventBus.on("attributeDeleted", async (attr) => {
  try {
    console.log("Attribute deleted event received:", attr);

    const attrId = attr.id;

    // 1. Remove combId reference from combinationData
    await Product.updateMany(
      { "combinationData.combinations.combIds": attrId },
      {
        $pull: { "combinationData.$[].combinations.$[comb].combIds": attrId },
      },
      {
        arrayFilters: [{ "comb.combIds": attrId }],
        strict: false,
        strictArrayFilters: false,
      }
    );

    // 2. Remove combination by value1 + name1
    await Product.updateMany(
      { "combinationData.combinations.value1": attr.value },
      {
        $pull: {
          "combinationData.$[].combinations": {
            value1: attr.value,
            name1: attr.variantName,
          },
        },
      }
    );

    // 3. Remove from variations_data
    await Product.updateMany(
      { "variations_data.name": attr.variantName },
      { $pull: { "variations_data.$.values": attr.value } }
    );

    console.log(
      `✅ Attribute '${attr.value}' deleted from combinationData + variations_data`
    );
  } catch (err) {
    console.error("attributeDeleted listener error:", err);
  }
});
