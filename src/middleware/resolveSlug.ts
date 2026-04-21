import { Request, Response, NextFunction } from "express";
import UrlRedirect from "../models/UrlRedirect";
import Category from "../models/Category";
import ParentProduct from "../models/ParentProduct";

// 🔥 Extend Request properly
interface CustomRequest extends Request {
  type?: "category" | "product";
  data?: any;
}

export const resolveSlug = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 🔥 Validate slug param
    if (!req.params.slug) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    // handle both /a/b and single slug
    const slugPath = Array.isArray(req.params.slug)
      ? req.params.slug.join("/")
      : req.params.slug;

    // =========================
    // 1. CHECK CATEGORY
    // =========================
    const category = await Category.findOne({ fullSlug: slugPath }).lean();

    if (category) {
      req.type = "category";
      req.data = category;
      return next();
    }

    // =========================
    // 2. CHECK PRODUCT
    // =========================
    const product = await ParentProduct.findOne({ fullSlug: slugPath }).lean();

    if (product) {
      req.type = "product";
      req.data = product;
      return next();
    }

    // =========================
    // 3. CHECK REDIRECT (SEO)
    // =========================
    const redirect = await UrlRedirect.findOne({
      oldSlug: slugPath,
    }).lean();

    if (redirect) {
      // 🔥 Always normalize URL
      const newUrl = redirect.newSlug.startsWith("/")
        ? redirect.newSlug
        : `/${redirect.newSlug}`;

      return res.json({
        redirect: true,
        newSlug: redirect.newSlug,
      });
    }

    // =========================
    // 4. NOT FOUND
    // =========================
    return res.status(404).json({
      success: false,
      message: "Page not found",
      slug: slugPath
    });

  } catch (error) {
    console.error("resolveSlug error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};