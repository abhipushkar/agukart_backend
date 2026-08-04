import ejs from "ejs";
import path from "path";
import Sales from "../models/Sales";
import Salesdetail from '../models/Sales_detail';
import VendorModel from "../models/VendorDetail";
import { transporter } from "../helpers/common";

const CUSTOMER_ORDER_URL = "https://www.agukart.com/profile/orders";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@agukart.com";
const CURRENCY_SYMBOL = "$";
const ADMIN_ORDER_URL = "https://admin.agukart.com/pages/orders";
const ADMIN_ORDER_EMAIL = process.env.ADMIN_ORDER_EMAIL || "";

const numberValue = (value: any) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value: any) => {
  return numberValue(value).toFixed(2);
};

const stripHtml = (value: any) => {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
};

const getFirstName = (name: string) => {
  const cleanName = String(name || "").trim();
  return cleanName ? cleanName.split(/\s+/)[0] : "Customer";
};

const getProductImageUrl = (productData: any) => {
  const firstImage = Array.isArray(productData?.image) ? productData.image[0] : "";
  const editedImage = productData?.edited_image || "";
  const image = String(editedImage || firstImage || "").trim();

  console.log("========== EMAIL PRODUCT IMAGE ==========");
  console.log("[PRODUCT]", stripHtml(productData?.product_title));
  console.log("[SKU]", productData?.sku_code || productData?.product_code || "");
  console.log("[IMAGE ARRAY]", productData?.image);
  console.log("[FIRST IMAGE]", firstImage);
  console.log("[EDITED IMAGE]", editedImage);
  console.log("[SELECTED IMAGE]", image);

  if (!image) {
    console.log("[EMAIL IMAGE] NO IMAGE FOUND");
    console.log("=========================================");
    return "";
  }

  if (/^https?:\/\//i.test(image)) {
    console.log("[FINAL IMAGE URL]", image);
    console.log("=========================================");
    return image;
  }

  const assetUrl = String(process.env.ASSET_URL || "").replace(/\/+$/, "");
  const cleanImage = image.replace(/^\/+/, "");

  let finalUrl = "";

  if (cleanImage.startsWith("uploads/")) {
    finalUrl = `${assetUrl}/${cleanImage}`;
  } else if (cleanImage.startsWith("product/")) {
    finalUrl = `${assetUrl}/uploads/${cleanImage}`;
  } else {
    finalUrl = `${assetUrl}/uploads/product/${cleanImage}`;
  }

  console.log("[FINAL IMAGE URL]", finalUrl);
  console.log("=========================================");

  return finalUrl;
};

