import e, { Response, Request } from "express";
import qs from "qs";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import sharp from "sharp";
import * as fs from 'fs';
import * as path from 'path';
import slugify from "slugify";
import eventBus from "../../events";
import User from '../../models/User';
import Category from '../../models/Category';
import Variant from '../../models/Variant';
import VariantAttribute from '../../models/Variant_attribute';
import Product from "../../models/Product";
import VariantProduct from "../../models/Variant-product";
import Brand from '../../models/Brand';
import ParentProduct from '../../models/ParentProduct';
import CombinationProduct from '../../models/CombinationProduct';
import Sales from '../../models/Sales';
import AttributesList from "../../models/AttributesList";
import { getAllCategoryTreeids, getAllParentCategory, convertToWebP, buildCategoryAdminPath, buildCategoryPath, getAllParents, getAllAdminParents, generateUniqueId, getAllChildCategory, buildAdminCategoryPath, buildAdminCategoryPathTitles, generateAffiliateCode, sendToEmail, buildCategoryPathTitles, generateUniqueGiftCode, buildCategoryTree } from "../../helpers/common";
import mongoose, { Types, PipelineStage, ObjectId, AnyArray } from "mongoose";
import SalesDetailsModel from "../../models/Sales_detail";
import Slider from "../../models/Slider";
import { create } from "domain";
import OccassionModel from "../../models/Occasions";
import { upload } from '../../middleware/video';
import ProductModel from "../../models/Product";
import storeModel from "../../models/Store";
import CategoryModel from "../../models/Category";
import BlogModel from "../../models/Blog";
import BlogTagModel from "../../models/BlogTag";
import AdminCategoryModel from "../../models/AdminCategory";
import HomeSettingModel from "../../models/HomeSetting";
import Information from "../../models/Information";
import CountryModel from "../../models/Country";
import StateModel from "../../models/State";
import CityModel from "../../models/City";
import RatingModel from "../../models/Rating";
import VendorModel from "../../models/VendorDetail";
import FollowModel from "../../models/Follow";
import UserProductViewModel from "../../models/UserProductView";
import UserEmailModel from "../../models/UserEmail";
import CouponModel from "../../models/Coupon";
import PromotionalOfferModel from "../../models/PromotionalOffer"
import UserModel from "../../models/User";
import GiftCardModel from "../../models/GiftCard"
import GiftCardCategoryModel from "../../models/GiftCardCategory";
import zlib from 'zlib';
import AffiliateUser from "../../models/AffiliateUser";
import moment from "moment";
import ShippingModel from "../../models/Shipping";
import SubscribeModel from "../../models/Subscibe";
import BannerModel from "../../models/Banner";
import GiftCardDescriptionModel from "../../models/GiftCardDescription";
import PolicyModel from "../../models/Policy";
import StoreSettingModel from "../../models/StoreSetting";
import PurchaseGiftCardModel from "../../models/PurchaseGiftCard";
import salesModel from "../../models/Sales";
import { devNull } from "os";
import reportModel from "../../models/Report";
import TransactionModel from "../../models/transaction";
import crypto from 'crypto';
import wishlistModel from "../../models/Wishlist";
import Cart from "../../models/Cart";
import followModel from "../../models/Follow";
import AffilateUserModel from "../../models/AffiliateUser";
import SettingModel from "../../models/Setting";
import ActivityModel from "../../models/Activity";
import productAndVedorActivityModel from "../../models/ProductActivity";
import visitModel from "../../models/Visitcount";
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { date } from "joi";
import giftCardVisitModel from "../../models/Giftcardvisitcount";
import { pipeline } from "stream";
import voucherModel from "../../models/Voucher";
import VoucherModel from "../../models/Voucher";
import CartCouponModel from "../../models/CartCoupon";
import ParentCartModel from "../../models/ParentCart";
import AddressModel from "../../models/Address";
import { paginateArray } from "../../utils/pagination";
import { paginate } from "../../utils/pagination";
import _ from 'lodash';
import { main } from "ts-node/dist/bin";
import { error } from "console";
dayjs.extend(duration);

interface CustomRequest extends Request {
    user?: any;
    files?: any;
    filepath?: string;
}

// helper to safely parse JSON from form-data
const parseJSON = (val: any, fallback: any) => {
  try {
    return typeof val === "string" ? JSON.parse(val) : val || fallback;
  } catch {
    return fallback;
  }
};

const storage1 = multer.memoryStorage();

const uploadVideo = multer({
    storage: storage1,
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith('video/')) {
            return cb(new Error('Only videos are allowed'));
        }
        cb(null, true);
    }
}).single('video');

const uploadDir = 'uploads/product';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    }
});

const uploadImage = multer({
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only images are allowed'));
        }
        cb(null, true);
    }
}).array('images', 12);


const deleteFile = (filePath: string) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Failed to delete file: ${filePath}`, err);
        } else {
            console.log(`Successfully deleted file: ${filePath}`);
        }
    });
};

export const saveFile = async (file: any, cleanedName: string, folder: string = "variant") => {
  if (!file) return "";

  const uploadDir = path.join("uploads", folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const isImage = file.mimetype.startsWith("image/");
  const timestamp = Date.now();
  const fileName = `${cleanedName}-${timestamp}${isImage ? ".webp" : path.extname(file.originalname)}`;
  const fullPath = path.join(uploadDir, fileName);

  try {
    if (isImage) {
      // IMPORTANT: use buffer for memoryStorage AND path when exists
      if (file.buffer) {
        await sharp(file.buffer).toFormat("webp").toFile(fullPath);
      } else if (file.path) {
        await sharp(file.path).toFormat("webp").toFile(fullPath);
      }
    } else {
      // non-image files (PDF, DOC)
      if (file.buffer) {
        await fs.promises.writeFile(fullPath, file.buffer);
      } else if (file.path) {
        await fs.promises.copyFile(file.path, fullPath);
      }
    }
  } catch (e) {
    console.error("File save failed:", e);
  }

  return `${process.env.ASSET_URL}/uploads/${folder}/${fileName}`;
};



const saveProductFile = async (file: any, cleanedName: string) => {
  if (!file) return "";

  const uploadDir = path.join("uploads", "product");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const mime = file.mimetype?.toLowerCase() || "";
  const ext = path.extname(file.originalname)?.toLowerCase() || "";
  const parsed = path.parse(cleanedName);
  const baseName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();

  let finalFileName = "";
  let fullPath = "";

  try {
    if (mime.startsWith("image/")) {
      finalFileName = `${baseName}-${timestamp}.webp`;
      fullPath = path.join(uploadDir, finalFileName);
      await sharp(file.path).toFormat("webp").toFile(fullPath);
    } else {
      finalFileName = `${baseName}-${timestamp}${ext}`;
      fullPath = path.join(uploadDir, finalFileName);
      await fs.promises.copyFile(file.path, fullPath);
    }
    return process.env.ASSET_URL + "/uploads/product/" + finalFileName;
  } catch (e) {
    console.error("File save failed:", e);
    return "";
  }
};

const extractVariantImages = async (req: CustomRequest) => {
    let product_variants = req.body.product_variation || [];

    if (!req.files || req.files.length === 0) return product_variants;

    for (const file of req.files) {
        const field = file.fieldname;

        // 1️⃣ Handle Variant Attribute Images
        let match = field.match(
            /product_variation\[(\d+)\]\[variant_attributes\]\[(\d+)\]\[(.*?)\]/
        );

        if (match) {
            const variantIndex = Number(match[1]);
            const attributeIndex = Number(match[2]);
            const imageKey = match[3];

            const savedUrl = await saveFile(
                file,
                `${imageKey}-${Date.now()}`,
                req.filepath || "parentVariant"
            );

            if (
                product_variants[variantIndex] &&
                product_variants[variantIndex].variant_attributes &&
                product_variants[variantIndex].variant_attributes[attributeIndex]
            ) {
                product_variants[variantIndex]
                    .variant_attributes[attributeIndex][imageKey] = savedUrl;
            }

            continue; 
        }
        match = field.match(
            /product_variation\[(\d+)\]\[guide\]\[(.*?)\]/
        );

        if (match) {
            const variantIndex = Number(match[1]);
            const guideKey = match[2]; // "guide_file"

            const savedUrl = await saveFile(
                file,
                `${guideKey}-${Date.now()}`,
                req.filepath || "parentVariant"
            );

            if (product_variants[variantIndex]) {
                if (!product_variants[variantIndex].guide)
                    product_variants[variantIndex].guide = {};

                product_variants[variantIndex].guide[guideKey] = savedUrl;
            }

            continue;
        }
    }

    return product_variants;
};



function processTabs(tabs: any[]) {
  return tabs.map((tab, idx) => {
    if (
      tab.description &&
      typeof tab.description === "string" &&
      tab.description.includes("data:image")
    ) {
      // ✅ extract base64
      const match = tab.description.match(/data:image\/(.*?);base64,([^"]*)/);
      if (match) {
        const ext = match[1] || "png";
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");

        // ✅ save to uploads/product/tabs/
        const filename = `tab-${Date.now()}-${idx}.${ext}`;
        const savePath = path.join("uploads", "product", "tabs", filename);
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        fs.writeFileSync(savePath, buffer);

        // ✅ replace base64 with file URL
        tab.description = tab.description.replace(
          /data:image\/.*?;base64,[^"]*/g,
          `${process.env.ASSET_URL}/uploads/product/tabs/${filename}`
        );
      }
    }
    return tab;
  });
}

export const addSlider = async (req: Request, resp: Response) => {
    try {
        if (!req.hasOwnProperty('file') && req.body._id === '0') {
            return resp.status(400).json({ message: 'Slider image is required' });
        }

        const sliderImageFile = req.file;
        let fileName = "";

        if (sliderImageFile && !(sliderImageFile.mimetype.startsWith('image/'))) {
            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        } else if (sliderImageFile) {
            const uploadsDir = path.join('uploads', 'slider');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const convertedFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const webpDestinationPath = path.join(uploadsDir, convertedFileName);
            await convertToWebP(sliderImageFile.buffer, webpDestinationPath);
            fileName = convertedFileName;
        }

        if (req.body._id === '0') {
            await Slider.create({ image: fileName });
            return resp.status(200).json({ message: 'Slider created successfully.', reset: true });
        } else {
            const existSlider = await Slider.findOne({ _id: req.body._id });
            if (existSlider) {
                if (fileName) {
                    const oldImage = existSlider.image;
                    const oldImagePath = path.join('uploads', 'slider', oldImage);
                    if (fs.existsSync(oldImagePath)) {
                        await fs.promises.unlink(oldImagePath);
                    }
                } else {
                    fileName = existSlider.image;
                }

                await Slider.updateOne({ _id: req.body._id }, { $set: { image: fileName } });
                console.log(req.body._id)
                return resp.status(200).json({ message: 'Slider updated successfully.' });
            }
            else {
                return resp.status(404).json({ message: 'Slider not found.' });
            }
        }
    } catch (err) {
        console.error('Error:', err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const sliderList = async (req: CustomRequest, resp: Response) => {

    try {
        const query: any = {
            deletedAt: null
        }
        const sliderList = await Slider.find().sort({ _id: -1 });

        if (!sliderList) {
            return resp.status(403).json({ message: 'Slider not found.' });
        }
        const baseurl = process.env.ASSET_URL + '/uploads/slider/';

        var data = sliderList.map(function (slider) {
            return {
                _id: slider._id,
                image: baseurl + slider.image,
                status: slider.status,
                createdAt: slider.createdAt,
                updatedAt: slider.updatedAt
            }
        });

        return resp.status(200).json({ messgae: "Slider list fetch successfully", data });

    } catch (err) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }

}

export const changeStatus = async (req: Request, resp: Response) => {

    try {

        const query = { _id: req.body.id }
        const updateData = { $set: { status: req.body.status } }
        await Slider.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Status changed successfully.' });

    } catch (err) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }

}

export const deleteSlider = async (req: Request, resp: Response) => {

    try {
        await Slider.findByIdAndUpdate({ _id: req.params.id }, { deletedAt: resp.locals.currentdate().tz('Asia/Kolkata') }, { new: true });
        return resp.status(200).json({ message: 'Slider deleted successfully.' });

    } catch (err) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }

}

export const getSlider = async (req: Request, resp: Response) => {
    try {
        const slider = await Slider.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

        console.log(slider)

        if (!slider) {
            return resp.status(404).json({ message: 'Slider not found.' });
        }

        const baseurl = process.env.ASSET_URL + '/uploads/slider/';

        const data = {
            _id: slider._id,
            image: baseurl + slider.image,
            status: slider.status,
            createdAt: slider.createdAt,
            updatedAt: slider.updatedAt
        };

        return resp.status(200).json({ message: 'Slider fetched successfully.', data });

    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addCategory = async (req: CustomRequest, resp: Response) => {
    try {
        const { title, description, meta_title, meta_keywords, meta_description, variant_id, parent_id, bestseller, equalTo, productsMatch, value, restricted_keywords, attributeList_id } = req.body;

        // const existingCategory = await Category.findOne({ title });

        // if (existingCategory && req.body._id == 'new') {
        //     return resp.status(400).json({ message: 'Category already exists.' });
        // }

        let parent_slug = '';

        if (parent_id && parent_id !== null) {
            const parentData = await Category.findOne({ _id: parent_id });
            if (parentData) {
                parent_slug = parentData.slug;
            }
        }

        let slug = slugify(title, {
            lower: true,
            remove: /[*+~.()'"!:@]/g,
        });

        if (parent_slug) {
            slug = `${parent_slug}-${slug}`;
        }

        if (req.body._id == 'new') {
            const data = await Category.create({
                description,
                meta_description,
                meta_keywords,
                meta_title,
                title,
                slug,
                parent_id,
                parent_slug,
                variant_id,
                attributeList_id,
                bestseller,
                productsMatch,
                equalTo,
                value,
                restricted_keywords,
                conditions: req.body.conditions || [],
                conditionType: req.body.conditionType || 'all',
                isAutomatic: req.body.isAutomatic || false,
                categoryScope: req.body.categoryScope || 'all',
                selectedCategories: req.body.selectedCategories || []
            });

            return resp.status(200).json({ message: 'Category created successfully.', success: true, data });
        } else {
            const query = { _id: req.body._id };
            const updateData = {
                $set: {
                    title,
                    parent_id,
                    parent_slug,
                    variant_id,
                    attributeList_id,
                    slug,
                    bestseller,
                    productsMatch,
                    equalTo,
                    value,
                    description,
                    meta_description,
                    meta_keywords,
                    meta_title,
                    restricted_keywords,
                    conditions: req.body.conditions || [],
                    conditionType: req.body.conditionType || 'all',
                    isAutomatic: req.body.isAutomatic ?? false,
                    categoryScope: req.body.categoryScope || 'all',
                    selectedCategories: req.body.selectedCategories || []
                },
            };

            await Category.updateOne(query, updateData);

            return resp.status(200).json({ message: 'Category updated successfully.' });
        }
    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addCategoryImage = async (req: Request, resp: Response) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const image1 = files?.["file"]?.[0];
        const image2 = files?.["image"]?.[0];

        if (image1 && !image1.mimetype.startsWith("image/")) {
            return resp.status(400).json({ message: "Invalid file type for image1. Only images are allowed." });
        }

        if (image2 && !image2.mimetype.startsWith("image/")) {
            return resp.status(400).json({ message: "Invalid file type for image2. Only images are allowed." });
        }

        let fileName1: string | undefined;
        let fileName2: string | undefined;

        const uploadDir = path.join('uploads', 'category');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        if (image1) {
            fileName1 = Date.now() + "-" + Math.round(Math.random() * 1e9) + ".webp";
            const fullPath = path.join(uploadDir, fileName1);
            await convertToWebP(image1.buffer, fullPath);
        }

        if (image2) {
            fileName2 = Date.now() + "-" + Math.round(Math.random() * 1e9) + ".webp";
            const fullPath = path.join(uploadDir, fileName2);
            await convertToWebP(image2.buffer, fullPath);
        }

        const query = { _id: req.body._id };
        const updateData = { $set: { image: fileName1, topRatedImage: fileName2 } };
        await Category.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Images added successfully.' });
    } catch (err) {
        console.error('Error processing images:', err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const categoryList = async (req: CustomRequest, resp: Response) => {
    try {
        const pipeline: any = [
            {
                $lookup: {
                    from: 'categories',
                    localField: 'parent_id',
                    foreignField: '_id',
                    as: 'parent_data'
                }
            },
            {
                $unwind: {
                    path: '$parent_data',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    image: 1,
                    status: 1,
                    description: 1,
                    meta_title: 1,
                    meta_keywords: 1,
                    meta_description: 1,
                    bestseller: 1,
                    topRated: 1,
                    parent_id: 1,
                    parent_name: '$parent_data.title',
                    parent_status: '$parent_data.status',
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ];

        const data = await Category.aggregate(pipeline);

        let categories = await Promise.all(
            data.map(async (category) => {
                const getChildCategory = await getAllChildCategory(category._id);
                const categoryIds = getChildCategory.map((item: any) => item._id);

                const totalProducts = await Product.countDocuments({
                    category: { $in: categoryIds },
                    status: true
                });

                const products = await Product.find({
                    category: { $in: categoryIds }
                });

                const productIds = products.map((item) => item._id);

                const numberOfOrders = await SalesDetailsModel.countDocuments({
                    product_id: { $in: productIds }
                });

                const view = await UserProductViewModel.countDocuments({
                    product_id: { $in: productIds }
                });

                const categoryDoc = await Category.findById(category._id);
                const cleanedParent = await buildCategoryPathTitles(categoryDoc?._id);

                return {
                    ...category,
                    totalProducts,
                    numberOfOrders,
                    view,
                    revenue: 0,
                    parent: cleanedParent
                };
            })
        );

        if (req.query.search) {
        const search = String(req.query.search).trim().toLowerCase();

        categories = categories.filter((cat: any) =>
        cat.parent && cat.parent.toLowerCase().includes(search)
        );
    }

        let sort: any = req.query.sort ? JSON.parse(req.query.sort as string) : { parent: 1 };

        if (sort.parent) {
            categories.sort((a, b) =>
                sort.parent === 1
                    ? a.parent.localeCompare(b.parent)
                    : b.parent.localeCompare(a.parent)
            );
        }

        if (sort.createdAt) {
            categories.sort((a, b) =>
                sort.createdAt === 1
                    ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }

        if (sort.updatedAt) {
            categories.sort((a, b) =>
                sort.updatedAt === 1
                    ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
                    : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
        }

        const paginatedResult = paginateArray(categories, req.query);

        return resp.status(200).json({
            message: 'Category retrieved successfully.',
            success: true,
            ...paginatedResult
        });

    } catch (err) {
        console.log(err);
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.'
        });
    }
};


export const categoryChangeStatus = async (req: CustomRequest, resp: Response) => {

    try {

        const childId = await getAllCategoryTreeids(req.body.id);

        if (childId.length !== 0 && req.body.status === false) {
            const query = { _id: { $in: childId }, status: true }
            const updateData = { $set: { status: req.body.status } }
            await Category.updateMany(query, updateData);
        }

        const query = { _id: req.body.id }
        const category = await Category.findOne(query);

        if (!category) {
            return resp.status(400).json({ message: 'Category not found.' });
        }

        if (category.parent_id != null && req.body.status === true) {
            const parentCategory = await Category.findOne({ _id: category.parent_id });
            if (parentCategory?.status === false) {
                return resp.status(400).json({ message: 'Firstly please active your Parent Category.' });
            }
        }
        const updateData = { $set: { status: req.body.status } }
        await Category.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Status changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const topRatedChangeStatus = async (req: CustomRequest, resp: Response) => {

    try {

        const query = { _id: req.body.id }
        const updateData = { $set: { topRated: req.body.topRated } }
        await Category.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Tpp Rated Category status changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const deleteCategory = async (req: CustomRequest, resp: Response) => {

    try {

        const id = req.params.id;

        const category = await Category.findOne({ _id: id });

        if (category) {

            const childId = await getAllCategoryTreeids(category._id);

            for (const ids of childId) {
                await Category.deleteMany({ _id: ids });
            }
            await Category.deleteOne({ _id: id });

            return resp.status(200).json({ message: 'Category deleted successfully.' });

        } else {
            return resp.status(403).json({ message: 'Category not found.' });

        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const getCategory = async (req: CustomRequest, resp: Response) => {
  try {
    const pipeline: any = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id)
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'parent_id',
          foreignField: '_id',
          as: 'parent_data'
        }
      },
      {
        $lookup: {
          from: 'variants',
          localField: 'variant_id',
          foreignField: '_id',
          as: 'variant_data'
        }
      },
      {
        $lookup: {
          from: 'attributelists',
          localField: 'attributeList_id',
          foreignField: '_id',
          as: 'attributeList_data'
        }
      },
      {
        $unwind: {
          path: '$parent_data',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          image: 1,
          topRatedImage: 1,
          equalTo: 1,
          productsMatch: 1,
          value: 1,
          status: 1,
          description: 1,
          meta_title: 1,
          meta_keywords: 1,
          meta_description: 1,
          bestseller: 1,
          parent_id: 1,
          parent_name: '$parent_data.title',
          parent_status: '$parent_data.status',
          variant_id: 1,
          variant_data: 1,
          attributeList_id: 1,
          attributeList_data: 1,
          restricted_keywords: 1,
          conditions: 1,
          conditionType: 1,
          isAutomatic: 1,
          categoryScope: 1,
          selectedCategories: 1
        }
      }
    ];

    const categoryData = await Category.aggregate(pipeline);
    const category = categoryData[0];

    if (!category) {
      return resp.status(404).json({ message: 'Category not found.' });
    }

    const baseurl = process.env.ASSET_URL + '/uploads/category/';

    const data: any = {
      _id: category._id,
      title: category.title,
      slug: category.slug,
      parent_id: category.parent_id,
      bestseller: category.bestseller,
      variant_id: category.variant_id,
      attributeList_id: category.attributeList_id,
      image: baseurl + category.image,
      topRatedImage: baseurl + category.topRatedImage,
      status: category.status,
      description: category.description,
      meta_title: category.meta_title,
      meta_keywords: category.meta_keywords,
      meta_description: category.meta_description,
      variant_data: category.variant_data,
      attributeList_data: category.attributeList_data,
      productsMatch: category.productsMatch,
      equalTo: category.equalTo,
      value: category.value,
      restricted_keywords: category.restricted_keywords,
      conditions: category.conditions,
      conditionType: category.conditionType,
      isAutomatic: category.isAutomatic,
      categoryScope: category.categoryScope,
      selectedCategories: category.selectedCategories
    };

    if (category.parent_id != null) {
      data.parent_name = category.parent_name;
      data.parent_status = category.parent_status;
    }

    return resp.status(200).json({
      message: 'Category retrieved successfully.',
      data
    });
  } catch (error) {
    console.error('❌ getCategory error:', error);
    return resp
      .status(500)
      .json({ message: 'Something went wrong. Please try again.' });
  }
};


export const userList = async (req: CustomRequest, resp: Response) => {

    try {

        let query: any = {
            designation_id: '1',
        }

        if (req.query.status) {
            query.status = req.query.status
        }

        if (req.query.startDate && req.query.endDate) {
            const startDate = new Date(req.query.startDate as string);
            const endDate = new Date(req.query.endDate as string);
            query.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const users = await User.find(query).sort({ _id: -1 });

        const result = await Promise.all(users.map(async (user) => {
            const totalOrders = await SalesDetailsModel.countDocuments({ user_id: user._id, order_status: 'completed' });
            let baseUrl = '';

            if (user.image.includes("https")) {
                baseUrl = user.image
            } else if (user.image) {
                baseUrl = process.env.ASSET_URL + '/uploads/profileImage/' + user.image;
            }
            const lastSeenDays = await UserProductViewModel.findOne({ user_id: user._id }).sort({ createdAt: -1 });
            const lastSeenDiffDays = lastSeenDays?.createdAt
                ? Math.ceil((new Date().getTime() - new Date(lastSeenDays.createdAt).getTime()) / (1000 * 3600 * 24))
                : 0;

            const lastPurchase = await SalesDetailsModel.findOne({ user_id: user._id, order_status: 'completed' }).sort({ createdAt: -1 });
            const lastPurchaseDiffDays = lastPurchase?.createdAt
                ? Math.ceil((new Date().getTime() - new Date(lastPurchase.createdAt).getTime()) / (1000 * 3600 * 24))
                : 0;

            let address = await AddressModel.findOne({ user_id: user._id });
            console.log(user._id)

            const totalSpends = await salesModel.aggregate([
                {
                    $match: {
                        user_id: new mongoose.Types.ObjectId(user._id)
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSpent: {
                            $sum: {
                                $ifNull: ["$subtotal", 0]
                            }
                        }
                    }
                }
            ])

            return {
                _id: user._id,
                name: user.name,
                phone_code: user.phone_code,
                occupation: user.occupation ? user.occupation : '',
                email: user.email,
                id_number: user.id_number,
                image: baseUrl,
                status: user.status,
                mobile: user.mobile,
                type: user.type,
                address: address,
                profession: user.profession ? user.profession : '',
                totalOrders: totalOrders,
                totalSpent: totalSpends?.[0]?.totalSpent || 0,
                lastSeenDiffDays: lastSeenDiffDays,
                lastPurchaseDiffDays: lastPurchaseDiffDays,
                created_at: resp.locals.currentdate(user.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
            };
        }));

        if (result) {

            return resp.status(200).json({ message: 'User retrieved successfully.', result });

        } else {

            return resp.status(403).json({ message: 'User not found.' });
        }

    } catch (error) {
        console.log(error)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const updateUserStatus = async (req: CustomRequest, resp: Response) => {

    const user_id = req.params.id;
    console.log(user_id);

    if (user_id === null || user_id === undefined || user_id === '') {
        return resp.status(403).json({ message: 'User ID Param not found.' });
    }

    try {

        const user = await User.findOne({ designation_id: '1', _id: user_id });

        if (user) {
            const updateData = { $set: { status: req.body.status } }
            await User.updateOne({ _id: user_id }, updateData);
            return resp.status(200).json({ message: 'User status updated successfully.' });
        } else {

            return resp.status(403).json({ message: 'User not found.' });
        }

    } catch (err: any) {

        return resp.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });

    }
}

export const getUserDetail = async (req: CustomRequest, resp: Response) => {

    const user_id = req.params.id;

    if (user_id === null || user_id === undefined || user_id === '') {
        return resp.status(403).json({ message: 'User ID Param not found.' });
    }

    try {
        const pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(user_id),
                    designation_id: 1
                }
            },
            {
                $lookup: {
                    from: "addresses",
                    localField: "_id",
                    foreignField: "user_id",
                    as: 'userAddressData'
                }
            },
            {
                $lookup: {
                    from: "wishlists",
                    localField: "_id",
                    foreignField: "user_id",
                    as: 'wishlistData'
                }
            },
            {
                $lookup: {
                    from: "follows",
                    localField: "_id",
                    foreignField: "user_id",
                    as: 'followData'
                }
            },
            {
                $lookup: {
                    from: "carts",
                    localField: "_id",
                    foreignField: "user_id",
                    as: 'cartData'
                }
            },
            {
                $lookup: {
                    from: "ratings",
                    localField: "_id",
                    foreignField: "user_id",
                    as: 'ratingData'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone_code: 1,
                    profession: 1,
                    mobile: 1,
                    dob: 1,
                    image: 1,
                    country_id: 1,
                    state_id: 1,
                    city_id: 1,
                    id_number: 1,
                    userAddressData: 1,
                    wallet_balance: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    wishlistCount: { $size: '$wishlistData' },
                    wishlistPrice: { $sum: '$wishlistData.price' },
                    followCount: { $size: '$followData' },
                    cartCount: { $size: '$cartData' },
                    cartPrice: { $sum: '$cartData.price' },
                    ratingCount: { $size: '$ratingData' },
                }
            }
        ]

        const data = await User.aggregate(pipeline);
        const user = data[0];
        const userEmailData = await UserEmailModel.findOne({ user_id: user?._id, status: { $in: ['Pending', 'Confirmed'] } }).sort({ _id: -1 });
        const country = await CountryModel.findOne({ _id: user?.country_id });
        const state = await StateModel.findOne({ _id: user?.state_id });
        const city = await CityModel.findOne({ _id: user?.city_id });

        if (user) {
            const image = user.image ? user.image : '';
            let baseUrl = '';

            if (image.includes("https")) {
                baseUrl = image
            } else if (image) {
                baseUrl = process.env.ASSET_URL + '/uploads/profileImage/' + image;
            }

            console.log(user)

            const data = {
                _id: user._id,
                name: user.name,
                email: user.email,
                email_verified: userEmailData ? userEmailData.status : 'Pending',
                phone_code: user.phone_code,
                mobile: user.mobile,
                dob: user.dob,
                image: baseUrl,
                gender: user.gender,
                country_id: user.country_id,
                state_id: user.state_id,
                city_id: user.city_id,
                country: country ? country.name : '',
                state: state ? state.name : '',
                city: city ? city.name : '',
                id_number: user.id_number,
                profession: user.profession,
                userAddresses: user.userAddressData,
                wishlistCount: user.wishlistCount,
                followCount: user.followCount,
                cartCount: user.cartCount,
                ratingCount: user.ratingCount,
                wallet_balance: user.wallet_balance,
                cartPrice: user.cartPrice,
                status: user.status,
                wishlistPrice: user.wishlistPrice,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }

            return resp.status(200).json({ message: 'User retrieved successfully.', data });

        } else {

            return resp.status(403).json({ message: 'User not found.' });
        }

    } catch (err: any) {

        return resp.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });

    }


}

export const addBrand = async (req: CustomRequest, resp: Response) => {

    try {
        const title = req.body.title;
        const description = req.body.description;
        const link = req.body.link;

        const slug = slugify(title, {
            lower: true,
            remove: /[*+~.()'"!:@]/g,
        })

        if (req.body._id == 'new') {

            const data = await Brand.create({ title: title, description: description, slug: slug, link: link });

            return resp.status(200).json({ message: 'Brand created successfully.', success: true, data });
        } else {

            const query = { _id: req.body._id }
            const updateData = { $set: { title: title, description: description, slug: slug, link: link } }

            await Brand.updateOne(query, updateData);

            return resp.status(200).json({ message: 'Brand updated successfully.' });
        }

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }


}

export const addBrandImage = async (req: CustomRequest, resp: Response) => {
    try {
        if (!req.hasOwnProperty('file')) {
            return resp.status(400).json({ message: 'Image is required' });
        }

        const categoryImageFile = req.file;
        let fileName = "";
        if (categoryImageFile && !(categoryImageFile.mimetype.startsWith('image/'))) {
            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }

        if (categoryImageFile) {
            fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const uploadDir = path.join('uploads', 'brand');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const fullPath = path.join(uploadDir, fileName);
            await convertToWebP(categoryImageFile.buffer, fullPath);  // Reusing the helper function
        }

        const query = { _id: req.body._id };
        const updateData = { $set: { image: fileName } };
        await Brand.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Image added successfully.' });
    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const brandList = async (req: CustomRequest, resp: Response) => {
    try {
        const query: any = {

        }
        const checkUser: any = await User.findOne({ _id: req.user._id });

        const brand = await Brand.find(query).sort({ _id: -1 });
        return resp.status(200).json({ message: 'Brand retrieved successfully.', success: true, brand });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getAllActiveBrands = async (req: CustomRequest, resp: Response) => {
    try {
        const brand = await Brand.find({ status: true }).sort({ _id: -1 });
        return resp.status(200).json({ message: 'Brand retrieved successfully.', success: true, brand });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const brandChangeStatus = async (req: CustomRequest, resp: Response) => {

    try {

        const query = { _id: req.body.id }
        const updateData = { $set: { status: req.body.status } }
        await Brand.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Status changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const brandFeaturedChangeStatus = async (req: CustomRequest, resp: Response) => {

    try {

        const query = { _id: req.body.id }
        const updateData = { $set: { featured: req.body.featured } }
        await Brand.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Featured status changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const deleteBrand = async (req: CustomRequest, resp: Response) => {

    try {

        const id = req.params.id;

        const brand = await Brand.findOne({ _id: id });

        if (brand) {

            await Brand.deleteOne({ _id: brand._id });

            return resp.status(200).json({ message: 'Brand deleted successfully.' });

        } else {
            return resp.status(403).json({ message: 'Brand not found.' });

        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const getBrand = async (req: CustomRequest, resp: Response) => {

    try {
        const query: any = {
            _id: req.params.id
        }

        const checkUser: any = await User.findOne({ _id: req.user._id });
        const brand = await Brand.findOne(query);

        if (brand == null) {
            return resp.status(403).json({ message: 'Brand not found.' });
        }
        const baseurl = process.env.ASSET_URL + '/uploads/brand/';

        const data: any = {
            _id: brand._id,
            title: brand.title,
            slug: brand.slug,
            image: baseurl + brand.image,
            link: brand.link,
            status: brand.status,
            featured: brand.featured,
            description: brand?.description ?? "NA"
        }
        return resp.status(200).json({ message: 'Brand retrieved successfully.', data });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

    export const addVariant = async (req: CustomRequest, resp: Response) => {
    try {
        const variant_name = req.body.variant_name;
        const base_url = process.env.ASSET_URL + "/uploads/variant/";
        const files: any[] = (req.files as any[]) || [];

        const findFile = (key: string) => files.find(f => f.fieldname === key);
        const findFiles = (key: string) => files.filter(f => f.fieldname === key);

        const cleanFileName = (filename: string, fallback: string) => {
        if (!filename) return "";

        const match = filename.match(/\[(preview_image|thumbnail|main_images)\](.*)/);
        if (match) {
        return match[1] + (match[2] || "");
        }

        let cleaned = filename.includes("]") ? filename.split("]").pop() || filename : filename;
        if (cleaned.startsWith("-")) {
        cleaned = fallback + cleaned;
        }
        return cleaned;
        };


        // check duplicate
        const existingVariant = await Variant.findOne({ variant_name });
        if (existingVariant && req.body._id == "new") {
        return resp
            .status(400)
            .json({ message: "Variant name already exists.", success: false });
        }
        

        let variantId: any;


        let variantAttr: any = req.body.variant_attr || [];
        if (typeof variantAttr === "string") {
        try {
            variantAttr = JSON.parse(variantAttr);
        } catch {
            variantAttr = [];
        }
        }

        let deletedStatusIds: any = req.body.deletedAttrIds || [];
        if (typeof deletedStatusIds === "string") {
        try {
            deletedStatusIds = JSON.parse(deletedStatusIds);
        } catch {
            deletedStatusIds = [];
        }
        }

        // 🆕 Handle guide chart upload for Variant
        const guideFile = findFile("guide_file"); // single file upload field
        const guide_name = req.body.guide_name || "";
        const guide_description = req.body.guide_description || "";
        let guide_file = "";
        let guide_type = "";

        if (guideFile) {
        guide_file = await saveFile(guideFile, guideFile.filename, "guide");
        guide_type = guideFile.mimetype === "application/pdf" ? "pdf" : "image";
        }

        // -------- CREATE --------
        if (req.body._id == "new") {
        const variant = await Variant.create({ variant_name, guide_name, guide_file, guide_type, guide_description });
        variantId = variant._id;

        for (let i = 0; i < variantAttr.length; i++) {
            const attr = variantAttr[i];

            const thumbFile = findFile(`variant_attr[${i}][thumbnail]`);
            const previewFile = findFile(`variant_attr[${i}][preview_image]`);
            const mainFiles = findFiles(`variant_attr[${i}][main_images]`);

        const thumbnail = thumbFile ? await saveFile(thumbFile, cleanFileName(thumbFile.filename, "thumbnail")) : "";
        const preview_image = previewFile ? await saveFile(previewFile, cleanFileName(previewFile.filename, "preview_image")) : "";
        const main_images = mainFiles.length
        ? await Promise.all(mainFiles.map(f => saveFile(f, cleanFileName(f.filename, "main_images"))))
        : [];


            await VariantAttribute.create({
            variant: variantId,
            attribute_value: attr.attr_name,
            sort_order: attr.sort_order,
            status: attr.status,
            thumbnail,
            preview_image,
            main_images,
            });
        }

        return resp
            .status(200)
            .json({ message: "Variant created successfully.", success: true });
        }

        // -------- UPDATE --------
        else {
        variantId = req.body._id;
        
        const existingVariant = await Variant.findById(variantId);
        const oldName = existingVariant?.variant_name;
        if (Array.isArray(deletedStatusIds) && deletedStatusIds.length > 0) {
            await VariantAttribute.updateMany(
            { _id: { $in: deletedStatusIds.map((id: string) => new mongoose.Types.ObjectId(id)) } },
            { $set: { deleted_status: true, status: false } }
            );

            // 🔹 Emit event for each soft-deleted attribute
           for (const id of deletedStatusIds) {
           const existingAttr = await VariantAttribute.findById(id);
           if (existingAttr) {
           let correctVariantName = existingVariant?.variant_name;
           const sampleProduct = await Product.findOne({ variant_id: variantId }, { variations_data: 1 });
           if (sampleProduct) {
           const match = sampleProduct.variations_data.find(v =>
           v.values.includes(existingAttr?.attribute_value)
           );
           if (match) correctVariantName = match.name;
        }

           eventBus.emit("attributeDeleted", {
           id,
           value: existingAttr?.attribute_value,
           variantName: correctVariantName
        });
       }
     }

        }

        for (let i = 0; i < variantAttr.length; i++) {
            const attr = variantAttr[i];

            const thumbFile = findFile(`variant_attr[${i}][thumbnail]`);
            const previewFile = findFile(`variant_attr[${i}][preview_image]`);
            const mainFiles = findFiles(`variant_attr[${i}][main_images]`);
            const thumbnail = thumbFile ? await saveFile(thumbFile, cleanFileName(thumbFile.filename, "thumbnail")) : "";
            const preview_image = previewFile ? await saveFile(previewFile, cleanFileName(previewFile.filename, "preview_image")) : "";
            const main_images = mainFiles.length
            ? await Promise.all(mainFiles.map(f => saveFile(f, cleanFileName(f.filename, "main_images"))))
            : [];

            if (attr._id && attr._id !== "new") {
            const existingAttr = await VariantAttribute.findById(attr._id);

            // find correct variantName from Product
            let correctVariantName = existingVariant?.variant_name;
            const sampleProduct = await Product.findOne(
            { variant_id: variantId },
            { variations_data: 1 }
          );

            if (sampleProduct) {
            const match = sampleProduct.variations_data.find(v =>
            v.values.includes(existingAttr?.attribute_value)
          );
          if (match) {
          correctVariantName = match.name; // <-- "Stone"
          }
        }

            const thumbnail = thumbFile
            ? await saveFile(thumbFile, cleanFileName(thumbFile.filename, "thumbnail"))
            : existingAttr?.thumbnail || "";

            const preview_image = previewFile
            ? await saveFile(previewFile, cleanFileName(previewFile.filename, "preview_image"))
            : existingAttr?.preview_image || "";

            const main_images = mainFiles.length
            ? await Promise.all(mainFiles.map(f => saveFile(f, cleanFileName(f.filename, "main_images"))))
            : existingAttr?.main_images || [];

            await VariantAttribute.updateOne(
            { _id: attr._id },
            {
            $set: {
            attribute_value: attr.attr_name,
            sort_order: attr.sort_order,
            status: attr.status,
            thumbnail,
            preview_image,
            main_images,
            },
            }
            );
            // 🔹 Emit event for Attribute update
            eventBus.emit("attributeUpdated", { id: attr._id, value: attr.attr_name, oldValue: existingAttr?.attribute_value, variantName: correctVariantName });
            }
            else {
            await VariantAttribute.create({
                variant: variantId,
                attribute_value: attr.attr_name,
                sort_order: attr.sort_order,
                status: attr.status,
                thumbnail,
                preview_image,
                main_images,
            });
            }
        }

            const updateData: any = { variant_name, guide_name, guide_description };

            if (guideFile) {
            updateData.guide_file = guide_file;
            updateData.guide_type = guide_type;
          }

        await Variant.updateOne({ _id: variantId }, { $set: updateData });

        // 🔹 Emit event for Variant update
        eventBus.emit("variantUpdated", { id: variantId, oldName, name: variant_name });

        return resp.status(200).json({ message: "Variant updated successfully." });
        }
    } catch (err) {
        console.log(err);
        return resp
        .status(500)
        .json({ message: "Something went wrong. Please try again." });
    }
    };




export const variantList = async (req: CustomRequest, resp: Response) => {
    try {
        const { fulldata } = req.query;

        const query: any = { deletedAt: null };

        if (req.query.search) {
            const search = String(req.query.search).trim();

            query.$or = [
                { variant_name: { $regex: search, $options: "i" } },
            ];
        }

        let sort: any = { variant_name: 1 };

        if (req.query.sort) {
            try {
                const incomingSort = JSON.parse(req.query.sort as string);
                if (typeof incomingSort === "object") {
                    sort = incomingSort;
                }
            } catch (e) {
                console.log("Invalid sort JSON, using default");
            }
        }

        if(fulldata === "true") {
            const variants = await Variant.aggregate([
                { $match: query },
                { $sort: sort },
                {
                    $lookup: {
                        from: "variantattributes",
                        localField: "_id",
                        foreignField: "variant",
                        pipeline: [
                            { $match: { deleted_status: false, deletedAt: null} },
                            { $sort: { sort_order: 1 } }
                        ],
                        as: "attributes"
                    }
                }
            ]);
            return resp.status(200).json({
                success: true,
                message: "Full Variant List retrieved successfully.",
                data: variants
            });
        }

        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);

        const skip = (page - 1) * limit;

        const variants = await Variant.aggregate([
            { $match: query },

            { $sort: sort },

            { $skip: skip },

            { $limit: limit },

            {
                $lookup: {
                    from: "variantattributes",
                    localField: "_id",
                    foreignField: "variant",
                    pipeline: [
                        { $match: { deleted_status: false, deletedAt: null } },
                        { $sort: { sort_order: 1 } }
                    ],
                    as: "attributes"
                }
            }
        ]);

        const total = await Variant.countDocuments(query);

        return resp.status(200).json({
            message: "Variant retrieved successfully.",
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: variants
        });

    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: "Something went wrong. Please try again." });
    }
};



export const variantChangeStatus = async (req: CustomRequest, resp: Response) => {

    try {

        const query = { _id: req.body.id }
        const variant = await Variant.findOne(query);

        if (variant) {
            const variantAttribute = await VariantAttribute.find({ variant: variant._id });
            const updateData = { $set: { status: req.body.status } }

            if (variantAttribute) {
                for (const variAttr of variantAttribute) {
                    await VariantAttribute.updateMany({ _id: variAttr._id }, updateData);
                }
            }

            await Variant.updateOne(query, updateData);

            return resp.status(200).json({ message: 'Status changed successfully.' });
        } else {

            return resp.status(200).json({ message: 'Variant not found.' });
        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }


}

export const variantCategoryChangeStatus = async (req: CustomRequest, resp: Response) => {

    try {

        const query = { _id: req.body.id }
        const variant = await Variant.findOne(query);

        if (variant) {
            const updateData = { $set: { category_status: req.body.status } }
            await Variant.updateOne(query, updateData);

            return resp.status(200).json({ message: 'Status changed for Category successfully.' });
        } else {

            return resp.status(200).json({ message: 'Variant not found.' });
        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }


}

export const variantProductStatus = async (req: CustomRequest, resp: Response) => {

    try {

        const query = { _id: req.body.id }
        const variant = await Variant.findOne(query);

        if (variant) {
            const updateData = { $set: { product_status: req.body.status } }
            await Variant.updateOne(query, updateData);

            return resp.status(200).json({ message: 'Status changed for Product successfully.' });
        } else {

            return resp.status(200).json({ message: 'Variant not found.' });
        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }


}

export const deleteVariant = async (req: CustomRequest, resp: Response) => {

    try {

        const id = req.params.id;

        const variant = await Variant.findOne({ _id: id });

        if (variant) {

            await Variant.findByIdAndUpdate({ _id: id }, { deletedAt: resp.locals.currentdate().tz('Asia/Kolkata') }, { new: true });
            await VariantAttribute.updateMany({ variant_id: id }, { deletedAt: resp.locals.currentdate().tz('Asia/Kolkata') });

            // Emit event so all related products are marked inactive
            eventBus.emit("variantDeleted", { id });
            return resp.status(200).json({ message: 'Variant deleted successfully.' });

        } else {
            return resp.status(403).json({ message: 'Variant not found.' });

        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const getVariant = async (req: CustomRequest, resp: Response) => {
    try {
        const query: any = {
            _id: req.params.id
        }

        const variant = await Variant.findOne(query);

        if (!variant) {
            return resp.status(403).json({ message: 'Variant not found.' });
        }

        const variantAttributes = await VariantAttribute.find({ variant: variant._id, deleted_status: false }).sort({ sort_order: 1 });

        const variantWithAttributes = variant.toObject() as any;
        variantWithAttributes.variantAttributes = variantAttributes || [];


        return resp.status(200).json({
            message: 'Variant and attributes retrieved successfully.',
            variant: variantWithAttributes
        });

    } catch (error) {
        console.error('Error retrieving variant or attributes:', error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

// Variant Attribute
export const addVariantAttribute = async (req: CustomRequest, resp: Response) => {

    try {
        const variant = req.body.variant;
        const attribute_value = req.body.attribute_value;

        if (req.body._id == 'new') {

            const chkVariantAttribute = await VariantAttribute.findOne({ attribute_value: attribute_value, variant: variant });

            if (chkVariantAttribute) {
                return resp.status(400).json({ message: 'Variant Attribute already exists with selected variant.' });
            }

            await VariantAttribute.create({ variant: variant, attribute_value: attribute_value});
            return resp.status(200).json({ message: 'Variant Attribute created successfully.', success: true });

        } else {

            const chkVariantAttribute = await VariantAttribute.findOne({ attribute_value: attribute_value, variant: variant, _id: req.body._id });

            if (chkVariantAttribute) {
                return resp.status(400).json({ message: 'Variant Attribute already exists with selected variant.' });
            }

            const query = { _id: req.body._id }
            const updateData = { $set: { variant: variant, attribute_value: attribute_value } }

            await VariantAttribute.updateOne(query, updateData);

            return resp.status(200).json({ message: 'Variant Attribute updated successfully.' });
        }



    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }


}

export const variantAttributeList = async (req: CustomRequest, resp: Response) => {
    try {
        const query: any = {
        }

        const variantAttribute = await VariantAttribute.find(query).populate('variant');
        return resp.status(200).json({ message: 'Variant Attribute retrieved successfully.', success: true, variantAttribute });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getAllActiveVariant = async (req: CustomRequest, resp: Response) => {
    try {
        const query: any = {
            status: true
        }

        if (req.query.type === 'Category') {
            query.category_status = true
        } else if (req.query.type === 'Product') {
            query.product_status = true
        }

        const variant = await Variant.find(query);

        const parent: any[] = [];

        for (const data of variant) {

            interface FinalData {
                id: Types.ObjectId;
                variant_name: string;
                variant_attribute?: any[];
            }
            let final: FinalData = {
                id: data._id,
                variant_name: data.variant_name
            };

            const variantAttr = await VariantAttribute.find({ variant: data._id, status: true });

            if (variantAttr) {
                final['variant_attribute'] = variantAttr;
            }

            parent.push(final);
        }
        return resp.status(200).json({ message: 'Variant retrieved successfully.', success: true, parent });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const variantAttributeChangeStatus = async (req: CustomRequest, resp: Response) => {

    try {

        const query = { _id: req.body.id }
        const updateData = { $set: { status: req.body.status } }
        await VariantAttribute.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Status changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const deleteVariantAttribute = async (req: CustomRequest, resp: Response) => {

    try {

        const id = req.params.id;

        const variantAttribute = await VariantAttribute.findOne({ _id: id });

        if (variantAttribute) {

            await VariantAttribute.deleteOne({ _id: variantAttribute._id });

            return resp.status(200).json({ message: 'Variant Attribute deleted successfully.' });

        } else {
            return resp.status(403).json({ message: 'Variant Attribute not found.' });

        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const getVariantAttribute = async (req: CustomRequest, resp: Response) => {

    try {
        const query: any = {
            _id: req.params.id
        }

        const variantAttribute = await VariantAttribute.findOne(query).populate('variant')

        if (variantAttribute) {

            return resp.status(200).json({ message: 'Variant Attribute retrieved successfully.', variantAttribute });

        } else {

            return resp.status(403).json({ message: 'Variant Attribute not found.' });
        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const createAttributeList = async (req: CustomRequest, resp: Response) => {
    try {
        const attributeList = await AttributesList.create(req.body);
        return resp.status(201).json({
            success: true,
            message: 'Attribute List created successfully.',
            data: attributeList
        });
    } catch (error: any) {
        return resp.status(500).json({
            success: false,
            message: error.message || 'Something went wrong. Please try again.'
        });
    }
};


export const getAttributeList = async (req: CustomRequest, resp: Response) => {
    try {
        const { sort, fulldata } = req.query;

        let sortOption: any = { createdAt: -1 };

        if (sort) {
            try {
                const parsed = JSON.parse(sort as string);
                if (typeof parsed === "object") sortOption = parsed;
            } catch {
                console.log("Invalid sort format received — using default sort.");
            }
        }

        let filter: any = { isDeleted: false };

        if(req.query.search) {
            const search = String(req.query.search).trim();

            filter.$or = [
                { name: { $regex: search, $options: "i" } },
            ]
        };

        if(fulldata === "true"){
            const data = await AttributesList.find(filter).sort(sortOption);

            return resp.status(200).json({
                success: true,
                message: "Full Attribute List retrieved successfully.",
                data
            });
        }

        const result = await paginate(AttributesList, {
            page: Number(req.query.page || 1),
            limit: Number(req.query.limit || 10),
            sort: sortOption,
            filter
        });

        return resp.status(200).json({
            success: true,
            message: "Attribute List retrieved successfully.",
            ...result
        });

    } catch (error: any) {
        return resp.status(500).json({
            success: false,
            message: error.message || "Something went wrong. Please try again."
        });
    }
};

export const getAttributeListById = async (req: CustomRequest, resp: Response) => {
    try {
        const attribute = await AttributesList.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if(!attribute) {
            return resp.status(404).json({
                success: false,
                message: 'Data not found'
            })
        }
        return resp.status(200).json({
            success: true,
            message: 'Attribute retrieved successfully.',
            data: attribute
        });
    } catch (error: any) {
        return resp.status(500).json({
            success: false,
            message: error.message || 'Something went wrong. Please try again.'
        })
    }
}

export const updateAttributeList = async (req: CustomRequest, res: Response) => {
  try {
    const id = req.params.id;

    const existing = await AttributesList.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    const createdAt = (existing as any).createdAt;

    const data = {
      ...req.body,
      _id: id,
      createdAt,
      updatedAt: new Date(),
    };

    if (data.values && data.values.length > 0) {
      const vals = data.values.map((v: any) => v.value?.trim().toLowerCase());
      if (vals.length !== new Set(vals).size) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate dropdown values are not allowed within the same attribute.",
        });
      }
    }

    if (data.subAttributes && data.subAttributes.length > 0) {
      const subNames = data.subAttributes.map((s: any) =>
        s.name?.trim().toLowerCase()
      );
      if (subNames.length !== new Set(subNames).size) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate sub-attribute names are not allowed within the same attribute.",
        });
      }

      for (const sub of data.subAttributes) {
        if (sub.values && sub.values.length > 0) {
          const valNames = sub.values.map((v: any) =>
            v.value?.trim().toLowerCase()
          );
          if (valNames.length !== new Set(valNames).size) {
            return res.status(400).json({
              success: false,
              message: `Duplicate values found in sub-attribute "${sub.name}". Each value must be unique.`,
            });
          }
        }
      }
    }
    await AttributesList.replaceOne({ _id: id }, data, { runValidators: true });

    const updated = await AttributesList.findById(id);

    return res.status(200).json({
      success: true,
      message: "Attribute List fully replaced successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating attribute:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

export const deleteAttributeList = async (req: CustomRequest, resp: Response) => {
    try {
        const attribute = await AttributesList.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true},
            { new: true }
        );
        if(!attribute) {
            return resp.status(404).json({
                success: false,
                message: 'Attribute not found'
            });
        }
        return resp.status(200).json({
            success: true,
            message: 'Attribute List deleted successfully'
        })
    } catch (error: any) {
        return resp.status(500).json({
        success: false,
        message: error.message || "Something went wrong. Please try again."
    });
    }
}

const stripHtml = (text: string = ""): string => {
  return text
    .replace(/<[^>]*>?/gm, "")   
    .replace(/\s+/g, " ")        
    .trim();
};

const decodeBase64 = (text = "") =>
  Buffer.from(text, "base64").toString("utf-8");

const buildMetaDescription = (text = "", max = 160) => {
  const clean = stripHtml(text);
  return clean.length > max ? clean.slice(0, max).trim() : clean;
};


export const addProduct = async (req: CustomRequest, resp: Response) => {
  try {

    req.body = qs.parse(req.body, { allowDots: true, depth: 20, arrayLimit: 100 });
    const files: any[] = (req.files as any[]) || [];
    const findFile = (key: string) => files.find(f => f.fieldname === key);
    const findFiles = (key: string) => files.filter(f => f.fieldname === key);
    const cleanTitle = stripHtml(req.body.product_title || "");
    const isUpdate =
  req.body._id &&
  req.body._id !== "new" &&
  mongoose.Types.ObjectId.isValid(req.body._id);

const existingProducts = isUpdate
  ? await Product.findById(req.body._id)
  : null;

    const data: any = {
      category: req.body.category,
      variant_id: req.body.variant_id,
      bestseller: req.body.bestseller,
      popular_gifts: req.body.popular_gifts,
      variant_attribute_id: req.body.variant_attribute_id,
      product_title: req.body.product_title,
      meta_title: cleanTitle,
      product_type: req.body.product_type,
      tax_ratio: req.body.tax_ratio,
      bullet_points: req.body.bullet_points
        ? Buffer.from(req.body.bullet_points, "utf-8").toString("base64")
        : "",
      description: req.body.description
        ? Buffer.from(req.body.description, "utf-8").toString("base64")
        : "",
      customize: req.body.customize,
      search_terms: req.body.search_terms,
      launch_date: req.body.launch_date,
      release_date: req.body.release_date,
      vendor_id: req.body.vendor_id,
      brand_id: req.body.brand_id,
      sku_code: req.body.sku_code,
      tax_code: req.body.tax_code,
      shipping_templates: req.body.shipping_templates,
      price: req.body.price ? Number(req.body.price) : undefined,
      sale_price: req.body.sale_price ? Number(req.body.sale_price) : undefined,
      sale_start_date: req.body.sale_start_date,
      sale_end_date: req.body.sale_end_date,
      qty: req.body.qty ? Number(req.body.qty) : undefined,
      max_order_qty: req.body.max_order_qty,
      color: req.body.color,
      can_offer: req.body.can_offer,
      gift_wrap: req.body.gift_wrap,
      restock_date: req.body.restock_date,
      production_time: req.body.production_time,
      gender: req.body.gender,
      size: req.body.size,
      size_map: req.body.size_map,
      color_textarea: req.body.color_textarea,
      color_map: req.body.color_map,
      style_name: req.body.style_name,
      shipping_weight: req.body.shipping_weight,
      shipping_weight_unit: req.body.shipping_weight_unit,
      display_dimension_length: req.body.display_dimension_length,
      display_dimension_width: req.body.display_dimension_width,
      display_dimension_height: req.body.display_dimension_height,
      display_dimension_unit: req.body.display_dimension_unit,
      package_dimension_height: req.body.package_dimension_height,
      package_dimension_length: req.body.package_dimension_length,
      package_dimension_width: req.body.package_dimension_width,
      package_dimension_unit: req.body.package_dimension_unit,
      package_weight: req.body.package_weight,
      package_weight_unit: req.body.package_weight_unit,
      unit_count: req.body.unit_count,
      unit_count_type: req.body.unit_count_type,
      how_product_made: req.body.how_product_made,
      occasion: req.body.occasion,
      design: req.body.design,
      material: req.body.material,
      product_size: req.body.product_size,
      isCombination:
        req.body.isCombination === "true" || req.body.isCombination === true,
      combinationData: req.body.combinationData || [],
      variations_data: parseJSON(req.body.variations_data, []),
      form_values: parseJSON(req.body.form_values, {}),
      customizationData: parseJSON(req.body.customizationData, {}),
      tabs: parseJSON(req.body.tabs, []),
      exchangePolicy: req.body.exchangePolicy,
      zoom: parseJSON(req.body.zoom, {}),
      dynamicFields: parseJSON(req.body.dynamicFields, {}),
    };

    if (req.body.description) {
       const decodedDesc = req.body.description;
    data.meta_description = buildMetaDescription(decodedDesc);
    }
    
    if (Array.isArray(req.body.search_terms)) {
       data.meta_keywords = req.body.search_terms.map((k: string) => k.trim()).filter(Boolean);
    }
     // if (req.body.sale_price > req.body.price) {
        //     return resp.status(400).json({ message: 'Sale price cannot be greater than price.', success: false });
        // }
        // let percentage = 0;
        // if (req.body.sale_price) {
        //     percentage = ((req.body.price - req.body.sale_price) / req.body.price) * 100;
        // }
        // data.discount = percentage;

        // 🔹 Process customizationData deeply (supports thumbnails, previews, main_images, edit_main_image, edit_preview_image)
if (data.customizationData?.customizations && Array.isArray(data.customizationData.customizations)) {
  data.customizationData.customizations = await Promise.all(
    data.customizationData.customizations.map(async (cust: any, cIdx: number) => {
      
      // 🔹 Process optionList images
      if (Array.isArray(cust.optionList)) {
        cust.optionList = await Promise.all(
          cust.optionList.map(async (opt: any, oIdx: number) => {
            const optThumb = findFile(`customizationData[customizations][${cIdx}][optionList][${oIdx}][thumbnail]`);
            const optPreview = findFile(`customizationData[customizations][${cIdx}][optionList][${oIdx}][preview_image]`);
            const optMainImages = findFiles(`customizationData[customizations][${cIdx}][optionList][${oIdx}][main_images][]`);
            const optEditMain = findFile(`customizationData[customizations][${cIdx}][optionList][${oIdx}][edit_main_image]`);
            const optEditPreview = findFile(`customizationData[customizations][${cIdx}][optionList][${oIdx}][edit_preview_image]`);

            // Parse crop data if sent
            if (opt.edit_main_image_data && typeof opt.edit_main_image_data === "string") {
              try { opt.edit_main_image_data = JSON.parse(opt.edit_main_image_data); } catch {}
            }
            if (opt.edit_preview_image_data && typeof opt.edit_preview_image_data === "string") {
              try { opt.edit_preview_image_data = JSON.parse(opt.edit_preview_image_data); } catch {}
            }

            return {
              ...opt,
              thumbnail: optThumb
                ? await saveProductFile(optThumb, `custom-thumb-${Date.now()}-${cIdx}-${oIdx}`)
                : opt.thumbnail || "",
              preview_image: optPreview
                ? await saveProductFile(optPreview, `custom-preview-${Date.now()}-${cIdx}-${oIdx}`)
                : opt.preview_image || "",
              main_images:
                optMainImages.length > 0
                  ? await Promise.all(
                      optMainImages.map((f, i) =>
                        saveProductFile(f, `custom-main-${Date.now()}-${cIdx}-${oIdx}-${i}`)
                      )
                    )
                  : opt.main_images || "",
              edit_main_image: optEditMain
                ? await saveProductFile(optEditMain, `custom-edit-main-${Date.now()}-${cIdx}-${oIdx}`)
                : (typeof opt.edit_main_image === "string" ? opt.edit_main_image : ""),
              edit_preview_image: optEditPreview
                ? await saveProductFile(optEditPreview, `custom-edit-preview-${Date.now()}-${cIdx}-${oIdx}`)
                : (typeof opt.edit_preview_image === "string" ? opt.edit_preview_image : ""),
            };
          })
        );
      }

      // 🔹 Handle GUIDE (for each customization)
      if (cust.guide) {
        const guideFile = findFile(`customizationData[customizations][${cIdx}][guide][guide_file]`);
        let guide_file = cust.guide.guide_file || "";
        let guide_type = cust.guide.guide_type || "";

        if (guideFile) {
          guide_file = await saveProductFile(guideFile, `guide-${Date.now()}-${cIdx}`);
          if (guideFile.mimetype.includes("pdf")) {
            guide_type = "pdf";
          } else if (guideFile.mimetype.includes("image")) {
            guide_type = "image";
          } else {
            guide_type = "document";
          }
        }

        cust.guide = {
          guide_name: cust.guide.guide_name || "",
          guide_description: cust.guide.guide_description || "",
          guide_file,
          guide_type,
        };
      }

      return cust;
    })
  );
}

//   PROCESS product_variants

let productVariants = [];

if (req.body.product_variants) {
  try {
    productVariants = JSON.parse(req.body.product_variants);
  } catch {
    productVariants = req.body.product_variants;
  }
}

if (Array.isArray(productVariants)) {
  productVariants = await Promise.all(
    productVariants.map(async (pv: any, pvIdx: number) => {

      if (!pv.variant_attributes) return pv;

      pv.variant_attributes = await Promise.all(
        pv.variant_attributes.map(async (attr: any, aIdx: number) => {

          const thumb = findFile(`product_variants[${pvIdx}][variant_attributes][${aIdx}][thumbnail]`);
          const preview = findFile(`product_variants[${pvIdx}][variant_attributes][${aIdx}][preview_image]`);
          const mainKey = `product_variants[${pvIdx}][variant_attributes][${aIdx}][main_images]`;
          const mainImgs = files.filter((f) => f.fieldname === mainKey || f.fieldname === `${mainKey}[]` || f.fieldname.startsWith(`${mainKey}[`));
          const editMain = findFile(`product_variants[${pvIdx}][variant_attributes][${aIdx}][edit_main_image]`);
          const editPreview = findFile(`product_variants[${pvIdx}][variant_attributes][${aIdx}][edit_preview_image]`);

          // Parse crop data
          if (attr.edit_main_image_data && typeof attr.edit_main_image_data === "string") {
            try { attr.edit_main_image_data = JSON.parse(attr.edit_main_image_data); } catch {}
          }
          if (attr.edit_preview_image_data && typeof attr.edit_preview_image_data === "string") {
            try { attr.edit_preview_image_data = JSON.parse(attr.edit_preview_image_data); } catch {}
          }

          // 🔹 Normalize old main_images (URLs)
// 1️⃣ Base from DB (CRITICAL)
const oldMainImages =
  isUpdate
    ? existingProducts?.product_variants?.[pvIdx]
        ?.variant_attributes?.[aIdx]?.main_images || []
    : [];

// clone so we don’t mutate DB object
const mergedMainImages: (string | null)[] = [...oldMainImages];

// 2️⃣ Apply body deletions
const bodyMainImages =
  req.body?.product_variants?.[pvIdx]?.variant_attributes?.[aIdx]?.main_images || {};

Object.keys(bodyMainImages).forEach((key) => {
  const idx = Number(key);
  if (Number.isNaN(idx)) return;

  if (bodyMainImages[key] === "") {
    mergedMainImages[idx] = null;
  }
});

// 3️⃣ Apply uploaded files (replace)
for (const file of mainImgs) {
  const match = file.fieldname.match(/\[main_images\]\[(\d+)\]/);
  if (!match) continue;

  const index = Number(match[1]);

  const uploadedUrl = await saveProductFile(
    file,
    `pv-main-${Date.now()}-${aIdx}-${index}`
  );

  mergedMainImages[index] = uploadedUrl;
}

          return {
            ...attr,

            thumbnail: thumb ? await saveProductFile(thumb, `pv-thumb-${Date.now()}`) : attr.thumbnail || "",
            preview_image: preview ? await saveProductFile(preview, `pv-preview-${Date.now()}`) : attr.preview_image || "",

            main_images: mergedMainImages,

            edit_main_image: editMain ? await saveProductFile(editMain, `pv-edit-main-${Date.now()}`) : attr.edit_main_image || "",
            edit_preview_image: editPreview ? await saveProductFile(editPreview, `pv-edit-preview-${Date.now()}`) : attr.edit_preview_image || ""
          };
        })
      );

      return pv;
    })
  );
}

data.product_variants = productVariants;



    // 🔹 Process nested combinationData images
if (Array.isArray(data.combinationData)) {
  data.combinationData = data.combinationData.map((variant: any) => {
    return {
      ...variant,
      combinations: Array.isArray(variant.combinations)
        ? variant.combinations.map((comb: any) => ({
            ...comb
          }))
        : []
    };
  });
}

    // 🔹 variations_data
    if (req.body.variations_data !== undefined) {
      let parsed = parseJSON(req.body.variations_data, []);

      data.variations_data = parsed.map((v: any)=> {
        if(v.variantId) {
            return {
                ...v,
                type: "global"
            };
        } else {
            return {
                ...v,
                type: "custom",
                customId: v.customId || new mongoose.Types.ObjectId().toString()
            };
        }
      });
    }
    
    // 🔹 tabs
    if (req.body.tabs !== undefined) {
      data.tabs = parseJSON(req.body.tabs, []);
    }

    // 🔹 remove undefined fields
    Object.keys(data).forEach((k) => {
      if (data[k] === undefined) delete data[k];
    });

    // 🔹 Single images
    if (findFile("thumbnail")) {
      data.thumbnail = await saveProductFile(
        findFile("thumbnail"),
        "thumbnail-" + Date.now()
      );
    } else if (req.body.thumbnail !== undefined) {
      data.thumbnail = req.body.thumbnail;
    }

    if (findFile("preview_image")) {
      data.preview_image = await saveProductFile(
        findFile("preview_image"),
        "preview-" + Date.now()
      );
    } else if (req.body.preview_image !== undefined) {
      data.preview_image = req.body.preview_image;
    }

    if (findFile("edit_preview_image")) {
      data.edit_preview_image = await saveProductFile(
        findFile("edit_preview_image"),
        "edit-preview-" + Date.now()
      );
    } else if (req.body.edit_preview_image !== undefined) {
      data.edit_preview_image = req.body.edit_preview_image;
    }

    // 🔹 Multiple images
const productMainImages = files.filter(
  (f) => f.fieldname === "main_images" || f.fieldname.startsWith("main_images[")
);

const oldProductMainImages =
  isUpdate
    ? (existingProducts as any)?.main_images || []
    : [];


const mergedProductMainImages: (string | null)[] = [...oldProductMainImages];

// deletions from body
const bodyProductImages = req.body?.main_images || {};
Object.keys(bodyProductImages).forEach((key) => {
  const idx = Number(key);
  if (Number.isNaN(idx)) return;

  if (bodyProductImages[key] === "") {
    mergedProductMainImages[idx] = null;
  }
});

// replacements from files
for (const file of productMainImages) {
  const match = file.fieldname.match(/\[(\d+)\]/);
  const index = match ? Number(match[1]) : mergedProductMainImages.length;

  const url = await saveProductFile(
    file,
    `main-${Date.now()}-${index}`
  );

  mergedProductMainImages[index] = url;
}

data.main_images = mergedProductMainImages;


    if (findFile("edit_main_image")) {
      data.edit_main_image = await saveProductFile(
        findFile("edit_main_image"),
        "edit-main-" + Date.now()
      );
    } else if (req.body.edit_main_image !== undefined) {
      data.edit_main_image = req.body.edit_main_image;
    }

    // 🔹 Create or Update
    if (req.body._id == "new") {
      const existingCombination = await Product.findOne({
        sku_code: req.body.sku_code,
      });

      if (existingCombination) {
        return resp
          .status(400)
          .json({ message: "SKU Code already exists.", success: false });
      }

      data.draft_status = false;
      const product = await Product.create(data);

      let cat = await CategoryModel.findById(req.body.category);
      if (cat && product && req.body.category) {
        const slug = slugify(
          `${cat.slug}-${String(product._id).padStart(4, "0")}`,
          {
            lower: true,
            remove: /[*+~.()'"!:@]/g,
          }
        );
        await Product.findByIdAndUpdate(product._id, { slug });
      }

      await PromotionalOfferModel.updateMany(
        { purchased_items: "Entire Catalog" },
        { $push: { product_id: product._id } }
      );

      return resp.status(200).json({
        message: "Product created successfully.",
        product,
        success: true,
      });
    } else {
      const existingCombination = await Product.findOne({
        sku_code: req.body.sku_code,
        _id: { $ne: req.body._id },
      });

      if (existingCombination) {
        return resp
          .status(400)
          .json({ message: "SKU Code already exists.", success: false });
      }

      const existingProduct = await Product.findById(req.body._id);

      if (!req.body.meta_title && req.body.product_title) {
         data.meta_title = stripHtml(req.body.product_title);
      } else if(!req.body.meta_title) {
        data.meta_title = existingProduct?.meta_title;
      }
      if (req.body.description) {
        const decodedDesc = req.body.description;
        data.meta_description = buildMetaDescription(decodedDesc);
      }

      if (Array.isArray(req.body.search_terms)) {
        data.meta_keywords = req.body.search_terms.map((k: string) => k.trim()).filter(Boolean);
      }

      // 🔹 Merge customizationData
if (req.body.customizationData !== undefined) {
  const newCustomData = data.customizationData || {};
  const oldCustomData = existingProduct?.customizationData || {};

  // Preserve previous optionList image URLs if not replaced
  if (Array.isArray(newCustomData.customizations) && Array.isArray(oldCustomData.customizations)) {
    newCustomData.customizations = newCustomData.customizations.map((newCust: any, cIdx: number) => {
      const oldCust = oldCustomData.customizations[cIdx] || {};
      if (Array.isArray(newCust.optionList) && Array.isArray(oldCust.optionList)) {
        newCust.optionList = newCust.optionList.map((newOpt: any, oIdx: number) => {
          const oldOpt = oldCust.optionList[oIdx] || {};
          return {
            ...oldOpt,
            ...newOpt,
            thumbnail: newOpt.thumbnail ?? oldOpt.thumbnail,
            preview_image: newOpt.preview_image ?? oldOpt.preview_image,
            main_images: newOpt.main_images ?? oldOpt.main_images,
            edit_main_image: newOpt.edit_main_image ?? oldOpt.edit_main_image,
            edit_preview_image: newOpt.edit_preview_image ?? oldOpt.edit_preview_image,
          };
        });
      }
      // Preserve old guide if not replaced
if (newCust.guide && oldCust.guide) {
  newCust.guide = {
    ...oldCust.guide,
    ...newCust.guide,
    guide_file: newCust.guide.guide_file ?? oldCust.guide.guide_file,
    guide_type: newCust.guide.guide_type ?? oldCust.guide.guide_type,
  };
}

      return newCust;
    });
  }

  data.customizationData = newCustomData;
}


      // 🔹 Merge combinationData
      if (req.body.combinationData !== undefined) {
      const newCombinationData = data.combinationData || [];

      if (
      existingProduct &&
      Array.isArray(existingProduct.combinationData) &&
      existingProduct.combinationData.length > 0
      ) {
      data.combinationData = newCombinationData.map((newComb: any, idx: number) => {
      const oldComb = existingProduct.combinationData[idx] || {};
      return {
        ...oldComb,
        ...newComb,
        combinations: Array.isArray(newComb.combinations)
          ? newComb.combinations.map((newSub: any, subIdx: number) => {
              const oldSub =
                (oldComb.combinations && oldComb.combinations[subIdx]) || {};
              return {
                ...oldSub,
                ...newSub,
                thumbnail: newSub.thumbnail ?? oldSub.thumbnail,
                preview_image: newSub.preview_image ?? oldSub.preview_image,
                main_images: newSub.main_images ?? oldSub.main_images,
                edit_main_image: newSub.edit_main_image ?? oldSub.edit_main_image,
                edit_preview_image:
                  newSub.edit_preview_image ?? oldSub.edit_preview_image,
              };
            })
          : oldComb.combinations || [],
        };
       });
      } else {
       data.combinationData = newCombinationData;
    }
    }

      // 🔹 Merge variations_data
     if (req.body.variations_data !== undefined) {
        let parsed = parseJSON(req.body.variations_data, []);

        data.variations_data = parsed.map((v: any)=> {
            if(v.variantId){
                return {
                    ...v,
                    type: "global"
                };
            }else {
                return {
                    ...v,
                    type: "custom",
                    customId: v.customId || new mongoose.Types.ObjectId().toString()
                };
            }
        });
    }


      // 🔹 Tabs
      if (req.body.tabs !== undefined) {
        let newTabs = parseJSON(req.body.tabs, []);
        newTabs = processTabs(newTabs);
        data.tabs = newTabs;
      }

      data.draft_status = false;

      Object.keys(data).forEach((k) => {
        if (data[k] === undefined) delete data[k];
      });

      await Product.updateOne({ _id: req.body._id }, { $set: {...data, combinationData: data.combinationData, },});

      return resp
        .status(200)
        .json({ message: "Product updated successfully." });
    }
  } catch (err) {
    console.log(err);
    return resp
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};

export const uploadProductVideo = async (req: Request, resp: Response) => {
    upload(req, resp, async function (err: any) {
        const deleteVidArr: string[] = req.body.deleteVidArr || [];
        let FeMessage = 'Video added successfully.'

        if (err) {
            console.log(err);
            return resp.status(400).json({ message: err.message, success: false });
        }
        const query = { _id: req.body.id };
        const product = await Product.findById(query)

        if (!product) {
            return resp.status(400).json({ message: 'Product Not Found.', success: false });
        }

        let videoFileNames: string[] = product?.videos?.length > 0 ? product?.videos : [];

        const videoFiles = req.files as Express.Multer.File[];
        if (videoFiles && videoFiles.length > 0) {
            const newVideos = videoFiles.map(file => file.filename);
            videoFileNames = [...videoFileNames, ...newVideos];
        }


        if (deleteVidArr && deleteVidArr.length > 0 && product.videos.length > 0) {
            const updatedArr = videoFileNames.filter((vid: string) => !deleteVidArr.includes(vid));
            videoFileNames = updatedArr
        }


        const updateData = { $set: { videos: videoFileNames } };

        await Product.updateOne(query, updateData);

        if (deleteVidArr.length > 0) {
            deleteVidArr.forEach((vid: string) => {
                const filePath = path.join(__dirname, '..', '..', '..', 'uploads', 'video', vid);
                deleteFile(filePath);
            });
            FeMessage = 'Vedios are successfully deleted'
        }

        return resp.status(200).json({ message: FeMessage, success: true });
    });
};

export const getAllActiveOccassion = async (req: CustomRequest, res: Response) => {
    try {
        const query: any = {
            status: true
        }

        const occasions = await OccassionModel.find(query);

        const baseurl = process.env.ASSET_URL + '/uploads/occassion/';

        const data = occasions.map(occasion => ({
            _id: occasion._id,
            title: occasion.title,
            image: baseurl + occasion.image,
            status: occasion.status,
            createdAt: occasion.createdAt,
            updatedAt: occasion.updatedAt
        }));

        return res.status(200).json({ message: "Occasion list fetched successfully.", data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getAllActiveCategory = async (req: CustomRequest, resp: Response) => {

    try {
        const userId = req.user._id;
        const subCatgory = await getAllParentCategory(null, userId);
        return resp.status(200).json({ message: "Category retrieved successfully.", subCatgory });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }


}

export const getCategoryFullDetails = async (req: CustomRequest, resp: Response) => {
    try {
        const { categoryIds } = req.body;

        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            return resp.status(400).json({
                success: false,
                message: "categoryIds[] is required."
            });
        }

        const results = await Promise.all(
            categoryIds.map(id => buildCategoryTree(id))
        );

        return resp.status(200).json({
            success: true,
            message: "Categories details retrieved successfully.",
            data: results.filter(r => r !== null)  
        });

    } catch (err) {
        console.log(err);
        return resp.status(500).json({ success: false, message: "Something went wrong." });
    }
};


export const getParentCategory = async (req: CustomRequest, resp: Response) => {
    try {
        const query: any = {
            // status: true
        }
        const except_me = req.query.except_me || false

        const categories = await Category.find(query);

        const data = await Promise.all(categories.map(async (category) => {
            if (!except_me) {
                let title = await buildCategoryPath(category._id);
                title = rtrim(title, ' > ');
                return {
                    _id: category._id,
                    title: title,
                };
            }
            else {
                const parents = await getAllParents(category._id)
                const title = parents.map(parent => parent.title).join(' > ');
                return {
                    _id: category._id,
                    title: rtrim(title, ">"),
                };
            }
        }));

        return resp.status(200).json({ message: "Category retrieved successfully.", data });

    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getAdminParentcategory = async (req: CustomRequest, resp: Response) => {
    try {
        const query: any = {
            // Uncomment below if you want to filter only active categories
            // status: true
        };

        const except_me = req.query.except_me === 'true'; // ensure boolean

        const categories = await AdminCategoryModel.find(query);

        const data = await Promise.all(categories.map(async (category) => {
            if (!except_me) {
                let title = await buildCategoryAdminPath(category._id);
                title = rtrim(title, ' > ');
                return {
                    _id: category._id,
                    title: title,
                };
            } else {
                const parents = await getAllAdminParents(category._id);
                const title = parents.map(parent => parent.title).join(' > ');
                return {
                    _id: category._id,
                    title: rtrim(title, '>'),
                };
            }
        }));

        return resp.status(200).json({
            message: "Category retrieved successfully.",
            data
        });

    } catch (err) {
        console.error(err);
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.'
        });
    }
};

export const getChildCategory = async (req: CustomRequest, resp: Response) => {
    try {
        const query: any = {
            status: true
        }

        const categories = await Category.find(query);
        const data = await Promise.all(categories.map(async (category) => {
            let title = await buildCategoryPath(category._id);
            title = rtrim(title, ' > ');
            const hasChildren = await Category.exists({
                parent_id: category._id,
            });
            if (!hasChildren) {
                return {
                    _id: category._id,
                    title: title,
                };
            } else {
                return null;
            }
        })).then((results) => results.filter((category) => category !== null));

        return resp.status(200).json({ message: "Category retrieved successfully.", data });

    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

function rtrim(str: any, charlist: any) {
    if (charlist === undefined) {
        charlist = ' \n\r\t\f\x0b';
    }
    const re = new RegExp("[" + charlist + "]+$", "g");
    return str.replace(re, "");
}

export const getProductList = async (req: CustomRequest, resp: Response) => {
  try {
    const baseUrl = process.env.ASSET_URL + "/uploads/product/";
    const parentBaseUrl = process.env.ASSET_URL + "/uploads/parent_product/";
    const category: any = req.query.category || null;
    const type = (req.query.type as string) || null; // active | inactive | all | draft | delete | sold-out | deleteByAdmin
    const designation_id = req.user?.designation_id;
    const user_id = req.user?._id;
    const featured = req.query.featured === "true";

    const pipeline: any[] = [];


    // ---------- Variations lookup ----------
pipeline.push(
  {
    $lookup: {
      from: "products",
      let: { parentId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$parent_id", "$$parentId"] },
                ...(type === "deleteByAdmin"
                  ? []
                  : [{ $eq: ["$isDeleted", false] }]),
                ...( ["active", "inactive", "sold-out"].includes(type || "")
                   ? [{ $eq: ["$draft_status", false] }]
                   : [] ),
                ...(designation_id == 3 ? [{ $eq: ["$vendor_id", user_id] }] : []),
                ...(featured ? [{ $eq: ["$featured", true] }] : []),
              ],
            },
          },
        },
        // ✅ NEW — lookup vendor info for each child variant
        {
          $lookup: {
            from: "vendordetails",
            localField: "vendor_id",
            foreignField: "user_id",
            as: "vendorInfo",
          },
        },
        {
          $addFields: {
            shop_name: {
              $ifNull: [{ $arrayElemAt: ["$vendorInfo.shop_name", 0] }, ""],
            },
          },
        },
      ],
      as: "productData",
    },
  },
  { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } }
);

if (type === "delete") {
  pipeline.push({
    $match: {
      isDeleted: true,
      deletedByAdmin: { $ne: true }
    }
  });
}


if (type === "deleteByAdmin") {
  pipeline.push({
    $match: {
      deletedByAdmin: true
    }
  });
}

    // // Exclude sold-out qty unless explicitly requested
    // if (type !== "sold-out" && type !== "all") {
    //   pipeline.push({
    //     $match: {
    //       $expr: {
    //         $gt: [
    //           {
    //             $convert: { input: "$productData.qty", to: "double", onError: 0, onNull: 0 },
    //           },
    //           0,
    //         ],
    //       },
    //     },
    //   });
    // }

if (!["draft", "delete", "deleteByAdmin"].includes(type || "")) {
  pipeline.push({
    $match: {
      "productData.draft_status": false,
    },
  });
}


    if (category) {
    pipeline.push({
    $match: {
      $or: [
        { "productData.category": new mongoose.Types.ObjectId(category) },
        { category: new mongoose.Types.ObjectId(category) },
      ],
      },
    });
    }

    pipeline.push(
      {
        $group: {
          _id: "$_id",
          product_title: { $first: "$product_title" },
          image: { $first: "$image" },
          seller_sku: { $first: "$seller_sku" },
          updatedAt: { $first: "$updatedAt" },
          createdAt: { $first: "$createdAt"},
          description: { $first: "$description" },
          vendor_id: { $first: "$vendor_id" },
          zoom: { $first: "$zoom" },
          productData: { $push: "$productData" },
          childCountData: { $first: "$childCountData" },
        },
      },
{
  $addFields: {
    type: "variations",
    image: {
      $cond: {
        if: { $ne: ["$image", null] },
        then: { $concat: [parentBaseUrl, "$image"] },
        else: null,
      },
    },
    productData: {
      $map: {
        input: "$productData",
        as: "pd",
        in: {
          $mergeObjects: [
            {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$$pd.draft_status", true] },
                    { $ne: [type, "draft"] },
                  ],
                },
                then: {},
                else: {
                  $mergeObjects: [
                    "$$pd",
                    {
                      image: {
                        $map: {
                          input: "$$pd.image",
                          as: "img",
                          in: { $concat: [baseUrl, "$$img"] },
                        },
                      },
                      parent_sku: "$seller_sku",
                      shop_name: { $ifNull: ["$$pd.shop_name", "$shop_name"] },
// ✅ Compute totalQty once and derive status simply
totalQty: {
  $add: [
    {
      $convert: {
        input: "$$pd.qty",
        to: "double",
        onError: 0,
        onNull: 0,
      },
    },
    {
      $sum: {
        $map: {
          input: {
            $reduce: {
              input: {
                $map: {
                  input: { $ifNull: ["$$pd.combinationData", []] },
                  as: "cd",
                  in: { $ifNull: ["$$cd.combinations", []] },
                },
              },
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
          as: "comb",
          in: {
            $convert: {
              input: "$$comb.qty",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
    },
  ],
},
productStatus: {
  $cond: [
    { $eq: ["$$pd.isDeleted", true] }, // 🧠 check this FIRST
    "delete",
    {
      $cond: [
        { $eq: ["$$pd.draft_status", true] },
        "draft",
        {
          $cond: [
            { $eq: ["$$pd.status", false] }, // only check inactive if not deleted or draft
            "inactive",
            {
              $cond: [
                {
                  $gt: [
                    {
                      $add: [
                        { $convert: { input: "$$pd.qty", to: "double", onError: 0, onNull: 0 } },
                        {
                          $sum: {
                            $map: {
                              input: {
                                $reduce: {
                                  input: {
                                    $map: {
                                      input: { $ifNull: ["$$pd.combinationData", []] },
                                      as: "cd",
                                      in: { $ifNull: ["$$cd.combinations", []] },
                                    },
                                  },
                                  initialValue: [],
                                  in: { $concatArrays: ["$$value", "$$this"] },
                                },
                              },
                              as: "comb",
                              in: {
                                $convert: {
                                  input: "$$comb.qty",
                                  to: "double",
                                  onError: 0,
                                  onNull: 0,
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
                    0,
                  ],
                },
                "active",
                "sold-out",
              ],
            },
          ],
        },
      ],
    },
  ],
},

                      inactiveReason: {
                        $cond: {
                          if: { $ne: ["$$pd.inactiveReason", ""] },
                          then: "$$pd.inactiveReason",
                          else: null,
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  },
}
);


    // ✅ Lookup total children count (without any filter)
pipeline.push({
  $lookup: {
    from: "products",
    let: { parentId: "$_id" },
    pipeline: [
      {
        $match: {
          $expr: { $eq: ["$parent_id", "$$parentId"] },
        },
      },
      {
        $count: "count",
      },
    ],
    as: "childCountData",
  },
});

pipeline.push({
  $addFields: {
    totalChildCount: {
      $ifNull: [{ $arrayElemAt: ["$childCountData.count", 0] }, 0],
    },
  },
});

pipeline.push({
  $lookup: {
    from: "vendordetails", // your collection name (auto-pluralized by Mongoose)
    localField: "vendor_id",
    foreignField: "user_id",
    as: "vendorInfo"
  }
});

pipeline.push({
  $addFields: {
    shop_name: { $ifNull: [{ $arrayElemAt: ["$vendorInfo.shop_name", 0] }, ""] }
  }
});


// ✅ After productStatus is computed, filter only for correct active/sold-out logic
if (type === "active") {
  pipeline.push({
    $match: {
      $expr: {
        $gt: [
          {
            $sum: {
              $map: {
                input: "$productData",
                as: "pd",
                in: {
                  $add: [
                    {
                      $convert: {
                        input: "$$pd.qty",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },
                    {
                      $sum: {
                        $map: {
                          input: {
                            $reduce: {
                              input: {
                                $map: {
                                  input: { $ifNull: ["$$pd.combinationData", []] },
                                  as: "cd",
                                  in: { $ifNull: ["$$cd.combinations", []] },
                                },
                              },
                              initialValue: [],
                              in: { $concatArrays: ["$$value", "$$this"] },
                            },
                          },
                          as: "comb",
                          in: {
                            $convert: {
                              input: "$$comb.qty",
                              to: "double",
                              onError: 0,
                              onNull: 0,
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          0,
        ],
      },
    },
  });
}


    if (designation_id == 3) {
      pipeline.push({ $match: { productData: { $ne: [] } } });
    }

   // ✅ Filter variants (child products) by their computed productStatus
if (type === "active") {
  pipeline.push({
    $addFields: {
      productData: {
        $filter: {
          input: "$productData",
          as: "pd",
          cond: { $eq: ["$$pd.productStatus", "active"] },
        },
      },
    },
  });
}

if (type === "sold-out") {
  pipeline.push({
    $addFields: {
      productData: {
        $filter: {
          input: "$productData",
          as: "pd",
          cond: { $eq: ["$$pd.productStatus", "sold-out"] },
        },
      },
    },
  });
}

// Filter by specific type (inactive / draft / delete)
if (type === "inactive") {
  pipeline.push({
    $addFields: {
      productData: {
        $filter: {
          input: "$productData",
          as: "pd",
          cond: {
            $and: [
              { $eq: ["$$pd.status", false] },
              { $eq: ["$$pd.isDeleted", false] } 
            ]
          },
        },
      },
    },
  });
}


if (type === "draft") {
  pipeline.push({
    $addFields: {
      productData: {
        $filter: {
          input: "$productData",
          as: "pd",
          cond: { $eq: ["$$pd.draft_status", true] },
        },
      },
    },
  });
}



if (type === "deleteByAdmin") {
  pipeline.push({
    $addFields: {
      productData: {
        $filter: {
          input: "$productData",
          as: "pd",
          cond: {
            $and: [
              { $eq: ["$$pd.isDeleted", true] },
              { $eq: ["$$pd.deletedByAdmin", true] }
            ]
          }
        },
      },
    },
  });
}


// ✅ Remove parents that have no child products left after filtering
if (["active", "sold-out", "draft", "inactive"].includes(type || "")) {
  pipeline.push({
    $match: { productData: { $ne: [] } },
  });
}


    // ---------- Union with simple products ----------
    const productMatch: any = {
      parent_id: null,
      ...(designation_id == 3 && { vendor_id: user_id }),
      ...(category && { category: new mongoose.Types.ObjectId(category) }),
      ...(featured && { featured: true }),
    };

    if (type !== "draft") productMatch.draft_status = false;
    if (!["delete", "deleteByAdmin"].includes(type || "")) productMatch.isDeleted = false;

    // type-based conditions
    if (type === "delete") productMatch.isDeleted = true;
    if (type === "deleteByAdmin") { productMatch.isDeleted = true;
    productMatch.deletedByAdmin = true;
    }
    if (type === "draft") productMatch.draft_status = true;
    if (type === "active") productMatch.status = true;
    if (type === "inactive") productMatch.status = false;


if (!["sold-out", "delete", "deleteByAdmin"].includes(type || "")) {
  productMatch.$expr = {
    $gt: [
      {
        $add: [
          { $convert: { input: "$qty", to: "double", onError: 0, onNull: 0 } },
          {
            $sum: {
              $map: {
                input: {
                  $ifNull: [
                    {
                      $reduce: {
                        input: {
                          $map: {
                            input: { $ifNull: ["$combinationData", []] },
                            as: "cd",
                            in: "$$cd.combinations",
                          },
                        },
                        initialValue: [],
                        in: { $concatArrays: ["$$value", "$$this"] },
                      },
                    },
                    [],
                  ],
                },
                as: "comb",
                in: {
                  $convert: { input: "$$comb.qty", to: "double", onError: 0, onNull: 0 },
                },
              },
            },
          },
        ],
      },
      0,
    ],
  };
}

    const unionPipeline: any[] = [{ $match: productMatch }];

if (type === "sold-out") {
  unionPipeline.push({
    $match: {
      $and: [
        { status: true },
        {
          $expr: {
            $and: [
              // main product qty = 0
              {
                $eq: [
                  { $convert: { input: "$qty", to: "double", onError: 0, onNull: 0 } },
                  0,
                ],
              },
              // check all combinationData.combinations.qty are also 0 or empty
              {
                $eq: [
                  {
              $sum: {
  $map: {
    input: {
      $ifNull: [
        {
          $reduce: {
            input: {
              $map: {
                input: { $ifNull: ["$combinationData", []] },
                as: "cd",
                in: "$$cd.combinations",
              },
            },
            initialValue: [],
            in: { $concatArrays: ["$$value", "$$this"] },
          },
        },
        [],
      ],
    },
    as: "comb",
    in: {
      $convert: { input: "$$comb.qty", to: "double", onError: 0, onNull: 0 },
    },
  },
},

                  },
                  0,
                ],
              },
            ],
          },
        },
      ],
    },
  });
}
    
// ✅ Lookup vendor info in union pipeline (for single products)
unionPipeline.push({
  $lookup: {
    from: "vendordetails",
    localField: "vendor_id",
    foreignField: "user_id",
    as: "vendorInfo"
  }
});
unionPipeline.push({
  $addFields: {
    shop_name: { $ifNull: [{ $arrayElemAt: ["$vendorInfo.shop_name", 0] }, ""] }
  }
});

    
    unionPipeline.push(
      {
        $addFields: {
          type: "product",
          image: {
            $map: {
              input: "$image",
              as: "img",
              in: { $concat: [baseUrl, "$$img"] },
            },
          },
          productStatus: {
            $switch: {
              branches: [
                { case: { $eq: [type, "sold-out"] }, then: "sold-out" },
                { case: { $eq: [type, "delete"] }, then: "delete" },
                { case: { $eq: [type, "draft"] }, then: "draft" },
                { case: { $eq: [type, "deleteByAdmin"] }, then: "removed" },
                {
                  case: { $in: [type, ["active", "inactive", "all"]] },
                  then: {
                    $cond: {
                      if: { $eq: ["$status", true] },
                      then: "active",
                      else: "inactive"
                    },
                  },
                },
              ],
              default: "unknown",
            },
          },
          inactiveReason: {
            $cond: {
               if: { $ne: ["$inactiveReason", ""] },
               then: "$inactiveReason",
               else: null
            }
          },
        },
      },
      {
        $project: {
          _id: 1,
          product_title: 1,
          shop_name: 1,
          zoom: 1,
          bestseller: 1,
          popular_gifts: 1,
          featured: 1,
          category: 1,
          sku_code: 1,
          qty: 1,
          price: 1,
          sale_price: 1,
          sale_start_date: 1,
          sale_end_date: 1,
          description: 1,
          vendor_id: 1,
          image: 1,
          type: 1,
          product_bedge: 1,
          updatedAt: 1,
          createdAt: 1,
          isDeleted: 1,
          deletedByAdmin: 1,
          draft_status: 1,
          sort_order: 1,
          status: {
            $cond: {
              if: { $eq: ["$draft_status", true] },
              then: {
                $cond: {
                  if: { $eq: [type, "draft"] },
                  then: "draft",
                  else: "$$REMOVE",
                },
              },
              else: "$productStatus",
            },
          },
        },
      }
    );

    pipeline.push({ $unionWith: { coll: "products", pipeline: unionPipeline } });

if (type === "delete") {
  pipeline.push({
    $match: {
      $and: [
        { deletedByAdmin: { $ne: true } },
        {
          $or: [
            { "productData.deletedByAdmin": { $ne: true } },
            { "productData": [ null ] },
            { "productData": { $eq: [null] } }
          ],
        },
      ],
    },
  });
}


    if (featured) {
      pipeline.push({
        $match: {
          $or: [
            { featured: true },
            { "productData.featured": true }
          ]
        }
      });
    }

    // -------------------- SEARCH FILTER --------------------
if (req.query.search && String(req.query.search).trim() !== "") {
  const search = String(req.query.search).trim();

  const isObjectId = mongoose.Types.ObjectId.isValid(search);

  const searchMatch: any = {
    $or: [
      ...(isObjectId
        ? [
            { _id: new mongoose.Types.ObjectId(search) }, // parent or product id
            { "productData._id": new mongoose.Types.ObjectId(search) }, // variant id
          ]
        : []),
      { sku_code: { $regex: search, $options: "i" } }, // simple product SKU
      { "productData.sku_code": { $regex: search, $options: "i" } }, // variant SKU
      { product_title: { $regex: search, $options: "i" } }, // parent title
      { "productData.product_title": { $regex: search, $options: "i" } }, // variant title
    ],
  };

  pipeline.push({ $match: searchMatch });
}


// -------------------- SORT FIX --------------------
let sortObj: Record<string, number> = { createdAt: -1 };

if (req.query.sort) {
  try {
    sortObj = JSON.parse(req.query.sort as string);
  } catch (err) {
    console.warn("Invalid sort JSON — using default sort.");
  }
}

const key = Object.keys(sortObj)[0] || "createdAt";
const direction = Object.values(sortObj)[0] || -1;

if (["sku_code", "sku"].includes(key)) {
  pipeline.push({
    $addFields: {
      sortField: {
        $ifNull: [
          { $arrayElemAt: ["$productData.sku_code", 0] }, // variant SKU
          "$sku_code", // normal product SKU
        ],
      },
    },
  });
} else if (["product_title", "title"].includes(key)) {
  pipeline.push({
    $addFields: {
      sortField: { $ifNull: ["$product_title", ""] },
    },
  });
} else if (["createdAt", "updatedAt"].includes(key)) {
  pipeline.push({
    $addFields: {
      sortField: `$${key}`,
    },
  });
} else {
  pipeline.push({
    $addFields: {
      sortField: `$${key}`,
    },
  });
}

pipeline.push({
  $sort: { sortField: direction },
});

    const combinedData = await ParentProduct.aggregate(pipeline);

    return resp.status(200).json({
      message: "Product retrieved successfully.",
      data: combinedData,
    });
  } catch (error) {
    console.error(error);
    return resp.status(500).json({
      message: "Something went wrong. Please try again.",
      error,
    });
  }
};



export const productChangeStatus = async (req: CustomRequest, resp: Response) => {
    try {
        const query = { _id: { $in: req.body._id } };

        const updateFields: any = {};
        if (req.body.status !== undefined) updateFields.status = req.body.status;
        if (req.body.delete !== undefined) updateFields.isDeleted = req.body.delete;
        if (req.body.draft !== undefined) updateFields.draft_status = req.body.draft;

        if (req.body.status === true) {
            updateFields.status = true
            updateFields.draft_status = false
            updateFields.isDeleted = false
        } else {
            updateFields.status = false
        }

        const updateData = { $set: updateFields };

        await Product.updateMany(query, updateData);

        return resp.status(200).json({ message: 'Status changed successfully.' });

    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};


export const changeProductSortOrder = async (req: CustomRequest, resp: Response) => {
    try {
        const query = { _id: req.body._id }
        const updateData = { $set: { sort_order: req.body.sort_order } }
        await Product.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Sort order changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }
}

export const changeBestSellerProduct = async (req: CustomRequest, resp: Response) => {
    try {
        const query = { _id: req.body._id }
        const updateData = { $set: { bestseller: req.body.bestseller } }
        await Product.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Bestseller status changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }
}

export const changePopularGiftProduct = async (req: CustomRequest, resp: Response) => {
    try {
        const query = { _id: req.body._id }
        const updateData = { $set: { popular_gifts: req.body.popular_gifts } }
        await Product.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Popular Gift status changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }
}


export const deleteProduct = async (req: Request, resp: Response) => {
  try {
    const id = req.params.id;

    const parentProduct = await ParentProduct.findById(id);

    if (parentProduct) {
      await ParentProduct.updateOne({ _id: id }, { $set: { isDeleted: true } });

      await Product.updateMany(
        { parent_id: id },
        { $set: { parent_id: null } }
      );

      return resp.status(200).json({
        message: 'Parent product deleted successfully and all child products detached.',
      });
    }
    const product = await Product.findById(id);

    if (product) {
      await Product.updateOne({ _id: id }, { $set: { isDeleted: true, parent_id: null } });

      return resp.status(200).json({
        message: 'Product deleted successfully and detached from parent.',
      });
    }

    return resp.status(404).json({ message: 'Product not found.' });

  } catch (error) {
    console.error('Delete error:', error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const deletedByAdmin = async (req: Request, resp: Response) => {
  try {
    const { id } = req.params;

    const parent = await ParentProduct.findById(id);
    if (parent) {
      await ParentProduct.updateOne(
        { _id: id },
        { $set: { deletedByAdmin: true } }
      );
      return resp
        .status(200)
        .json({ message: 'Parent product marked as deleted by Admin.' });
    }

    const product = await Product.findById(id);
    if (product) {
      await Product.updateOne(
        { _id: id },
        { $set: { deletedByAdmin: true } }
      );
      return resp
        .status(200)
        .json({ message: 'Product marked as deleted by Admin.' });
    }

    return resp.status(404).json({ message: 'Product or parent not found.' });
  } catch (error) {
    console.error('Error marking deletedByAdmin:', error);
    return resp
      .status(500)
      .json({ message: 'Something went wrong. Please try again.' });
  }
};

export const editProduct = async (req: CustomRequest, resp: Response) => {
  try {
    const id = req.params.id;

    const pipeline: any = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category_data",
        },
      },
      { $unwind: { path: "$category_data", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "variants",
          localField: "variant_id",
          foreignField: "_id",
          as: "variant_data",
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand_id",
          foreignField: "_id",
          as: "brand_data",
        },
      },
      { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "variantattributes",
          localField: "variant_attribute_id",
          foreignField: "_id",
          as: "variant_attr_data",
        },
      },
    ];

    const product = await Product.aggregate(pipeline);
    const productData = product[0];

    if (!productData) {
      return resp
        .status(200)
        .json({ message: "No Product Found", productData: {} });
    }

    // --- Normalize combinationData ---
    if (typeof productData.combinationData === "string") {
    try {
    productData.combinationData = JSON.parse(productData.combinationData);
    } catch {
    productData.combinationData = [];
   }
   }
   if (
   !Array.isArray(productData.combinationData) &&
   typeof productData.combinationData !== "object"
   ) {
     productData.combinationData = [];
   }

    // --- Normalize variations_data ---
    if (Array.isArray(productData.variations_data)) {
      productData.variations_data = productData.variations_data.map(
        (item: any) => {
          if (typeof item === "string") {
            try {
              return JSON.parse(item);
            } catch {
              return item;
            }
          }
          return item;
        }
      );
    } else if (typeof productData.variations_data === "string") {
      try {
        productData.variations_data = JSON.parse(productData.variations_data);
      } catch {
        productData.variations_data = [];
      }
    }

    // --- Normalize form_values ---
    if (typeof productData.form_values === "string") {
      try {
        productData.form_values = JSON.parse(productData.form_values);
      } catch {
        productData.form_values = {};
      }
    }

    // --- Normalize dynamicFields ---
   if (typeof productData.dynamicFields === "string") {
     try {
     productData.dynamicFields = JSON.parse(productData.dynamicFields);
    } catch {
     productData.dynamicFields = {};
    }
    } else if (!productData.dynamicFields || typeof productData.dynamicFields !== "object") {
    productData.dynamicFields = {};
    }

    // --- Normalize tabs ---
    if (Array.isArray(productData.tabs)) {
      productData.tabs = productData.tabs.map((item: any) => {
        if (typeof item === "string") {
          try {
            return JSON.parse(item);
          } catch {
            return item;
          }
        }
        return item;
      });
    } else if (typeof productData.tabs === "string") {
      try {
        productData.tabs = JSON.parse(productData.tabs);
      } catch {
        productData.tabs = [];
      }
    }

    // --- Variant + Attribute restructuring ---
    const variantArr = productData.variant_data.map((data: any) => ({
      variant_name: data.variant_name,
    }));

    const variantAttrArr = productData.variant_attr_data.map((data: any) => ({
      _id: data._id,
      attribute_value: data.attribute_value,
      thumbnail: data.thumbnail,
      preview_image: data.preview_image,
      main_images: data.main_images || [],
    }));

    productData.variant_data = variantArr;
    productData.variant_attr_data = variantAttrArr;

    // --- Map combinationData with attributes ---
    if (productData?.combinationData) {
      productData.combinationData = productData.combinationData.map(
        (combination: any) => ({
          ...combination,
          combinations: (combination.combinations || []).map((comb: any) => {
            const matchedAttr = variantAttrArr.find(
              (a: any) =>
                Array.isArray(comb.combIds) &&
                comb.combIds.includes(String(a._id))
            );

            return {
              ...comb,
              thumbnail:
                comb.thumbnail !== undefined && comb.thumbnail !== null
                  ? comb.thumbnail
                  : matchedAttr?.thumbnail || "",
              preview_image:
                comb.preview_image !== undefined && comb.preview_image !== null
                  ? comb.preview_image
                  : matchedAttr?.preview_image || "",
              edit_preview_image: comb.edit_preview_image && comb.edit_preview_image !== "{}" ? comb.edit_preview_image
               : comb.edit_preview_image || "",
              main_images:
                comb.main_images !== undefined && comb.main_images !== null
                  ? comb.main_images
                  : matchedAttr?.main_images || [],
              edit_main_image: comb.edit_main_image && comb.edit_main_image !== "{}" ? comb.edit_main_image
                : comb.edit_main_image || "",
            };
          }),
        })
      );
    }

    // --- Format dates ---
    productData.sale_start_date = resp.locals
      .currentdate(productData.sale_start_date)
      .tz("Asia/Kolkata")
      .format("DD-MM-YYYY HH:mm:ss");
    productData.sale_end_date = resp.locals
      .currentdate(productData.sale_end_date)
      .tz("Asia/Kolkata")
      .format("DD-MM-YYYY HH:mm:ss");
    productData.restock_date = resp.locals
      .currentdate(productData.restock_date)
      .tz("Asia/Kolkata")
      .format("DD-MM-YYYY HH:mm:ss");
    productData.launch_date = resp.locals
      .currentdate(productData.launch_date)
      .tz("Asia/Kolkata")
      .format("DD-MM-YYYY HH:mm:ss");
    productData.release_date = resp.locals
      .currentdate(productData.release_date)
      .tz("Asia/Kolkata")
      .format("DD-MM-YYYY HH:mm:ss");

    // --- Base URLs ---
    productData.imageBaseUrl =
      productData.image.length > 0
        ? process.env.ASSET_URL + "/uploads/product/"
        : "";
    productData.videoBaseUrl =
      productData.videos.length > 0
        ? process.env.ASSET_URL + "/uploads/video/"
        : "";

    // --- Decode text fields ---
    productData.bullet_points = Buffer.from(
      productData.bullet_points,
      "base64"
    ).toString("utf-8");
    productData.description = Buffer.from(
      productData.description,
      "base64"
    ).toString("utf-8");

    // --- Add variant-deleted error info ---
    if (
    productData.inactiveReason === "variant_deleted" &&
    productData.deletedVariantIds?.length
    ) {
    productData.variations_data = productData.variations_data.map((v: any) => ({
    ...v,
    error: productData.deletedVariantIds.includes(v.variantId)
      ? "❌ This variant has been deleted from original source."
      : null,
    }));
  }

    return resp.status(200).json({
      message: "Product retrieved successfully.",
      productData,
    });
  } catch (error) {
    return resp
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};


export const getActivePolicy = async (req: CustomRequest, resp: Response) => {

    try {

        const { vendor_id } = req.body

        const policies = await PolicyModel.find({ vendor_id: vendor_id, status: true }).sort({ _id: -1 });

        return resp.status(200).json({ message: "Policy retrieved successfully.", policies});

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}

export const changeTopRatedStatus = async (req: CustomRequest, resp: Response) => {
    try {

        const query = { _id: req.body.id }
        const updateData = { $set: { top_rated: req.body.status } }
        await Product.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Top rated Status changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }
}

export const changeFeaturedStatus = async (req: CustomRequest, resp: Response) => {

    try {

        const query = { _id: req.body._id }
        const updateData = { $set: { featured: req.body.featured } }
        await Product.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Featured Status changed successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

}
export const getVariantDataByCategoryId = async (req: Request, resp: Response) => {

    try {

        const category_id = req.params.id;

        const category = await Category.findOne({ _id: category_id });

        if (!category) {
            return resp.status(404).send('Category not found');
        }

        const variant = await Variant.find({ _id: { $in: category.variant_id }, status: true });
        const parent: any[] = [];

        for (const data of variant) {

            interface FinalData {
                id: Types.ObjectId;
                variant_name: string;
                variant_attribute?: any[];
            }
            let final: FinalData = {
                id: data._id,
                variant_name: data.variant_name
            };

            const variantAttr = await VariantAttribute.find({ variant: data._id, status: true });

            if (variantAttr) {
                final['variant_attribute'] = variantAttr;
            }

            parent.push(final);
        }
        return resp.status(200).json({ message: "Variant fetched According to Product .", parent });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getAttributeListByCategoryId = async (req: Request, resp: Response) => {
    try {
        const category_id = req.params.id;
        const category = await Category.findOne({_id: category_id});
        
        if(!category) {
           return resp.status(404).send('Category not found'); 
        }
        
        if(!category.attributeList_id || category.attributeList_id.length === 0) {
            return resp.status(404).json({ message: "No attribute lists assigned to this category." });
        }
        
        const attributeLists = await AttributesList.find({
            _id: {$in: category.attributeList_id },
            status: true,
        });
        return resp.status(200).json({ message: "Attribute lists fetched successfully." , attributeLists, });
    } catch (error) {
      console.error("Error fetching attribute list:", error);
      return resp.status(500).json({ message: "Something went wrong. Please try again."});
    }
}

export const addVariantProduct = async (req: CustomRequest, resp: Response) => {
    try {

        const parentProduct = await Product.findOne({ _id: req.body.product_id });

        if (!parentProduct) {
            return resp.status(400).json({ message: 'Product not found.' });
        }

        const data: any = {
            variant_id: req.body.variant_id,
            product_id: req.body.product_id,
            variant_attribute_id: req.body.variant_attribute_id,
            discount_type: req.body.discount_type,
            discount_amount: req.body.discount_amount,
            delivery: req.body.delivery,
            delivery_amount: req.body.delivery_amount,
            stock: req.body.stock,
            sale_price: req.body.sale_price,
            return_policy: req.body.return_policy,
            meta_title: req.body.meta_title,
            meta_keywords: req.body.meta_keywords,
            meta_description: req.body.meta_description
        }

        if (req.body._id == 'new') {

            const variantProduct = await VariantProduct.create(data);
            const slug = slugify(`${parentProduct.product_title}-${String(variantProduct.id).padStart(4, '0')}`, {
                lower: true,   // Convert the slug to lowercase
                remove: /[*+~.()'"!:@]/g,  // Remove special characters
            });
            variantProduct.slug = slug;
            await variantProduct.save();

            return resp.status(200).json({ message: 'Variant Product created successfully.' });


        } else {

            const query = { _id: req.body._id }
            const updateData = { $set: data }

            await VariantProduct.updateOne(query, updateData);

            return resp.status(200).json({ message: 'Variant Product updated successfully.' });
        }

    } catch (err) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const uploadImages = async (req: Request, resp: Response) => {
    uploadImage(req, resp, async (err: any) => {
        const deleteImgArr: string[] = req.body.deleteImgArr || [];
        let FeMessage = 'Images added successfully.';

        if (err) {
            return resp.status(400).json({ message: err.message, success: false });
        }

        const product_id = req.body._id;
        if (!product_id) {
            return resp.status(400).json({ message: 'Product ID is required.', success: false });
        }

        const product = await Product.findById(product_id);
        if (!product) {
            return resp.status(400).json({ message: 'Product Not Found.', success: false });
        }

        const files = req.files as Express.Multer.File[];
        let data: string[] = product?.image?.length > 0 ? product?.image : [];

        const convertedFiles: string[] = [];
        if (files) {
            const uploadFolderPath = path.join('uploads', 'product');

            try {
                await fs.promises.mkdir(uploadFolderPath, { recursive: true });
            } catch (mkdirError) {
                console.error('Error creating upload folder:', mkdirError);
                return resp.status(500).json({ message: 'Failed to create upload folder.', success: false });
            }

            for (const file of files) {
                const webpFileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp';
                const webpFilePath = path.join(uploadFolderPath, webpFileName);
                try {
                    await sharp(file.buffer).webp({ quality: 80 }).toFile(webpFilePath);
                    convertedFiles.push(webpFileName);
                } catch (error) {
                    return resp.status(400).json({ message: 'Error converting image to webp', success: false });
                }
            }
        }

        if (deleteImgArr && deleteImgArr.length > 0 && product.image.length > 0) {
            data = data.filter((img: string) => !deleteImgArr.includes(img));
        }

        let finalData: any[] = [];
        const filesData: Array<{ name: string; sortOrder: number }> = [];
        const newImgSortArray: string[] = req.body.newImgSortArray || [];
        const existimageSortOrder = req.body.existimageSortOrder || [];
        const altText = req.body.altText || [];
        const parsedArray = existimageSortOrder.map((item: any) => JSON.parse(item));

        if (convertedFiles) {
            convertedFiles.forEach((file, index) => {
                filesData.push({
                    name: file,
                    sortOrder: parseInt(newImgSortArray[index]) || 0
                });
            });
        }

        finalData = [...parsedArray, ...filesData];
        finalData = finalData.sort((a, b) => a.sortOrder - b.sortOrder).map(item => item.name);
        console.log(finalData)
        try {
            const query = { _id: product_id };
            const updateData = { $set: { image: finalData, altText: altText } };

            await Product.updateOne(query, updateData);

            return resp.status(200).json({ message: FeMessage, success: true });
        } catch (error) {
            return resp.status(500).json({ message: 'Failed to add images.', success: false });
        }
    });
};


export const uploadDescImages = async (req: Request, resp: Response) => {


    uploadImage(req, resp, async (err: any) => {

        if (err) {
            return resp.status(400).json({ message: err.message, success: false });
        }
        const product_id = req.body._id

        if (!product_id) {
            return resp.status(400).json({ message: 'Product ID is required.', success: false });
        }

        const files = req.files as Express.Multer.File[];

        const data: string[] = [];

        if (files) {
            files.forEach(file => {
                data.push(file.filename);
            });
        }
        if (files) {
            const uploadFolderPath = path.join('uploads', 'product');

            try {
                await fs.promises.mkdir(uploadFolderPath, { recursive: true });
            } catch (mkdirError) {
                return resp.status(500).json({ message: 'Failed to create upload folder.', success: false });
            }

            for (const file of files) {
                const webpFileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp';
                const webpFilePath = path.join(uploadFolderPath, webpFileName);
                try {
                    await sharp(file.buffer).webp({ quality: 80 }).toFile(webpFilePath);
                    data.push(webpFileName);
                } catch (error) {
                    return resp.status(400).json({ message: 'Error converting image to webp', success: false });
                }
            }
        }
        try {
            const query = { _id: product_id }
            const updateData = { $set: { description_image: data } }

            await Product.updateOne(query, updateData);
            return resp.status(200).json({ message: 'Images added successfully.', success: true });
        } catch (error) {
            return resp.status(500).json({ message: 'Failed to add images.', success: false });
        }
    });
};

export const getVariantProductList = async (req: Request, resp: Response) => {
    try {
        const product_id = req.params.id;

        const variantProduct = await VariantProduct.findOne({ product_id: product_id }).populate(['variant_id', 'variant_attribute_id']);

        return resp.status(200).json({ message: "Variant Product List fetched successfully.", variantProduct })

    } catch (error) {
        console.log(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const variantProductChangeStatus = async (req: CustomRequest, resp: Response) => {
    try {
        const query = { _id: req.body.id }
        const updateData = { $set: { status: req.body.status } }
        await VariantProduct.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Status changed successfully.' });

    } catch (error) {
        console.log(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const deleteVariantProduct = async (req: CustomRequest, resp: Response) => {

    try {

        const id = req.params.id;

        const variantProduct = await VariantProduct.findOne({ _id: id });

        if (variantProduct) {

            await VariantProduct.deleteOne({ _id: variantProduct._id });

            return resp.status(200).json({ message: 'Variant Product deleted successfully.' });

        } else {
            return resp.status(400).json({ message: 'Variant Product not found.' });

        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }
};

export const editVariantProductByID = async (req: CustomRequest, resp: Response) => {

    try {

        const id = req.params.id;

        const variantProduct = await VariantProduct.findOne({ _id: id });

        if (variantProduct) {

            await VariantProduct.deleteOne({ _id: variantProduct._id });

            return resp.status(200).json({ message: 'Variant Product deleted successfully.' });

        } else {
            return resp.status(400).json({ message: 'Variant Product not found.' });

        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }
};

export const salesList = async (req: CustomRequest, resp: Response) => {
    try {
        const order_status = req.params.type;
        const startDate = req.query.startDate
            ? resp.locals.currentdate(req.query.startDate).startOf("day").toDate()
            : null;
        const endDate = req.query.endDate
            ? resp.locals.currentdate(req.query.endDate).endOf("day").toDate()
            : null;
        const sort = (req.query.sort as string | undefined) || undefined;
        const delivery = (req.query.delivery as string | undefined) || undefined;
        const search = (req.query.search as string | undefined) || undefined;

        const _idSort = sort === "newest" ? -1 : 1;

        let delivery_status: string[] = [];
        if (delivery === "all")
            delivery_status = ["No tracking", "Pre transit", "In transit", "Delivered", "Cancelled"];
        else if (delivery === "intransit") delivery_status = ["In transit"];
        else if (delivery === "delivered") delivery_status = ["Delivered"];
        else if (delivery === "notracking") delivery_status = ["No tracking"];

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const pipe: any[] = [];

        pipe.push(
            {
                $match: {
                    ...(startDate && endDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {}),
                },
            },
            {
                $lookup: {
                    from: "salesdetails",
                    localField: "_id",
                    foreignField: "sale_id",
                    as: "saleDetaildata",
                    pipeline: [
                        {
                            $match: {
                                ...(order_status ? { order_status } : {}),
                            },
                        },

                        // ---------- Product / Variant lookups (as-is) ----------
                        {
                            $lookup: {
                                from: "products",
                                localField: "product_id",
                                foreignField: "_id",
                                as: "productMain",
                            },
                        },
                        { $unwind: { path: "$productMain", preserveNullAndEmptyArrays: true } },
                        {
                            $lookup: {
                                from: "variants",
                                localField: "variant_id",
                                foreignField: "_id",
                                as: "variantData",
                            },
                        },
                        {
                            $lookup: {
                                from: "variantattributes",
                                localField: "variant_attribute_id",
                                foreignField: "_id",
                                as: "variantAttributeData",
                            },
                        },

                        // ---------- ⭐ NEW: Buyer Notes join per sale detail ----------
                        {
                            $lookup: {
                                from: "buyernotes", // <<-- collection name (update if different)
                                let: {
                                    bn_user_id: "$user_id",
                                    bn_vendor_id: "$vendor_id",
                                    bn_product_id: "$product_id",
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$user_id", "$$bn_user_id"] },
                                                    { $eq: ["$vendor_id", "$$bn_vendor_id"] },
                                                    { $eq: ["$product_id", "$$bn_product_id"] },
                                                ],
                                            },
                                        },
                                    },
                                    { $sort: { updatedAt: -1, createdAt: -1 } },
                                    { $limit: 1 },
                                    {
                                        $project: {
                                            _id: 0,
                                            // support either field name
                                            buyer_note: { $ifNull: ["$buyer_note", "$note"] },
                                        },
                                    },
                                ],
                                as: "buyerNoteData",
                            },
                        },
                        {
                            $addFields: {
                                buyer_note: {
                                    $ifNull: [{ $arrayElemAt: ["$buyerNoteData.buyer_note", 0] }, null],
                                },
                            },
                        },
                        { $project: { buyerNoteData: 0 } }
                        // ---------- ⭐ END Buyer Notes ----------
                    ],
                },
            },
            { $match: { saleDetaildata: { $ne: [] } } },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "userData",
                },
            },
            { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "vendordetails",
                    localField: "saleDetaildata.vendor_id",
                    foreignField: "user_id",
                    as: "vendordata",
                },
            },
            { $unwind: { path: "$vendordata", preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    ...(delivery_status.length ? { "saleDetaildata.delivery_status": { $in: delivery_status } } : {}),
                    ...(search
                        ? {
                            $or: [
                                { order_id: { $regex: search, $options: "i" } },
                                { "userData.name": { $regex: search, $options: "i" } },
                                { "userData.email": { $regex: search, $options: "i" } },
                                { "vendordata.shop_name": { $regex: search, $options: "i" } },
                                { "userData._id": { $regex: search, $options: "i" } },
                                { "saleDetaildata.productMain.product_title": { $regex: search, $options: "i" } },
                                { "userData.id_number": { $regex: search, $options: "i" } },
                                { "userData.address_line1": { $regex: search, $options: "i" } },
                                { "userData.address_line2": { $regex: search, $options: "i" } },
                            ],
                        }
                        : {}),
                },
            },
            {
                $project: {
                    _id: 1,
                    order_id: 1,
                    subtotal: 1,
                    payment_status: 1,
                    country: 1,
                    state: 1,
                    city: 1,
                    mobile: 1,
                    address_line1: 1,
                    address_line2: 1,
                    pincode: 1,
                    userName: "$userData.name",
                    userEmail: "$userData.email",
                    user_idnumer: "$userData._id",
                    user_image: {
                        $concat: [process.env.ASSET_URL + "/uploads/profileImage/", "$userData.image"],
                    },
                    saleDetaildata: 1, // contains buyer_note inside each element now
                    createdAt: 1,
                    shop_name: "$vendordata.shop_name",
                },
            },
            { $sort: { _id: _idSort } },
            { $skip: skip },
            { $limit: limit }
        );

        const countPipe = [...pipe];
        const skipIndex = countPipe.findIndex((p) => Object.keys(p).includes("$skip"));
        if (skipIndex !== -1) countPipe.splice(skipIndex, 2);
        countPipe.push({ $count: "count" });

        const countResult = await Sales.aggregate(countPipe);
        const totalCount = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        const rawData = await Sales.aggregate(pipe);

        // cache for stars
        const starCache = new Map<string, { greenStar: boolean; redStar: boolean }>();
        await Promise.all(
            rawData.map(async (sale: any) => {
                try {
                    const userIdAny = sale.user_idnumer || sale.user_id || req.user?._id;
                    const userObjId = typeof userIdAny === "string" ? new mongoose.Types.ObjectId(userIdAny) : userIdAny;
                    if (!userObjId) {
                        sale.redStar = false;
                        sale.greenStar = false;
                        return;
                    }
                    const cacheKey = String(userObjId);
                    let stat = starCache.get(cacheKey);
                    if (!stat) {
                        const vendorAgg = await SalesDetailsModel.aggregate([
                            { $match: { user_id: userObjId } },
                            { $group: { _id: "$vendor_id", cnt: { $sum: 1 } } },
                        ]);
                        const distinctVendors = vendorAgg.length;
                        const hasMultiFromSameVendor = vendorAgg.some((v) => (v.cnt || 0) > 1);
                        stat = { greenStar: distinctVendors > 1, redStar: hasMultiFromSameVendor };
                        starCache.set(cacheKey, stat);
                    }
                    sale.greenStar = stat.greenStar;
                    sale.redStar = stat.redStar;
                } catch {
                    sale.redStar = false;
                    sale.greenStar = false;
                }
            })
        );

        const grouped = _.groupBy(rawData, (item: any) =>
            resp.locals.currentdate(item.createdAt).format("YYYY-MM-DD")
        );
        const formattedSales = Object.entries(grouped).map(([date, sales]) => ({ date, sales }));
        const base_url = process.env.ASSET_URL + "/uploads/product/";

        return resp.status(200).json({
            message: "Sales list fetched successfully.",
            sales: formattedSales,
            pagination: {
                totalCount,
                totalPages,
                page,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            base_url,
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

export const salesDetail = async (req: Request, resp: Response) => {

    try {

        const type = req.params.type;
        const id = req.body.id;

        let orderStatus: any;
        if (type == 'failed') {

            orderStatus = '0';

        } else if (type == 'pending') {

            orderStatus = '1';

        } else if (type == 'rejected') {

            orderStatus = '7';

        } else if (type == 'confirmed') {

            orderStatus = '2';

        } else if (type == 'shipped') {

            orderStatus = '10';

        } else if (type == 'delivered') {

            orderStatus = '9';

        } else if (type == 'return') {

            orderStatus = '8';

        } else if (type == 'cancelled') {

            orderStatus = '4';

        } else {

            return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
        }
        const pipeline = [
            {
                '$match': {
                    '_id': new mongoose.Types.ObjectId(id)
                }
            }, {
                '$lookup': {
                    'from': 'salesdetails',
                    'localField': '_id',
                    'foreignField': 'sale_id',
                    'as': 'salesData',
                    'pipeline': [
                        {
                            '$match': {
                                'order_status': orderStatus
                            }
                        }
                    ]
                }
            },
            {
                '$match': {
                    'salesData': { '$not': { '$size': 0 } }
                }
            }
        ];

        const sales = await Sales.aggregate(pipeline);
        return resp.status(200).json({ message: "Sales details fetched successfully.", sales })

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }
};

export const updateOrderStatus = async (req: Request, resp: Response) => {

    try {

        const _id = req.body._id;
        const order_status = req.body.order_status;

        const salesDetail = await SalesDetailsModel.find({ sale_id: { $in: _id } });
        if (!salesDetail) {
            return resp.status(400).json({ message: 'Sales not found.' });
        }

        // for (let i = 0; i < salesDetail.length; i++) {
        //     await SalesDetailsModel.updateOne({ _id: salesDetail[i]._id }, { order_status: order_status });
        // }

        for (let i = 0; i < salesDetail.length; i++) {
            const saleItem = salesDetail[i];
            if (order_status === 'cancelled') {
                const product = await ProductModel.findById(saleItem.product_id);
                if (product) {
                    const updatedQty = Number(product.qty) + Number(saleItem.qty);
                    product.qty = updatedQty.toString();
                    await product.save();
                }
            }
            await SalesDetailsModel.updateOne({ _id: saleItem._id }, { order_status: order_status });
        }
        return resp.status(200).json({ message: 'Order status updated successfully.' });

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

};

export const orderHistory = async (req: CustomRequest, resp: Response) => {

    try {

        const pipeline: any = [
            {
                '$match': {
                    '_id': new mongoose.Types.ObjectId(req.body._id)
                }
            },
            {
                '$lookup': {
                    'from': 'salesdetails',
                    'localField': '_id',
                    'foreignField': 'sale_id',
                    'as': 'saleDetaildata',
                    'pipeline': [
                        {
                            '$lookup': {
                                'from': "variants",
                                'localField': "variant_id",
                                'foreignField': "_id",
                                'as': "variantData",
                            },
                        },
                        {
                            '$lookup': {
                                'from': "variantattributes",
                                'localField': "variant_attribute_id",
                                'foreignField': "_id",
                                'as': "variantAttributeData",
                            },
                        },
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'user_id',
                    'foreignField': '_id',
                    'as': 'userData'
                }
            },
            {
                '$unwind': {
                    'path': '$userData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$project': {
                    '_id': 1,
                    'order_id': 1,
                    'subtotal': 1,
                    'payment_status': 1,
                    'state': 1,
                    'city': 1,
                    'coupon_discount': 1,
                    'net_amount': 1,
                    'address_line1': 1,
                    'address_line2': 1,
                    'pincode': 1,
                    'userName': '$userData.name',
                    'userEmail': '$userData.email',
                    'saleDetaildata': 1,
                    'createdAt': 1
                }
            },
        ];

        console.log(pipeline);

        const data = await Sales.aggregate(pipeline);
        const orderHistory = data[0];
        const base_url = process.env.ASSET_URL + '/uploads/product/';

        return resp.status(200).json({ message: "Order history fetched successfully.", orderHistory, base_url })
    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

};

export const getOrderInvoice = async (req: Request, resp: Response) => {

    try {

        const pipeline: any = [
            {
                '$match': {
                    '_id': {
                        '$in': req.body._id.map((id: string) => new mongoose.Types.ObjectId(id))
                    }
                }
            },
            {
                '$lookup': {
                    'from': 'salesdetails',
                    'localField': '_id',
                    'foreignField': 'sale_id',
                    'as': 'saleDetaildata',
                    'pipeline': [
                        {
                            '$lookup': {
                                'from': "variants",
                                'localField': "variant_id",
                                'foreignField': "_id",
                                'as': "variantData",
                            },
                        },
                        {
                            '$lookup': {
                                'from': "variantattributes",
                                'localField': "variant_attribute_id",
                                'foreignField': "_id",
                                'as': "variantAttributeData",
                            },
                        },
                    ]
                }
            },
            {
                '$unwind': {
                    'path': '$saleDetaildata',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'user_id',
                    'foreignField': '_id',
                    'as': 'userData'
                }
            },
            {
                '$unwind': {
                    'path': '$userData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$group': {
                    '_id': {
                        '_id': '$_id',
                        'vendor_id': '$saleDetaildata.productData.vendor_id'
                    },
                    'order_id': { '$first': '$order_id' },
                    'subtotal': { '$first': '$subtotal' },
                    'payment_status': { '$first': '$payment_status' },
                    'name': { '$first': '$name' },
                    'mobile': { '$first': '$mobile' },
                    'email': { '$first': '$email' },
                    'phone_code': { '$first': '$phone_code' },
                    'country': { '$first': '$country' },
                    'state': { '$first': '$state' },
                    'city': { '$first': '$city' },
                    'address_line1': { '$first': '$address_line1' },
                    'address_line2': { '$first': '$address_line2' },
                    'pincode': { '$first': '$pincode' },
                    'userName': { '$first': '$userData.name' },
                    'userEmail': { '$first': '$userData.email' },
                    'createdAt': { '$first': '$createdAt' },
                    'saleDetails': {
                        '$push': '$saleDetaildata' // Group all sale details for this vendor
                    }
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'order_id': 1,
                    'subtotal': 1,
                    'payment_status': 1,
                    'name': 1,
                    'mobile': 1,
                    'phone_code': 1,
                    'email': 1,
                    'country': 1,
                    'state': 1,
                    'city': 1,
                    'address_line1': 1,
                    'address_line2': 1,
                    'pincode': 1,
                    'userName': '$userData.name',
                    'userEmail': '$userData.email',
                    'saleDetails': 1,
                    'createdAt': 1
                }
            },
        ];

        const data = await Sales.aggregate(pipeline);
        // const orderHistory = data[0];
        const base_url = process.env.ASSET_URL + '/uploads/product/';

        return resp.status(200).json({ message: "Invoice fetched successfully.", data, base_url })
    } catch (error) {
        console.log(error)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

};

export const orderReady = async (req: Request, resp: Response) => {

    try {

        const type = req.body.type;
        const sale_id = req.body.sale_id;
        const suborder_id = req.body.suborder_id;
        let orderStatus: any;

        const pipeline = [
            {
                '$match': {
                    '_id': new mongoose.Types.ObjectId(sale_id),
                }
            }, {
                '$lookup': {
                    'from': 'salesdetails',
                    'localField': '_id',
                    'foreignField': 'sale_id',
                    'as': 'salesdetails',
                }
            }, {
                '$unwind': {
                    'path': '$salesdetails',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$match': {
                    'salesdetails.sub_order_id': suborder_id,
                    'salesdetails.is_approve': '1',
                }
            }
        ]

        const result = await Sales.aggregate(pipeline);
        const sales = result[0];

        if (sales) {

            if (type == 'shipped') {

                orderStatus = '10';
                const query = { sale_id: sales._id, sub_order_id: suborder_id }
                const updateData = { $set: { shipped_date: resp.locals.currentdate().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), shipping_couriername: req.body.shipping_couriername, shipping_couriernumber: req.body.shipping_couriernumber, is_approve: "1", order_status: orderStatus } }
                await SalesDetailsModel.updateMany(query, updateData);

            } else if (type == 'delivered') {

                orderStatus = '9';
                const query = { sale_id: sales._id, sub_order_id: suborder_id, order_status: '10' }
                const updateData = { $set: { delivered_date: resp.locals.currentdate().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), is_approve: "1", order_status: orderStatus } }
                await SalesDetailsModel.updateMany(query, updateData);
            }

            return resp.status(200).json({ message: "Order " + type + " Successfully." })

        } else {
            return resp.status(400).json({ message: "Sales not found." })
        }

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }
};

export const returnApprove = async (req: Request, resp: Response) => {
    try {

        const return_amount = req.body.return_amount;
        const id = req.body.id;
        const admin_returnremark = req.body.admin_returnremark;

        const query = { _id: id }
        const updateData = { $set: { order_status: '8', return_amount: return_amount, return_status: 'Approved', admin_returnremark: admin_returnremark } }
        await SalesDetailsModel.updateOne(query, updateData);

        resp.status(200).json({ message: 'Return request approved successfully.' })

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

};

export const returnReject = async (req: Request, resp: Response) => {

    try {

        const admin_returnremark = req.body.admin_returnremark;
        const id = req.body.id;

        const query = { _id: id }
        const updateData = { $set: { return_status: 'Rejected', admin_returnremark: admin_returnremark } }
        await SalesDetailsModel.updateOne(query, updateData);

        resp.status(200).json({ message: 'Return rejected successfully..' })

    } catch (error) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

    }

};

export const changePassword = async (req: CustomRequest, resp: Response) => {

    try {
        const user = await User.findOne({ _id: req.user._id });

        if (!user) {

            return resp.status(400).json({ message: 'Invalid User.' });

        }

        bcrypt.compare(req.body.old_password, user.password, async (err, result) => {
            if (err) {

                return resp.status(400).json({ message: err });

            } else if (result) {
                if (req.body.new_password === req.body.confirm_password) {
                    const hashedPassword = await bcrypt.hash(req.body.new_password, 10);
                    user.password = hashedPassword;
                    user.multipleTokens = [];
                    await user.save();
                    return resp.status(200).json({ message: 'Password Changed Successfully' });

                } else {
                    return resp.status(400).json({ message: "New password and Confirm Password doesn't match" });
                }

            } else {
                return resp.status(400).json({ message: 'Invalid Old password' });
            }
        });


    } catch (error) {
        console.log(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const updateProfile = async (req: CustomRequest, resp: Response) => {

    try {
        const user = await User.findOne({ _id: req.user._id, designation_id: { $in: ['2', '3'] } });

        if (!user) {

            return resp.status(400).json({ message: 'Invalid User.' });

        }

        user.name = req.body.name;
        user.email = req.body.email;
        user.mobile = req.body.mobile;
        await user.save();

        return resp.status(200).json({ message: 'Profile updated successfully.' });

    } catch (error) {
        console.log(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const logout = async (req: CustomRequest, resp: Response) => {

    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        await User.updateOne(
            { _id: req.user._id },
            { $pull: { multipleTokens: { token } } }
        );

        resp.json({ message: "Logged out successfully" });
    } catch (error) {
        console.log(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getProfile = async (req: CustomRequest, resp: Response) => {

    try {
        const userId = req.user._id;
        const pipeline: any = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "countrydata",
                },
            },
            {
                $unwind: {
                    path: "$countrydata",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "states",
                    localField: "state_id",
                    foreignField: "_id",
                    as: "statedata",
                },
            },
            {
                $unwind: {
                    path: "$statedata",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "citydata",
                },
            },
            {
                $unwind: {
                    path: "$citydata",
                    preserveNullAndEmptyArrays: true,
                },
            },
        ]
        const users = await User.aggregate(pipeline);
        const user = users[0];

        if (!user) {

            return resp.status(400).json({ message: 'Invalid User.' });

        }

        const image = user.image || "";
        let baseUrl = '';

        if (image.includes("https")) {
            baseUrl = image
        } else if (image) {
            baseUrl = process.env.ASSET_URL + '/uploads/vendor/' + image;
        }

        let shopImageUrl = process.env.ASSET_URL + '/uploads/shop-icon/';

        let data = {
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            slug: '',
            shopname: '',
            shopImage: '',
            image: baseUrl,
            shop_icon: '',
            country: user.countrydata || null,
            state: user.statedata || null,
            city: user.citydata || null,
            vendor: {},
            particularVendorSales: 0,
            shopImageUrl: shopImageUrl
        }

        if (req.user.designation_id === 3) {
            const vendorData = await VendorModel.findOne({ user_id: req.user._id });
            if (vendorData) {
                data.vendor = vendorData;
            }
        }

        let particularVendorSales = await SalesDetailsModel.find({ vendor_id: req.user._id, payment_status: '1' }).countDocuments();

        data.particularVendorSales = particularVendorSales;

        return resp.status(200).json({ message: 'Profile fetched successfully.', data });

    } catch (error) {
        console.log(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getCategoryList = async (req: CustomRequest, resp: Response) => {

    try {
        const userId = req.user._id;
        const subCatgory = await getAllParentCategory(null, userId);
        return resp.status(200).json({ message: "Category retrieved successfully.", subCatgory });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }

}

export const addOccasion = async (req: CustomRequest, res: Response) => {
    try {
        const { title, id } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required." });
        }

        let occasion;
        if (id === 'new') {
            occasion = await OccassionModel.create({ title });
            return res.status(200).json({ message: "Occasion added successfully.", occasion });
        } else {
            occasion = await OccassionModel.findByIdAndUpdate(
                id,
                { title },
                { new: true, runValidators: true }
            );
            if (!occasion) {
                return res.status(404).json({ message: "Occasion not found." });
            }
            return res.status(200).json({ message: "Occasion updated successfully.", occasion });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};


export const uploadOccassionImage = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.body._id) {
            return res.status(400).json({ message: 'Occasion id is required' });
        }
        if (!req.hasOwnProperty('file')) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const categoryImageFile = req.file;
        let fileName = "";
        if (categoryImageFile && !(categoryImageFile.mimetype.startsWith('image/'))) {
            return res.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }

        if (categoryImageFile) {
            fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const uploadDir = path.join('uploads', 'occassion');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, fileName);
            await convertToWebP(categoryImageFile.buffer, filePath);
        }
        const query = { _id: req.body._id };
        const updateData = { $set: { image: fileName } };
        await OccassionModel.updateOne(query, updateData);

        return res.status(200).json({ message: 'Image added successfully.' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};


export const occassionList = async (req: CustomRequest, res: Response) => {
    try {
        const query: any = {
        }

        const occasions = await OccassionModel.find(query);

        const baseurl = process.env.ASSET_URL + `/uploads/occassion/`;

        const data = occasions.map(occasion => ({
            _id: occasion._id,
            title: occasion.title,
            image: baseurl + occasion.image,
            status: occasion.status,
            createdAt: occasion.createdAt,
            updatedAt: occasion.updatedAt
        }));

        return res.status(200).json({ message: "Occasion list fetched successfully.", data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};
export const deleteOccassion = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params
        const occassion = await OccassionModel.deleteOne({ _id: id })
        return res.status(200).json({ message: "Occassion deleted successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const occassionChangeStatus = async (req: CustomRequest, res: Response) => {
    try {
        const { id, status } = req.body
        const occassion = await OccassionModel.updateOne({ _id: id }, { $set: { status } })
        return res.status(200).json({ message: "Occassion status changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getOccasion = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params;

        const query: any = {
            _id: id
        }

        const occasion = await OccassionModel.findOne(query);

        if (!occasion) {
            return res.status(404).json({ message: "Occasion not found." });
        }

        const baseurl = `${process.env.ASSET_URL}/uploads/occassion/`;

        const data = {
            _id: occasion._id,
            title: occasion.title,
            image: baseurl + occasion.image,
            status: occasion.status,
            createdAt: occasion.updatedAt,
            updatedAt: occasion.updatedAt
        };

        return res.status(200).json({ message: "Occasion fetched successfully.", data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addParentProduct = async (req: CustomRequest, resp: Response) => {
    try {
        req.body.product_variation = parseJSON(req.body.product_variation, []);
        req.body.product_variation = parseJSON(req.body.product_variation, []);
        req.body.variant_id = parseJSON(req.body.variant_id, []);
        req.body.variant_attribute_id = parseJSON(req.body.variant_attribute_id, []);
        req.body.sku = parseJSON(req.body.sku, []);
        req.body.zoom = parseJSON(req.body.zoom, {});
        const finalVariants = await extractVariantImages(req);

        let vendorId = null;
        if(req.user.designation_id === 3) {
            vendorId = req.user._id;
        } else {
            if(!req.body.vendor_id) {
                return resp.status(400).json({
                message: "vendor_id is required when admin adds a parent product",
                success: false
                });
            }
            vendorId = req.body.vendor_id;
        }
        const data: any = {
            product_title: req.body.product_title,
            description: req.body.description,
            variant_id: req.body.variant_id,
            variant_attribute_id: req.body.variant_attribute_id,
            sku: req.body.sku,
            seller_sku: req.body.seller_sku,
            zoom: req.body.zoom,
            product_variants: finalVariants,
        };

        data.vendor_id = vendorId;
        
       
        if (req.body.sub_category) {
            data.sub_category = req.body.sub_category;
        }
        const combinations = parseJSON(req.body.combinations, []);
 
 
        if (req.body._id === 'new') {
 
            const parent_product = await ParentProduct.create(data);
            const sku: any = [];
 
            for (const combData of combinations) {
                const existingCombination = await CombinationProduct.findOne({ sku_code: combData.sku_code });
                // const checkExistProductCombination = await Product.findOne({ sku_code: combData.sku_code, isCombination: true });
 
                // if (checkExistProductCombination) {
                //     return resp.status(400).json({ message: `You can't create combination of ${checkExistProductCombination.sku_code} this sku code.`, success: false });
                // }
 
                if (existingCombination) {
                    return resp.status(400).json({ message: `SKU Code ${existingCombination.sku_code} already exists.`, success: false });
                }
            }
 
            for (const combData of combinations) {
                const product = await Product.findOne({ sku_code: combData.sku_code });
                const combinationProductData = {
                    product_id: parent_product._id,
                    combination_id: combData.comb,
                    sku_code: combData.sku_code,
                    sku_product_id: product?._id,
                    seller_sku: combData.seller_sku
                };
                await CombinationProduct.create(combinationProductData);
                sku.push(combData.sku_code);
 
                await Product.findByIdAndUpdate(combData.product_id,{ $set: {price: combData.price,sale_price: combData.sale_price,qty: combData.qty,sale_start_date: combData.sale_start_date,sale_end_date: combData.sale_end_date,seller_sku: combData.seller_sku,},$addToSet: { variant_id: { $each: req.body.variant_id },variant_attribute_id: { $each: req.body.variant_attribute_id },},},{ new: true }
             );
 
            }
            const query = { sku_code: { $in: sku } };
            const updateData = { $set: { parent_id: parent_product._id } };
            await Product.updateMany(query, updateData);
 
            return resp.status(200).json({ message: 'Parent Product created successfully.', parent_product, success: true });
        } else {
 
            for (const combData of combinations) {
                const existingCombination = await CombinationProduct.findOne({ sku_code: combData.sku_code, product_id: { $ne: req.body._id } });
                // const checkExistProductCombination = await Product.findOne({ sku_code: combData.sku_code, isCombination: true });
 
                // if (checkExistProductCombination) {
                //     return resp.status(400).json({ message: `You can't create combination of ${checkExistProductCombination.sku_code} this sku code.`, success: false });
                // }
 
                if (existingCombination) {
                    return resp.status(400).json({ message: `SKU Code ${existingCombination.sku_code} already exists.`, success: false });
                }
            }
            const sku: any = [];
            for (const combData of combinations) {
                const query = { sku_code: combData.sku_code, product_id: req.body._id };
                const product = await Product.findOne({ sku_code: combData.sku_code });
                const updateData = {
                    combination_id: combData.comb,
                    sku_code: combData.sku_code,
                    sku_product_id: product?._id,
                };
                await CombinationProduct.updateOne(query, { $set: updateData }, { upsert: true });
                sku.push(combData.sku_code);
 
                await Product.findByIdAndUpdate(combData.product_id,{$set: {price: combData.price,sale_price: combData.sale_price,qty: combData.qty,sale_start_date: combData.sale_start_date,sale_end_date: combData.sale_end_date,seller_sku: combData.seller_sku,},$addToSet: {variant_id: { $each: req.body.variant_id || [] },variant_attribute_id: { $each: req.body.variant_attribute_id || [] },},},{ new: true });
 
            }
 
            const query = { _id: req.body._id };
            const updateData = { $set: data };
            await ParentProduct.updateOne(query, updateData);
 
            const parent_product = await ParentProduct.findOne({ _id: req.body._id });
            if (!parent_product) {
            return resp.status(404).json({
             message: "Parent product not found while updating.",
            success: false,
            });
            }
            const query1 = { sku_code: { $in: sku } };
            const updateData1 = { $set: { parent_id: parent_product?._id } };
            await Product.updateMany(query1, updateData1);
            await Product.updateMany(
            { parent_id: parent_product._id, sku_code: { $nin: sku } },
            { $set: { parent_id: null } }
        );
 
            return resp.status(200).json({ message: 'Parent Product updated successfully.', parent_product, success: true });
        }
    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addParentProductImage = async (req: CustomRequest, resp: Response) => {
    try {
        if (!req.body._id) {
            return resp.status(400).json({ message: 'Parent Product id is required' });
        }

        if (!req.hasOwnProperty('file')) {
            return resp.status(400).json({ message: 'Image is required' });
        }

        const categoryImageFile = req.file;
        let fileName = "";

        if (categoryImageFile && !(categoryImageFile.mimetype.startsWith('image/'))) {
            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }

        if (categoryImageFile) {
            fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const uploadDir = path.join('uploads', 'parent_product');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const destinationPath = path.join(uploadDir, fileName);
            await convertToWebP(categoryImageFile.buffer, destinationPath);
        }
        const query = { _id: req.body._id };
        const updateData = { $set: { image: fileName } };
        await ParentProduct.updateOne(query, updateData);
        return resp.status(200).json({ message: 'Image added successfully.' });
    } catch (err) {
        console.error('Error in addParentProductImage:', err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};


export const updateProductByField = async (req: CustomRequest, resp: Response) => {

    try {

        if (!req.body._id) {
            return resp.status(400).json({ message: 'Please Provide Id' });
        }

        const update = await ProductModel.findByIdAndUpdate(req.body._id, req.body, { new: true })
        return resp.status(200).json({ message: 'Updated successfully.' });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }


}

export const fetchParentProduct = async (req: CustomRequest, resp: Response) => {

    try {
        let id = req.params.id
        const baseurl = process.env.ASSET_URL + '/uploads/parent_product/';
        if (!id) {
            return resp.status(400).json({ message: 'Please Provide Id' });
        }

        const data = await ParentProduct.findById(id)
            .populate(['variant_id', 'variant_attribute_id'])

        if (!data) {
            return resp.status(400).json({ message: 'Product Not Found.' });
        }

        return resp.status(200).json({ message: 'Fetched successfully.', data, base_url: baseurl });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }


}

export const addBlog = async (req: CustomRequest, res: Response) => {
    try {
        const { title, _id, description, short_description, tag_id, author_name } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required." });
        }

        let blog;
        if (_id === 'new') {
            const existingBlog = await BlogModel.findOne({ title });
            if (existingBlog) {
                return res.status(400).json({ message: 'Blog already exists.' });
            }
            blog = await BlogModel.create({ title: title, description: description, short_description: short_description, tag_id: tag_id, author_name: author_name });

            const slug = slugify(`${title}`, {
                lower: true,
                remove: /[*+~.()'"!:@]/g,
            });
            blog.slug = slug;
            await blog.save();
            return res.status(200).json({ message: "Blog added successfully.", blog });
        } else {

            const existingCombination = await BlogModel.findOne({ title: title, _id: { $ne: req.body._id } });

            if (existingCombination) {
                return res.status(400).json({ message: 'Blog already exists.', success: false });
            }

            blog = await BlogModel.findByIdAndUpdate(
                _id,
                { title: title, description: description, short_description: short_description, tag_id: tag_id, author_name: author_name },
                { new: true, runValidators: true }
            );
            if (!blog) {
                return res.status(404).json({ message: "Blog not found." });
            }
            return res.status(200).json({ message: "Blog updated successfully.", blog });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const uploadBlogImage = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.body._id) {
            return res.status(400).json({ message: 'Blog id is required' });
        }

        if (!req.hasOwnProperty('file')) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const categoryImageFile = req.file;
        let fileName = "";
        if (categoryImageFile && !(categoryImageFile.mimetype.startsWith('image/'))) {
            return res.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }

        if (categoryImageFile) {
            fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const uploadDir = path.join('uploads', 'blog');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const destinationPath = path.join(uploadDir, fileName);
            await convertToWebP(categoryImageFile.buffer, destinationPath);
        }
        const query = { _id: req.body._id };
        const updateData = { $set: { image: fileName } };
        await BlogModel.updateOne(query, updateData);
        return res.status(200).json({ message: 'Image added successfully.' });
    } catch (err) {
        console.error('Error in uploadBlogImage:', err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const blogList = async (req: CustomRequest, res: Response) => {
    try {

        const blogs = await BlogModel.find()
            .populate({
                path: 'tag_id',
                match: { status: true }
            }).sort({ _id: -1 });


        const baseurl = process.env.ASSET_URL + `/uploads/blog/`;

        const data = blogs.map(blog => ({
            _id: blog._id,
            tag_id: blog.tag_id,
            title: blog.title,
            author_name: blog.author_name,
            description: blog.description,
            short_description: blog.short_description,
            image: baseurl + blog.image,
            status: blog.status,
            featured: blog.featured,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt
        }));

        return res.status(200).json({ message: "Blog list fetched successfully.", data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const deleteBlog = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params
        const blog = await BlogModel.deleteOne({ _id: id })
        return res.status(200).json({ message: "Blog deleted successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const blogChangeStatus = async (req: CustomRequest, res: Response) => {
    try {
        const { id, status } = req.body
        const blog = await BlogModel.updateOne({ _id: id }, { $set: { status } })
        return res.status(200).json({ message: "Blog status changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const blogFeaturedStatus = async (req: CustomRequest, res: Response) => {
    try {
        const { id, featured } = req.body
        const blog = await BlogModel.updateOne({ _id: id }, { $set: { featured } })
        return res.status(200).json({ message: "Blog featured status changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getBlog = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params;

        const query = {
            _id: id
        }

        const blog = await BlogModel.findOne(query).populate({
            path: 'tag_id',
            match: { status: true }
        });


        if (!blog) {
            return res.status(404).json({ message: "Blog not found." });
        }

        const baseurl = `${process.env.ASSET_URL}/uploads/blog/`;

        const data = {
            _id: blog._id,
            tag_id: blog.tag_id,
            author_name: blog.author_name,
            title: blog.title,
            description: blog.description,
            short_description: blog.short_description,
            image: baseurl + blog.image,
            status: blog.status,
            featured: blog.featured,
            createdAt: blog.updatedAt,
            updatedAt: blog.updatedAt
        };

        return res.status(200).json({ message: "Blog fetched successfully.", data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addBlogTag = async (req: CustomRequest, res: Response) => {
    try {
        const { title, _id } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required." });
        }

        let blogTag;
        if (_id === 'new') {
            const existingBlog = await BlogTagModel.findOne({ title });
            if (existingBlog) {
                return res.status(400).json({ message: 'Blog tag already exists.' });
            }
            blogTag = await BlogTagModel.create({ title: title });

            const slug = slugify(`${title}-`, {
                lower: true,
                remove: /[*+~.()'"!:@]/g,
            });
            blogTag.slug = slug;
            await blogTag.save();
            return res.status(200).json({ message: "Blog Tag added successfully.", blogTag });
        } else {

            const existingCombination = await BlogTagModel.findOne({ title: title, _id: { $ne: req.body._id } });

            if (existingCombination) {
                return res.status(400).json({ message: 'Blog tag already exists.', success: false });
            }

            blogTag = await BlogTagModel.findByIdAndUpdate(
                _id,
                { title: title },
                { new: true, runValidators: true }
            );
            if (!blogTag) {
                return res.status(404).json({ message: "Blog tag not found." });
            }
            return res.status(200).json({ message: "Blog tag updated successfully.", blogTag });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const tagBlogList = async (req: CustomRequest, res: Response) => {
    try {

        const tagBlogs = await BlogTagModel.find().sort({ _id: -1 });

        const data = tagBlogs.map(blog => ({
            _id: blog._id,
            title: blog.title,
            slug: blog.slug,
            status: blog.status,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt
        }));

        return res.status(200).json({ message: "Blog tag list fetched successfully.", data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const tagBlogChangeStatus = async (req: CustomRequest, res: Response) => {
    try {
        const { id, status } = req.body
        const blog = await BlogTagModel.updateOne({ _id: id }, { $set: { status } })
        return res.status(200).json({ message: "Blog tag status changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getTagBlog = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params;

        const query: any = {
            _id: id
        }

        const blog = await BlogTagModel.findOne(query);

        if (!blog) {
            return res.status(404).json({ message: "Blog tag not found." });
        }

        const data = {
            _id: blog._id,
            title: blog.title,
            status: blog.status,
            slug: blog.slug,
            createdAt: blog.updatedAt,
            updatedAt: blog.updatedAt
        };

        return res.status(200).json({ message: "Blog tag fetched successfully.", data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getActiveTags = async (req: CustomRequest, res: Response) => {
    try {
        const data = await BlogTagModel.find({ status: true }).sort({ _id: -1 });
        return res.status(200).json({ message: "Blog tag fetched successfully.", data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getAllSearchTerms = async (req: CustomRequest, res: Response) => {
    try {
        const data = await Product.find().select('search_terms');

        const uniqueSearchTerms = [
            ...new Set(data.flatMap((item: any) => item.search_terms))
        ];

        return res.status(200).json({ message: "Search terms fetched successfully.", data: uniqueSearchTerms });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};


export const addAdminCategory = async (req: CustomRequest, res: Response) => {
    try {
        const { title, _id, tag, parent_id, productsMatch, equalTo, value, restricted_keywords } = req.body;

        let parentId: any;

        if (parent_id == '') {
            parentId = null;
        } else {
            parentId = parent_id
        }

        if (!title) {
            return res.status(400).json({ message: "Title is required." });
        }

        let adminCategory;
        if (_id === 'new') {
            const existingAdminCategory = await AdminCategoryModel.findOne({ title });
            if (existingAdminCategory) {
                return res.status(400).json({ message: 'Category already exists.' });
            }
            adminCategory = await AdminCategoryModel.create({ title: title, tag: tag, parent_id: parentId, productsMatch: productsMatch, equalTo: equalTo, value: value, restricted_keywords: restricted_keywords, isAutomatic: req.body.isAutomatic, categoryScope: req.body.categoryScope, selectedCategories: req.body.selectedCategories || [], conditionType: req.body.conditionType, conditions: req.body.conditions || [] });

            const slug = slugify(`${title}`, {
                lower: true,
                remove: /[*+~.()'"!:@]/g,
            });
            adminCategory.slug = slug;
            await adminCategory.save();
            return res.status(200).json({ message: "Category added successfully.", adminCategory });
        } else {

            const existingCombination = await AdminCategoryModel.findOne({ title: title, _id: { $ne: req.body._id }, parent_id: parentId });

            if (existingCombination) {
                return res.status(400).json({ message: 'Category already exists.', success: false });
            }
            
            const slug = slugify(`${title}`, {
                lower: true,
                remove: /[*+~.()'"!:@]/g,
            });

            adminCategory = await AdminCategoryModel.findByIdAndUpdate(
                _id,
                { title: title, slug: slug, restricted_keywords: restricted_keywords, tag: tag, parent_id: parentId, productsMatch: productsMatch, equalTo: equalTo, value: value, isAutomatic: req.body.isAutomatic, categoryScope: req.body.categoryScope, selectedCategories: req.body.selectedCategories || [], conditionType: req.body.conditionType, conditions: req.body.conditions || [] },
                { new: true, runValidators: true }
            );
            if (!adminCategory) {
                return res.status(404).json({ message: "Category not found." });
            }
            return res.status(200).json({ message: "Category updated successfully.", adminCategory });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const uploadAdminCategoryImage = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.body._id) {
            return res.status(400).json({ message: 'Category id is required' });
        }
        if (!req.hasOwnProperty('file')) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const categoryImageFile = req.file;
        if (categoryImageFile && !categoryImageFile.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }

        let fileName = "";
        if (categoryImageFile) {
            const ext = path.extname(categoryImageFile.originalname);
            fileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp';
            const uploadDir = path.join('uploads', 'admin-category');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const destinationPath = path.join(uploadDir, fileName);

            try {
                await convertToWebP(categoryImageFile.buffer, destinationPath);  // Reusing the helper function

                console.log('Image successfully converted to WebP format.');
            } catch (err) {
                console.error("Error converting the file to WebP format:", err);
                return res.status(400).json({ message: 'Error converting image to WebP.' });
            }
        }

        const query = { _id: req.body._id };
        const updateData = { $set: { image: fileName } };

        await AdminCategoryModel.updateOne(query, updateData);

        return res.status(200).json({ message: 'Image added successfully.' });

    } catch (err) {
        console.error('Error during file upload:', err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const adminCategoryList = async (req: CustomRequest, res: Response) => {
    try {
        const adminCategory = await AdminCategoryModel.find().sort({ _id: -1 });
        const baseurl = process.env.ASSET_URL + `/uploads/admin-category/`;

        const data = await Promise.all(
            adminCategory.map(async (category) => {
                try {
                    const parent = await buildAdminCategoryPathTitles(category._id);
                    return {
                        _id: category._id,
                        tag: category.tag,
                        parent,
                        parent_id: category.parent_id,
                        popular: category.popular,
                        special: category.special,
                        title: category.title,
                        image: category.image ? baseurl + category.image : "",
                        status: category.status,
                        menuStatus: category.menuStatus,
                        createdAt: category.createdAt,
                        updatedAt: category.updatedAt
                    };
                } catch (err) {
                    console.error(`Error processing category ${category._id}:`, err);
                    return null;
                }
            })
        );

        let categories = data.filter(Boolean);

        if (req.query.search) {
        const search = String(req.query.search).trim().toLowerCase();

        categories = categories.filter((cat: any) =>
        (cat.title && cat.title.toLowerCase().includes(search)) ||
        (cat.parent && cat.parent.toLowerCase().includes(search))
        );
    }

        let sort: any = req.query.sort ? JSON.parse(req.query.sort as string) : { parent: 1 };

        if (sort.parent) {
            categories.sort((a: any, b: any) =>
                sort.parent === 1
                    ? a.parent.localeCompare(b.parent)
                    : b.parent.localeCompare(a.parent)
            );
        }

        if (sort.createdAt) {
            categories.sort((a: any, b: any) =>
                sort.createdAt === 1
                    ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }

        if (sort.updatedAt) {
            categories.sort((a: any, b: any) =>
                sort.updatedAt === 1
                    ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
                    : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
        }

        const paginatedResult = paginateArray(categories, req.query);

        return res.status(200).json({
            message: "Category list fetched successfully.",
            success: true,
            ...paginatedResult
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
};


export const adminCategoryChangeStatus = async (req: CustomRequest, res: Response) => {
    try {
        const { id, status } = req.body
        const blog = await AdminCategoryModel.updateOne({ _id: id }, { $set: { status } })
        return res.status(200).json({ message: "Category status changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}
export const adminCategoryPopular = async (req: CustomRequest, res: Response) => {
    try {
        const { id, popular } = req.body
        const category = await AdminCategoryModel.updateOne({ _id: id }, { $set: { popular } })
        return res.status(200).json({ message: "Category popular status changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const adminCategorySpecial = async (req: CustomRequest, res: Response) => {
    try {
        const { id, special } = req.body
        const category = await AdminCategoryModel.updateOne({ _id: id }, { $set: { special } })
        return res.status(200).json({ message: "Special Category status changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const changeAdminCategoryMenuStatus = async (req: CustomRequest, res: Response) => {
    try {
        const { id, menuStatus } = req.body
        const category = await AdminCategoryModel.updateOne({ _id: id }, { $set: { menuStatus } })
        return res.status(200).json({ message: "Category menu status changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getAdminCategory = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params;

        const query = {
            _id: id
        }

        const adminCategory = await AdminCategoryModel.findOne(query).populate('parent_id');


        if (!adminCategory) {
            return res.status(404).json({ message: "Admin Category not found." });
        }

        const baseurl = `${process.env.ASSET_URL}/uploads/admin-category/`;

        const data = {
            _id: adminCategory._id,
            tag: adminCategory.tag,
            parent_id: adminCategory.parent_id,
            title: adminCategory.title,
            popular: adminCategory.popular,
            special: adminCategory.special,
            image: baseurl + adminCategory.image,
            status: adminCategory.status,
            productsMatch: adminCategory.productsMatch,
            equalTo: adminCategory.equalTo,
            value: adminCategory.value,
            createdAt: adminCategory.updatedAt,
            updatedAt: adminCategory.updatedAt,
            restricted_keywords: adminCategory.restricted_keywords,
            isAutomatic: adminCategory.isAutomatic,
            categoryScope: adminCategory.categoryScope,
            selectedCategories: adminCategory.selectedCategories,
            conditionType: adminCategory.conditionType,
            conditions: adminCategory.conditions
        };

        return res.status(200).json({ message: "Category fetched successfully.", data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addDeal = async (req: CustomRequest, resp: Response) => {
    try {
        const type = req.body.type;
        if (!type) {
            return resp.status(400).json({ message: "Type is required." });
        }
        const header_text = req.body.header_text;
        const description = req.body.description;
        const deal_1_link = req.body.deal_1_link;
        const deal_2_link = req.body.deal_2_link;
        const box1_title = req.body.box1_title;
        const box2_title = req.body.box2_title;
        const box3_title = req.body.box3_title;
        const box4_title = req.body.box4_title;
        const box1_category = JSON.parse(req.body.box1_category || '[]');
        const box2_category = JSON.parse(req.body.box2_category || '[]');
        const box3_category = JSON.parse(req.body.box3_category || '[]');
        const box4_category = JSON.parse(req.body.box4_category || '[]');

        const deal1File = req.files?.["deal1"]?.[0] as Express.Multer.File | undefined;
        const deal2File = req.files?.["deal2"]?.[0] as Express.Multer.File | undefined;

        let fileName1: string | undefined;
        let fileName2: string | undefined;

        if (deal1File && !deal1File.mimetype.startsWith("image/")) {
            return resp
                .status(400)
                .json({ message: "Invalid file type image. Only images are allowed." });
        }

        if (deal2File && !deal2File.mimetype.startsWith("image/")) {
            return resp
                .status(400)
                .json({ message: "Invalid file type image. Only images are allowed." });
        }

        if (deal1File) {
            fileName1 = Date.now() + "-" + Math.round(Math.random() * 1e9) + ".webp";

            const uploadDir = path.join('uploads', 'deal');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const destinationPath1 = path.join(uploadDir, fileName1);

            try {
                await convertToWebP(deal1File.buffer, destinationPath1)
            } catch (err) {
                console.error("Error converting and saving the front file:", err);
                return resp.status(500).json({ message: "Error saving the front image." });
            }
        }


        if (deal2File) {
            fileName2 = Date.now() + "-" + Math.round(Math.random() * 1e9) + ".webp";

            const uploadDir = path.join('uploads', 'deal');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const destinationPath2 = path.join(uploadDir, fileName2);

            try {
                await convertToWebP(deal2File.buffer, destinationPath2)
            } catch (err) {
                console.error("Error converting and saving the back file:", err);
                return resp.status(500).json({ message: "Error saving the back image." });
            }
        }
        if (type === 'add') {
            const deal = new HomeSettingModel({
                deal_1_link,
                deal_2_link,
                deal_1: fileName1,
                deal_2: fileName2,
                box1_title,
                box2_title,
                box3_title,
                box4_title,
                box1_category,
                box2_category,
                box3_category,
                box4_category,
                header_text,
                description
            });
            await deal.save();
        } else if (type === 'update') {
            await HomeSettingModel.updateOne({}, { $set: { deal_1_link, deal_2_link, deal_1: fileName1, deal_2: fileName2, box1_title, box2_title, box3_title, box4_title, box1_category, box2_category, box3_category, box4_category, header_text, description } });
        }

        return resp.status(200).json({
            message: `Home Settings ${type === 'add' ? 'added' : 'updated'} successfully.`,
        });
    } catch (err) {
        console.error("Error:", err);
        return resp
            .status(500)
            .json({ message: "Something went wrong. Please try again." });
    }
};

export const getDeal = async (req: CustomRequest, resp: Response) => {
    try {
        const deal = await HomeSettingModel.findOne({}).populate('box1_category').populate('box2_category').populate('box3_category').populate('box4_category');
        let base_url = `${process.env.ASSET_URL}/uploads/deal/`;

        return resp.status(200).json({ data: deal, base_url });
    } catch (err) {
        console.error("Error:", err);
        return resp
            .status(500)
            .json({ message: "Something went wrong. Please try again." });
    }
};


export const getActiveAdminCategory = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        const fetchCategories = async (parentId: any, userId: any): Promise<any[]> => {
            const parent: any[] = [];
            const query: any = {
                parent_id: parentId,
                status: true
            };

            const checkUser: any = await User.findOne({ _id: userId });
            if (checkUser?.designation_id == '3') {
                query.store_id = userId;
            }

            const category = await AdminCategoryModel.find(query);

            for (const data of category) {
                const final: {
                    _id: any;
                    title: string;
                    subs?: any[];
                } = {
                    _id: data._id,
                    title: data.title
                };

                const childParent = await fetchCategories(data._id, userId);
                if (childParent.length > 0) {
                    final.subs = childParent;
                }

                parent.push(final);
            }

            return parent;
        };

        const data = await fetchCategories(id, userId);

        return res.status(200).json({
            message: "Category list fetched successfully.",
            data
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
};

export const getInformation = async (req: Request, resp: Response) => {

    const validTypes = ['terms-condition', 'privacy-policy'];

    let type = req.params.type.toLowerCase();

    if (!validTypes.includes(type)) {

        return resp.status(400).json({ message: 'Invalid type.' });
    }

    const typeMappings: Record<string, string> = {
        'terms-condition': 'Terms & Conditions',
        'privacy-policy': 'Privacy Policy'
    };

    const information = await Information.findOne({ type: typeMappings[type] });

    return resp.status(200).json({ data: information, type: typeMappings[type] });
};

export const updateInformation = async (req: Request, resp: Response) => {
    try {
        const data: any = {
            type: req.body.type,
            description: req.body.description
        }

        if (req.body._id && req.body._id == 'new') {

            await Information.create(data);

            return resp.status(200).json({ message: `${req.body.type} added successfully.`, script: true });

        }
        else {
            const result = await Information.updateOne(
                { _id: req.body._id },
                { $set: data }
            );
            return resp.status(200).json({ message: `${req.body.type} updated successfully.` });
        }
    } catch (err) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addVendor = async (req: Request, resp: Response) => {
    try {

        let password = await bcrypt.hash(req.body.password, 10);

        const data: any = {
            name: req.body.name,
            mobile: req.body.mobile,
            phone_code: req.body.phone_code,
            email: req.body.email,
            gender: req.body.gender,
            dob: req.body.dob,
            country_id: req.body.country_id,
            state_id: req.body.state_id,
            city_id: req.body.city_id,
            password: password,
            designation_id: '3',
            showPassword: req.body.password
        }

        let slug = slugify(req.body.shop_name, {
            lower: true,
            remove: /[*+~.()'"!:@]/g,
        });
        const existingVendor = await VendorModel.findOne({ shop_title: req.body.shop_title });

        if (existingVendor && req.body._id == 'new') {
            return resp.status(400).json({ message: 'Vendor already exists.' });
        }

        if (req.body._id == 'new') {
            const user = await User.findOne({ email: req.body.email });

            if (user) {

                return resp.status(400).json({ message: "This user is already exists." });

            } else {
                const chkMobile = await User.findOne({ mobile: req.body.mobile });

                if (chkMobile) {

                    return resp.status(400).json({ message: "This mobile is already associated with another user." });

                }

                if (req.body.password != req.body.confirm_password) {

                    return resp.status(400).json({ message: "Password and Confirm Password don't match" });
                }
                const lastUniqueNumber = await User.countDocuments({ designation_id: 3 })
                const uniqueId = generateUniqueId(lastUniqueNumber);
                data.id_number = uniqueId;

                const user = await User.create(data);

                const additional_info = {
                    user_id: user._id,
                    shop_title: req.body.shop_title,
                    slug: slug,
                    shop_announcement: req.body.shop_announcement,
                    buyers_message: req.body.buyers_message,
                    shop_name: req.body.shop_name,
                    members: req.body.members,
                    story_headline: req.body.story_headline,
                    story: req.body.story,
                    shop_photos: req.body.shop_photos,
                    description: req.body.description,
                    shop_policy: req.body.shop_policy,
                    shop_address: req.body.shop_address
                }

                await VendorModel.create(additional_info);
                return resp.status(200).json({ message: "Vendor added Successfully.", success: true, user });
            }
        } else {
            const existingCombination = await User.findOne({ email: req.body.email, _id: { $ne: req.body._id } });

            const existingVendor = await VendorModel.findOne({ shop_title: req.body.shop_title, user_id: { $ne: req.body._id } });

            if (existingVendor) {
                return resp.status(400).json({ message: `${req.body.shop_title} already exists.`, success: false });
            }

            if (existingCombination) {
                return resp.status(400).json({ message: 'Email already exists.', success: false });
            }

            await User.findByIdAndUpdate({ _id: req.body._id }, data);

            const user = await User.findOne({ _id: req.body._id });

            const additional_info = {
                user_id: user?._id,
                shop_title: req.body.shop_title,
                slug: slug,
                shop_announcement: req.body.shop_announcement,
                buyers_message: req.body.buyers_message,
                shop_name: req.body.shop_name,
                members: req.body.members,
                story_headline: req.body.story_headline,
                story: req.body.story,
                shop_photos: req.body.shop_photos,
                description: req.body.description,
                shop_policy: req.body.shop_policy,
                shop_address: req.body.shop_address,
                shop_video: req.body.shop_video,
            }
            const query = { user_id: req.body._id };

            if (req.body.isDeleteVideo == true) {
                additional_info.shop_video = '';
            }

            await VendorModel.updateOne(query, additional_info);

            return resp.status(200).json({ message: "Vendor updated successfully.", user });
        }
    } catch (error) {
        console.log(error);
        resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const addVendorProfile = async (req: CustomRequest, resp: Response) => {

    try {

        if (!req.hasOwnProperty('file')) {
            return resp.status(400).json({ message: 'Profile Image is required' });
        }

        if (!req.body._id) {
            return resp.status(400).json({ message: 'Id is required.' });
        }

        const categoryImageFile = req.file;

        let fileName = "";

        if (categoryImageFile && !(categoryImageFile.mimetype.startsWith('image/'))) {

            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });

        } else if (categoryImageFile) {

            const ext = path.extname(categoryImageFile.originalname);
            fileName = (Date.now() + '-' + Math.round(Math.random() * 1E9)) + ext;

            if (!fs.existsSync(path.join('uploads/vendor'))) {
                fs.mkdirSync(path.join('uploads/vendor'));
            }

            const destinationPath = path.join('uploads/vendor', fileName);
            try {
                await convertToWebP(categoryImageFile.buffer, destinationPath);

                console.log('Image successfully converted to WebP format.');
            } catch (err) {
                console.error("Error converting the file to WebP format:", err);
                return resp.status(500).json({ message: 'Error converting image to WebP.' });
            }
        }

        const query = { _id: req.body._id }
        const updateData = { $set: { image: fileName } }

        await User.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Image added successfully.' });

    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addShopBanner = async (req: CustomRequest, resp: Response) => {
  try {
    const { user_id, index, scale, x, y } = req.body;

    if (!user_id) {
      return resp.status(400).json({ message: 'User id is required' });
    }

    if (!req.files || !req.files.image || !req.files.editedImage) {
      return resp.status(400).json({ message: 'Both image and editedImage are required' });
    }

    const vendor = await VendorModel.findOne({ user_id });

    if (!vendor) {
      return resp.status(404).json({ message: 'Vendor not found' });
    }

    if (!index && vendor.shop_banner.length >= 5) {
      return resp.status(400).json({ message: 'Maximum 5 banners allowed' });
    }

    const uploadDir = path.join('uploads', 'shop-banner');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const imageFile = (req.files as any).image[0];
    const imageName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    await convertToWebP(imageFile.buffer, path.join(uploadDir, imageName));

    const editedFile = (req.files as any).editedImage[0];
    const editedName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-edited.webp`;
    await convertToWebP(editedFile.buffer, path.join(uploadDir, editedName));

    const bannerObj = {
      image: imageName,
      editedImage: editedName,
      metaData: {
        scale: Number(scale) || 1,
        x: Number(x) || 0,
        y: Number(y) || 0,
      },
    };

    if (index !== undefined && vendor.shop_banner[index]) {
      vendor.shop_banner[index] = bannerObj;
    } else {
      vendor.shop_banner.push(bannerObj);
    }

    await vendor.save();

    return resp.status(200).json({ message: 'Shop banner saved successfully' });

  } catch (error) {
    console.error('addShopBanner error:', error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getShopBanner = async (req: CustomRequest, resp: Response) => {
  try {
    const user = req.user;

    if (!user || !user._id) {
      return resp.status(401).json({ message: 'Unauthorized access.' });
    }

    if (user.designation_id !== 3) {
      return resp.status(403).json({ message: 'Access denied. Vendor only.' });
    }

    const vendorDetails = await VendorModel.findOne(
      { user_id: user._id },
      { shop_banner: 1 }
    ).lean();

    if (!vendorDetails) {
      return resp.status(404).json({ message: 'Vendor not found.' });
    }

    const banner_url = process.env.ASSET_URL + '/uploads/shop-banner/';

    const banners = (vendorDetails.shop_banner || []).map((banner: any) => ({
      image: banner.image ? banner_url + banner.image : '',
      editedImage: banner.editedImage ? banner_url + banner.editedImage : '',
      metaData: banner.metaData || { scale: 1, x: 0, y: 0 }
    }));

    return resp.status(200).json({
      message: 'Shop banners fetched successfully.',
      user_id: user._id, 
      data: banners
    });

  } catch (error) {
    console.error('getShopBanner error:', error);
    return resp.status(500).json({
      message: 'Something went wrong. Please try again.'
    });
  }
};

export const deleteShopBanner = async (req: Request, resp: Response) => {
  try {
    const { user_id, index } = req.body;

    if (!user_id || index === undefined) {
      return resp.status(400).json({ message: 'User id and index are required' });
    }

    const vendor = await VendorModel.findOne({ user_id });

    if (!vendor || !vendor.shop_banner[index]) {
      return resp.status(404).json({ message: 'Banner not found' });
    }

    const banner = vendor.shop_banner[index];

    const dir = path.join('uploads', 'shop-banner');
    if (banner.image) fs.existsSync(path.join(dir, banner.image)) && fs.unlinkSync(path.join(dir, banner.image));
    if (banner.editedImage) fs.existsSync(path.join(dir, banner.editedImage)) && fs.unlinkSync(path.join(dir, banner.editedImage));

    vendor.shop_banner.splice(index, 1);
    await vendor.save();

    return resp.status(200).json({ message: 'Shop banner deleted successfully' });

  } catch (error) {
    console.error('deleteShopBanner error:', error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


export const addShopIcon = async (req: CustomRequest, resp: Response) => {
    try {
        if (!req.hasOwnProperty('file')) {
            return resp.status(400).json({ message: 'Shop Icon is required' });
        }

        if (!req.body._id) {
            return resp.status(400).json({ message: 'Id is required.' });
        }

        const categoryImageFile = req.file;
        let fileName = "";
        if (categoryImageFile && !(categoryImageFile.mimetype.startsWith('image/'))) {
            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }

        if (categoryImageFile) {
            fileName = (Date.now() + '-' + Math.round(Math.random() * 1E9)) + '.webp';

            const uploadDir = path.join('uploads', 'shop-icon');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const destinationPath = path.join(uploadDir, fileName);

            try {
                await convertToWebP(categoryImageFile.buffer, destinationPath);

            } catch (err) {
                console.error("Error converting the file to WebP format:", err);
                return resp.status(500).json({ message: 'Error converting image to WebP.' });
            }
        }
        const query = { user_id: req.body._id };
        const updateData = { $set: { shop_icon: fileName } };
        await VendorModel.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Shop Icon added successfully.' });

    } catch (err) {
        console.log('Error in addShopIcon:', err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getVendor = async (req: Request, resp: Response) => {
    try {
        const search = req.query.search?.toString()?.trim() || '';
        const searchRegex = new RegExp(search, 'i');

        let userQuery: any = { designation_id: '3' };

        if (search) {
            userQuery.$or = [
                { name: { $regex: searchRegex } },
                { email: { $regex: searchRegex } },
                { id_number: { $regex: searchRegex } }
            ];
        }

        const users = await User.find(userQuery).sort({ _id: -1 });

        const shopIconBaseUrl = process.env.ASSET_URL + '/uploads/shop-icon/';
        const base_url = process.env.ASSET_URL + '/uploads/vendor/';

        const data = await Promise.all(users.map(async (item: any) => {
            const vendorData = await VendorModel.findOne({ user_id: item._id });

            if (search && vendorData?.shop_name && !vendorData.shop_name.match(searchRegex)) {
                const matchedInUser = [item.name, item.email, item.id_number].some(field =>
                    field?.toLowerCase().includes(search.toLowerCase())
                );
                if (!matchedInUser) return null;
            }

            const country = await CountryModel.findOne({ _id: item.country_id });
            const state = await StateModel.findOne({ _id: item.state_id });
            const city = await CityModel.findOne({ _id: item.city_id });

            const orderCount = await SalesDetailsModel.countDocuments({
                vendor_id: item._id,
            });

            const lastOrderDays: any = await SalesDetailsModel.findOne({
                vendor_id: item._id,
                order_status: 'completed'
            }).sort({ createdAt: -1 });

            const currentDate = new Date();
            const lastOrderDate = lastOrderDays?.createdAt ? new Date(lastOrderDays.createdAt) : null;
            const diffDays = lastOrderDate
                ? Math.ceil(Math.abs(currentDate.getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24))
                : null;

            const followers = await FollowModel.countDocuments({ vendor_id: item._id });

            const revenueAgg = await SalesDetailsModel.aggregate([
                {
                    $match: {
                        vendor_id: item._id,
                        order_status: 'completed',
                        delivery_status: 'Delivered'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: {
                                $multiply: ["$qty", "$amount"]
                            }
                        }
                    }
                }
            ]);

            const revenue = revenueAgg[0]?.totalRevenue || 0;


            return {
                _id: item._id,
                name: item.name,
                email: item.email,
                mobile: item.mobile,
                phone_code: item.phone_code,
                image: item.image ? base_url + item.image : '',
                status: item.status,
                id_number: item.id_number,
                country: country?.name,
                state: state?.name,
                city: city?.name,
                dob: item.dob,
                gender: item.gender,
                orderCount,
                revenue,
                followers,
                lastOrderDays: diffDays || 0,
                vendorData,
                showPassword: item.showPassword
            };
        }));

        return resp.status(200).json({
            message: "Vendor list.",
            success: true,
            data: data.filter(Boolean),
            shopIconBaseUrl
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getVendorById = async (req: Request, resp: Response) => {
    try {
        const user = await User.findById({ _id: req.params.id, designation_id: '3' });

        const vendorData = await VendorModel.findOne({ user_id: req.params.id });

        if (!user) {
            return resp.status(400).json({ message: 'User not found.' });
        }
        const country = await CountryModel.findOne({ _id: user.country_id });
        const state = await StateModel.findOne({ _id: user.state_id });
        const city = await CityModel.findOne({ _id: user.city_id });

        let base_url = process.env.ASSET_URL + '/uploads/vendor/';
        let shopVideoBaseUrl = process.env.ASSET_URL + '/uploads/shop-video/';
        let shopIconBaseUrl = process.env.ASSET_URL + '/uploads/shop-icon/';
        let shopPhotoBaseUrl = process.env.ASSET_URL + '/uploads/shop-photos/';

        const data = {
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            phone_code: user.phone_code,
            image: base_url + user.image,
            status: user.status,
            country: country?.name,
            state: state?.name,
            city: city?.name,
            country_id: user.country_id,
            state_id: user.state_id,
            city_id: user.city_id,
            dob: user.dob,
            gender: user.gender,
            showPassword: user.showPassword,
            vendorData: vendorData
        }

        return resp.status(200).json({ message: "Vendor list.", success: true, data: data, shopVideoBaseUrl, shopIconBaseUrl, shopPhotoBaseUrl });
    } catch (err) {
        console.log(err)
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const changeVendorStatus = async (req: Request, resp: Response) => {
    try {
        const query = { _id: req.body.id }
        const updateData = { $set: { status: req.body.status } }
        await User.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Vendor Status changed successfully.' });
    } catch {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getProductBySku = async (req: Request, resp: Response) => {
  try {
    const sku_code = req.params.sku;
    const product = await Product.findOne({ sku_code: sku_code });

    if (!product) {
      return resp.status(400).json({ message: 'Product not found.' });
    }

    const variantDetails: any[] = [];

    if (Array.isArray(product.combinationData)) {
      for (const combo of product.combinationData) {
        if (combo?.variant_name && Array.isArray(combo.combinations)) {
          const values = combo.combinations
            .filter((item: any) => item?.value1)
            .map((item: any) => item.value1);
          if (values.length > 0) {
            variantDetails.push({
              source: "combinationData",
              variant_name: combo.variant_name,
              values,
            });
          }
        }
      }
    }

    if (product.customizationData?.customizations) {
      for (const custom of product.customizationData.customizations) {
        if (custom.isVariant === "true" && Array.isArray(custom.optionList)) {
          const values = custom.optionList
            .filter((opt: any) => opt?.optionName)
            .map((opt: any) => opt.optionName);
          if (values.length > 0) {
            variantDetails.push({
              source: "customizationData",
              variant_name: custom.title,
              values,
            });
          }
        }
      }
    }

    const data = {
      product_id: product._id,
      vendor_id: product.vendor_id,
      price: product.price,
      sale_price: product.sale_price,
      sale_start_date: product.sale_start_date,
      sale_end_date: product.sale_end_date,
      qty: product.qty,
      variants_used: variantDetails,
    };

    return resp.status(200).json({
      message: "Fetched Product Data.",
      success: true,
      data,
    });
  } catch (err) {
    console.log("getProductBySku Error:", err);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


export const getAllActiveVendor = async (req: Request, resp: Response) => {
    try {
        const user = await User.find({ designation_id: '3', status: true }).sort({ _id: -1 });

        const userIds = [...new Set(user.map((user) => user._id))];

        const vendorData = await VendorModel.find({ user_id: { $in: userIds } });

        const vendorMap = vendorData.reduce((acc: any, vendor: any) => {
            acc[vendor.user_id.toString()] = vendor;
            return acc;
        }, {});

        const data = await Promise.all(user.map(async (item: any) => {
            return {
                _id: item._id,
                name: item.name,
                email: item.email,
                shopName: vendorMap[item._id.toString()] ? vendorMap[item._id.toString()].shop_name : '',
            }
        }));

        return resp.status(200).json({ message: "Active Vendor list.", success: true, data: data });
    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getRatingByType = async (req: CustomRequest, resp: Response) => {
    try {
        const vendorid = req.user._id;
        const type = req.params.type;
        const product_id: any = req.query.product_id || null;
        let startDate = req.query.startDate ? resp.locals.currentdate(req.query.startDate).startOf('day').toDate() : null;
        let endDate = req.query.endDate ? resp.locals.currentdate(req.query.endDate).endOf('day').toDate() : null;
        const delivery_rating: any = req.query.delivery_rating || null;
        const item_rating: any = req.query.item_rating || null;

        const pipe: any = [
            {
                '$match': {
                    'status': type
                }
            },
            {
                '$lookup': {
                    'from': 'products',
                    'localField': 'product_id',
                    'foreignField': '_id',
                    'as': 'productData'
                }
            },
            {
                '$unwind': {
                    'path': '$productData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$lookup': {
                    'from': 'salesdetails',
                    'localField': 'saledetail_id',
                    'foreignField': '_id',
                    'as': 'salesDetailData'
                }
            },
            {
                '$unwind': {
                    'path': '$salesDetailData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'salesDetailData.vendor_id',
                    'foreignField': '_id',
                    'as': 'vendorData'
                }
            },
            {
                '$unwind': {
                    'path': '$vendorData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$lookup': {
                    'from': 'sales',
                    'localField': 'salesDetailData.sale_id',
                    'foreignField': '_id',
                    'as': 'salesData'
                }
            },
            {
                '$unwind': {
                    'path': '$salesData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$lookup': {
                    'from': 'vendordetails',
                    'localField': 'productData.vendor_id',
                    'foreignField': 'user_id',
                    'as': 'vendorDetailsData'
                }
            },
            {
                '$unwind': {
                    'path': '$vendorDetailsData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            ...(req.user.designation_id === 3 ? [
                {
                    '$match': {
                        'productData.vendor_id': new mongoose.Types.ObjectId(vendorid)
                    }
                },
            ] : []),
            ...(product_id ? [
                {
                    '$match': {
                        'product_id': new mongoose.Types.ObjectId(product_id)
                    }
                }
            ] : []),
            ...(delivery_rating ? [
                {
                    '$match': {
                        'delivery_rating': delivery_rating
                    }
                }
            ] : []),
            ...(item_rating ? [
                {
                    '$match': {
                        'item_rating': item_rating
                    }
                }
            ] : []),
            ...(startDate && endDate ? [
                {
                    '$match': {
                        'createdAt': { '$gte': startDate, '$lte': endDate }
                    }
                }
            ] : startDate ? [
                {
                    '$match': {
                        'createdAt': { '$gte': startDate }
                    }
                }
            ] : endDate ? [
                {
                    '$match': {
                        'createdAt': { '$lte': endDate }
                    }
                }
            ] : []),
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'user_id',
                    'foreignField': '_id',
                    'as': 'userData'
                }
            },
            {
                '$unwind': {
                    'path': '$userData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$project': {
                    '__id': 1,
                    'user_id': 1,
                    'saledetail_id': 1,
                    'product_id': 1,
                    'delivery_rating': 1,
                    'item_rating': 1,
                    'additional_comment': 1,
                    'recommended': 1,
                    'status': 1,
                    'reject_remark': 1,
                    'product_name': '$productData.product_title',
                    'user_name': '$userData.name',
                    'productSku': '$productData.sku_code',
                    'orderId': '$salesData.order_id',
                    'shopName': '$vendorDetailsData.shop_name',
                    'createdAt': 1,
                    'approved_date': 1,
                    'rejected_date': 1,
                    "vendor_id": 1
                }
            }
        ];

        const ratingData = await RatingModel.aggregate(pipe);
        return resp.status(200).json({ message: "Rating fetched successfully.", ratingData });
    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }

}

export const getAllVendorProduct = async (req: CustomRequest, resp: Response) => {
    try {
        const vendorid = req.user._id;
        const product = await Product.find({ vendor_id: vendorid });

        const data = await Promise.all(product.map(async (item: any) => {
            return {
                product_id: item._id,
                product_title: item.product_title,
                qty: item.qty
            }
        }));

        return resp.status(200).json({ message: "Fetched Product Data.", success: true, data: data });

    } catch (err) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const changeRatingStatus = async (req: CustomRequest, resp: Response) => {
    try {
        const status = req.body.status;
        const id = req.body.id;

        const ratings = await RatingModel.find({ _id: { $in: id } });

        if (!ratings || ratings.length === 0) {
            return resp.status(400).json({ message: 'Invalid Rating Id' });
        }

        let productIds = new Set();

        for (let rating of ratings) {
            rating.status = status;
            const product = await ProductModel.findById(rating.product_id);
            if (status === 'rejected') {
                rating.reject_remark = req.body.reject_remark;
                rating.rejected_date = resp.locals.currentdate().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
            }

            if (status === 'approved' && product) {
                rating.approved_date = resp.locals.currentdate().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
                product.userReviewCount += 1;
                await product.save();
            }

            await rating.save();
            const productId = rating.product_id;
            productIds.add(productId);
        }

        for (let productId of productIds) {
            const productRatings = await RatingModel.find({ product_id: productId, status: 'approved' });

            const avgRating = productRatings.length > 0
                ? productRatings.reduce((sum, rating) => sum + Number(rating.item_rating), 0) / productRatings.length
                : 0;

            await ProductModel.findByIdAndUpdate(productId, { ratingAvg: avgRating });
        }


        return resp.status(200).json({ message: "Rating status changed and product ratings updated successfully.", success: true });

    } catch (err) {
        console.error(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const uploadShopVideo = async (req: Request, resp: Response) => {

    uploadVideo(req, resp, async function (err: any) {
        if (err) {
            console.log(err)
            return resp.status(400).json({ message: err.message, success: false });
        }

        if (!req.file) {
            return resp.status(400).json({ message: 'Video is required', success: false });
        }

        const videoFile = req.file;
        const ext = path.extname(videoFile.originalname);
        const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;

        if (!fs.existsSync(path.join('uploads/shop-video'))) {
            fs.mkdirSync(path.join('uploads/shop-video'));
        }

        const destinationPath = path.join('uploads/shop-video', fileName);

        fs.writeFile(destinationPath, videoFile.buffer, 'binary', (err) => {
            if (err) {
                console.error('Error moving the file:', err);
            } else {
                console.error('File moved successfully');
            }
        });

        const query = { user_id: req.body._id };
        const updateData = { $set: { shop_video: fileName } };

        await VendorModel.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Shop Video uploaded successfully', success: true });
    });
};

export const addShopPhotos = async (req: CustomRequest, resp: Response) => {
    try {
        if (!req.hasOwnProperty('file')) {
            return resp.status(400).json({ message: 'Shop Photos are required' });
        }

        const categoryImageFile = req.file;
        if (categoryImageFile && !(categoryImageFile.mimetype.startsWith('image/'))) {
            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }
        if (categoryImageFile) {
            const ext = path.extname(categoryImageFile.originalname);
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const uploadDir = path.join('uploads', 'shop-photos');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const destinationPath = path.join(uploadDir, fileName);
            await convertToWebP(categoryImageFile.buffer, destinationPath);
            return resp.status(200).json({
                message: 'Shop Photos added successfully.',
                fileName
            });
        }

        return resp.status(400).json({ message: 'No file uploaded' });

    } catch (err) {
        console.error(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const updateProductQuantity = async (req: Request, resp: Response) => {
    try {
        const { _id, isCombination, combinationData, qty } = req.body;

        if (!_id) return resp.status(400).json({ message: "Product _id is required." });
        if (qty === undefined || qty === null) {
            return resp.status(400).json({ message: "qty is required." });
        }
        const qtyStr = String(qty);

        if (!isCombination) {
            const result = await ProductModel.updateOne(
                { _id: new mongoose.Types.ObjectId(_id) },
                { $set: { qty: qtyStr } }
            );
            return resp.status(200).json({
                message: "Quantity updated successfully (non-variant).",
                matched: result.matchedCount,
                modified: result.modifiedCount,
            });
        }

        const prod = await ProductModel.findById(_id).select("form_values.isCheckedQuantity");
        if (!prod) return resp.status(404).json({ message: "Product not found." });

        if (prod?.form_values?.isCheckedQuantity === false) {
            const result = await ProductModel.updateOne(
                { _id: prod._id },
                { $set: { qty: qtyStr } }
            );
            return resp.status(200).json({
                message: "Quantity updated successfully (product-level qty).",
                matched: result.matchedCount,
                modified: result.modifiedCount,
            });
        }

        if (!Array.isArray(combinationData) || combinationData.length === 0) {
            return resp.status(400).json({
                message: "combinationData must be a non-empty array of IDs to match against combIds.",
            });
        }
        const idsStrings: string[] = Array.from(
            new Set(combinationData.map((x: any) => String(x)))
        );

        const result = await ProductModel.updateOne(
            { _id: new mongoose.Types.ObjectId(_id) },
            [
                {
                    $set: {
                        combinationData: {
                            $map: {
                                input: "$combinationData",
                                as: "g",
                                in: {
                                    $mergeObjects: [
                                        "$$g",
                                        {
                                            combinations: {
                                                $map: {
                                                    input: "$$g.combinations",
                                                    as: "c",
                                                    in: {
                                                        $mergeObjects: [
                                                            "$$c",
                                                            {
                                                                qty: {
                                                                    $cond: [
                                                                        {
                                                                            $gt: [
                                                                                {
                                                                                    $size: {
                                                                                        $setIntersection: [
                                                                                            {
                                                                                                $map: {
                                                                                                    input: { $ifNull: ["$$c.combIds", []] },
                                                                                                    as: "id",
                                                                                                    in: { $toString: "$$id" }
                                                                                                }
                                                                                            },
                                                                                            idsStrings
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                0
                                                                            ]
                                                                        },
                                                                        qtyStr,
                                                                        "$$c.qty"
                                                                    ]
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            ]
        );

        return resp.status(200).json({
            message: "Combination quantities updated successfully.",
            matched: result.matchedCount,
            modified: result.modifiedCount,
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

export const addCoupon = async (req: CustomRequest, resp: Response) => {
    const {
        _id,
        coupon_code,
        coupon_title,
        coupon_description,
        discount_amount,
        discount_type,
        valid_for,
        start_date,
        expiry_date,
        product_id,
        max_discount,
        no_of_times,
        vendor_id,
        purchased_items,
        isSynced,
    } = req.body;

    let productIds: any = [];
    let removed_product_id: any = [];
    const skuCode = product_id;

    if (purchased_items == 'Product Wise') {

        const existingProducts = await ProductModel.find({ sku_code: { $in: skuCode }, vendor_id: req.user._id });

        if (!existingProducts) {
            return resp.status(404).json({ message: 'Product not found' });
        }

        productIds = existingProducts.map((product) => product._id);

    } else if (purchased_items == 'Entire Catalog' && product_id.length == 0) {

        const existingProducts = await ProductModel.find({ vendor_id: req.user._id });

        productIds = existingProducts.map((product) => product._id)
            ;
    } else if (purchased_items == 'Entire Catalog' && product_id.length != 0) {

        const existingProducts = await ProductModel.find({ sku_code: { $in: skuCode }, vendor_id: req.user._id });

        if (!existingProducts) {
            return resp.status(404).json({ message: 'Product not found' });
        }

        const removableProductsIds = existingProducts.map((product) => product._id);

        removed_product_id = removableProductsIds;

        const allProducts = await ProductModel.find({ vendor_id: req.user._id });

        const allProductIds = allProducts.map((product) => product._id);

        productIds = allProductIds.filter((id) =>
            !removableProductsIds.map(remId => remId.toString()).includes(id.toString())
        );

    }

    const couponData = {
        vendor_id,
        coupon_code,
        coupon_title,
        coupon_description,
        discount_amount,
        discount_type,
        valid_for,
        start_date,
        expiry_date,
        product_id: productIds,
        max_discount,
        no_of_times,
        purchased_items,
        isSynced,
        removed_product_id: removed_product_id,
    };

    try {
        if (discount_amount !== undefined && isNaN(discount_amount)) {
            return resp.status(400).json({ message: 'Discount amount must be a number' });
        }

        const vendor = await User.findById(vendor_id);
        if (!vendor) {
            return resp.status(404).json({ message: 'Vendor not found' });
        }

        const existingCoupon = await CouponModel.findOne({ vendor_id, $or: [{ coupon_code }, { coupon_title }] });
        if (existingCoupon && existingCoupon._id.toString() !== _id) {
            return resp.status(400).json({ message: 'Coupon code must be unique for this vendor' });
        }

        if (discount_type === 'percentage' && discount_amount > 100) {
            return resp.status(400).json({ message: 'Discount percentage cannot be greater than 100' });
        }

        if (discount_type === 'flat' && discount_amount <= 0) {
            return resp.status(400).json({ message: 'Flat discount must be greater than 0' });
        }

        let coupon;
        if (_id === '0') {
            coupon = new CouponModel(couponData);
            await coupon.save();
            return resp.status(200).json({
                message: 'Coupon created successfully',
                coupon,
            });
        } else {
            coupon = await CouponModel.updateOne(
                { _id: _id },
                { $set: couponData }
            )

            return resp.status(200).json({
                message: 'Coupon updated successfully',
            });
        }
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const deleteCoupon = async (req: Request, resp: Response) => {
    const { id } = req.params;
    console.log(id)
    try {
        const coupon = await CouponModel.findById(id);
        if (!coupon) {
            return resp.status(404).json({ message: 'Coupon not found' });
        }
        await CouponModel.deleteOne({ _id: id });

        return resp.status(200).json({
            message: 'Coupon deleted successfully',
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const listCoupons = async (req: Request, resp: Response) => {
    try {
        const user_id = (req as any).user?._id;
        const coupons = await CouponModel.find({ vendor_id: user_id });

        const couponsPaths = await Promise.all(
            coupons.map(async (coupon) => {
                const expiryDateFormatted = coupon.expiry_date
                    ? resp.locals.currentdate(coupon.expiry_date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm')
                    : '';

                const isExpired = coupon.expiry_date
                    ? moment.tz(coupon.expiry_date, 'Asia/Kolkata').isBefore(moment.tz('Asia/Kolkata'))
                    : false;

                return {
                    _id: coupon._id,
                    status: coupon.status,
                    coupon_code: coupon.coupon_code,
                    coupon_description: coupon.coupon_description,
                    discount_amount: coupon.discount_amount,
                    discount_type: coupon.discount_type,
                    max_discount: coupon.max_discount,
                    coupon_title: coupon.coupon_title,
                    start_date: coupon.start_date
                        ? resp.locals.currentdate(coupon.start_date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm')
                        : '',
                    expiry_date: expiryDateFormatted,
                    expiry_status: isExpired ? "expired" : "active",
                };
            })
        );

        return resp.status(200).json({
            message: "Coupons fetched successfully",
            coupons: couponsPaths,
        });

    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const changeCouponStatus = async (req: Request, resp: Response) => {
    try {
        const query = { _id: req.body.id }
        const updateData = { $set: { status: req.body.status } }
        await CouponModel.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Coupon Status changed successfully.' });
    } catch {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getCoupon = async (req: Request, resp: Response) => {
    const { id } = req.params;

    try {
        const couponData = await CouponModel.findById(id);

        if (!couponData) {
            return resp.status(400).json({ message: 'Coupon not found' });
        }
        let product_id: any = []
        if (couponData.purchased_items == 'Product Wise') {
            const productData = await ProductModel.find({ _id: { $in: couponData.product_id } });
            product_id = productData.map((item) => item.sku_code);
        } else if (couponData.purchased_items == 'Entire Catalog' && couponData.removed_product_id.length != 0) {
            console.log("AAAAAAAAAA")
            const productData = await ProductModel.find({ _id: { $in: couponData.removed_product_id } });
            product_id = productData.map((item) => item.sku_code);
        } else if (couponData.purchased_items == 'Entire Catalog' && couponData.removed_product_id.length == 0) {
            const productData = await ProductModel.find({ vendor_id: couponData.vendor_id });
            product_id = []
        }

        let coupon = {
            _id: couponData._id,
            vendor_id: couponData.vendor_id,
            coupon_title: couponData.coupon_title,
            coupon_code: couponData.coupon_code,
            coupon_description: couponData.coupon_description,
            discount_amount: couponData.discount_amount,
            max_discount: couponData.max_discount,
            discount_type: couponData.discount_type,
            expiry_date: couponData.expiry_date,
            start_date: couponData.start_date,
            purchased_items: couponData.purchased_items,
            product_id: product_id,
            no_of_times: couponData.no_of_times,
            total_uses: couponData.total_uses,
            valid_for: couponData.valid_for,
            isSynced: couponData.isSynced,
        }
        return resp.status(200).json({
            message: 'Coupon fetched successfully',
            coupon,
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const addPromotion = async (req: CustomRequest, resp: Response) => {
    const {
        _id,
        offer_type,
        promotion_type,
        discount_amount,
        promotional_title,
        qty,
        offer_amount,
        vendor_id,
        product_id,
        start_date,
        expiry_date,
        purchased_items
    } = req.body;

    let productIds: any = [];
    let removed_product_id: any = [];
    const skuCode = product_id;

    if (purchased_items == 'Product Wise') {

        const existingProducts = await ProductModel.find({ sku_code: { $in: skuCode }, vendor_id: req.user._id });

        if (!existingProducts) {
            return resp.status(404).json({ message: 'Product not found' });
        }

        productIds = existingProducts.map((product) => product._id);

    } else if (purchased_items == 'Entire Catalog' && product_id.length == 0) {

        const existingProducts = await ProductModel.find({ vendor_id: req.user._id });

        productIds = existingProducts.map((product) => product._id)
            ;
    } else if (purchased_items == 'Entire Catalog' && product_id.length != 0) {

        const existingProducts = await ProductModel.find({ sku_code: { $in: skuCode }, vendor_id: req.user._id });

        if (!existingProducts) {
            return resp.status(404).json({ message: 'Product not found' });
        }

        const removableProductsIds = existingProducts.map((product) => product._id);

        removed_product_id = removableProductsIds;

        const allProducts = await ProductModel.find({ vendor_id: req.user._id });

        const allProductIds = allProducts.map((product) => product._id);

        productIds = allProductIds.filter((id) =>
            !removableProductsIds.map(remId => remId.toString()).includes(id.toString())
        );

    }

    const promotionData = {
        vendor_id,
        offer_type,
        promotion_type,
        offer_amount,
        promotional_title,
        discount_amount,
        qty,
        product_id: productIds,
        start_date,
        expiry_date,
        removed_product_id: removed_product_id,
        purchased_items
    };

    try {
        const existPromotion = await PromotionalOfferModel.findOne({ promotional_title: { $regex: new RegExp(`^${promotional_title}$`, 'i') } });

        if (existPromotion && existPromotion._id.toString() !== _id) {
            return resp.status(400).json({ message: 'Promotion with this title already exists.', success: false });
        }

        if (discount_amount !== undefined && isNaN(discount_amount)) {
            return resp.status(400).json({ message: 'Offer amount must be a number' });
        }

        const vendor = await UserModel.findById(vendor_id);
        if (!vendor) {
            return resp.status(404).json({ message: 'Vendor not found' });
        }

        let promotion;
        if (_id === '0') {
            promotion = new PromotionalOfferModel(promotionData);
            await promotion.save();
            return resp.status(200).json({
                message: 'Promotion created successfully',
                promotion,
            });
        } else {
            promotion = await PromotionalOfferModel.updateOne(
                { _id },
                { $set: promotionData }
            );

            return resp.status(200).json({
                message: 'Promotion updated successfully',
            });
        }
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const listPromotions = async (req: CustomRequest, resp: Response) => {
    try {
        const promotions = await PromotionalOfferModel.find({ vendor_id: req.user._id });

        if (!promotions || promotions.length === 0) {
            return resp.status(200).json({ message: 'No promotions found', promotions: [] });
        }

        const promotionsPaths = await Promise.all(
            promotions.map(async (promotion) => {
                const startDateFormatted = promotion.start_date
                    ? resp.locals.currentdate(promotion.start_date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm')
                    : '';

                const expiryDateFormatted = promotion.expiry_date
                    ? resp.locals.currentdate(promotion.expiry_date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm')
                    : '';

                const isExpired = promotion.expiry_date
                    ? moment.tz(promotion.expiry_date, 'Asia/Kolkata').isBefore(moment.tz('Asia/Kolkata'))
                    : false;

                const newExpiryStatus = isExpired ? 'expired' : 'active';

                if (promotion.expiry_status !== newExpiryStatus) {
                    await PromotionalOfferModel.updateOne(
                        { _id: promotion._id },
                        { $set: { expiry_status: newExpiryStatus } }
                    );
                }

                return {
                    _id: promotion._id,
                    promotional_title: promotion.promotional_title,
                    offer_amount: promotion.offer_amount,
                    promotion_type: promotion.promotion_type,
                    offer_type: promotion.offer_type,
                    discount_amount: promotion.discount_amount,
                    qty: promotion.qty,
                    vendor_id: promotion.vendor_id,
                    status: promotion.status,
                    start_date: startDateFormatted,
                    expiry_date: expiryDateFormatted,
                    expiry_status: newExpiryStatus,
                };
            })
        );


        return resp.status(200).json({
            message: 'Promotions fetched successfully',
            promotions: promotionsPaths,
        });

    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const getPromotion = async (req: Request, resp: Response) => {
    const { id } = req.params;

    try {
        const promotion = await PromotionalOfferModel.findById(id);

        if (!promotion) {
            return resp.status(400).json({ message: 'Promotion not found' });
        }
        let product_id: any = []

        if (promotion.purchased_items == 'Product Wise') {
            const productData = await ProductModel.find({ _id: { $in: promotion.product_id } });
            product_id = productData.map((item) => item.sku_code);
        } else if (promotion.purchased_items == 'Entire Catalog' && promotion.removed_product_id.length != 0) {
            const productData = await ProductModel.find({ _id: { $in: promotion.removed_product_id } });
            product_id = productData.map((item) => item.sku_code);
        } else if (promotion.purchased_items == 'Entire Catalog' && promotion.removed_product_id.length == 0) {
            const productData = await ProductModel.find({ vendor_id: promotion.vendor_id });
            product_id = []
        }

        return resp.status(200).json({
            message: 'Promotion fetched successfully',
            promotion: {
                _id: promotion._id,
                offer_type: promotion.offer_type,
                promotion_type: promotion.promotion_type,
                offer_amount: promotion.offer_amount,
                promotional_title: promotion.promotional_title,
                discount_amount: promotion.discount_amount,
                purchased_items: promotion.purchased_items,
                qty: promotion.qty,
                vendor_id: promotion.vendor_id,
                product_id: product_id,
                start_date: promotion.start_date,
                expiry_date: promotion.expiry_date,
            },
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const deletePromotion = async (req: Request, resp: Response) => {
    const { id } = req.params;
    console.log(id);

    try {
        const promotion = await PromotionalOfferModel.findById(id);

        if (!promotion) {
            return resp.status(404).json({ message: 'Promotion not found' });
        }
        await PromotionalOfferModel.deleteOne({ _id: id });

        return resp.status(200).json({
            message: 'Promotion deleted successfully',
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const changePromotionStatus = async (req: Request, resp: Response) => {
    try {
        const query = { _id: req.body.id };
        const updateData = { $set: { status: req.body.status } };
        await PromotionalOfferModel.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Promotion status changed successfully.' });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addGiftCardCategory = async (req: Request, resp: Response) => {
    const {
        _id,
        title,
        sort_order,
        description
    } = req.body;

    if (!title || title.trim() === '') {
        return resp.status(400).json({ message: 'Category title is required' });
    }

    const categoryData = {
        title,
        sort_order
    };

    try {
        let category;

        const existingCategory = await GiftCardCategoryModel.findOne({
            title: { $regex: new RegExp(`^${title}$`, 'i') }, isDeleted: false
        });

        if (existingCategory && existingCategory._id.toString() !== _id) {
            return resp.status(400).json({ message: 'Gift card category already exist with this title.' });
        }

        if (_id === '0') {
            category = new GiftCardCategoryModel(categoryData);

            await category.save();
        } else {
            category = await GiftCardCategoryModel.findById(_id);
            if (!category) {
                return resp.status(404).json({ message: 'Category not found' });
            }

            category.title = title;
            category.sort_order = sort_order;
            category.description = description;
            await category.save();
        }
        await category.save();

        return resp.status(200).json({
            message: _id === '0' ? 'Category created successfully' : 'Category updated successfully',
            category,
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const uploadGiftCardCategoryImage = async (req: Request, resp: Response) => {
    try {
        const id = req.body._id;
        if (!req.file) {
            return resp.status(400).json({ message: 'Image is required' });
        }

        const imageFile = req.file;
        if (imageFile && !imageFile.mimetype.startsWith('image/')) {
            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }


        const ext = path.extname(imageFile.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const uploadDir = path.join('uploads', 'giftcard-category-images');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const destinationPath = path.join(uploadDir, fileName);
        await convertToWebP(imageFile.buffer, destinationPath);

        await GiftCardCategoryModel.findByIdAndUpdate({ _id: id }, { image: fileName }, { new: true });

        return resp.status(200).json({
            message: 'Image uploaded successfully.',
            fileName
        });

    } catch (err) {
        console.error(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const listGiftCardCategories = async (req: Request, resp: Response) => {
    try {
        const categories = await GiftCardCategoryModel.find({ isDeleted: false }).sort({ _id: -1 });

        if (categories.length === 0) {
            return resp.status(200).json({ message: 'No gift card categories found', categories: [] });
        }

        const categoriesPaths = await Promise.all(
            categories.map(async (category) => {
                const baseUrl = process.env.ASSET_URL + '/uploads/giftcard-category-images/';
                return {
                    _id: category._id,
                    title: category.title,
                    status: category.status,
                    image: category.image ? baseUrl + category.image : '',
                    sort_order: category.sort_order,
                    description: category.description
                };
            })
        );

        return resp.status(200).json({
            message: 'Gift card categories fetched successfully',
            categories: categoriesPaths,
        });
    } catch (error) {
        console.error('Error fetching gift card categories:', error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const getGiftCardCategory = async (req: Request, resp: Response) => {
    const { id } = req.params;

    try {
        const category = await GiftCardCategoryModel.findById(id)

        if (!category) {
            return resp.status(404).json({ message: 'Gift card category not found' });
        }

        let categoryPath = await buildCategoryPath(category._id);
        categoryPath = categoryPath ? rtrim(categoryPath, ' > ') : 'NA';

        const baseUrl = process.env.ASSET_URL + '/uploads/giftcard-category-images/';

        return resp.status(200).json({
            message: 'Gift card category fetched successfully',
            category: {
                _id: category._id,
                title: category.title,
                status: category.status,
                categoryPath,
                image: category.image ? baseUrl + category.image : '',
                sort_order: category.sort_order,
                description: category.description
            }
        });

    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const deleteGiftCardCategory = async (req: Request, resp: Response) => {
    const { id } = req.params;

    try {
        const giftCardCategory = await GiftCardCategoryModel.findById(id);

        if (!giftCardCategory) {
            return resp.status(400).json({ message: 'Gift card category not found' });
        }

        giftCardCategory.isDeleted = true;
        await giftCardCategory.save();

        return resp.status(200).json({
            message: 'Gift card category deleted successfully',
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const changeGiftCardCategoryStatus = async (req: Request, resp: Response) => {
    try {
        const query = { _id: req.body.id };
        const updateData = { $set: { status: req.body.status } };
        await GiftCardCategoryModel.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Gift Card Category Model status changed successfully.' });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const uploadGiftCardImage = async (req: Request, resp: Response) => {
    try {
        const id = req.body._id;
        if (!req.hasOwnProperty('file')) {
            return resp.status(400).json({ message: 'Image is required' });
        }

        const imageFile: any = req.file;

        if (imageFile && !(imageFile.mimetype.startsWith('image/'))) {
            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }

        const ext = path.extname(imageFile.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const uploadDir = path.join('uploads', 'giftcard-images');

        await GiftCardModel.findByIdAndUpdate({ _id: id }, { image: fileName }, { new: true });
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const destinationPath = path.join(uploadDir, fileName);
        await convertToWebP(imageFile.buffer, destinationPath);

        return resp.status(200).json({
            message: 'Image uploaded successfully.',
            fileName
        });

    } catch (err) {
        console.error(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addGiftCard = async (req: Request, resp: Response) => {
    const { _id,
        category_id,
        title,
        validity,
        description,
        image,
    } = req.body;

    const giftCardData = {
        category_id,
        title,
        validity,
        description,
        image,
    };

    try {
        if (!title || title.trim() === '') {
            return resp.status(400).json({ message: 'Gift card title is required' });
        }

        const giftcardcategory = await GiftCardCategoryModel.findById(category_id)

        if (!giftcardcategory) {
            return resp.status(400).json({ message: 'Gift Card Category not found' });
        }

        const existingGiftCard = await GiftCardModel.findOne({
            category_id,
            title: { $regex: new RegExp(`^${title}$`, 'i') }
        });

        if (existingGiftCard && existingGiftCard._id.toString() !== _id) {
            return resp.status(400).json({ message: 'Gift card with this title already exists in this category' });
        }

        let giftCard;
        if (_id === '0') {
            giftCard = new GiftCardModel(giftCardData);
            await giftCard.save();
            return resp.status(200).json({
                message: 'Gift card created successfully',
                giftCard,
            });
        } else {
            giftCard = await GiftCardModel.updateOne({ _id }, { $set: giftCardData });
            return resp.status(200).json({
                message: 'Gift card updated successfully',
            });
        }
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const listGiftCards = async (req: Request, resp: Response) => {
    try {
        const giftCards = await GiftCardModel.find().populate('category_id').sort({ _id: -1 });

        const giftCardsPaths = await Promise.all(
            giftCards.map(async (giftCard) => {
                let giftCardCategoryData: any = {};
                if (giftCard.category_id) {
                    giftCardCategoryData = {
                        _id: giftCard.category_id._id,
                        title: (giftCard.category_id as any).title,
                    };
                }
                return {
                    _id: giftCard._id,
                    title: giftCard.title,
                    category_id: giftCard.category_id,
                    category_title: giftCardCategoryData.title,
                    status: giftCard.status,
                    validity: giftCard.validity,
                    description: giftCard.description,
                    image: giftCard.image,
                };
            })
        );

        return resp.status(200).json({
            message: 'Gift cards fetched successfully',
            giftCards: giftCardsPaths,
        });

    } catch (error) {
        console.error('Error fetching gift cards:', error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const getGiftCard = async (req: Request, resp: Response) => {
    const { id } = req.params;

    try {
        const giftCard = await GiftCardModel.findById(id);

        if (!giftCard) {
            return resp.status(400).json({ message: 'Gift card not found' });
        }
        const base_url = process.env.ASSET_URL
        const imageUrl = giftCard.image ? `${base_url}/uploads/giftcard-images/${giftCard.image}` : '';

        const data = {
            _id: giftCard._id,
            title: giftCard.title,
            category_id: giftCard.category_id,
            status: giftCard.status,
            validity: giftCard.validity,
            description: giftCard.description,
            image: imageUrl,
        };

        return resp.status(200).json({
            message: 'Gift card fetched successfully',
            giftCard: data,
        });
    } catch (error) {
        console.error('Error fetching gift card:', error);
        return resp.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const deleteGiftCard = async (req: Request, resp: Response) => {
    const { id } = req.params;

    try {
        const giftcard = await GiftCardModel.findById(id);

        if (giftcard) {
            await GiftCardModel.deleteOne({ _id: id });

            return resp.status(200).json({
                message: 'Gift Card deleted successfully',
            });
        } else {
            return resp.status(400).json({
                message: 'Gift card not found',
            });
        }

    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
        });
    }
};

export const changeGiftCardStatus = async (req: CustomRequest, resp: Response) => {
    const { id, status } = req.body;

    try {
        const query = { _id: id };
        const updateData = { $set: { status } };
        await GiftCardModel.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Gift Card status changed successfully.' });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const listActiveGiftCardCategories = async (req: Request, resp: Response) => {
    try {
        const categories = await GiftCardCategoryModel.find({ isDeleted: false, status: true }).sort({ sort_order: 1 });

        const categoriesPaths = await Promise.all(
            categories.map(async (category) => {

                const baseUrl = process.env.ASSET_URL + '/uploads/giftcard-category-images/';

                return {
                    _id: category._id,
                    title: category.title,
                    status: category.status,
                    image: category.image ? baseUrl + category.image : '',
                };
            })
        );

        return resp.status(200).json({
            message: 'Gift card categories fetched successfully',
            categories: categoriesPaths,
        });
    } catch (error) {
        console.error('Error fetching gift card categories:', error);
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
        });
    }
};

export const getGiftCardPurchaseHistory = async (req: Request, resp: Response) => {
    try {
        const type = req.params.type;

        const history = await PurchaseGiftCardModel.find({ isRedeemed: type }).sort({ _id: -1 }).populate('gift_card_id').populate('user_id');
        let data = history.map((transaction) => {
            const purchaseTransaction = transaction.toObject();
            const giftCard = purchaseTransaction.gift_card_id as any;
            const userData = purchaseTransaction.user_id as any;
            const purchaseGiftCardTransaction = {
                _id: purchaseTransaction._id,
                orderId: purchaseTransaction.orderId,
                user_id: userData.name,
                amount: purchaseTransaction.amount,
                description: giftCard.title,
                isRedeemed: purchaseTransaction.isRedeemed,
                redeemedAt: purchaseTransaction.redeemedAt ? moment(purchaseTransaction.redeemedAt).format('YYYY-MM-DD HH:mm:ss') : null,
                delivery_date: purchaseTransaction.delivery_date ? moment(purchaseTransaction.delivery_date).format('YYYY-MM-DD HH:mm:ss') : null,
                createdAt: moment(purchaseTransaction.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                expiry_date: purchaseTransaction?.expiry_date
            };
            return purchaseGiftCardTransaction;
        });

        return resp.status(200).json({
            message: 'Gift card purchased history fetched successfully',
            history: data
        })
    } catch (error) {
        console.error('Error fetching gift card categories:', error);
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
        });
    }
};

export const resendMailForGiftCardCodeByAdmin = async (req: CustomRequest, resp: Response) => {

    const user_id = req.user._id;
    const _id = req.body._id;
    const email = req.body.email;

    try {
        let gift_code = await generateUniqueGiftCode();
        const purchaseGiftCardInstance = await PurchaseGiftCardModel.findOneAndUpdate({ _id: _id }, { gift_code: gift_code }).populate('gift_card_id');
        const giftcardData = purchaseGiftCardInstance?.gift_card_id as any;
        if (purchaseGiftCardInstance) {
            const subject = "Gift Card Code";
            const body = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                
                <div style="text-align: center;">
                <h1 style="color: #4CAF50; font-size: 28px; margin-bottom: 10px;">🎁 You've Received a Gift Card!</h1>
                <p style="font-size: 16px; color: #555;">Enjoy exclusive benefits and discounts using this card.</p>
                </div>

                <div style="margin: 30px 0; text-align: center;">
                <img src="${process.env.ASSET_URL}/uploads/giftcard-images/${giftcardData?.image}" 
                    alt="Gift Card" 
                    style="max-width: 100%; height: auto; border-radius: 10px; border: 1px solid #ddd;" />
                </div>

                <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #333; margin-bottom: 5px;">${giftcardData?.title}</h2>
                <p style="font-size: 14px; color: #777;">Use the code below during checkout</p>
                </div>

                <div style="text-align: center; margin: 20px 0;">
                <span style="display: inline-block; background-color: #f9f9f9; color: #000; padding: 15px 30px; font-size: 20px; font-weight: bold; border: 2px dashed #4CAF50; border-radius: 6px;">
                    ${gift_code}
                </span>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/redeem" 
                    style="background-color: #4CAF50; color: #fff; text-decoration: none; padding: 12px 25px; font-size: 16px; border-radius: 5px; display: inline-block;">
                    🎉 Redeem Now
                </a>
                </div>

                <div style="margin: 30px 0; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
                <p style="font-size: 14px; margin: 8px 0;"><strong>Amount:</strong> ₹${purchaseGiftCardInstance.amount}</p>
                <p style="font-size: 14px; margin: 8px 0;"><strong>Order ID:</strong> ${purchaseGiftCardInstance.orderId}</p>
                <p style="font-size: 14px; margin: 8px 0;"><strong>Valid Until:</strong> ${giftcardData?.validity} days</p>
                </div>

                <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 30px;">Thank you for choosing us. Happy gifting!</p>
            </div>
            `;
            const user = await User.findOne({ _id: user_id });
            if (!user) {
                return resp.status(400).json({ message: 'User not found' });
            }
            await sendToEmail(email, subject, body, user.email);
        }

        return resp.status(200).json({
            message: 'Gift card email sent successfully',
            giftCard: purchaseGiftCardInstance,
        });
    } catch (error) {
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
        });
    }
};

export const getAffiliateUser = async (req: Request, resp: Response) => {

    const { status } = req.params;

    try {
        const pipeline = [
            {
                $match: { status: status.toString() },
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "countryData",
                },
            },
            {
                $unwind: {
                    path: "$countryData",
                },
            },
            {
                $lookup: {
                    from: "states",
                    localField: "state_id",
                    foreignField: "_id",
                    as: "stateData",
                },
            },
            {
                $unwind: {
                    path: "$stateData",
                },
            },
            {
                $lookup: {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "cityData",
                },
            },
            {
                $unwind: {
                    path: "$cityData",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "affiliateId",
                    as: "userCommision",
                }
            },
            {
                $unwind: {
                    path: "$userCommision",
                    preserveNullAndEmptyArrays: true
                },
            },
            {
                $project: {
                    _id: "$_id",
                    name: {
                        $cond: {
                            if: { $eq: ["$last_name", ""] },
                            then: "$first_name",
                            else: { $concat: ["$first_name", " ", "$last_name"] },
                        },
                    },
                    email: 1,
                    phone: "$mobile",
                    status: 1,
                    country: "$countryData.name",
                    state: "$stateData.name",
                    city: "$cityData.name",
                    country_id: 1,
                    state_id: 1,
                    city_id: 1,
                    userCommision: "$userCommision",
                    affiliate_commission: {
                        $cond: {
                            if: { $eq: ["$status", "approved"] },
                            then: "$userCommision.affiliate_commission",
                            else: 0
                        }
                    }
                },
            },
        ];

        const AffiliateUsers = await AffiliateUser.aggregate(pipeline);

        return resp.status(200).json({ users: AffiliateUsers });
    } catch (error) {
        console.error("Error fetching users by status:", error);
        return resp.status(500).json({ error: "Internal server error." });
    }
};

export const getAffiliateUserById = async (req: Request, resp: Response) => {
    const { id } = req.params;
    try {
        const pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                },
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "countryData",
                },
            },
            {
                $unwind: {
                    path: "$countryData",
                },
            },
            {
                $lookup: {
                    from: "states",
                    localField: "state_id",
                    foreignField: "_id",
                    as: "stateData",
                },
            },
            {
                $unwind: {
                    path: "$stateData",
                },
            },
            {
                $lookup: {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "cityData",
                },
            },
            {
                $unwind: {
                    path: "$cityData",
                },
            },
            {
                $project: {
                    id: "$_id",
                    first_name: 1,
                    last_name: 1,
                    email: 1,
                    phone: "$mobile",
                    status: 1,
                    address: 1,
                    address_2: 1,
                    country: "$countryData.name",
                    state: "$stateData.name",
                    city: "$cityData.name",
                    country_id: 1,
                    state_id: 1,
                    city_id: 1,
                    pin_code: 1,
                },
            },
        ];

        const user = await AffiliateUser.aggregate(pipeline);
        if (!user || user.length === 0) {
            return resp.status(400).json({ error: "User not found" });
        }
        return resp.status(200).json({ message: "User fetched successfully.", user: user[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return resp.status(500).json({ error: "Internal server error." });
    }
};

export const changeAffiliateUserStatus = async (req: Request, resp: Response) => {
    // const { id } = req.params;
    const { _id, status, reject_remark, affiliate_commission } = req.body;

    try {
        const affiliateuser = await AffiliateUser.findOne({ _id: _id });
        if (!affiliateuser) {
            return resp.status(404).json({ error: "Affiliate user not found" });
        }

        affiliateuser.status = status;
        affiliateuser.action_date = resp.locals.currentdate().tz('Asia/Kolkata');

        affiliateuser.reject_remark = reject_remark;

        if (status === 'approved') {

            const uniqueAffiliateCode = generateAffiliateCode();
            const newUser = new User({
                email: affiliateuser.email,
                mobile: affiliateuser.mobile,
                password: affiliateuser.password,
                designation_id: '4',
                country_id: affiliateuser.country_id,
                state_id: affiliateuser.state_id,
                city_id: affiliateuser.city_id,
                address: affiliateuser.address,
                address_2: affiliateuser.address_2,
                name: `${affiliateuser.first_name} ${affiliateuser.last_name}`,
                affiliate_code: uniqueAffiliateCode,
                affiliate_commission: affiliate_commission,
                affiliateId: affiliateuser._id
            });

            await newUser.save();
        }
        await affiliateuser.save();

        return resp.status(200).json({ message: "Affiliate user status updated successfully" });
    } catch (error) {
        console.error('Error updating status:', error);
        return resp.status(500).json({ error: "Internal server error" });
    }
};

export const updateAffiliateCommission = async (req: Request, resp: Response) => {
    try {
        const { _id, affiliate_commission } = req.body;
        const affiliateuser = await AffiliateUser.findOne({ _id: _id });
        if (!affiliateuser) {
            return resp.status(404).json({ error: "Affiliate user not found" });
        }

        const user = await User.findOne({ affiliateId: affiliateuser._id });
        if (!user) {
            return resp.status(404).json({ error: "User not found" });
        }

        user.affiliate_commission = affiliate_commission;
        await user.save();

        return resp.status(200).json({ message: "Affiliate commission updated successfully" });
    } catch (error) {
        console.error('Error updating status:', error);
        return resp.status(500).json({ error: "Internal server error" });
    }
};

export const updateAffiliateUser = async (req: Request, resp: Response) => {

    const {
        _id,
        email,
        mobile,
        first_name,
        last_name,
        country_id,
        state_id,
        city_id,
        pin_code,
        address,
        address_2,
    } = req.body;

    try {
        const affiliateUser = await AffiliateUser.findOne({ _id: _id, status: { $ne: 'rejected' } });
        if (!affiliateUser) {
            return resp.status(404).json({ error: "Affiliate user not found" });
        }

        if (email && email !== affiliateUser.email) {
            const existingUser = await AffiliateUser.findOne({ email, _id: { $ne: _id } });
            if (existingUser) {
                return resp.status(400).json({ error: "Email already in use by another user." });
            }
        }

        affiliateUser.email = email;
        affiliateUser.mobile = mobile;
        affiliateUser.first_name = first_name;
        affiliateUser.last_name = last_name;
        affiliateUser.country_id = country_id;
        affiliateUser.state_id = state_id;
        affiliateUser.city_id = city_id;
        affiliateUser.pin_code = pin_code;
        affiliateUser.address = address;
        affiliateUser.address_2 = address_2;
        await affiliateUser.save();

        return resp.status(200).json({
            message: "Affiliate user updated successfully",
            affiliateUser,
        });
    } catch (error) {
        console.error("Error updating affiliate user:", error);
        return resp.status(500).json({ error: "Internal server error" });
    }
};

export const getAffiliateReport = async (req: Request, resp: Response) => {
    try {
        const currentMonth = req.query.month ? Number(req.query.month) : moment().month() + 1;
        const currentYear = req.query.year ? Number(req.query.year) : moment().year();

        const pipeline: any = [
            {
                $match: {
                    designation_id: 4
                }
            },
            {
                $lookup: {
                    from: "salesdetails",
                    localField: "_id",
                    foreignField: "affiliate_id",
                    as: "salesDetailData"
                }
            },
            {
                $unwind: {
                    path: "$salesDetailData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$salesDetailData.createdAt" }, currentMonth] },
                            { $eq: [{ $year: "$salesDetailData.createdAt" }, currentYear] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$salesDetailData.affiliate_id",
                    name: { $first: "$name" },
                    amount: { $sum: "$salesDetailData.amount" },
                    affiliate_commission: { $first: "$affiliate_commission" },
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    amount: {
                        $multiply: ["$amount", { $divide: ["$affiliate_commission", 100] }]
                    },
                    affiliate_commission: 1,
                    totalAmount: "$amount"
                }
            }
        ];

        const data = await User.aggregate(pipeline);
        return resp.status(200).json({ data });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Something went wrong. Please try again" });
    }
};

export const getAffiliateReportById = async (req: Request, resp: Response) => {
    try {
        const affiliateId = req.params.id;

        const pipeline: any = [
            {
                $match: {
                    affiliate_id: new mongoose.Types.ObjectId(affiliateId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "userData"
                }
            },
            {
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    customer_name: "$userData.name",
                    createdAt: 1,
                    product_name: "$productData.product_title",
                    amount: 1
                }
            }
        ];

        const data = await SalesDetailsModel.aggregate(pipeline);
        return resp.status(200).json({ data });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Something went wrong. Please try again" });
    }
};

export const addShippingTemplate = async (req: CustomRequest, resp: Response) => {
    try {
        const { title, shippingTemplateData, _id } = req.body;

        let vendor_id = req.user._id

        const findAdmin = await User.findOne({ _id: req.user._id, designation_id: 2 })

        if (findAdmin) {
            vendor_id = null
        }
        if (!title || !shippingTemplateData) {
            return resp.status(400).json({ message: 'Please provide title and standard shipping.' });
        }

        const existTemplate = await ShippingModel.findOne({ title: title, vendor_id: req.user._id });

        if (existTemplate && existTemplate._id.toString() !== _id) {
            return resp.status(400).json({ message: 'Shipping template already exists with this title.' });
        }

        if (_id == 'new') {

            const data = await ShippingModel.create({ title: title, shippingTemplateData: shippingTemplateData, vendor_id: vendor_id });

            return resp.status(200).json({ message: 'Shipping Template created successfully.', success: true, data });
        } else {

            const query = { _id: _id }
            const updateData = { $set: { title: title, shippingTemplateData: shippingTemplateData } }

            await ShippingModel.updateOne(query, updateData);

            return resp.status(200).json({ message: 'Shipping Template updated successfully.' });
        }


    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Something went wrong. Please try again" });
    }
}

export const getShippingTemplate = async (req: CustomRequest, resp: Response) => {
    try {

        const templates = await ShippingModel.find({
            $or: [
                { vendor_id: new mongoose.Types.ObjectId(req.user._id) },
                { vendor_id: { $eq: null } }
            ]
        });

        return resp.status(200).json({ message: 'Shipping Template fetched successfully.', success: true, templates });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Something went wrong. Please try again" });
    }
}

export const getShippingTemplateById = async (req: CustomRequest, resp: Response) => {
    try {
        const { id } = req.params;
        const template = await ShippingModel.findOne({
            _id: id, $or: [
                { vendor_id: new mongoose.Types.ObjectId(req.user._id) },
                { vendor_id: { $eq: null } }
            ]
        });
        return resp.status(200).json({ message: 'Shipping Template fetched successfully.', success: true, template });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Something went wrong. Please try again" });
    }
}

export const setDefaultTemplate = async (req: CustomRequest, resp: Response) => {
    try {
        const { id, isDefault } = req.body;
        const template = await ShippingModel.findOne({
            _id: id, $or: [
                { vendor_id: new mongoose.Types.ObjectId(req.user._id) },
                { vendor_id: { $eq: null } }
            ]
        });

        if (!template) {
            return resp.status(400).json({ message: 'Shipping Template not found.' });
        }

        if (isDefault) {
            await ShippingModel.updateMany({
                $or: [
                    { vendor_id: new mongoose.Types.ObjectId(req.user._id) },
                    { vendor_id: { $eq: null } }
                ]
            }, { $set: { isDefault: false } });
        }

        template.isDefault = isDefault;
        await template.save();

        return resp.status(200).json({ message: 'Shipping Template updated successfully.' });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Something went wrong. Please try again" });
    }
}

export const deleteShippingTemplate = async (req: CustomRequest, resp: Response) => {
    try {
        const { id } = req.body;
        const template = await ShippingModel.findOne({
            _id: id, $or: [
                { vendor_id: new mongoose.Types.ObjectId(req.user._id) },
                { vendor_id: { $eq: null } }
            ]
        });

        if (!template) {
            return resp.status(400).json({ message: 'Shipping Template not found.' });
        }

        await ShippingModel.deleteOne({ _id: id });
        return resp.status(200).json({ message: 'Shipping Template deleted successfully.' });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Something went wrong. Please try again" });
    }
}

export const getAllShippingTemplate = async (req: CustomRequest, resp: Response) => {
    try {
        const vendor_id = req.params.id;
        if(!vendor_id) {
            return resp.status(400).json({error: "Vendor ID is required in params."});
        }
        const template = await ShippingModel.find({vendor_id});
        return resp.status(200).json({ message: 'Shipping Template fetched successfully.', template });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Something went wrong. Please try again" });
    }
}

export const getSubscribeData = async (req: CustomRequest, resp: Response) => {
    try {
        const { start_date, end_date } = req.query;

        const pipeline: any[] = [];

        const startDateStr = String(start_date);
        const endDateStr = String(end_date);

        if (start_date && end_date) {
            pipeline.push({
                $match: {
                    createdAt: {
                        $gte: new Date(startDateStr),
                        $lte: new Date(endDateStr + 'T23:59:59.999Z'),
                    },
                },
            });
        }


        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    let: { email: "$email" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$email", "$$email"] },
                                        { $eq: ["$designation_id", 1] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "userData",
                },
            },
            {
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    customerId: {
                        $ifNull: ["$userData.id_number", "N/A"],
                    },
                },
            }
        );

        const data = await SubscribeModel.aggregate(pipeline);
        return resp.status(200).json({ message: 'Subscribe data fetched successfully.', data });

    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Something went wrong. Please try again" });
    }
};

export const addBanner = async (req: Request, resp: Response) => {
    try {
        if (!req.hasOwnProperty('file') && req.body._id === '0') {
            return resp.status(400).json({ message: 'Banner image is required' });
        }

        const bannerImageFile = req.file;
        let fileName = "";

        if (bannerImageFile && !(bannerImageFile.mimetype.startsWith('image/'))) {
            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        } else if (bannerImageFile) {
            const uploadsDir = path.join('uploads', 'banner');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const convertedFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const webpDestinationPath = path.join(uploadsDir, convertedFileName);
            await convertToWebP(bannerImageFile.buffer, webpDestinationPath);
            fileName = convertedFileName;
        }

        if (req.body._id === '0') {
            await BannerModel.create({ image: fileName });
            return resp.status(200).json({ message: 'Banner created successfully.', reset: true });
        } else {
            const existBanner = await BannerModel.findOne({ _id: req.body._id });
            if (existBanner) {
                if (fileName) {
                    const oldImage = existBanner.image;
                    const oldImagePath = path.join('uploads', 'banner', oldImage);
                    if (fs.existsSync(oldImagePath)) {
                        await fs.promises.unlink(oldImagePath);
                    }
                } else {
                    fileName = existBanner.image;
                }

                await BannerModel.updateOne({ _id: req.body._id }, { $set: { image: fileName } });
                return resp.status(200).json({ message: 'Banner updated successfully.' });
            }
            else {
                return resp.status(404).json({ message: 'Banner not found.' });
            }
        }
    } catch (err) {
        console.error('Error:', err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const bannerList = async (req: CustomRequest, resp: Response) => {

    try {
        const query: any = {
            deletedAt: null
        }
        const bannerList = await BannerModel.find().sort({ _id: -1 });

        if (!bannerList) {
            return resp.status(403).json({ message: 'Banner not found.' });
        }
        const baseurl = process.env.ASSET_URL + '/uploads/banner/';

        var data = bannerList.map(function (banner) {
            return {
                _id: banner._id,
                image: baseurl + banner.image,
                status: banner.status,
                createdAt: banner.createdAt,
                updatedAt: banner.updatedAt
            }
        });

        return resp.status(200).json({ messgae: "Banner list fetch successfully", data });

    } catch (err) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }

}

export const changeBannerStatus = async (req: Request, resp: Response) => {

    try {

        const query = { _id: req.body.id }
        const updateData = { $set: { status: req.body.status } }
        await BannerModel.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Status changed successfully.' });

    } catch (err) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }

}

export const deleteBanner = async (req: Request, resp: Response) => {

    try {
        const id = req.params.id;

        const banner = await BannerModel.findOne({ _id: id });

        if (banner) {

            await BannerModel.deleteOne({ _id: banner._id });

            return resp.status(200).json({ message: 'Banner deleted successfully.' });

        } else {
            return resp.status(403).json({ message: 'Banner not found.' });

        }

    } catch (err) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }

}

export const getBanner = async (req: Request, resp: Response) => {
    try {
        const banner = await BannerModel.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

        if (!banner) {
            return resp.status(404).json({ message: 'banner not found.' });
        }

        const baseurl = process.env.ASSET_URL + '/uploads/banner/';

        const data = {
            _id: banner._id,
            image: baseurl + banner.image,
            status: banner.status,
            createdAt: banner.createdAt,
            updatedAt: banner.updatedAt
        };

        return resp.status(200).json({ message: 'Banner fetched successfully.', data });

    } catch (err) {
        console.log(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getGiftCardDescription = async (req: Request, resp: Response) => {

    const description = await GiftCardDescriptionModel.findOne();

    return resp.status(200).json({ description });
};

export const addGiftCardDescription = async (req: Request, resp: Response) => {
    try {
        const data: any = {
            description: req.body.description
        }

        if (req.body._id && req.body._id == 'new') {

            await GiftCardDescriptionModel.create(data);

            return resp.status(200).json({ message: `Description added successfully.`, script: true });

        }
        else {
            const result = await GiftCardDescriptionModel.updateOne(
                { _id: req.body._id },
                { $set: data }
            );
            return resp.status(200).json({ message: `Description updated successfully.` });
        }
    } catch (err) {

        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addPolicy = async (req: CustomRequest, res: Response) => {
    try {
        const { policyTitle, _id, returns, exchange, returnExchangeTime, description } = req.body;

        if (!policyTitle) {
            return res.status(400).json({ message: "Policy title is required." });
        }

        let policy;
        if (_id === 'new') {
            const existingPolicy = await PolicyModel.findOne({ policyTitle });
            if (existingPolicy) {
                return res.status(400).json({ message: 'Policy already exists.' });
            }
            policy = await PolicyModel.create({ vendor_id: req.user._id, policyTitle: policyTitle, description: description, returns: returns, exchange: exchange, returnExchangeTime: returnExchangeTime });

            await policy.save();
            return res.status(200).json({ message: "Policy added successfully.", policy });
        } else {

            const existingPolicy = await PolicyModel.findOne({ policyTitle: policyTitle, _id: { $ne: req.body._id } });

            if (existingPolicy) {
                return res.status(400).json({ message: 'Policy already exists.', success: false });
            }

            policy = await PolicyModel.findByIdAndUpdate(
                _id,
                { policyTitle: policyTitle, description: description, returns: returns, exchange: exchange, returnExchangeTime: returnExchangeTime },
                { new: true, runValidators: true }
            );
            if (!policy) {
                return res.status(404).json({ message: "Policy not found." });
            }
            return res.status(200).json({ message: "Policy updated successfully.", policy });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const policyList = async (req: CustomRequest, res: Response) => {
    try {
        const policies = await PolicyModel.find({ vendor_id: req.user._id }).sort({ _id: -1 });
        return res.status(200).json({ message: "Policies fetched successfully.", policies });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const deletePolicy = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params
        const policy = await PolicyModel.deleteOne({ _id: id, vendor_id: req.user._id })
        return res.status(200).json({ message: "Policy deleted successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const policyChangeStatus = async (req: CustomRequest, res: Response) => {
    try {
        const { id, status } = req.body
        const policy = await PolicyModel.updateOne({ _id: id, vendor_id: req.user._id }, { $set: { status } })
        return res.status(200).json({ message: "Policy status changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getPolicy = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params;

        const query = {
            _id: id,
            vendor_id: req.user._id
        }

        const policy = await PolicyModel.findOne(query);

        if (!policy) {
            return res.status(404).json({ message: "Policy not found." });
        }

        return res.status(200).json({ message: "Policy fetched successfully.", policy });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const sendMailToSubscribers = async (req: any, res: Response) => {
    try {
        const { id, description } = req.body;
        const data = await SubscribeModel.find({ _id: { $in: id } });

        for (const subscriber of data) {
            const unsubscribeUrl = `https://project.imgglobal.in/ecommercereact/backend/api/changeMailStatus?id=${subscriber._id}&status=unsubscribe`;

            const htmlContent = `
            <div>
            <p>${description}</p>
            <br/>
            <p style="font-size: 12px; color: #555;">
                This email has been sent to members who have requested to join the mailing list.
                If you do not wish to receive emails, you can 
                <a href="${unsubscribeUrl}" style="color: #e53935; text-decoration: none; font-weight: bold;">
                unsubscribe
                </a>.
            </p>
            </div>
            `;


            await sendToEmail(
                subscriber.email,
                "Thanks for subscribing.",
                htmlContent,
                req.user.email
            );
        }

        return res.status(200).json({ message: "Email sent successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};


export const addStoreSetting = async (req: CustomRequest, res: Response) => {
    try {
        const { storeName, _id, skuCode, sortOrder, type, product_title } = req.body;
        const query: any = {}

        if (type === 'sku') {
            query.sku_code = { $in: skuCode };
        }

        if (type === 'title') {
            query.product_title = { $in: product_title };
        }

        let vendor_id = null;
        let product_id: any = [];

        if (skuCode) {
            const productData = await ProductModel.find(query);
            product_id = productData.map((item: any) => item._id);
        }

        if (req.user.designation_id === 3) {
            vendor_id = req.user._id
        }

        let storeSetting;
        if (_id === 'new') {

            storeSetting = await StoreSettingModel.create({ vendor_id: vendor_id, type: type, storeName: storeName, sortOrder: sortOrder, product_id: product_id });

            await storeSetting.save();
            return res.status(200).json({ message: "Store Setting added successfully.", storeSetting });
        } else {

            storeSetting = await StoreSettingModel.findByIdAndUpdate(
                _id,
                { vendor_id: vendor_id, storeName: storeName, sortOrder: sortOrder, product_id: product_id, type: type },
                { new: true, runValidators: true }
            );

            return res.status(200).json({ message: "Store Setting updated successfully.", storeSetting });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getStoreSettings = async (req: CustomRequest, res: Response) => {
    try {
        let vendor_id = null;

        if (req.user.designation_id === 3) {
            vendor_id = req.user._id
        }

        const storeSettings = await StoreSettingModel.find({ vendor_id: vendor_id }).sort({ _id: -1 });
        return res.status(200).json({ message: "Store Setting fetched successfully.", storeSettings });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const deleteStoreSetting = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params
        let vendor_id = null;

        if (req.user.designation_id === 3) {
            vendor_id = req.user._id
        }
        const storeSetting = await StoreSettingModel.deleteOne({ _id: id, vendor_id: vendor_id })
        return res.status(200).json({ message: "Store Setting deleted successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const storeSettingChangeStatus = async (req: CustomRequest, res: Response) => {
    try {
        const { id, status } = req.body
        let vendor_id = null;

        if (req.user.designation_id === 3) {
            vendor_id = req.user._id
        }
        const storeSetting = await StoreSettingModel.updateOne({ _id: id, vendor_id: vendor_id }, { $set: { status } })
        return res.status(200).json({ message: "Store Setting changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getStoreSettingById = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params;
        let vendor_id = null;

        if (req.user.designation_id === 3) {
            vendor_id = req.user._id
        }
        const query = {
            _id: id,
            vendor_id: vendor_id
        }

        const storeSetting = await StoreSettingModel.findOne(query);

        if (!storeSetting) {
            return res.status(404).json({ message: "Store Setting not found." });
        }

        return res.status(200).json({ message: "Store Setting fetched successfully.", storeSetting });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};


export const getProductByVendor = async (req: CustomRequest, res: Response) => {
    try {
        const vendor_id = req.user._id;
        const productImageBase = process.env.ASSET_URL + '/uploads/product/';

        const products = await ProductModel.find({ vendor_id: vendor_id })
            .select('product_title _id image zoom')
            .sort({ _id: -1 });

        const updatedProducts = products.map((product: any) => ({
            _id: product._id,
            product_title: product.product_title,
            zoom: product.zoom,
            product_image: product.image && product.image.length > 0
                ? productImageBase + product.image[0]
                : null
        }));

        return res.status(200).json({
            success: true,
            message: "Products fetched successfully.",
            products: updatedProducts
        });

    } catch (err) {
        console.error("Error in getProductByVendor:", err);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
};


export const createStore = async (req: CustomRequest, res: Response) => {
    try {
        const { store_name, product_select, selected_sku_codes, selected_products, sort_order } = req.body;
        const vendor_id = req.user._id;

        const nameExists = await storeModel.findOne({ vendor_id, store_name });
        if (nameExists) {
            return res.status(400).json({ message: 'Store name already exists for this vendor.' });
        }

        const sortOrderExists = await storeModel.findOne({ vendor_id, sort_order });
        if (sortOrderExists) {
            return res.status(400).json({ message: 'Sort order already exists for this vendor.' });
        }

        const store = await storeModel.create({
            store_name,
            vendor_id,
            product_select,
            selected_sku_codes,
            selected_products,
            sort_order
        });

        return res.status(200).json({ message: "Store created successfully.", store });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const updateStore = async (req: CustomRequest, res: Response) => {
    try {
        const { store_name, product_select, selected_sku_codes, selected_products, sort_order, _id } = req.body;
        const vendor_id = req.user._id;

        const nameExists = await storeModel.findOne({
            vendor_id,
            store_name,
            _id: { $ne: _id }
        });

        if (nameExists) {
            return res.status(400).json({ message: 'Store name already exists for this vendor.' });
        }

        const sortOrderExists = await storeModel.findOne({
            vendor_id,
            sort_order,
            _id: { $ne: _id }
        });

        if (sortOrderExists) {
            return res.status(400).json({ message: 'Sort order already exists for this vendor.' });
        }

        const store = await storeModel.findByIdAndUpdate(
            _id,
            {
                store_name,
                vendor_id,
                product_select,
                selected_sku_codes,
                selected_products,
                sort_order
            },
            { new: true }
        );

        return res.status(200).json({ message: "Store updated successfully.", store });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const deleteStore = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params
        const vendor_id = req.user._id;
        const store = await storeModel.deleteOne({ _id: id, vendor_id: vendor_id })
        return res.status(200).json({ message: "Store deleted successfully.", store });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getStore = async (req: CustomRequest, res: Response) => {
    try {
        const stores = await storeModel.find({ vendor_id: req.user._id }).sort({ _id: -1 });
        if (!stores) {
            return res.status(404).json({ message: 'Store not found.' });
        }
        return res.status(200).json({ message: 'Store fetched successfully.', stores });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getStoreById = async (req: CustomRequest, res: Response) => {
    try {
        const { id } = req.params;
        const store = await storeModel.findById(id);
        if (!store) {
            return res.status(404).json({ message: 'Store not found.' });
        }
        return res.status(200).json({ message: 'Store fetched successfully.', store });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const updateStoreStatus = async (req: CustomRequest, res: Response) => {
    try {
        const { id, status } = req.body
        const store = await storeModel.updateOne({ _id: id, vendor_id: req.user._id }, { $set: { status } })
        return res.status(200).json({ message: "Store status changed successfully.", store });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const countryBlocked = async (req: CustomRequest, res: Response) => {
    try {
        const { country_names } = req.body;

        if (!Array.isArray(country_names) || country_names.length === 0) {
            return res.status(400).json({ message: "country_names array is required." });
        }

        const blockResult = await CountryModel.updateMany(
            { name: { $in: country_names } },
            { $set: { isBlocked: true } }
        );

        const unblockResult = await CountryModel.updateMany(
            { name: { $nin: country_names } },
            { $set: { isBlocked: false } }
        );

        return res.status(200).json({
            message: "Countries' blocked status updated successfully.",
            blockedCount: blockResult.modifiedCount,
            unblockedCount: unblockResult.modifiedCount
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getOrderHistory = async (req: CustomRequest, res: Response) => {
    try {
        const { sales_id } = req.body;

        const pipeline: any[] = [
            { $match: { _id: new mongoose.Types.ObjectId(sales_id) } },
            {
                $lookup: {
                    from: "salesdetails",
                    localField: "_id",
                    foreignField: "sale_id",
                    as: "saleDetaildata",
                    pipeline: [
                        // ⭐ NEW: fetch latest buyer note for each sale detail
                        {
                            $lookup: {
                                from: "buyernotes", // <-- adjust collection name if different
                                let: {
                                    bn_user_id: "$user_id",
                                    bn_vendor_id: "$vendor_id",
                                    bn_product_id: "$product_id",
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$user_id", "$$bn_user_id"] },
                                                    { $eq: ["$vendor_id", "$$bn_vendor_id"] },
                                                    { $eq: ["$product_id", "$$bn_product_id"] },
                                                ],
                                            },
                                        },
                                    },
                                    { $sort: { updatedAt: -1, createdAt: -1 } },
                                    { $limit: 1 },
                                    {
                                        $project: {
                                            _id: 0,
                                            buyer_note: { $ifNull: ["$buyer_note", "$note"] },
                                        },
                                    },
                                ],
                                as: "buyerNoteData",
                            },
                        },
                        {
                            $addFields: {
                                buyer_note: {
                                    // prefer note from buyernotes; fallback to existing field if present
                                    $ifNull: [{ $arrayElemAt: ["$buyerNoteData.buyer_note", 0] }, "$buyer_note"],
                                },
                            },
                        },
                        // keep response shape EXACTLY like before
                        {
                            $project: {
                                _id: 1,
                                qty: 1,
                                product_id: 1,
                                vendor_id: 1,
                                sub_total: 1,
                                promotional_discount: 1,
                                discount: 1,
                                coupon_discount: 1,
                                amount: 1,
                                delivery: 1,
                                seller_note: 1,
                                buyer_note: 1, // now enriched
                                shippingName: 1,
                                shippingAmount: 1,
                                original_price: 1,
                                couponData: 1,
                                couponDiscountAmount: 1,
                                order_status: 1,
                                delivery_status: 1,
                                productData: {
                                    _id: 1,
                                    product_title: 1,
                                    image: 1,
                                    sale_price: 1,
                                    price: 1,
                                    slug: 1,
                                    vendor_id: 1,
                                    vendor_name: 1,
                                },
                                deliveryData: 1,
                            },
                        },
                    ],
                },
            },
            { $match: { saleDetaildata: { $ne: [] } } },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "userData",
                },
            },
            { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    deliveryExpectedDate: {
                        $dateAdd: {
                            startDate: "$createdAt",
                            unit: "day",
                            amount: 5,
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    order_id: 1,
                    createdAt: 1,
                    payment_status: 1,
                    subtotal: 1,
                    voucher_dicount: 1,
                    deliveryExpectedDate: 1,
                    state: 1,
                    country: 1,
                    city: 1,
                    address_line1: 1,
                    wallet_used: 1,
                    address_line2: 1,
                    pincode: 1,
                    userName: "$userData.name",
                    id_number: "$userData.id_number",
                    mobile: "$userData.mobile",
                    userEmail: "$userData.email",
                    user_id: "$userData._id",
                    saleDetaildata: 1,
                },
            },
        ];

        const sales = await salesModel.aggregate(pipeline);
        const base_url = `${process.env.ASSET_URL}/uploads/product/`;

        let redStar = false;
        let greenStar = false;

        if (sales.length > 0) {
            const sale = sales[0];
            const userId = sale.user_id;
            const saleDetailItems = sale.saleDetaildata;

            // ⭐ star logic (unchanged)
            if (userId) {
                const vendorAgg = await SalesDetailsModel.aggregate([
                    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
                    { $group: { _id: "$vendor_id", cnt: { $sum: 1 } } },
                ]);
                const distinctVendors = vendorAgg.length;
                const hasMultiFromSameVendor = vendorAgg.some((v) => (v.cnt || 0) > 1);
                greenStar = distinctVendors > 1;
                redStar = hasMultiFromSameVendor;
            }

            // (rest enrichment untouched)
            const vendorProductPairs = saleDetailItems.map((item: any) => ({
                vendor_id: item.vendor_id,
                product_id: item.product_id,
            }));

            const allPromotions = await PromotionalOfferModel.find({
                $and: [
                    {
                        $or: vendorProductPairs.map((pair: any) => ({
                            vendor_id: pair.vendor_id,
                            product_id: { $in: [pair.product_id] },
                        })),
                    },
                    { expiry_status: { $ne: "expired" } },
                ],
            });

            const allCoupons = await CouponModel.find({
                $or: vendorProductPairs.map((pair: any) => ({
                    vendor_id: pair.vendor_id,
                    product_id: { $in: [pair.product_id] },
                })),
            });

            for (const item of saleDetailItems) {
                const baseAmount = Number(item.amount || 0);
                const promoDiscount = Number(item.promotional_discount || 0);
                const couponDiscount = Number(item.coupon_discount || 0);
                const finalAmount = baseAmount - promoDiscount - couponDiscount;

                item.finalAmount = parseFloat(finalAmount.toFixed(2));
                item.priceBreakdown = {
                    itemSubtotal: baseAmount,
                    todaySale: promoDiscount,
                    couponDiscount: couponDiscount,
                    itemTotal: parseFloat(finalAmount.toFixed(2)),
                };

                if (item.productData?.image?.length > 0) {
                    item.productData.image = item.productData.image.map(
                        (img: string) => base_url + img
                    );
                }

                const promo = allPromotions.find(
                    (p) =>
                        p.vendor_id.toString() === item.vendor_id.toString() &&
                        p.product_id.map((id: any) => id.toString()).includes(item.product_id.toString())
                );

                if (promo) {
                    item.promotionalOfferData = {
                        _id: promo._id,
                        promotional_title: promo.promotional_title,
                        discount_amount: promo.discount_amount,
                        purchased_items: promo.purchased_items,
                        product_id: promo.product_id,
                        vendor_id: promo.vendor_id,
                        offer_type: promo.offer_type,
                        expiry_status: promo.expiry_status,
                    };
                }

                const couponMatch = allCoupons.find(
                    (c) =>
                        c.vendor_id.toString() === item.vendor_id.toString() &&
                        c.product_id.map((id: any) => id.toString()).includes(item.product_id.toString())
                );

                if (couponMatch) {
                    item.matchedCouponOfferData = {
                        _id: couponMatch._id,
                        vendor_id: couponMatch.vendor_id,
                        coupon_title: couponMatch.coupon_title,
                        coupon_code: couponMatch.coupon_code,
                        coupon_description: couponMatch.coupon_description,
                        discount_amount: couponMatch.discount_amount,
                        discount_type: couponMatch.discount_type,
                        product_id: couponMatch.product_id,
                    };
                }
            }

            sales[0].redStar = redStar;
            sales[0].greenStar = greenStar;
        }

        return res.status(200).json({
            message: "Order History fetched successfully.",
            sales,
            base_url,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

export const getOrderHistory2 = async (req: CustomRequest, res: Response) => {
    try {
        const { user_id, vendor_id } = req.body;

        const pipeline: any[] = [
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id)
                }
            },
            {
                $lookup: {
                    from: 'salesdetails',
                    let: { saleId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$sale_id', '$$saleId'] },
                                        { $eq: ['$vendor_id', new mongoose.Types.ObjectId(vendor_id)] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'variants',
                                localField: 'variant_id',
                                foreignField: '_id',
                                as: 'variantData'
                            }
                        },
                        {
                            $lookup: {
                                from: 'variantattributes',
                                localField: 'variant_attribute_id',
                                foreignField: '_id',
                                as: 'variantAttributeData'
                            }
                        }
                    ],
                    as: 'saleDetaildata'
                }
            },
            {
                $match: {
                    saleDetaildata: { $ne: [] }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            {
                $unwind: {
                    path: '$userData',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    order_id: 1,
                    subtotal: 1,
                    payment_status: 1,
                    state: 1,
                    country: 1,
                    city: 1,
                    address_line1: 1,
                    address_line2: 1,
                    pincode: 1,
                    userName: '$userData.name',
                    userEmail: '$userData.email',
                    saleDetaildata: 1,
                    createdAt: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ];

        const sales = await salesModel.aggregate(pipeline);
        const base_url = `${process.env.ASSET_URL}/uploads/product/`;

        return res.status(200).json({
            message: 'Order History fetched successfully.',
            sales,
            base_url
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getReviews = async (req: Request, resp: Response) => {
    try {
        const user_id = req.body.user_id;
        const vendor_id = req.body.vendor_id;

        let pipe: any[] = [];

        pipe.push(
            {
                '$match': {
                    'user_id': new mongoose.Types.ObjectId(user_id),
                    'status': 'approved'
                }
            },
            {
                '$lookup': {
                    'from': 'products',
                    'localField': 'product_id',
                    'foreignField': '_id',
                    'as': 'productData',
                    'pipeline': [
                        {
                            $match: {
                                'vendor_id': new mongoose.Types.ObjectId(vendor_id)
                            }
                        },
                    ]
                }
            },
            {
                $match: {
                    'productData': { $ne: [] }
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'user_id',
                    'foreignField': '_id',
                    'as': 'userData'
                }
            },
            {
                '$unwind': {
                    'path': '$userData',
                    'preserveNullAndEmptyArrays': true
                }
            }
        );

        pipe.push(
            {
                '$project': {
                    '_id': 1,
                    'delivery_rating': 1,
                    'item_rating': 1,
                    'additional_comment': 1,
                    'userName': '$userData.name',
                    'userEmail': '$userData.email',
                    'productData': 1,
                    'createdAt': 1
                }
            },
            {
                '$sort': { 'createdAt': -1 }
            },
        );

        const data = await RatingModel.aggregate(pipe);
        const base_url = process.env.ASSET_URL + '/uploads/product/';

        return resp.status(200).json({ message: "Review fetched successfully.", data, base_url });

    } catch (error) {
        console.log(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getFavoriteProducts = async (req: Request, resp: Response) => {
    try {
        const user_id = req.body.user_id;
        const vendor_id = req.body.vendor_id;

        let pipe: any[] = [];

        pipe.push(
            {
                '$match': {
                    'user_id': new mongoose.Types.ObjectId(user_id),
                }
            },
            {
                '$lookup': {
                    'from': "variants",
                    'localField': "variant_id",
                    'foreignField': "_id",
                    'as': "variantData",
                },
            },
            {
                '$lookup': {
                    'from': "variantattributes",
                    'localField': "variant_attribute_id",
                    'foreignField': "_id",
                    'as': "variantAttributeData",
                },
            },
            {
                '$lookup': {
                    'from': 'products',
                    'localField': 'product_id',
                    'foreignField': '_id',
                    'as': 'productData',
                    'pipeline': [
                        {
                            $match: {
                                'vendor_id': new mongoose.Types.ObjectId(vendor_id)
                            }
                        },
                    ]
                }
            },
            {
                $match: {
                    'productData': { $ne: [] }
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'user_id',
                    'foreignField': '_id',
                    'as': 'userData'
                }
            },
            {
                '$unwind': {
                    'path': '$userData',
                    'preserveNullAndEmptyArrays': true
                }
            }
        );

        pipe.push(
            {
                '$project': {
                    '_id': 1,
                    'isCombination': 1,
                    'variant_id': 1,
                    'variant_attribute_id': 1,
                    'userName': '$userData.name',
                    'userEmail': '$userData.email',
                    'original_price': 1,
                    'price': 1,
                    'status': 1,
                    'productData': 1,
                    'variantData': 1,
                    'variantAttributeData': 1,
                    'createdAt': 1
                }
            },
            {
                '$sort': { 'createdAt': -1 }
            },
        );

        const data = await wishlistModel.aggregate(pipe);
        const base_url = process.env.ASSET_URL + '/uploads/product/';

        return resp.status(200).json({ message: "Review fetched successfully.", data, base_url });

    } catch (error) {
        console.log(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getBlockedCountry = async (req: CustomRequest, res: Response) => {
    try {
        const countries = await CountryModel.find({ isBlocked: true });
        return res.status(200).json({ message: 'Blocked countries fetched successfully.', countries });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const addDescription = async (req: CustomRequest, res: Response) => {
    try {
        const data: any = {
            type: req.body.type,
            description: req.body.description
        }

        if (req.body._id && req.body._id == 'new') {

            await SettingModel.create(data);

            return res.status(200).json({ message: `${req.body.type} added successfully.`, script: true });

        }
        else {
            const result = await SettingModel.updateOne(
                { _id: req.body._id },
                { $set: data }
            );
            return res.status(200).json({ message: `${req.body.type} updated successfully.` });
        }
    } catch (err) {

        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getDescription = async (req: CustomRequest, res: Response) => {
    try {
        const rawType = req.params.type;
        const typeKey = rawType?.toLowerCase();

        const typeMappings: Record<string, string> = {
            'terms-condition': 'Terms & Conditions',
            'privacy-policy': 'Privacy Policy',
            'our-top-brands': 'Our Top Brands',
            'our-top-store': 'Our Top Store',
            'wholesale': 'Wholesale',
            'about-agukart': 'About Agukart',
            'contact-shop': 'Contact Shop',
            'contact-us': 'Contact Us',
            'affiliate': 'Affiliate',
        };

        const matchedType = typeMappings[typeKey];

        if (!matchedType) {
            return res.status(400).json({ message: 'Invalid type.' });
        }

        const information = await SettingModel.findOne({ type: matchedType });

        return res.status(200).json({
            success: true,
            type: matchedType,
            data: information || {}
        });

    } catch (error: any) {
        console.error('Error fetching description:', error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

export const getStoreReport = async (req: CustomRequest, res: Response) => {
    try {
        const productBaseUrl = `${process.env.ASSET_URL}/uploads/product/`;
        const shopBaseUrl = `${process.env.ASSET_URL}/uploads/shop-icon/`;
        const pipeline: any = [
            {
                $match: {
                    reporttype: "shop",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "store_id",
                    foreignField: "_id",
                    as: "vendorDetails",
                    pipeline: [
                        {
                            $lookup: {
                                from: "vendordetails",
                                localField: "_id",
                                foreignField: "user_id",
                                as: "storedetail",
                            },
                        },
                        {
                            $unwind: {
                                path: "$storedetail",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$vendorDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
        ]
        const storeReport = await reportModel.aggregate(pipeline);
        return res.status(200).json({ message: 'Store report fetched successfully.', storeReport, productBaseUrl, shopBaseUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getProductReport = async (req: CustomRequest, res: Response) => {
    try {
        const shopBaseUrl = `${process.env.ASSET_URL}/uploads/shop-icon/`;
        const productBaseUrl = `${process.env.ASSET_URL}/uploads/product/`;
        const pipeline: any = [
            {
                $match: {
                    reporttype: "product",
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "productdetails",
                },
            },
            {
                $unwind: {
                    path: "$productdetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "vendordetails",
                    localField: "productdetails.vendor_id",
                    foreignField: "user_id",
                    as: "vendordata",
                },
            },
            {
                $unwind: {
                    path: "$vendordata",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
        ]
        const productReport = await reportModel.aggregate(pipeline);
        return res.status(200).json({ message: 'Product report fetched successfully.', productReport, shopBaseUrl, productBaseUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getSingleReportById = async (req: CustomRequest, res: Response) => {
    try {
        const id = req.params.id;
        const productBaseUrl = `${process.env.ASSET_URL}/uploads/product/`;
        const shopBaseUrl = `${process.env.ASSET_URL}/uploads/shop-icon/`;
        if (!id) {
            return res.status(400).json({ message: 'Report ID is required.' });
        }
        const pipeline: any = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "productdetail",
                    pipeline: [
                        {
                            $lookup: {
                                from: "vendordetails",
                                localField: "vendor_id",
                                foreignField: "user_id",
                                as: "shopdata",
                            },
                        },
                        {
                            $unwind: {
                                path: "$shopdata",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "vendordetails",
                    localField: "store_id",
                    foreignField: "user_id",
                    as: "storedata",
                },
            },
            {
                $unwind: {
                    path: "$storedata",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: "$productdetail",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
        ]

        const report = await reportModel.aggregate(pipeline);
        const singleReport = report[0];
        return res.status(200).json({ message: 'Report fetched successfully.', report: singleReport, productBaseUrl, shopBaseUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const extandGiftCardExpiryDate = async (req: CustomRequest, res: Response) => {
    try {
        const { id, expiryDate } = req.body;
        if (!id || !expiryDate) {
            return res.status(400).json({ message: 'Gift card ID and expiry date are required.' });
        }

        const giftCard = await PurchaseGiftCardModel.findById(id);
        if (!giftCard) {
            return res.status(404).json({ message: 'Gift card not found.' });
        }

        giftCard.expiry_date = expiryDate;
        await giftCard.save();

        return res.status(200).json({ message: 'Gift card expiry date extended successfully.', giftCard });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const setProductBedge = async (req: CustomRequest, res: Response) => {
    try {
        const { product_id, badge } = req.body;
        if (!product_id) {
            return res.status(400).json({ message: 'Product ID is required.' });
        }

        const product = await ProductModel.findById(product_id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        product.product_bedge = badge;
        await product.save();

        return res.status(200).json({ message: 'Product badge set successfully.', product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const copySameProduct = async (req: CustomRequest, res: Response) => {
    try {
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({ message: 'Product ID is required.' });
        }

        const productDoc = await ProductModel.findById(product_id);

        if (!productDoc) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const product: any = productDoc.toObject();

        delete product._id;
        delete product.createdAt;
        delete product.updatedAt;

        const newProduct = new ProductModel({
            ...product,
            product_title: `${product.product_title}`,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newProduct.save();

        return res.status(200).json({
            message: 'Product copied successfully.',
            product: newProduct
        });

    } catch (error) {
        console.error('Error copying product:', error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addDraftProduct = async (req: CustomRequest, res: Response) => {
  try {
    req.body = qs.parse(req.body, { allowDots: true, depth: 20, arrayLimit: 100 });
    const files: any[] = (req.files as any[]) || [];
    const findFile = (key: string) => files.find(f => f.fieldname === key);
    const findFiles = (key: string) => files.filter(f => f.fieldname === key);
    const cleanTitle = stripHtml(req.body.product_title || "");

    const parseJSON = (val: any, fallback: any) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val || fallback;
      } catch {
        return fallback;
      }
    };

    const data: any = {
      category: req.body.category,
      variant_id: req.body.variant_id,
      bestseller: req.body.bestseller,
      popular_gifts: req.body.popular_gifts,
      variant_attribute_id: req.body.variant_attribute_id,
      product_title: req.body.product_title,
      meta_title: cleanTitle,
      product_type: req.body.product_type,
      tax_ratio: req.body.tax_ratio,
      bullet_points: req.body.bullet_points
        ? Buffer.from(req.body.bullet_points, "utf-8").toString("base64")
        : "",
      description: req.body.description
        ? Buffer.from(req.body.description, "utf-8").toString("base64")
        : "",
      customize: req.body.customize,
      search_terms: req.body.search_terms,
      launch_date: req.body.launch_date,
      release_date: req.body.release_date,
      vendor_id: req.body.vendor_id,
      brand_id: req.body.brand_id,
      sku_code: req.body.sku_code,
      tax_code: req.body.tax_code,
      shipping_templates: req.body.shipping_templates,
      price: req.body.price ? Number(req.body.price) : undefined,
      sale_price: req.body.sale_price ? Number(req.body.sale_price) : undefined,
      sale_start_date: req.body.sale_start_date,
      sale_end_date: req.body.sale_end_date,
      qty: req.body.qty ? Number(req.body.qty) : undefined,
      max_order_qty: req.body.max_order_qty,
      color: req.body.color,
      can_offer: req.body.can_offer,
      gift_wrap: req.body.gift_wrap,
      restock_date: req.body.restock_date,
      production_time: req.body.production_time,
      gender: req.body.gender,
      size: req.body.size,
      size_map: req.body.size_map,
      color_textarea: req.body.color_textarea,
      color_map: req.body.color_map,
      style_name: req.body.style_name,
      shipping_weight: req.body.shipping_weight,
      shipping_weight_unit: req.body.shipping_weight_unit,
      display_dimension_length: req.body.display_dimension_length,
      display_dimension_width: req.body.display_dimension_width,
      display_dimension_height: req.body.display_dimension_height,
      display_dimension_unit: req.body.display_dimension_unit,
      package_dimension_height: req.body.package_dimension_height,
      package_dimension_length: req.body.package_dimension_length,
      package_dimension_width: req.body.package_dimension_width,
      package_dimension_unit: req.body.package_dimension_unit,
      package_weight: req.body.package_weight,
      package_weight_unit: req.body.package_weight_unit,
      unit_count: req.body.unit_count,
      unit_count_type: req.body.unit_count_type,
      how_product_made: req.body.how_product_made,
      occasion: req.body.occasion,
      design: req.body.design,
      material: req.body.material,
      product_size: req.body.product_size,
      isCombination:
        req.body.isCombination === "true" || req.body.isCombination === true,
      combinationData: parseJSON(req.body.combinationData, []),
      variations_data: parseJSON(req.body.variations_data, []),
      form_values: parseJSON(req.body.form_values, {}),
      customizationData: parseJSON(req.body.customizationData, {}),
      tabs: parseJSON(req.body.tabs, []),
      exchangePolicy: req.body.exchangePolicy,
      zoom: parseJSON(req.body.zoom, {}),
      dynamicFields: parseJSON(req.body.dynamicFields, {}),
    };

    if (req.body.description) {
       const decodedDesc = req.body.description;
    data.meta_description = buildMetaDescription(decodedDesc);
    }
    
    if (Array.isArray(req.body.search_terms)) {
       data.meta_keywords = req.body.search_terms.map((k: string) => k.trim()).filter(Boolean);
    }

    let parsedVariations = parseJSON(req.body.variations_data, []);
    data.variations_data = parsedVariations.map((v: any) => {
    if (v.variantId) {
    return { ...v, type: "global" };
    } else {
    return {
      ...v,
      type: "custom",
      customId: v.customId || new mongoose.Types.ObjectId().toString()
    };
   }
  });
    
  // 🔹 Process customizationData deeply (supports thumbnails, previews, main_images, edit_main_image, edit_preview_image)
if (data.customizationData?.customizations && Array.isArray(data.customizationData.customizations)) {
  data.customizationData.customizations = await Promise.all(
    data.customizationData.customizations.map(async (cust: any, cIdx: number) => {
      if (Array.isArray(cust.optionList)) {
        cust.optionList = await Promise.all(
          cust.optionList.map(async (opt: any, oIdx: number) => {
            // 🔍 Find possible uploaded files
            const optThumb = findFile(`customizationData[customizations][${cIdx}][optionList][${oIdx}][thumbnail]`);
            const optPreview = findFile(`customizationData[customizations][${cIdx}][optionList][${oIdx}][preview_image]`);
            const optMainImages = findFiles(`customizationData[customizations][${cIdx}][optionList][${oIdx}][main_images][]`);
            const optEditMain = findFile(`customizationData[customizations][${cIdx}][optionList][${oIdx}][edit_main_image]`);
            const optEditPreview = findFile(`customizationData[customizations][${cIdx}][optionList][${oIdx}][edit_preview_image]`);

            // 🔹 Parse crop data JSONs if sent
            if (opt.edit_main_image_data && typeof opt.edit_main_image_data === "string") {
              try { opt.edit_main_image_data = JSON.parse(opt.edit_main_image_data); } catch {}
            }
            if (opt.edit_preview_image_data && typeof opt.edit_preview_image_data === "string") {
              try { opt.edit_preview_image_data = JSON.parse(opt.edit_preview_image_data); } catch {}
            }

            // 🔹 Save uploaded files
            const processedOpt = {
              ...opt,
              thumbnail: optThumb
                ? await saveProductFile(optThumb, `custom-thumb-${Date.now()}-${cIdx}-${oIdx}`)
                : opt.thumbnail || "",
              preview_image: optPreview
                ? await saveProductFile(optPreview, `custom-preview-${Date.now()}-${cIdx}-${oIdx}`)
                : opt.preview_image || "",
              main_images:
                optMainImages.length > 0
                  ? await Promise.all(
                      optMainImages.map((f, i) =>
                        saveProductFile(f, `custom-main-${Date.now()}-${cIdx}-${oIdx}-${i}`)
                      )
                    )
                  : opt.main_images || [],
              edit_main_image: optEditMain
                ? await saveProductFile(optEditMain, `custom-edit-main-${Date.now()}-${cIdx}-${oIdx}`)
                : (typeof opt.edit_main_image === "string" ? opt.edit_main_image : ""),
              edit_preview_image: optEditPreview
                ? await saveProductFile(optEditPreview, `custom-edit-preview-${Date.now()}-${cIdx}-${oIdx}`)
                : (typeof opt.edit_preview_image === "string" ? opt.edit_preview_image : "")
            };

            return processedOpt;
          })
        );
      }
            if (cust.guide) {
        const guideFile = findFile(`customizationData[customizations][${cIdx}][guide][guide_file]`);
        let guide_file = cust.guide.guide_file || "";
        let guide_type = cust.guide.guide_type || "";

        if (guideFile) {
          guide_file = await saveProductFile(guideFile, `guide-${Date.now()}-${cIdx}`);
          if (guideFile.mimetype.includes("pdf")) {
            guide_type = "pdf";
          } else if (guideFile.mimetype.includes("image")) {
            guide_type = "image";
          } else {
            guide_type = "document";
          }
        }

        cust.guide = {
          guide_name: cust.guide.guide_name || "",
          guide_description: cust.guide.guide_description || "",
          guide_file,
          guide_type,
        };
      }
      return cust;
    })
  );
}

    // 🔹 Process nested combinationData images
    if (Array.isArray(data.combinationData)) {
      data.combinationData = await Promise.all(
        data.combinationData.map(async (variant: any, vIdx: number) => {
        let combinations = variant.combinations;
        if (!Array.isArray(combinations)) {
           combinations = combinations ? [combinations] : [];
        }
        // 🔹 Handle guide data for each variant (if sent)
let guide = [];

if (Array.isArray(variant.guide)) {
  guide = await Promise.all(
    variant.guide.map(async (g: any, gIdx: number) => {
      const guideFile = findFile(`combinationData[${vIdx}][guide][${gIdx}][guide_file]`);
      let guide_file = g.guide_file || "";
      let guide_type = g.guide_type || "";

      if (guideFile) {
        guide_file = await saveProductFile(
          guideFile,
          `guide-${Date.now()}-${vIdx}-${gIdx}`
        );

        if (guideFile.mimetype.includes("pdf")) guide_type = "pdf";
        else if (guideFile.mimetype.includes("image")) guide_type = "image";
        else guide_type = "document";
      }

      return {
        guide_name: g.guide_name || "",
        guide_description: g.guide_description || "",
        guide_file,
        guide_type,
      };
    })
  );
}

variant.guide = guide;

            combinations = await Promise.all(
              combinations.map(async (comb: any, cIdx: number) => {
                const combThumb = findFile(
                  `combinationData[${vIdx}][combinations][${cIdx}][thumbnail]`
                );
                const combPreview = findFile(
                  `combinationData[${vIdx}][combinations][${cIdx}][preview_image]`
                );
                const combMains = findFiles(
                  `combinationData[${vIdx}][combinations][${cIdx}][main_images][]`
                );

                return {
                  ...comb,
                  thumbnail: combThumb
                    ? await saveProductFile(
                        combThumb,
                        `comb-thumb-${Date.now()}`
                      )
                    : comb.thumbnail ?? undefined,
                  preview_image: combPreview
                    ? await saveProductFile(
                        combPreview,
                        `comb-preview-${Date.now()}`
                      )
                    : comb.preview_image ?? undefined,
                  main_images:
                    combMains.length > 0
                      ? await Promise.all(
                          combMains.map((f, i) =>
                            saveProductFile(f, `comb-main-${Date.now()}-${i}`)
                          )
                        )
                      : comb.main_images ?? undefined,
                };
              })
            );
          return variant;
        })
      );
    }

    // 🔹 Handle single images
    if (findFile("thumbnail")) {
      data.thumbnail = await saveProductFile(
        findFile("thumbnail"),
        "thumbnail-" + Date.now()
      );
    } else if (req.body.thumbnail !== undefined) {
      data.thumbnail = req.body.thumbnail;
    }

    if (findFile("preview_image")) {
      data.preview_image = await saveProductFile(
        findFile("preview_image"),
        "preview-" + Date.now()
      );
    } else if (req.body.preview_image !== undefined) {
      data.preview_image = req.body.preview_image;
    }

    if (findFile("edit_preview_image")) {
      data.edit_preview_image = await saveProductFile(
        findFile("edit_preview_image"),
        "edit-preview-" + Date.now()
      );
    } else if (req.body.edit_preview_image !== undefined) {
      data.edit_preview_image = req.body.edit_preview_image;
    }

    if (findFiles("main_images").length > 0) {
      data.main_images = await Promise.all(
        findFiles("main_images").map((f, idx) =>
          saveProductFile(f, `main-${Date.now()}-${idx}`)
        )
      );
    } else if (req.body.main_images !== undefined) {
      data.main_images = Array.isArray(req.body.main_images)
        ? req.body.main_images
        : [req.body.main_images];
    }

    if (findFile("edit_main_image")) {
      data.edit_main_image = await saveProductFile(
        findFile("edit_main_image"),
        "edit-main-" + Date.now()
      );
    } else if (req.body.edit_main_image !== undefined) {
      data.edit_main_image = req.body.edit_main_image;
    }

    // 🔹 Always draft
    data.draft_status = true;

    // 🔹 Create or Update
    if (req.body._id == "new") {
      const product = await Product.create({ ...data, status: false });

      const cat = await CategoryModel.findById(req.body.category);
      if (cat && product && req.body.category) {
        const slug = slugify(
          `${cat.slug}-${String(product._id).padStart(4, "0")}`,
          {
            lower: true,
            remove: /[*+~.()'"!:@]/g,
          }
        );
        await Product.findByIdAndUpdate(product._id, { slug });
      }

      await PromotionalOfferModel.updateMany(
        { purchased_items: "Entire Catalog" },
        { $push: { product_id: product._id } }
      );

      return res.status(200).json({
        message: "Draft product created successfully.",
        product,
        success: true,
      });
    } else {
      const product = await Product.findByIdAndUpdate(
        req.body._id,
        { ...data, draft_status: true },
        { new: true }
      );

      return res.status(200).json({
        message: "Draft product updated successfully.",
        product,
        success: true,
      });
    }
  } catch (error) {
    console.error("Error creating/updating draft product:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};


export const addWalletBalanceByAdmin = async (req: CustomRequest, res: Response) => {
    try {
        const { user_id, amount } = req.body;

        if (!user_id || !amount) {
            return res.status(400).json({ message: 'User ID and amount are required.' });
        }

        const user = await UserModel.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.wallet_balance += Number(amount);
        await user.save();

        const transaction = new TransactionModel({
            user_id,
            transaction_type: 'Cr',
            amount: Number(amount),
            transaction_id: await generateUniqueGiftCode(),
            message: 'Top up added by admin',
        });

        await transaction.save();

        return res.status(200).json({
            message: 'Wallet balance updated and transaction recorded successfully.',
            user,
            transaction,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const updateUserProfile = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.body._id;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.name = req.body.name ?? user.name;
        user.email = req.body.email ?? user.email;
        user.mobile = req.body.mobile ?? user.mobile;
        user.country_id = req.body.country_id ?? user.country_id;
        user.state_id = req.body.state_id ?? user.state_id;
        user.city_id = req.body.city_id ?? user.city_id;

        await user.save();

        return res.status(200).json({
            message: "User profile updated successfully.",
            user,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

export const resetPassword = async (req: Request, resp: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return resp.status(400).json({ status: false, message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return resp.status(404).json({ status: false, message: "User not found" });
        }

        const newPassword = crypto.randomBytes(6).toString("hex");

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        const subject = "Your Password Has Been Reset";
        const body = `
            <h3>Password Reset Successful</h3>
            <p>Your new password is: <strong>${newPassword}</strong></p>
            <p>Please log in and change your password immediately.</p>
        `;

        await sendToEmail(email, subject, body, "");

        return resp.status(200).json({
            status: true,
            message: "Password reset successful. Please check your email.",
        });

    } catch (error) {
        console.error("Reset error:", error);
        return resp.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};

export const getFavouriteProducts = async (req: CustomRequest, resp: Response) => {
    try {
        const user_id = req.query.user_id as string;
        const type = req.query.type as string;

        const shopiconBaseUrl = `${process.env.ASSET_URL}/uploads/shop-icon/`;
        const productBaseUrl = `${process.env.ASSET_URL}/uploads/product/`;

        if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
            return resp.status(400).json({ success: false, message: 'Invalid or missing user_id' });
        }

        if (!['favourite', 'shop', 'cart', 'review'].includes(type)) {
            return resp.status(400).json({ success: false, message: 'Invalid type parameter.' });
        }

        switch (type) {
            case 'favourite': {
                const favouriteProducts = await wishlistModel
                    .find({ user_id })
                    .populate('product_id');
                return resp.status(200).json({ success: true, data: favouriteProducts, shopiconBaseUrl, productBaseUrl });
            }

            case 'shop': {
                const pipeline = [
                    {
                        $match: {
                            user_id: new mongoose.Types.ObjectId(user_id)
                        }
                    },
                    {
                        $lookup: {
                            from: 'vendordetails',
                            localField: 'vendor_id',
                            foreignField: 'user_id',
                            as: 'vendor_data'
                        }
                    },
                    {
                        $unwind: {
                            path: '$vendor_data',
                            preserveNullAndEmptyArrays: true
                        }
                    }
                ];
                const followShops = await followModel.aggregate(pipeline);
                return resp.status(200).json({ success: true, data: followShops, shopiconBaseUrl, productBaseUrl });
            }

            case 'cart': {
                const pipeline: any = [
                    {
                        $match:
                        {
                            user_id: new mongoose.Types.ObjectId(user_id)
                        },
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "product_id",
                            foreignField: "_id",
                            as: "product_id",
                        },
                    },
                    {
                        $unwind: {
                            path: "$product_id",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'vendordetails',
                            localField: 'vendor_id',
                            foreignField: 'user_id',
                            as: 'vendor_data'
                        }
                    },
                    {
                        $unwind: {
                            path: '$vendor_data',
                            preserveNullAndEmptyArrays: true
                        }
                    }
                ]
                const cartProducts = await Cart.aggregate(pipeline);
                return resp.status(200).json({ success: true, data: cartProducts, shopiconBaseUrl, productBaseUrl });
            }

            case 'review': {
                const pipeline: any = [
                    {
                        $match:
                        {
                            user_id: new mongoose.Types.ObjectId(user_id)
                        },
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "product_id",
                            foreignField: "_id",
                            as: "product_id",
                        },
                    },
                    {
                        $unwind: {
                            path: "$product_id",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'vendordetails',
                            localField: 'vendor_id',
                            foreignField: 'user_id',
                            as: 'vendor_data'
                        }
                    },
                    {
                        $unwind: {
                            path: '$vendor_data',
                            preserveNullAndEmptyArrays: true
                        }
                    }
                ]
                const reviews = await RatingModel.aggregate(pipeline);
                return resp.status(200).json({ success: true, data: reviews, shopiconBaseUrl, productBaseUrl });
            }
        }
    } catch (err: any) {
        console.error(err);
        return resp.status(500).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
};

export const getOrderHistorys = async (req: CustomRequest, resp: Response) => {
    try {
        const user_id = req.body.user_id;

        if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
            return resp.status(400).json({ success: false, message: 'Invalid user_id' });
        }

        const pipeline: PipelineStage[] = [
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id)
                }
            },
            {
                $lookup: {
                    from: 'salesdetails',
                    localField: '_id',
                    foreignField: 'sale_id',
                    as: 'saleDetaildata',
                    pipeline: [
                        {
                            $lookup: {
                                from: 'products',
                                localField: 'product_id',
                                foreignField: '_id',
                                as: 'productMain'
                            }
                        },
                        {
                            $unwind: {
                                path: '$productMain',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'variants',
                                localField: 'variant_id',
                                foreignField: '_id',
                                as: 'variantData'
                            }
                        },
                        {
                            $lookup: {
                                from: 'variantattributes',
                                localField: 'variant_attribute_id',
                                foreignField: '_id',
                                as: 'variantAttributeData'
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            {
                $unwind: {
                    path: '$userData',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    order_id: 1,
                    subtotal: 1,
                    payment_status: 1,
                    state: 1,
                    city: 1,
                    address_line1: 1,
                    address_line2: 1,
                    pincode: 1,
                    userName: '$userData.name',
                    userEmail: '$userData.email',
                    saleDetaildata: 1,
                    createdAt: 1
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    sales: { $push: "$$ROOT" }
                }
            },
            {
                $addFields: { date: '$_id' }
            },
            {
                $project: { _id: 0, date: 1, sales: 1 }
            },
            {
                $sort: { date: -1 }
            }
        ];

        const history = await Sales.aggregate(pipeline);
        const base_url = process.env.ASSET_URL + '/uploads/product/';

        return resp.status(200).json({ success: true, data: history, base_url });

    } catch (err: any) {
        console.error(err);
        return resp.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
};

export const getDashboarData = async (req: CustomRequest, resp: Response) => {
    try {
        const { designation_id, _id: userId } = req.user;
        const userIdString = userId.toString();
        const { startDate, endDate } = req.query;

        // date filter
        const dateFilter: any = {};
        if (startDate || endDate) {
            const start = startDate ? moment.tz(startDate as string, "Asia/Kolkata").startOf("day").toDate() : undefined;
            const end = endDate ? moment.tz(endDate as string, "Asia/Kolkata").endOf("day").toDate() : undefined;
            if (start || end) {
                dateFilter.createdAt = {};
                if (start) dateFilter.createdAt.$gte = start;
                if (end) dateFilter.createdAt.$lte = end;
            }
        }

        const isVendor = designation_id == "3";
        const vendorIdObj = new mongoose.Types.ObjectId(userIdString);

        const vendorMatch = isVendor ? { vendor_id: userIdString } : {};
        const productMatch = { ...vendorMatch, ...dateFilter };

        const productCount = await Product.countDocuments(productMatch);
        const userCount = await User.countDocuments({ ...vendorMatch, ...dateFilter });
        const shopFollowCount = await followModel.countDocuments({ ...vendorMatch, ...dateFilter });
        const reviewCount = await RatingModel.countDocuments({ ...vendorMatch, ...dateFilter });
        const affiliateCount = await AffilateUserModel.countDocuments({ ...vendorMatch, ...dateFilter });

        // ✅ FIX: shopFavoriteCount via wishlist -> products join, filter by products.vendor_id
        let shopFavoriteCount = 0;
        if (isVendor) {
            const favPipe: any[] = [];

            // apply date filter on wishlist documents
            if (dateFilter.createdAt) favPipe.push({ $match: { createdAt: dateFilter.createdAt } });

            favPipe.push(
                {
                    $lookup: {
                        from: "products",
                        localField: "product_id",
                        foreignField: "_id",
                        as: "prod"
                    }
                },
                { $unwind: { path: "$prod", preserveNullAndEmptyArrays: false } },
                { $match: { "prod.vendor_id": vendorIdObj } },
                { $count: "cnt" }
            );

            const favAgg = await wishlistModel.aggregate(favPipe);
            shopFavoriteCount = favAgg[0]?.cnt || 0;
        } else {
            // non-vendor: plain wishlist count with date filter
            shopFavoriteCount = await wishlistModel.countDocuments({ ...dateFilter });
        }

        // visitCount (unchanged)
        const pipeline: any[] = [];
        if (Object.keys(dateFilter).length) pipeline.push({ $match: dateFilter });
        if (isVendor) {
            pipeline.push(
                {
                    $lookup: {
                        from: "products",
                        localField: "product_id",
                        foreignField: "_id",
                        as: "productData",
                    },
                },
                { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
                { $match: { "productData.vendor_id": vendorIdObj } }
            );
        }
        pipeline.push({
            $group: { _id: null, totalVisitCount: { $sum: "$visit_count" } },
        });

        const visitAgg = await visitModel.aggregate(pipeline);
        const visitCount = visitAgg[0]?.totalVisitCount || 0;

        return resp.status(200).json({
            success: true,
            data: {
                role: designation_id,
                productCount,
                userCount,
                shopFollowCount,
                shopFavoriteCount,
                reviewCount,
                affiliateCount,
                visitCount
            }
        });

    } catch (err: any) {
        console.error("Dashboard Error:", err);
        return resp.status(500).json({
            success: false,
            error: err.message || "Internal server error"
        });
    }
};

export const getUserDashboardData = async (req: CustomRequest, resp: Response) => {
    try {
        const { user_id, startDate, endDate } = req.query;

        if (!user_id) {
            return resp.status(400).json({
                success: false,
                error: "user_id is required",
            });
        }

        const userIdString = String(user_id);
        const userDoc = await User.findById(userIdString).select("designation_id");
        if (!userDoc) {
            return resp.status(404).json({ success: false, error: "User not found" });
        }

        const designation_id = userDoc.designation_id;

        const dateFilter: any = {};
        if (startDate || endDate) {
            const start = startDate
                ? moment.tz(startDate as string, "Asia/Kolkata").startOf("day").toDate()
                : undefined;

            const end = endDate
                ? moment.tz(endDate as string, "Asia/Kolkata").endOf("day").toDate()
                : undefined;

            dateFilter.createdAt = {};
            if (start) dateFilter.createdAt.$gte = start;
            if (end) dateFilter.createdAt.$lte = end;

            if (Object.keys(dateFilter.createdAt).length === 0) {
                delete dateFilter.createdAt;
            }
        }

        const isVendor = designation_id == 3;
        const vendorMatch = isVendor ? { vendor_id: userIdString } : {};
        const productMatch = { ...vendorMatch, ...dateFilter };

        const productCount = await Product.countDocuments(productMatch);
        const userCount = await User.countDocuments({ ...vendorMatch, ...dateFilter });
        const shopFollowCount = await followModel.countDocuments({ ...vendorMatch, ...dateFilter });
        const shopFavoriteCount = await wishlistModel.countDocuments({ ...vendorMatch, ...dateFilter });
        const reviewCount = await RatingModel.countDocuments({ ...vendorMatch, ...dateFilter });
        const affiliateCount = await AffilateUserModel.countDocuments({ ...vendorMatch, ...dateFilter });

        const visitPipe: any[] = [];
        if (Object.keys(dateFilter).length) {
            visitPipe.push({ $match: dateFilter });
        }
        if (isVendor) {
            visitPipe.push(
                {
                    $lookup: {
                        from: "products",
                        localField: "product_id",
                        foreignField: "_id",
                        as: "productData",
                    },
                },
                {
                    $unwind: { path: "$productData", preserveNullAndEmptyArrays: true },
                },
                {
                    $match: {
                        "productData.vendor_id": new mongoose.Types.ObjectId(userIdString),
                    },
                }
            );
        }
        visitPipe.push({
            $group: { _id: null, totalVisitCount: { $sum: "$visit_count" } },
        });

        const visitAgg = await visitModel.aggregate(visitPipe);
        const visitCount = visitAgg[0]?.totalVisitCount || 0;
        const sdMatch: any = {
            ...dateFilter,
            order_status: { $ne: "cancelled" },
            ...(isVendor
                ? { vendor_id: new mongoose.Types.ObjectId(userIdString) }
                : { user_id: new mongoose.Types.ObjectId(userIdString) }),
        };

        const revenueOrdersPipe: any[] = [
            { $match: sdMatch },
            {
                $addFields: {
                    qtyNum: { $convert: { input: "$qty", to: "double", onError: 0, onNull: 0 } },
                    amountNum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } },
                },
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: { $multiply: ["$qtyNum", "$amountNum"] } },
                    orders: { $addToSet: "$sale_id" },
                },
            },
            {
                $project: {
                    _id: 0,
                    revenue: { $round: ["$revenue", 2] },
                    totalOrders: { $size: "$orders" },
                },
            },
        ];

        const revenueOrdersAgg = await SalesDetailsModel.aggregate(revenueOrdersPipe);
        const revenue = revenueOrdersAgg[0]?.revenue || 0;
        const totalOrders = revenueOrdersAgg[0]?.totalOrders || 0;

        return resp.status(200).json({
            success: true,
            data: {
                role: designation_id,
                productCount,
                userCount,
                shopFollowCount,
                shopFavoriteCount,
                reviewCount,
                affiliateCount,
                visitCount,
                totalOrders,
                revenue,
            },
        });
    } catch (err: any) {
        console.error("User Dashboard Error:", err);
        return resp.status(500).json({
            success: false,
            error: err.message || "Internal server error",
        });
    }
};

export const getTopSellingProductbyMonth = async (req: CustomRequest, resp: Response) => {
    try {
        const { startDate, endDate, month, year, page = 1, limit = 5 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const start = startDate
            ? new Date(startDate as string)
            : new Date(Number(year), Number(month) - 1, 1);

        const end = endDate
            ? new Date(endDate as string)
            : new Date(Number(year), Number(month), 1);

        end.setHours(23, 59, 59, 999);

        if (!start || !end) {
            return resp.status(400).json({ success: false, message: "Start and end date or month/year are required" });
        }

        const productBaseUrl = process.env.ASSET_URL + `/uploads/product/`;

        const matchStage: any = {
            createdAt: { $gte: start, $lt: end },
            order_status: { $ne: "cancelled" }
        };

        const user = req.user;
        if (user.designation_id == "3") {
            matchStage.vendor_id = user._id;
        }

        const result = await SalesDetailsModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$product_id",
                    totalQtySold: { $sum: "$qty" },
                    totalRevenue: { $sum: { $multiply: ["$qty", "$amount"] } },
                    latestProductData: { $first: "$productData" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $sort: { totalQtySold: -1 } },
                        { $skip: skip },
                        { $limit: Number(limit) },
                        {
                            $project: {
                                productId: "$_id",
                                name: "$latestProductData.product_title",
                                image: { $arrayElemAt: ["$latestProductData.image", 0] },
                                skucode: "$productDetails.sku_code",
                                totalQtySold: 1,
                                totalRevenue: 1
                            }
                        }
                    ]
                }
            }
        ]);

        const topProducts = result[0]?.data || [];
        const total = result[0]?.metadata[0]?.total || 0;

        return resp.status(200).json({
            success: true,
            data: topProducts,
            productBaseUrl,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (err: any) {
        console.error(err);
        return resp.status(500).json({
            success: false,
            error: err.message || "Internal server error"
        });
    }
};


export const generateToken = async (req: Request, resp: Response) => {
    try {
        const { user_id } = req.body;

        if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
            return resp.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const checkUser = await User.findById(user_id);
        if (!checkUser) {
            return resp.status(404).json({ success: false, message: 'User not found' });
        }

        const secret = process.env.SECRET;
        if (!secret) {
            return resp.status(500).json({ success: false, message: 'JWT_SECRET not configured in environment' });
        }

        const token = jwt.sign({ _id: user_id }, secret);

        if (!Array.isArray(checkUser.multipleTokens)) {
            checkUser.multipleTokens = [];
        }

        checkUser.multipleTokens.push({ token, createdAt: new Date() });
        await checkUser.save();

        return resp.status(200).json({ success: true, token });
    } catch (error: any) {
        console.error('Error generating token:', error.message);
        return resp.status(500).json({ success: false, message: 'Something went wrong while generating token' });
    }
};

export const getSalesDataByMonthYear = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, type, user_id } = req.query;

        if (!user_id || !startDate || !endDate || !type) {
            return res.status(400).json({
                success: false,
                message: "User ID, startDate, endDate, and type are required"
            });
        }

        const start = moment.tz(startDate as string, "Asia/Kolkata").startOf("day");
        const end = moment.tz(endDate as string, "Asia/Kolkata").endOf("day");
        const diffDays = end.diff(start, "days");

        const interval: "hourly" | "daily" | "monthly" =
            diffDays <= 1 ? "hourly" : diffDays <= 30 ? "daily" : "monthly";

        const matchStage: any = {
            user_id: new mongoose.Types.ObjectId(user_id as string),
            createdAt: { $gte: start.toDate(), $lte: end.toDate() },
            order_status: { $ne: "cancelled" }
        };

        let groupId: any = {};
        let projectStage: any = { _id: 0 };

        if (interval === "hourly") {
            groupId = {
                hour: { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } }
            };
            projectStage.hour = "$_id.hour";
            projectStage.day = "$_id.day";
        } else if (interval === "daily") {
            groupId = {
                day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } }
            };
            projectStage.day = "$_id.day";
            projectStage.month = "$_id.month";
            projectStage.year = "$_id.year";
        } else {
            groupId = {
                month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } }
            };
            projectStage.month = "$_id.month";
            projectStage.year = "$_id.year";
        }

        const sumField = type === "orders" ? 1 : { $multiply: ["$qty", "$amount"] };
        const totalFieldName = type === "orders" ? "totalOrders" : "totalRevenue";

        const pipeline: PipelineStage[] = [
            { $match: matchStage },
            {
                $group: {
                    _id: groupId,
                    [totalFieldName]: { $sum: sumField }
                }
            },
            {
                $project: {
                    ...projectStage,
                    [totalFieldName]: 1
                }
            },
            { $sort: { "_id": 1 } }
        ];

        const result = await SalesDetailsModel.aggregate(pipeline);
        const filledResults: any[] = [];

        if (interval === "hourly") {
            const isSameDate = moment(startDate as string).isSame(endDate as string, "day");
            const isToday = moment(endDate as string).isSame(moment(), "day");

            if (isSameDate) {
                // ✅ CASE: startDate == endDate → full 0-23 hours
                const day = moment(endDate as string).date();
                for (let h = 0; h < 24; h++) {
                    const match = result.find(r => r.hour === h && r.day === day);
                    filledResults.push({
                        hour: h,
                        day,
                        [totalFieldName]: match ? match[totalFieldName] : 0
                    });
                }
            } else if (isToday) {
                // ✅ CASE: endDate is today → last 24 hours ending at now
                const now = moment.tz("Asia/Kolkata");
                for (let i = 0; i < 24; i++) {
                    const hourTime = now.clone().subtract(i, "hours");
                    const h = hourTime.hour();
                    const d = hourTime.date();
                    const match = result.find(r => r.hour === h && r.day === d);
                    filledResults.unshift({
                        hour: h,
                        day: d,
                        [totalFieldName]: match ? match[totalFieldName] : 0
                    });
                }
            }
        } else if (interval === "daily") {
            for (let i = 0; i <= diffDays; i++) {
                const date = start.clone().add(i, "days");
                const d = date.date(), m = date.month() + 1, y = date.year();
                const match = result.find(r => r.day === d && r.month === m && r.year === y);
                filledResults.push({
                    day: d,
                    month: m,
                    year: y,
                    [totalFieldName]: match ? match[totalFieldName] : 0
                });
            }
        } else {
            let date = start.clone().startOf("month");
            const endMonth = end.clone().startOf("month");

            while (date.isSameOrBefore(endMonth)) {
                const m = date.month() + 1;
                const y = date.year();
                const match = result.find(r => r.month === m && r.year === y);
                filledResults.push({
                    month: m,
                    year: y,
                    [totalFieldName]: match ? match[totalFieldName] : 0
                });
                date.add(1, "month");
            }
        }

        return res.status(200).json({
            success: true,
            interval,
            data: filledResults
        });

    } catch (err: any) {
        console.error("SalesData Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Internal server error"
        });
    }
};

export const getTopSalesByVendorAdmin = async (req: CustomRequest, res: Response) => {
    try {
        const { startDate, endDate, type } = req.query;
        const { designation_id, _id: userId } = req.user;
        console.log(designation_id);
        console.log(req.user);

        if (!startDate || !endDate || !type) {
            return res.status(400).json({ success: false, message: "startDate, endDate, and type are required" });
        }

        const start = moment.tz(startDate as string, "Asia/Kolkata").startOf("day");
        const end = moment.tz(endDate as string, "Asia/Kolkata").endOf("day");
        const isSameDate = moment(startDate as string).isSame(endDate as string, "day");
        const isToday = moment(endDate as string).isSame(moment(), "day");

        const diffDays = end.diff(start, 'days');

        const dateFilter: any = {
            createdAt: {
                $gte: start.toDate(),
                $lte: end.toDate()
            }
        };

        if (designation_id === 3 && type !== "visit") {
            dateFilter.vendor_id = userId;
        }

        const interval: "hourly" | "daily" | "monthly" =
            diffDays <= 1 ? "hourly" : diffDays <= 30 ? "daily" : "monthly";

        const groupId: any = {};
        const projectStage: any = { _id: 0 };

        if (interval === "hourly") {
            groupId.hour = { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } };
            groupId.day = { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } };
            projectStage.hour = "$_id.hour";
            projectStage.day = "$_id.day";
        } else if (interval === "daily") {
            groupId.day = { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } };
            groupId.month = { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } };
            groupId.year = { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } };
            projectStage.day = "$_id.day";
            projectStage.month = "$_id.month";
            projectStage.year = "$_id.year";
        } else {
            groupId.month = { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } };
            groupId.year = { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } };
            projectStage.month = "$_id.month";
            projectStage.year = "$_id.year";
        }

        const keyFn = (r: any) =>
            interval === "hourly"
                ? `${r.day}-${r.hour}`
                : interval === "daily"
                    ? `${r.year}-${r.month}-${r.day}`
                    : `${r.year}-${r.month}`;

        if (type === "conversion rate") {
            const ordersAgg = await SalesDetailsModel.aggregate([
                { $match: { ...dateFilter, order_status: { $ne: "cancelled" } } },
                { $group: { _id: groupId, orders: { $sum: "$qty" } } },
                { $sort: { "_id": 1 } },
                { $project: { ...projectStage, orders: "$orders" } }
            ]);

            let visitsAgg: any[] = [];

            const visitPipeline: any[] = [
                { $match: dateFilter }
            ];

            if (designation_id === 3) {
                visitPipeline.push(
                    {
                        $lookup: {
                            from: "products",
                            localField: "product_id",
                            foreignField: "_id",
                            as: "product"
                        }
                    },
                    { $unwind: "$product" },
                    { $match: { "product.vendor_id": userId } }
                );
            }

            visitPipeline.push(
                {
                    $group: {
                        _id: groupId,
                        visits: { $sum: "$visit_count" }
                    }
                },
                { $sort: { "_id": 1 } },
                { $project: { ...projectStage, visits: "$visits" } }
            );

            visitsAgg = await visitModel.aggregate(visitPipeline);

            const map = new Map<string, any>();
            for (const v of visitsAgg) {
                map.set(keyFn(v), { ...v, orders: 0 });
            }

            for (const o of ordersAgg) {
                const key = keyFn(o);
                if (!map.has(key)) map.set(key, { ...o, visits: 0 });
                else map.get(key).orders = o.orders;
            }

            const filledResults: any[] = [];

            if (interval === "hourly") {
                const now = moment.tz("Asia/Kolkata").startOf("hour");
                const isSlidingWindow = !isSameDate && isToday;

                if (isSlidingWindow) {
                    for (let i = 23; i >= 0; i--) {
                        const currentMoment = moment(now).subtract(i, 'hours');
                        const h = currentMoment.hour();
                        const d = currentMoment.date();

                        const key = `${d}-${h}`;
                        const found = map.get(key);

                        filledResults.push({
                            hour: h,
                            day: d,
                            conversionRate: found ? parseFloat(((found.orders / (found.visits || 1)) * 100).toFixed(2)) : 0
                        });
                    }
                } else {
                    const d = moment(endDate as string).date();

                    for (let h = 0; h < 24; h++) {
                        const key = `${d}-${h}`;
                        const found = map.get(key);

                        filledResults.push({
                            hour: h,
                            day: d,
                            conversionRate: found ? parseFloat(((found.orders / (found.visits || 1)) * 100).toFixed(2)) : 0
                        });
                    }
                }
            } else if (interval === "daily") {
                for (let i = 0; i <= diffDays; i++) {
                    const current = moment(start).add(i, "day");
                    const d = current.date();
                    const m = current.month() + 1;
                    const y = current.year();
                    const key = `${y}-${m}-${d}`;
                    const found = map.get(key);
                    filledResults.push({
                        day: d,
                        month: m,
                        year: y,
                        conversionRate: found ? parseFloat(((found.orders / (found.visits || 1)) * 100).toFixed(2)) : 0
                    });
                }
            } else {
                let current = moment(start).startOf("month");
                const endMonth = moment(end).startOf("month");
                while (current.isSameOrBefore(endMonth)) {
                    const m = current.month() + 1;
                    const y = current.year();
                    const key = `${y}-${m}`;
                    const found = map.get(key);
                    filledResults.push({
                        month: m,
                        year: y,
                        conversionRate: found ? parseFloat(((found.orders / (found.visits || 1)) * 100).toFixed(2)) : 0
                    });
                    current.add(1, "month");
                }
            }

            return res.status(200).json({ success: true, data: filledResults });
        }

        const isVisitQuery = type === "visit";
        const model = isVisitQuery ? visitModel : SalesDetailsModel;

        const matchStage: any = { ...dateFilter };
        if (!isVisitQuery) matchStage.order_status = { $ne: "cancelled" };

        let sumField: any = "$qty";
        if (isVisitQuery) sumField = "$visit_count";
        else if (type === "total orders") sumField = 1;
        else if (type === "revenue") sumField = { $multiply: ["$qty", "$amount"] };

        let pipeline: any[] = [];

        if (isVisitQuery && designation_id === 3) {
            pipeline = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: "products",
                        localField: "product_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: "$product" },
                { $match: { "product.vendor_id": userId } },
                {
                    $group: {
                        _id: groupId,
                        total: { $sum: sumField }
                    }
                },
                { $sort: { "_id": 1 } },
                { $project: { ...projectStage, total: 1 } }
            ];
        } else {
            pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: groupId,
                        total: { $sum: sumField }
                    }
                },
                { $sort: { "_id": 1 } },
                { $project: { ...projectStage, total: 1 } }
            ];
        }

        const rawResults = await model.aggregate(pipeline);
        const filledResults: any[] = [];

        if (interval === "hourly") {
            const now = moment.tz("Asia/Kolkata").startOf("hour");
            const isSlidingWindow = !isSameDate && isToday;

            if (isSlidingWindow) {
                for (let i = 23; i >= 0; i--) {
                    const currentMoment = moment(now).subtract(i, 'hours');
                    const h = currentMoment.hour();
                    const d = currentMoment.date();

                    const existing = rawResults.find(r =>
                        r.hour === h &&
                        r.day === d
                    );

                    filledResults.push({
                        hour: h,
                        day: d,
                        total: existing ? existing.total : 0
                    });
                }
            } else {
                const d = moment(endDate as string).date();

                for (let h = 0; h < 24; h++) {
                    const existing = rawResults.find(r =>
                        r.hour === h &&
                        r.day === d
                    );

                    filledResults.push({
                        hour: h,
                        day: d,
                        total: existing ? existing.total : 0
                    });
                }
            }
        } else if (interval === "daily") {
            for (let i = 0; i <= diffDays; i++) {
                const current = moment(start).add(i, "day");
                const d = current.date();
                const m = current.month() + 1;
                const y = current.year();
                const existing = rawResults.find(r => r.day === d && r.month === m && r.year === y);
                filledResults.push({ day: d, month: m, year: y, total: existing ? existing.total : 0 });
            }
        } else {
            let current = moment(start).startOf("month");
            const endMonth = moment(end).startOf("month");
            while (current.isSameOrBefore(endMonth)) {
                const m = current.month() + 1;
                const y = current.year();
                const existing = rawResults.find(r => r.month === m && r.year === y);
                filledResults.push({ month: m, year: y, total: existing ? existing.total : 0 });
                current.add(1, "month");
            }
        }

        return res.status(200).json({ success: true, data: filledResults });

    } catch (err: any) {
        console.error("Dashboard Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Internal server error"
        });
    }
};

export const getTopSalesCountByVendorAdmin = async (req: CustomRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const { designation_id, _id: userId } = req.user;

        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: "startDate and endDate are required" });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const dateFilter: any = {
            createdAt: {
                $gte: start
            }
        };

        if (designation_id === 3) {
            dateFilter.vendor_id = userId;
        }

        const ordersAgg = await SalesDetailsModel.aggregate([
            { $match: { ...dateFilter, order_status: { $ne: "cancelled" } } },
            { $group: { _id: null, totalOrder: { $sum: 1 }, totalUnitOrders: { $sum: "$qty" }, totalRevenue: { $sum: { $multiply: ["$qty", "$amount"] } } } }
        ]);

        const pipeline: any = [
            {
                $match: {
                    createdAt: {
                        $gte: start,
                        $lte: end,
                    },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $group: {
                    _id: null,
                    visit: {
                        $sum: "$visit_count",
                    },
                },
            },
        ]

        const visitsAgg = await visitModel.aggregate(pipeline);
        const totalOrder = ordersAgg[0]?.totalOrder || 0;
        const totalUnitOrders = ordersAgg[0]?.totalUnitOrders || 0;
        const totalRevenue = ordersAgg[0]?.totalRevenue || 0;
        const visit = visitsAgg[0]?.visit || 0;

        const conversionRate = totalUnitOrders > 0 ? parseFloat(((totalOrder / totalUnitOrders) * 100).toFixed(2)) : 0;

        return res.status(200).json({
            success: true,
            data: {
                visit,
                totalOrder,
                totalUnitOrders,
                conversionRate,
                totalRevenue
            }
        });

    } catch (err: any) {
        console.error("Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Internal server error"
        });
    }
};

export const getActivities = async (req: CustomRequest, res: Response) => {
    try {
        const userBaseUrl = process.env.ASSET_URL + '/uploads/profileImage/';
        const productBaseUrl = process.env.ASSET_URL + '/uploads/product/';
        const shopBaseUrl = process.env.ASSET_URL + '/uploads/shop-icon/';

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;
        const skip = (page - 1) * limit;

        const userId = req.query.user_id as string;

        const matchStage = userId
            ? { $match: { user_id: new Types.ObjectId(userId) } }
            : null;

        const pipeline: any[] = [];

        if (matchStage) {
            pipeline.push(matchStage);
        }

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "userdata",
                },
            },
            {
                $unwind: {
                    path: "$userdata",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "productdata",
                },
            },
            {
                $unwind: {
                    path: "$productdata",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "vendordetails",
                    localField: "vendor_id",
                    foreignField: "user_id",
                    as: "vendordata",
                },
            },
            {
                $unwind: {
                    path: "$vendordata",
                    preserveNullAndEmptyArrays: true,
                },
            }
        );

        const activities = await ActivityModel.aggregate(pipeline)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const countFilter = userId ? { user_id: new Types.ObjectId(userId) } : {};
        const totalCount = await ActivityModel.countDocuments(countFilter);

        if (activities.length === 0) {
            return res.status(404).json({ message: 'No activities found.' });
        }

        return res.status(200).json({
            message: 'Activities fetched successfully.',
            status: true,
            data: activities,
            userBaseUrl,
            productBaseUrl,
            shopBaseUrl,
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getProductAndVendorActivities = async (req: CustomRequest, res: Response) => {
    try {
        const userBaseUrl = process.env.ASSET_URL + '/uploads/profileImage/';
        const shopIconBaseUrl = process.env.ASSET_URL + '/uploads/shop-icon/';
        const productBaseUrl = process.env.ASSET_URL + '/uploads/product/';

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;
        const skip = (page - 1) * limit;

        const user = req.user;

        const matchStage: any = {};

        const pipeline: any = [];

        if (user?.designation_id === 3) {
            pipeline.push({ $match: { vendor_id: new Types.ObjectId(user._id) } });
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "userdata",
                },
            },
            {
                $unwind: {
                    path: "$userdata",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "productdata",
                },
            },
            {
                $unwind: {
                    path: "$productdata",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "vendordetails",
                    localField: "vendor_id",
                    foreignField: "user_id",
                    as: "vendordata",
                },
            },
            {
                $unwind: {
                    path: "$vendordata",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        );

        const activities = await productAndVedorActivityModel.aggregate(pipeline);

        const totalCount = await productAndVedorActivityModel.countDocuments(matchStage);

        if (activities.length === 0) {
            return res.status(404).json({ message: 'No activities found for this user.' });
        }

        return res.status(200).json({
            message: 'Activities fetched successfully.',
            status: true,
            data: activities,
            userBaseUrl,
            shopIconBaseUrl,
            productBaseUrl,
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getSalesTrafficReport = async (req: CustomRequest, res: Response) => {
    try {
        const { startDate, endDate, wiseType = "day" } = req.query;
        const { designation_id, _id: userId } = req.user;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const start = moment.tz(startDate as string, "Asia/Kolkata").startOf("day");
        const end = moment.tz(endDate as string, "Asia/Kolkata").endOf("day");

        const baseMatchCondition: any = {
            createdAt: { $gte: start.toDate(), $lte: end.toDate() }
        };

        const isVendor = designation_id == "3";
        if (isVendor) {
            baseMatchCondition.vendor_id = new mongoose.Types.ObjectId(userId.toString());
        }

        let groupId: any;
        let projectDate: any;
        let ordersProject: any;
        let viewsProject: any;

        if (wiseType === "month") {
            groupId = {
                year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } }
            };
            projectDate = {
                $concat: [
                    { $toString: "$_id.year" }, "-",
                    { $toString: "$_id.month" }
                ]
            };
            ordersProject = {
                _id: 0,
                date: projectDate,
                totalOrderItems: 1,
                unitsOrdered: 1,
                orderedProductSales: 1,
                amountRefunded: 1,
                numberOfCancel: 1
            };
            viewsProject = {
                _id: 0,
                date: projectDate,
                totalViewItems: 1
            };
        } else if (wiseType === "week") {
            groupId = {
                year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                week: { $isoWeek: { date: "$createdAt", timezone: "Asia/Kolkata" } }
            };
            projectDate = {
                $concat: [
                    { $toString: "$_id.year" }, "-W",
                    { $toString: "$_id.week" }
                ]
            };
            ordersProject = {
                _id: 0,
                date: projectDate,
                week: "$_id.week",
                month: {
                    $month: {
                        date: {
                            $dateFromParts: {
                                isoWeekYear: "$_id.year",
                                isoWeek: "$_id.week"
                            }
                        },
                        timezone: "Asia/Kolkata"
                    }
                },
                totalOrderItems: 1,
                unitsOrdered: 1,
                orderedProductSales: 1,
                amountRefunded: 1,
                numberOfCancel: 1
            };
            viewsProject = {
                _id: 0,
                date: projectDate,
                week: "$_id.week",
                month: {
                    $month: {
                        date: {
                            $dateFromParts: {
                                isoWeekYear: "$_id.year",
                                isoWeek: "$_id.week"
                            }
                        },
                        timezone: "Asia/Kolkata"
                    }
                },
                totalViewItems: 1
            };
        } else {
            groupId = {
                year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } }
            };
            projectDate = {
                $concat: [
                    { $toString: "$_id.year" }, "-",
                    { $toString: "$_id.month" }, "-",
                    { $toString: "$_id.day" }
                ]
            };
            ordersProject = {
                _id: 0,
                date: projectDate,
                totalOrderItems: 1,
                unitsOrdered: 1,
                orderedProductSales: 1,
                amountRefunded: 1,
                numberOfCancel: 1
            };
            viewsProject = {
                _id: 0,
                date: projectDate,
                totalViewItems: 1
            };
        }

        const ordersAgg = await SalesDetailsModel.aggregate([
            { $match: baseMatchCondition },
            {
                $group: {
                    _id: groupId,
                    totalOrderItems: { $sum: 1 },
                    unitsOrdered: { $sum: "$qty" },
                    orderedProductSales: { $sum: { $multiply: ["$qty", "$amount"] } },
                    amountRefunded: { $sum: "$refund_amount" },
                    numberOfCancel: {
                        $sum: { $cond: [{ $eq: ["$order_status", "cancelled"] }, 1, 0] }
                    }
                }
            },
            { $project: ordersProject }
        ]);

        const viewsAgg = await visitModel.aggregate([
            { $match: baseMatchCondition },
            {
                $group: {
                    _id: groupId,
                    totalViewItems: { $sum: "$visit_count" }
                }
            },
            { $project: viewsProject }
        ]);

        const map = new Map<string, any>();

        for (const view of viewsAgg) {
            map.set(view.date, {
                date: view.date,
                week: view.week,
                month: view.month,
                totalViewItems: view.totalViewItems,
                totalOrderItems: 0,
                unitsOrdered: 0,
                orderedProductSales: 0,
                amountRefunded: 0,
                numberOfCancel: 0
            });
        }

        for (const order of ordersAgg) {
            const existing = map.get(order.date) || {
                date: order.date,
                week: order.week,
                month: order.month,
                totalViewItems: 0
            };
            map.set(order.date, {
                ...existing,
                ...order
            });
        }

        const finalData: any[] = [];
        let index = 1;

        for (const data of map.values()) {
            const conversionRate =
                data.totalViewItems > 0
                    ? parseFloat(((data.totalOrderItems / data.totalViewItems) * 100).toFixed(2))
                    : 0;

            finalData.push({
                sNo: index++,
                ...data,
                conversionRate
            });
        }

        finalData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return res.status(200).json({
            success: true,
            data: finalData
        });

    } catch (err: any) {
        console.error("Sales Traffic Report Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Internal server error"
        });
    }
};

export const getShopSaleReport = async (req: CustomRequest, res: Response) => {
    try {
        const { startDate, endDate, wiseType = "day" } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const start = moment(startDate as string).startOf("day");
        const end = moment(endDate as string).endOf("day");

        let dateFormat = "%Y-%m-%d";
        if (wiseType === "month") dateFormat = "%Y-%m";
        if (wiseType === "week") dateFormat = "%G-W%V";

        const isVendor = req.user?.designation_id == 3;
        console.log(isVendor)
        const matchStage: any = isVendor
            ? { _id: new Types.ObjectId(req.user._id) }
            : {};

        const pipeline: any = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "vendordetails",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "vendorDetails"
                }
            },
            { $unwind: { path: "$vendorDetails", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "vendor_id",
                    as: "products",
                    pipeline: [
                        {
                            $lookup: {
                                from: "salesdetails",
                                let: { productId: "$_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$product_id", "$$productId"] },
                                                    { $gte: ["$createdAt", start.toDate()] },
                                                    { $lte: ["$createdAt", end.toDate()] }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            qty: 1,
                                            amount: 1,
                                            is_refunded: 1,
                                            total_amount: 1,
                                            date: {
                                                $dateToString: {
                                                    format: dateFormat,
                                                    date: "$createdAt"
                                                }
                                            }
                                        }
                                    }
                                ],
                                as: "sales"
                            }
                        },
                        {
                            $lookup: {
                                from: "visitcounts",
                                localField: "_id",
                                foreignField: "product_id",
                                as: "visits"
                            }
                        }
                    ]
                }
            },

            { $unwind: "$products" },
            {
                $unwind: {
                    path: "$products.sales",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {
                        shopName: "$shop_name",
                        vendorName: "$vendorDetails.shop_name",
                        date: "$products.sales.date"
                    },
                    totalOrders: { $sum: { $cond: [{ $ifNull: ["$products.sales.qty", false] }, 1, 0] } },
                    totalUnits: { $sum: "$products.sales.qty" },
                    totalSales: { $sum: "$products.sales.amount" },
                    totalRefunds: {
                        $sum: {
                            $cond: [
                                { $eq: ["$products.sales.is_refunded", true] },
                                "$products.sales.total_amount",
                                0
                            ]
                        }
                    },
                    totalViews: { $sum: { $size: "$products.visits" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    shopName: "$_id.shopName",
                    vendorName: "$_id.vendorName",
                    date: "$_id.date",
                    totalOrders: 1,
                    totalUnits: 1,
                    totalSales: 1,
                    totalRefunds: 1,
                    totalViews: 1,
                    conversionRate: {
                        $cond: [
                            { $eq: ["$totalViews", 0] },
                            0,
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            { $divide: ["$totalOrders", "$totalViews"] },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    }
                }
            }
        ];

        const rawData = await User.aggregate(pipeline);

        const allDates: string[] = [];
        const temp = start.clone();

        while (temp.isSameOrBefore(end)) {
            if (wiseType === "month") {
                allDates.push(temp.format("YYYY-MM"));
                temp.add(1, "month");
            } else if (wiseType === "week") {
                allDates.push(temp.format("GGGG-[W]WW"));
                temp.add(1, "week");
            } else {
                allDates.push(temp.format("YYYY-MM-DD"));
                temp.add(1, "day");
            }
        }

        const dateMap = new Map<string, any>();
        for (const entry of rawData) {
            if (entry.date) {
                dateMap.set(entry.date, entry);
            }
        }

        const finalData: any[] = [];

        for (const date of allDates) {
            if (dateMap.has(date)) {
                finalData.push(dateMap.get(date));
            } else {
                finalData.push({
                    rawData,
                    date
                });
            }
        }

        finalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return res.status(200).json({
            success: true,
            finalData
        });

    } catch (err: any) {
        console.error("Shop Sale Report Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Internal server error"
        });
    }
};


export const allChildProductDetails = async (req: Request & { user?: any }, res: Response) => {
    try {
        const { startDate, endDate, type, wiseType = "day" } = req.query;

        if (!startDate || !endDate || !type) {
            return res.status(400).json({
                success: false,
                message: "startDate, endDate, and type are required",
            });
        }

        const isChild = type === "child";
        const start = moment(startDate as string).startOf("day");
        const end = moment(endDate as string).endOf("day");
        const finalData: any[] = [];

        // Get user info from request (make sure middleware sets req.user)
        const designation_id = req.user?.designation_id;
        const userId = req.user?._id;
        const isVendor = designation_id == 3;

        let unit: moment.unitOfTime.StartOf = "day";
        let format = "YYYY-MM-DD";

        if (wiseType === "month") {
            unit = "month";
            format = "YYYY-MM";
        } else if (wiseType === "week") {
            unit = "week";
            format = "GGGG-[W]WW"; // ISO week format
        }

        const periods: { from: Date; to: Date; label: string }[] = [];

        const temp = start.clone();
        while (temp.isSameOrBefore(end)) {
            const from = temp.clone().startOf(unit);
            const to = temp.clone().endOf(unit);
            const label = from.format(format);
            periods.push({ from: from.toDate(), to: to.toDate(), label });
            temp.add(1, unit);
        }

        for (const { from, to, label } of periods) {
            const matchConditions: any = {
                createdAt: { $gte: from, $lte: to },
                "productData.parent_id": isChild ? { $ne: null } : null,
            };

            if (isVendor) {
                // If vendor, filter sales details to products owned by this vendor only
                matchConditions["productData.vendor_id"] = new mongoose.Types.ObjectId(userId);
            }

            const pipeline: any = [
                { $match: matchConditions },
                {
                    $lookup: {
                        from: "visitcounts",
                        let: { pid: "$product_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$product_id", "$$pid"] },
                                            { $gte: ["$createdAt", from] },
                                            { $lte: ["$createdAt", to] },
                                        ],
                                    },
                                },
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalViews: { $sum: "$visit_count" },
                                },
                            },
                        ],
                        as: "visitStats",
                    },
                },
                {
                    $addFields: {
                        totalViews: {
                            $ifNull: [{ $arrayElemAt: ["$visitStats.totalViews", 0] }, 0],
                        },
                        isCancelled: {
                            $cond: [{ $eq: ["$order_status", "cancelled"] }, 1, 0],
                        },
                        productId: "$product_id",
                        parentSKU: "$productData.sku_code",
                        childSKU: "$productData.sku_code",
                        title: "$productData.product_title",
                        image: { $arrayElemAt: ["$productData.image", 0] },
                        price: {
                            $toDouble: {
                                $ifNull: ["$productData.price", "$amount"],
                            },
                        },
                        date: label,
                    },
                },
                {
                    $group: {
                        _id: {
                            productId: "$productId",
                            parentSKU: "$parentSKU",
                            childSKU: "$childSKU",
                            title: "$title",
                            image: "$image",
                            date: "$date",
                        },
                        totalOrderItems: { $sum: 1 },
                        unitsOrdered: { $sum: "$qty" },
                        totalViews: { $sum: "$totalViews" },
                        orderedProductSales: { $sum: "$amount" },
                        refundedAmount: {
                            $sum: {
                                $cond: [{ $eq: ["$is_refunded", true] }, "$total_amount", 0],
                            },
                        },
                        cancelledOrders: { $sum: "$isCancelled" },
                    },
                },
                {
                    $addFields: {
                        conversionRate: {
                            $cond: [
                                { $eq: ["$totalViews", 0] },
                                0,
                                {
                                    $round: [
                                        { $multiply: [{ $divide: ["$totalOrderItems", "$totalViews"] }, 100] },
                                        2,
                                    ],
                                },
                            ],
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id.date",
                        productId: "$_id.productId",
                        parentSKU: "$_id.parentSKU",
                        childSKU: "$_id.childSKU",
                        title: "$_id.title",
                        image: {
                            $concat: [
                                process.env.ASSET_URL || "",
                                "/uploads/product/",
                                "$_id.image",
                            ],
                        },
                        totalOrderItems: 1,
                        unitsOrdered: 1,
                        totalViewItems: "$totalViews",
                        orderedProductSales: { $round: ["$orderedProductSales", 2] },
                        cancelledOrders: 1,
                        conversionRate: 1,
                        ...(isChild ? {} : { refundedAmount: 1 }),
                    },
                },
            ];

            const dayResults = await SalesDetailsModel.aggregate(pipeline);
            finalData.push(...dayResults);
        }

        return res.status(200).json({
            success: true,
            data: finalData,
        });
    } catch (error) {
        console.error("Error generating report:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};

export const getAllUsers = async (req: CustomRequest, resp: Response) => {
    try {
        const { startDate, endDate, wiseType = "day" } = req.query;

        if (!startDate || !endDate) {
            return resp.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        let start = new Date(startDate as string);
        let end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);

        let format = "%Y-%m-%d"; // default for day
        if (wiseType === "month") {
            format = "%Y-%m";
        } else if (wiseType === "week") {
            format = "%G-W%V"; // ISO week format
        }

        // designation_id check
        const designationId = req.user?.designation_id;
        const userId = req.user?._id;
        const isVendor = designationId === "3";

        const matchConditions: any = {
            createdAt: { $gte: start, $lte: end }
        };

        if (isVendor) {
            // Vendor: only fetch users created by them
            matchConditions.created_by = userId;
        }

        const usersByDate = await UserModel.aggregate([
            {
                $match: matchConditions
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: format,
                            date: "$createdAt",
                            timezone: "Asia/Kolkata"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    count: 1
                }
            },
            {
                $sort: { date: -1 }
            }
        ]);

        return resp.status(200).json({
            success: true,
            data: usersByDate
        });

    } catch (error: any) {
        console.error("Error fetching users:", error);
        return resp.status(500).json({
            success: false,
            error: error.message || "Internal server error"
        });
    }
};


export const getAllCustomers = async (req: CustomRequest, res: Response) => {
    try {
        let { startDate, endDate, wiseType = "day" } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const start = moment.tz(startDate as string, "Asia/Kolkata").startOf("day").toDate();
        const end = moment.tz(endDate as string, "Asia/Kolkata").endOf("day").toDate();

        let dateFormat = "%Y-%m-%d";
        if (wiseType === "month") {
            dateFormat = "%Y-%m";
        } else if (wiseType === "week") {
            dateFormat = "%G-W%V";
        }

        const designationId = req.user?.designation_id;
        const userId = req.user?._id;
        const isVendor = designationId === "3";

        const matchConditions: any = {
            createdAt: { $gte: start, $lte: end }
        };

        if (isVendor) {
            matchConditions.created_by = userId;
        }

        const pipeline: any = [
            {
                $match: matchConditions
            },
            {
                $lookup: {
                    from: "salesdetails",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "orders"
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: "$orders" },
                    totalOrderAmount: { $sum: "$orders.amount" },
                    totalRefundAmount: {
                        $sum: {
                            $map: {
                                input: "$orders",
                                as: "ord",
                                in: {
                                    $cond: [
                                        { $eq: ["$$ord.is_refunded", true] },
                                        "$$ord.total_amount",
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "countrydata"
                }
            },
            { $unwind: { path: "$countrydata", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "states",
                    localField: "state_id",
                    foreignField: "_id",
                    as: "statedata"
                }
            },
            { $unwind: { path: "$statedata", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "citydata"
                }
            },
            { $unwind: { path: "$citydata", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "addresses",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "addressdata"
                }
            },
            { $unwind: { path: "$addressdata", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    customerId: "$id_number",
                    date: {
                        $dateToString: {
                            format: dateFormat,
                            date: "$createdAt",
                            timezone: "Asia/Kolkata"
                        }
                    },
                    customer_name: "$name",
                    email: "$email",
                    phone: "$mobile",
                    address: "$addressdata.address_line1",
                    cityname: { $ifNull: ["$citydata.name", ""] },
                    statename: { $ifNull: ["$statedata.name", ""] },
                    countryname: { $ifNull: ["$countrydata.name", ""] },
                    pincode: "$addressdata.pincode",
                    totalOrders: 1,
                    totalOrderAmount: { $round: ["$totalOrderAmount", 2] },
                    totalRefundAmount: { $round: ["$totalRefundAmount", 2] }
                }
            },
            {
                $sort: { date: -1 }
            }
        ];

        const users = await UserModel.aggregate(pipeline);

        return res.status(200).json({
            success: true,
            data: users
        });

    } catch (error: any) {
        console.error("Error fetching customer report:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Internal server error"
        });
    }
};

export const getGiftCards = async (req: CustomRequest, res: Response) => {
    try {
        const { startDate, endDate, wiseType = "day" } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const start = moment.tz(startDate as string, "Asia/Kolkata").startOf("day");
        const end = moment.tz(endDate as string, "Asia/Kolkata").endOf("day");

        let dateFormat = "%Y-%m-%d";
        let momentFormat = "YYYY-MM-DD";
        let momentUnit: moment.unitOfTime.DurationConstructor = "day";

        if (wiseType === "month") {
            dateFormat = "%Y-%m";
            momentFormat = "YYYY-MM";
            momentUnit = "month";
        } else if (wiseType === "week") {
            dateFormat = "%G-W%V";
            momentFormat = "GGGG-[W]WW";
            momentUnit = "week";
        }

        const isVendor = req.user?.designation_id === "3";
        const userId = req.user?._id;

        const baseMatch = {
            createdAt: {
                $gte: start.toDate(),
                $lte: end.toDate()
            },
            ...(isVendor ? { created_by: userId } : {})
        };

        const orderPipeline: any[] = [
            { $match: baseMatch },
            {
                $project: {
                    qty: 1,
                    amount: 1,
                    date: {
                        $dateToString: {
                            format: dateFormat,
                            date: "$createdAt",
                            timezone: "Asia/Kolkata"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$date",
                    totalOrderGiftCard: { $sum: 1 },
                    giftCardOrdered: { $sum: "$qty" },
                    orderedGiftCardSales: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    totalOrderGiftCard: 1,
                    giftCardOrdered: 1,
                    orderedGiftCardSales: {
                        $round: ["$orderedGiftCardSales", 2]
                    }
                }
            }
        ];

        const visitPipeline: any[] = [
            { $match: baseMatch },
            {
                $project: {
                    visit_count: 1,
                    date: {
                        $dateToString: {
                            format: dateFormat,
                            date: "$date",
                            timezone: "Asia/Kolkata"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$date",
                    totalViewItems: { $sum: "$visit_count" }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    totalViewItems: 1
                }
            }
        ];

        const [orders, visits] = await Promise.all([
            PurchaseGiftCardModel.aggregate(orderPipeline),
            giftCardVisitModel.aggregate(visitPipeline)
        ]);

        const allDates: string[] = [];
        const temp = start.clone();
        while (temp.isSameOrBefore(end)) {
            allDates.push(temp.format(momentFormat));
            temp.add(1, momentUnit);
        }

        const orderMap = new Map(orders.map(d => [d.date, d]));
        const visitMap = new Map(visits.map(v => [v.date, v.totalViewItems]));

        const finalData = allDates.map(date => {
            return {
                date,
                totalOrderGiftCard: orderMap.get(date)?.totalOrderGiftCard || 0,
                giftCardOrdered: orderMap.get(date)?.giftCardOrdered || 0,
                orderedGiftCardSales: orderMap.get(date)?.orderedGiftCardSales || 0,
                totalViewItems: visitMap.get(date) || 0
            };
        });

        finalData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return res.status(200).json({
            success: true,
            data: finalData
        });

    } catch (error: any) {
        console.error("Gift Card Report Error:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Internal server error"
        });
    }
};

export const addVoucher = async (req: Request, res: Response) => {
    try {
        const {
            _id,
            type,
            wiseType,
            product_skus,
            shop_ids,
            startDate,
            endDate,
            promotionTitle,
            description,
            claim_code,
            usage_limits,
            type_of_users,
            auto_voucher,
            term_of_use,
            max_amount,
            discount_amount,
            voucher_limit,
            cart_amount,
            discount_type
        } = req.body;

        if (!type || !['product', 'shop'].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid 'type' field." });
        }

        if (_id == "0") {

            const duplicate_claim_code = await VoucherModel.findOne({ claim_code });

            if (duplicate_claim_code) {
                return res.status(400).json({ success: false, message: "Claim code already exists." });
            }

            const voucherData = {
                type,
                wiseType,
                product_skus: product_skus,
                shop_ids: shop_ids,
                startDate,
                endDate,
                promotionTitle,
                description,
                claim_code,
                usage_limits: usage_limits || [],
                type_of_users,
                auto_voucher,
                term_of_use,
                max_amount,
                discount_amount,
                voucher_limit,
                cart_amount,
                discount_type
            };

            const newVoucher = await VoucherModel.create(voucherData);

            return res.status(200).json({
                success: true,
                message: 'Voucher added successfully!',
                voucher: newVoucher,
            });
        } else {
            const voucherData = {
                type,
                wiseType,
                product_skus: product_skus,
                shop_ids: shop_ids,
                startDate,
                endDate,
                promotionTitle,
                description,
                claim_code,
                usage_limits: usage_limits || [],
                type_of_users,
                auto_voucher,
                term_of_use,
                max_amount,
                discount_amount,
                voucher_limit,
                cart_amount,
                discount_type
            };

            const updatedVoucher = await VoucherModel.findByIdAndUpdate(_id, voucherData, { new: true });

            return res.status(200).json({
                success: true,
                message: 'Voucher updated successfully!',
                voucher: updatedVoucher,
            });
        }

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        });
    }
};

export const getVouchers = async (req: Request, res: Response) => {
    try {
        const vouchers = await VoucherModel.find({}).sort({ createdAt: -1 });

        const updatedVouchers = await Promise.all(
            vouchers.map(async (voucher) => {
                const startDateFormatted = voucher.startDate
                    ? res.locals.currentdate(voucher.startDate).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm')
                    : '';

                const endDateFormatted = voucher.endDate
                    ? res.locals.currentdate(voucher.endDate).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm')
                    : '';

                const expiryDateFormatted = voucher.endDate
                    ? res.locals.currentdate(voucher.endDate).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm')
                    : '';

                const isExpired = voucher.endDate
                    ? moment.tz(voucher.endDate, 'Asia/Kolkata').isBefore(moment.tz('Asia/Kolkata'))
                    : false;

                return {
                    _id: voucher._id,
                    type: voucher.type,
                    wiseType: voucher.wiseType,
                    product_skus: voucher.product_skus,
                    shop_ids: voucher.shop_ids,
                    promotionTitle: voucher.promotionTitle,
                    description: voucher.description,
                    claim_code: voucher.claim_code,
                    usage_limits: voucher.usage_limits,
                    type_of_users: voucher.type_of_users,
                    auto_voucher: voucher.auto_voucher,
                    cart_amount: voucher.cart_amount,
                    max_amount: voucher.max_amount,
                    voucher_limit: voucher.voucher_limit,
                    status: voucher.status,
                    discount_amount: voucher.discount_amount,
                    discount_type: voucher.discount_type,
                    start_date: startDateFormatted,
                    end_date: endDateFormatted,
                    expiry_date: expiryDateFormatted,
                    expiry_status: isExpired ? "expired" : "active",
                };
            })
        );

        return res.status(200).json({
            message: "Vouchers fetched successfully",
            vouchers: updatedVouchers,
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal server error. Please try again later.',
        });
    }
};

export const changeVoucherStatus = async (req: Request, res: Response) => {
    try {
        const { id, status } = req.body;
        const voucher = await VoucherModel.findById(id);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }
        voucher.status = status;
        await voucher.save();
        return res.status(200).json({ success: true, message: 'Voucher status changed successfully' });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        });
    }
}

export const deleteVoucher = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const voucher = await VoucherModel.findById(id);

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }
        await VoucherModel.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: 'Voucher deleted successfully' });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        });
    }
};

export const getVoucherById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const voucher = await VoucherModel.findById(id);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }
        return res.status(200).json({ success: true, voucher });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        });
    }
}

export const saveSalerNote = async (req: CustomRequest, resp: Response) => {
    try {
        const { seller_note, order_id, vendor_id } = req.body;

        const query = {
            order_id: order_id,
            ...(Array.isArray(vendor_id)
                ? { vendor_id: { $in: vendor_id } }
                : { vendor_id: vendor_id })
        };

        const result = await SalesDetailsModel.updateMany(query, {
            $set: { seller_note: seller_note }
        });

        if (result.modifiedCount === 0) {
            return resp.status(404).json({ message: 'No matching sales found to update.' });
        }

        return resp.status(200).json({
            message: 'Seller note updated successfully.',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};





