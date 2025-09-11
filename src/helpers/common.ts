import Category from "../models/Category";
import User from "../models/User";
import { ObjectId, Types } from 'mongoose';
const nodemailer = require("nodemailer")
import dotenv from 'dotenv';
import AdminCategoryModel from "../models/AdminCategory";
dotenv.config();
import GiftCard from "../models/GiftCard";
import sharp from 'sharp';
import path from 'path'
import PurchaseGiftCardModel from "../models/PurchaseGiftCard";
import ActivityModel from "../models/Activity";
import productActivityModel from "../models/ProductActivity";
export const getOfferProductPrice = (salePrice: any, discountType: any, discountAmount: any) => {
    let discount_price = 0;

    if (discountType == "1") {
        discount_price = (salePrice * discountAmount) / 100;
    }
    else if (discountType == "2") {
        discount_price = discountAmount;
    }

    return Math.round((salePrice - discount_price) * 100) / 100;
}

export const getAllCategoryTreeids = async (id: any) => {
    const ids: Types.ObjectId[] = [];

    const category = await Category.find({ parent_id: id });

    if (category) {

        for (const data of category) {

            ids.push(data._id);

            const childCategoryIds = await getAllCategoryTreeids(data._id);

            if (childCategoryIds && childCategoryIds.length > 0) {
                ids.push(...childCategoryIds);
            }

        }
    }
    return ids;
}

export const getAllParentCategory = async (id: any, userId: any) => {

    const parent: any[] = [];

    const query: any = {
        parent_id: id,
        status: true
    }

    const checkUser: any = await User.findOne({ _id: userId });

    if (checkUser?.designation_id == '3') {
        query.store_id = userId
    }
    const category = await Category.find(query);

    for (const data of category) {

        interface FinalData {
            id: Types.ObjectId;
            title: string;
            subs?: any[];
        }

        let final: FinalData = {
            id: data._id,
            title: data.title
        };

        const childParent = await getAllParentCategory(data._id, userId);
        if (childParent) {
            final['subs'] = childParent;
        }

        parent.push(final);
    }
    return parent;
}


export const getCategoryTree = async (id: any) => {
    const parent: any[] = [];

    const category = await Category.find({ parent_id: id, status: true });

    for (const data of category) {

        interface FinalData {
            id: Types.ObjectId;
            title: string;
            image: string;
            subs?: any[];
        }

        let final: FinalData = {
            id: data._id,
            title: data.title,
            image: data.image
        };

        const childParent = await getCategoryTree(data._id);
        if (childParent) {
            final['subs'] = childParent;
        }

        parent.push(final);
    }
    return parent;
}

interface FinalData {
    id: Types.ObjectId;
    title: string;
    image: string;
    childIds: Types.ObjectId[];
}

interface FinalDataNew {
    id: Types.ObjectId;
    title: string;
    image: string;
}

export const getCategoryTreeNew = async (id: Types.ObjectId | string, splitSearchWord: string[] = []): Promise<FinalDataNew[]> => {
    const parent: FinalDataNew[] = [];

    const condition: any ={ parent_id: id, status: true }
    if (splitSearchWord.length > 0) {
        condition.restricted_keywords = { $not: { $elemMatch: { $in: splitSearchWord } } };
    }

    const category = await Category.find(condition);

    for (const data of category) {
        const final: FinalDataNew = {
            id: data._id,
            title: data.title,
            image: data.image,
        };

        parent.push(final);

        const childParent = await getCategoryTreeNew(data._id, splitSearchWord);
        parent.push(...childParent);
    }
    return parent;
};

export const buildCategoryPath = async (_id: any) => {
    let name: any = '';

    const result = await Category.findOne({ _id: _id });

    if (result) {
        if (result.parent_id) {
            name += await buildCategoryPath(result.parent_id)
        }
        name += result.title + ' > '
    }
    return name ? name : 'NA';
};