const formatOrderDate = (date: any) => {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatPaymentMethod = (paymentType: string) => {
  const type = String(paymentType || "").toLowerCase();

  if (type === "paypal") return "PayPal";
  if (type === "cod") return "Cash on Delivery";
  if (type === "wallet") return "Agukart Wallet";

  return paymentType || "N/A";
};

const getPaymentStatus = (paymentStatus: string) => {
  const status = String(paymentStatus || "").toLowerCase();

  if (status === "completed") {
    return {
      statusLabel: "Payment completed",
      statusColor: "#e1f4e5",
      statusTextColor: "#14752c",
    };
  }

  if (status === "failed") {
    return {
      statusLabel: "Payment failed",
      statusColor: "#fde5e5",
      statusTextColor: "#b42318",
    };
  }

  return {
    statusLabel: "Payment pending",
    statusColor: "#fff3d6",
    statusTextColor: "#8a5a00",
  };
};

export const buildCustomerOrderEmailData = async (saleId: any) => {
  const sale: any = await Sales.findById(saleId).lean();

  if (!sale) {
    throw new Error(`Sale not found for customer order email: ${saleId}`);
  }

  const details: any[] = await Salesdetail.find({
    sale_id: sale._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  if (!details.length) {
    throw new Error(`SalesDetails not found for customer order email: ${saleId}`);
  }

  const vendorIds = [
    ...new Set(
      details
        .map((detail: any) => detail.vendor_id?.toString())
        .filter(Boolean),
    ),
  ];

  const vendorProfiles: any[] = await VendorModel.find({
    user_id: { $in: vendorIds },
  })
    .select("user_id shop_name shop_title slug shop_icon")
    .lean();

  const vendorProfileMap = new Map(
    vendorProfiles.map((profile: any) => [
      profile.user_id.toString(),
      profile,
    ]),
  );

  const shopMap = new Map<string, any>();

  for (const detail of details) {
    const vendorId = detail.vendor_id?.toString() || "";
    const subOrderId = detail.sub_order_id || vendorId;
    const groupKey = subOrderId;
    const vendorProfile: any = vendorProfileMap.get(vendorId);

    if (!shopMap.has(groupKey)) {
      shopMap.set(groupKey, {
        vendorId,
        subOrderId: detail.sub_order_id || "",
        shopName:
          vendorProfile?.shop_name ||
          vendorProfile?.shop_title ||
          detail.vendor_name ||
          "Agukart Shop",
        items: [],
      });
    }

    const productData = detail.productData || {};

    shopMap.get(groupKey).items.push({
      itemId: detail.item_id || "",
      productId: detail.product_id?.toString() || "",
      title: stripHtml(productData.product_title) || "Product",
      productCode: productData.product_code || "",
      image: getProductImageUrl(productData),
      qty: numberValue(detail.qty),
      amount: numberValue(detail.amount),
      amountFormatted: money(detail.amount),
      variants: Array.isArray(detail.variants)
        ? detail.variants.filter(
            (variant: any) =>
              variant?.variantName &&
              variant?.attributeName,
          )
        : [],
    });
  }

  const paymentStatus = getPaymentStatus(sale.payment_status);

  const shippingCharge =
    numberValue(sale.shipping) +
    numberValue(sale.delivery);

  const phone = [
    sale.phone_code,
    sale.mobile,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    customerFirstName: getFirstName(sale.name),

    order: {
      orderId: sale.order_id,
      orderDate: formatOrderDate(sale.createdAt),
    },

    shops: Array.from(shopMap.values()),

    summary: {
      subtotal: money(sale.subtotal),
      promotionDiscount: money(sale.promotional_discount),
      promotionDiscountValue: numberValue(sale.promotional_discount),
      couponDiscount: money(sale.coupon_discount),
      couponDiscountValue: numberValue(sale.coupon_discount),
      voucherDiscount: money(sale.voucher_dicount),
      voucherDiscountValue: numberValue(sale.voucher_dicount),
      shipping: money(shippingCharge),
      shippingValue: shippingCharge,
      walletUsed: money(sale.wallet_used),
      walletUsedValue: numberValue(sale.wallet_used),
      total: money(sale.net_amount),
    },

    shipping: {
      name: sale.name || "",
      addressLine1: sale.address_line1 || "",
      addressLine2: sale.address_line2 || "",
      city: sale.city || "",
      state: sale.state || "",
      pincode: sale.pincode || "",
      country: sale.country || "",
      phone,
    },

    payment: {
      method: formatPaymentMethod(sale.payment_type),
      statusLabel: paymentStatus.statusLabel,
      statusColor: paymentStatus.statusColor,
      statusTextColor: paymentStatus.statusTextColor,
    },

    currencySymbol: CURRENCY_SYMBOL,
    orderUrl: CUSTOMER_ORDER_URL,
    supportEmail: SUPPORT_EMAIL,
    currentYear: new Date().getFullYear(),
  };
};

export const sendCustomerOrderConfirmationEmail = async (saleId: any) => {
  const sale: any = await Sales.findById(saleId)
    .select("email order_id")
    .lean();

  if (!sale) {
    throw new Error(`Sale not found while sending customer email: ${saleId}`);
  }

  if (!sale.email) {
    throw new Error(`Customer email missing for order: ${sale.order_id}`);
  }

  const emailData = await buildCustomerOrderEmailData(saleId);

  const templatePath = path.join(__dirname, "../views/customerOrderEmail.ejs");

  const html = await ejs.renderFile(templatePath, emailData);

  await transporter.sendMail({
    from: process.env.USEREMAIL_NAME!,
    to: sale.email,
    subject: `Order Confirmed - ${sale.order_id} | Agukart`,
    html,
  });

  console.log(
    `[CUSTOMER ORDER EMAIL SENT] order=${sale.order_id} email=${sale.email}`,
  );
};



// new function to send order confirmation email to admin




const formatAdminOrderDate = (date: any) => {
  if (!date) return { date: "", time: "" };

  const value = new Date(date);

  return {
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(value),
  };
};

const getAdminPaymentStatus = (paymentStatus: string) => {
  const status = String(paymentStatus || "").toLowerCase();

  if (status === "completed") {
    return {
      label: "Paid",
      backgroundColor: "#e1f4e5",
      textColor: "#14752c",
    };
  }

  if (status === "failed") {
    return {
      label: "Failed",
      backgroundColor: "#fde5e5",
      textColor: "#b42318",
    };
  }

  return {
    label: "Pending",
    backgroundColor: "#fff3d6",
    textColor: "#8a5a00",
  };
};

export const buildAdminOrderEmailData = async (saleId: any) => {
  const sale: any = await Sales.findById(saleId).lean();

  if (!sale) {
    throw new Error(`Sale not found for admin order email: ${saleId}`);
  }

  const details: any[] = await Salesdetail.find({
    sale_id: sale._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  if (!details.length) {
    throw new Error(`SalesDetails not found for admin order email: ${saleId}`);
  }

  const vendorIds = [
    ...new Set(
      details
        .map((detail: any) => detail.vendor_id?.toString())
        .filter(Boolean),
    ),
  ];

  const vendorProfiles: any[] = await VendorModel.find({
    user_id: { $in: vendorIds },
  })
    .select("user_id shop_name shop_title slug shop_icon")
    .lean();

  const vendorProfileMap = new Map(
    vendorProfiles.map((profile: any) => [
      profile.user_id.toString(),
      profile,
    ]),
  );

  const shopMap = new Map<string, any>();

  for (const detail of details) {
    const vendorId = detail.vendor_id?.toString() || "";
    const subOrderId = detail.sub_order_id || vendorId;
    const vendorProfile: any = vendorProfileMap.get(vendorId);
    const productData = detail.productData || {};

    if (!shopMap.has(subOrderId)) {
      shopMap.set(subOrderId, {
        vendorId,
        vendorName: detail.vendor_name || "",
        subOrderId: detail.sub_order_id || "",
        shopName: vendorProfile?.shop_name || vendorProfile?.shop_title || "Agukart Shop",
        items: [],
        shopTotalValue: 0,
        shopTotal: "0.00",
      });
    }

    const shop = shopMap.get(subOrderId);

    const itemAmount = numberValue(detail.amount);

    shop.shopTotalValue += itemAmount;

    shop.items.push({
      itemId: detail.item_id || "",
      productId: detail.product_id?.toString() || "",
      title: stripHtml(productData.product_title) || "Product",
      productCode: productData.product_code || "",
      image: getProductImageUrl(productData),
      qty: numberValue(detail.qty),
      unitPrice: numberValue(detail.qty) > 0 ? itemAmount / numberValue(detail.qty) : itemAmount,
      unitPriceFormatted: money(numberValue(detail.qty) > 0 ? itemAmount / numberValue(detail.qty) : itemAmount),
      amount: itemAmount,
      amountFormatted: money(itemAmount),
      variants: Array.isArray(detail.variants)
        ? detail.variants.filter((variant: any) => variant?.variantName && variant?.attributeName)
        : [],
    });
  }

  const shops = Array.from(shopMap.values()).map((shop: any) => ({
    ...shop,
    shopTotal: money(shop.shopTotalValue),
  }));

  const orderDate = formatAdminOrderDate(sale.createdAt);
  const paymentStatus = getAdminPaymentStatus(sale.payment_status);
  const shippingCharge = numberValue(sale.shipping) + numberValue(sale.delivery);
  const phone = [sale.phone_code, sale.mobile].filter(Boolean).join(" ");

  return {
    order: {
      orderId: sale.order_id,
      orderDate: orderDate.date,
      orderTime: orderDate.time,
    },

    customer: {
      name: sale.name || "",
      email: sale.email || "",
      phone,
    },

    shipping: {
      name: sale.name || "",
      addressLine1: sale.address_line1 || "",
      addressLine2: sale.address_line2 || "",
      city: sale.city || "",
      state: sale.state || "",
      pincode: sale.pincode || "",
      country: sale.country || "",
      phone,
    },

    payment: {
      method: formatPaymentMethod(sale.payment_type),
      status: paymentStatus.label,
      statusColor: paymentStatus.backgroundColor,
      statusTextColor: paymentStatus.textColor,
      transactionId: sale.paypal_capture_id || sale.paypal_order_id || "",
      paidAt: sale.paid_at
        ? `${formatAdminOrderDate(sale.paid_at).date}, ${formatAdminOrderDate(sale.paid_at).time}`
        : "",
      amountPaid: money(sale.net_amount),
    },

    shops,

    multipleShops: shops.length > 1,

    summary: {
      subtotal: money(sale.subtotal),
      promotionDiscount: money(sale.promotional_discount),
      promotionDiscountValue: numberValue(sale.promotional_discount),
      couponDiscount: money(sale.coupon_discount),
      couponDiscountValue: numberValue(sale.coupon_discount),
      voucherDiscount: money(sale.voucher_dicount),
      voucherDiscountValue: numberValue(sale.voucher_dicount),
      shipping: money(shippingCharge),
      shippingValue: shippingCharge,
      walletUsed: money(sale.wallet_used),
      walletUsedValue: numberValue(sale.wallet_used),
      total: money(sale.net_amount),
    },

    currencySymbol: CURRENCY_SYMBOL,
    adminOrderUrl: ADMIN_ORDER_URL,
    supportEmail: SUPPORT_EMAIL,
    currentYear: new Date().getFullYear(),
  };
};

export const sendAdminOrderNotificationEmail = async (saleId: any) => {
  if (!ADMIN_ORDER_EMAIL) {
    throw new Error("ADMIN_ORDER_EMAIL is missing in environment variables");
  }

  const sale: any = await Sales.findById(saleId)
    .select("order_id")
    .lean();

  if (!sale) {
    throw new Error(`Sale not found while sending admin order email: ${saleId}`);
  }

  const emailData = await buildAdminOrderEmailData(saleId);

  const templatePath = path.join(
    process.cwd(),
    "src",
    "views",
    "adminOrderEmail.ejs",
  );

  const html = await ejs.renderFile(templatePath, emailData);

  await transporter.sendMail({
    from: process.env.USEREMAIL_NAME!,
    to: ADMIN_ORDER_EMAIL,
    subject: `New Order Received - ${sale.order_id} | Agukart`,
    html,
  });

  console.log(
    `[ADMIN ORDER EMAIL SENT] order=${sale.order_id} email=${ADMIN_ORDER_EMAIL}`,
  );
};