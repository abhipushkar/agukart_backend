import { Request, Response, NextFunction } from "express";
import UrlRedirect from "../models/UrlRedirect";
import Category from "../models/Category";
import ParentProduct from "../models/ParentProduct";
import AdminCategory from "../models/AdminCategory";

// 🔥 Extend Request properly
interface CustomRequest extends Request {
  type?: "category" | "product" | "adminCategory";
  data?: any;
}

export const resolveSlug = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.slug) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    const slugPath = Array.isArray(req.params.slug)
      ? req.params.slug.join("/")
      : req.params.slug;

    // =========================
    // 🔥 STEP 1: RESOLVE FINAL SLUG (CHAIN REDIRECT)
    // =========================
    let finalSlug = slugPath;
    let safetyCounter = 0;

    while (true) {
      const redirect = await UrlRedirect.findOne({
        oldSlug: finalSlug,
      }).lean();

      if (!redirect || !redirect.newSlug) break;

      finalSlug = redirect.newSlug;
      safetyCounter++;

      // 🚨 prevent infinite loop
      if (safetyCounter > 10) break;
    }

    // =========================
    // 🔥 STEP 2: IF REDIRECT HAPPENED → RETURN FINAL URL
    // =========================
    if (finalSlug !== slugPath) {
      return res.json({
        redirect: true,
        newSlug: finalSlug,
      });
    }

    // =========================
    // 🔥 STEP 3: CHECK CATEGORY
    // =========================
    const category = await Category.findOne({ fullSlug: finalSlug }).lean();

    if (category) {
      req.type = "category";
      req.data = category;
      return next();
    }
    // =========================
    // 🔥 STEP 4: CHECK ADMIN-CATEGORY
    // =========================
    const adminCategory = await AdminCategory.findOne({ fullSlug: finalSlug }).lean();

    if (adminCategory) {
      req.type = "adminCategory";
      req.data = adminCategory;
      return next();
    }

    // =========================
    // 🔥 STEP 4: CHECK PRODUCT
    // =========================
    const product = await ParentProduct.findOne({ fullSlug: finalSlug }).lean();

    if (product) {
      req.type = "product";
      req.data = product;
      return next();
    }

    // =========================
    // 🔥 STEP 5: NOT FOUND
    // =========================
    return res.status(404).json({
      success: false,
      message: "Page not found",
      slug: finalSlug,
    });

  } catch (error) {
    console.error("resolveSlug error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};