export const buildCategoryAdminPath = async (categoryId: any, depth = 0): Promise<string> => {
    if (!categoryId || depth > 10) return '';
    const category = await AdminCategoryModel.findById(categoryId);
    if (!category) return '';
    const parentPath = await buildCategoryAdminPath(category.parent_id, depth + 1);
    return parentPath ? `${parentPath} > ${category.title}` : category.title;
};


export const buildCategoryPathTitle = async (_id: any, title: any) => {
    let name: any = '';

    const result = await Category.findOne({ _id: _id });

    if (result) {
        if (result.parent_id) {
            name += await buildCategoryPathTitle(result.parent_id, result.title)
        }
        name += result.title + ' > ' + title
    }
    return name ? name : title;
};

export const buildCategoryPathTitles = async (categoryId: any): Promise<string> => {
    if (!categoryId) return '';

    const category = await Category.findById(categoryId);
    if (!category) return '';

    const parentPath: string = await buildCategoryPathTitles(category.parent_id);
    return parentPath ? `${parentPath} > ${category.title}` : category.title;
};


export const buildCategoryBySlug = async (_id: any) => {
    let arr: any = [];

    const result = await Category.findOne({ _id: _id });

    if (result) {
        if (result.parent_id) {
            let data = await buildCategoryBySlug(result.parent_id);
            arr.push(...data);
        }
        arr.push(result);
    }

    return arr;
};

export const buildAdminCategoryBySlug = async (_id: any) => {
    let arr: any = [];

    const result = await AdminCategoryModel.findOne({ _id: _id });

    if (result) {
        if (result.parent_id) {
            let data = await buildAdminCategoryBySlug(result.parent_id);
            arr.push(...data);
        }
        arr.push(result);
    }

    return arr;
};

export const getAllParents = async (categoryId: any) => {
    let parents = [];
    let currentCategory = await Category.findById(categoryId).populate('parent_id').exec();

    while (currentCategory && currentCategory.parent_id) {
        currentCategory = await Category.findById(currentCategory.parent_id).populate('parent_id').exec();
        if (currentCategory) {
            parents.unshift(currentCategory); // Add to the beginning of the array
        }
    }

    return parents;
};

export const getAllAdminParents = async (categoryId: any) => {
    let parents = [];
    let currentCategory = await AdminCategoryModel.findById(categoryId).populate('parent_id').exec();

    while (currentCategory && currentCategory.parent_id) {
        currentCategory = await AdminCategoryModel.findById(currentCategory.parent_id).populate('parent_id').exec();
        if (currentCategory) {
            parents.unshift(currentCategory); // Add to the beginning of the array
        }
    }

    return parents;
};

export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.emailUser,
        pass: process.env.emailPass
    }
});

export const getMainCategory = async (_id: any): Promise<any> => {
    let result: any = await Category.findOne({ _id: _id });

    if (result && result.parent_id) {
        const parent = await getMainCategory(result.parent_id);
        // console.log(parent);
        return parent;
    }

    return result;
};

export const getAllChildCategory = async (_id: any): Promise<any> => {
    let arr: any = [];

    const result = await Category.find({ parent_id: _id });

    if (result && result.length > 0) {

        for (const item of result) {

            arr.push(item);
            const child = await getAllChildCategory(item._id);
            arr.push(...child);

        }
    }

    return arr;
};

export function generateUniqueId(lastUniqueNumber: any) {

    const currentDate = new Date();
    const year = currentDate.getFullYear(); // e.g., 2024
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based, so add 1 and pad to 2 digits
    const date = String(currentDate.getDate()).padStart(2, '0'); // Pad date to 2 digits

    // Ensure the unique number is always 4 digits
    const uniqueNumber = String(lastUniqueNumber + 1).padStart(4, '0');

    // Combine all parts into the final unique ID
    const uniqueId = `${year}${month}${date}${uniqueNumber}`;

    return uniqueId;
}

