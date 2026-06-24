import ProductModel from "../models/Product";

export const allocateInventory = async (
  productId: string,
  cartItem: any
) => {
  let result: any = {
    success: false,
    inventoryStatus: "out_of_stock",
    inventoryNote: "",
    productData: null,
  };

  const productData = await ProductModel.findById(productId);

  if (!productData) {
    result.inventoryNote = "Product not found";
    return result;
  }

  const qtyDrivenByCombination =
    productData.form_values?.isCheckedQuantity === true &&
    Number(productData.qty) === 0;

  // SIMPLE PRODUCT
  if (!qtyDrivenByCombination) {
const currentQty = Number(productData.qty || 0);

if (currentQty < Number(cartItem.qty)) {
  return {
    success: false,
    inventoryStatus: "out_of_stock",
    inventoryNote: `Requested ${cartItem.qty}, only ${currentQty} available.`,
    productData,
  };
}

productData.qty = String(
  currentQty - Number(cartItem.qty)
);

await productData.save();

return {
  success: true,
  inventoryStatus: "allocated",
  inventoryNote: "",
  productData,
};
  }

  // COMBINATION PRODUCT

  const normalize = (str: any) =>
    String(str).trim().toLowerCase();

  const qtyGroupName =
    productData.form_values?.quantities;

  const selectedValues =
    (cartItem.variants || []).map((v: any) =>
      normalize(v.attributeName)
    );

  let found = false;

  for (const group of productData.combinationData || []) {
    if (
      normalize(group.variant_name) !==
      normalize(qtyGroupName)
    ) {
      continue;
    }

    for (const comb of group.combinations || []) {
      const combValues =
        (comb.combValues || []).map((v: any) =>
          normalize(v)
        );

      const isPartialMatch =
        combValues.every((v: string) =>
          selectedValues.includes(v)
        );

      if (!isPartialMatch) continue;

      found = true;

      const currentQty =
        Number(comb.qty || 0);

      if (currentQty < Number(cartItem.qty)) {
        result.inventoryNote =
          `Requested ${cartItem.qty}, only ${currentQty} available. Another checkout completed first.`;

        return result;
      }

      comb.qty = String(
        currentQty - Number(cartItem.qty)
      );

      productData.markModified("combinationData");

      await productData.save();

      return {
        success: true,
        inventoryStatus: "allocated",
        inventoryNote: "",
        productData,
      };
    }
  }

  if (!found) {
    result.inventoryNote =
      "Matching inventory combination not found";
  }

  return result;
};