export function generateCustomerUniqueId() {

    const currentDate = new Date();
    const year = currentDate.getFullYear(); // e.g., 2024
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based, so add 1 and pad to 2 digits
    const date = String(currentDate.getDate()).padStart(2, '0'); // Pad date to 2 digits
    let hours = currentDate.getHours();
    let minutes = currentDate.getMinutes();
    let milliseconds = currentDate.getMilliseconds();

    // Combine all parts into the final unique ID
    const uniqueId = `CUST${year}${month}${date}${hours}${minutes}${milliseconds}`;

    return uniqueId;
}

export const buildAdminCategoryPath = async (_id: any) => {
    let name: any = '';

    const result = await AdminCategoryModel.findOne({ _id: _id });

    if (result) {
        if (result.parent_id) {
            name += await buildAdminCategoryPath(result.parent_id)
        }
        name += result.title + ' > '
    }
    return name ? name : 'NA';
};

export const buildAdminCategoryPathTitles = async (categoryId: any, depth = 0): Promise<string> => {
    if (!categoryId || depth > 10) return '';

    const category = await AdminCategoryModel.findById(categoryId);
    if (!category) return '';

    const parentPath = await buildAdminCategoryPathTitles(category.parent_id, depth + 1);

    return parentPath ? `${parentPath} > ${category.title}` : category.title;
};

export const convertToWebP = async (fileBuffer: Buffer, fullPath: string): Promise<void> => {
    try {
        await sharp(fileBuffer).webp().toFile(fullPath);
    } catch (error) {
        console.log(error);
        throw new Error('Error converting image to WebP format');
    }
};

export const generateFormattedCouponCode = () => {

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Helper function to generate a segment of specific length
    const generateSegment = (length: any) => {
        let segment = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            segment += characters[randomIndex];
        }
        return segment;
    };

    // Generate coupon code with segments: 4-6-5
    const part1 = generateSegment(4);
    const part2 = generateSegment(6);
    const part3 = generateSegment(5);

    return `${part1}-${part2}-${part3}`;
}

export const generateUniqueGiftCode = async () => {
    let gift_code = generateFormattedCouponCode();
    while (true) {
        const exists_code = await PurchaseGiftCardModel.findOne({ gift_code: gift_code });
        if (!exists_code) {
            return gift_code;
        }
        gift_code = generateFormattedCouponCode();
    }
};

export const sendToEmail = async (email: string, subject: string, body: string, cc: string) => {
    const transporter = nodemailer.createTransport({
        host: "smtpout.secureserver.net",
        port: 465,
        secure: true,
        auth: {
            user: process.env.USEREMAIL_NAME!,
            pass: process.env.PASSWORD!
        }
    });
    const mailOptions = {
        from: process.env.USEREMAIL_NAME!,
        to: email,
        cc: cc,
        subject: subject,
        html: body
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (err) {
        console.log("Email send failed with error", err);
    }
};

export function generateAffiliateCode() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const date = String(currentDate.getDate()).padStart(2, '0');
    let hours = currentDate.getHours();
    let minutes = currentDate.getMinutes();
    let milliseconds = currentDate.getMilliseconds();

    const uniqueId = `AFF${year}${month}${date}${hours}${minutes}${milliseconds}`;

    return uniqueId;
}

export const activity = async (userId: any, productId:any, vendorId:any, activityType: string, description: string) => {
    try {
        const activityData = {
            user_id: userId,
            product_id: productId,
            vendor_id: vendorId,
            activity_type: activityType,
            description: description
        };
        const activityModel = new ActivityModel(activityData);
        await activityModel.save();
    } catch (error) {
        console.error("Error saving activity:", error);
    }
}

export const vandorAndProductActivity = async (_id:any, product_id:any, vendor_id:any, type:string, activityType:string, description:String) =>{
    try {
        const activityData = {
            user_id: _id,
            product_id: product_id,
            vendor_id: vendor_id,
            type: type,
            activity_type: activityType,
            description: description
        };
        const activityModel = new productActivityModel(activityData);
        await activityModel.save();
    } catch (error) {
        console.error("Error saving vendor and product activity:", error);
    }
}