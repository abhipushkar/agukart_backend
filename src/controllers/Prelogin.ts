import { Response, Request } from "express";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
const ejs = require('ejs');
import path from 'path';
import User from '../models/User';
import Country from '../models/Country';
import State from '../models/State';
import City from '../models/City';
import Category from '../models/Category';
import Product from '../models/Product';
import mongoose from "mongoose";
import VariantProduct from "../models/Variant-product";
import { buildAdminCategoryBySlug, buildCategoryBySlug, buildCategoryPath, generateCustomerUniqueId, getAllChildCategory, getAllParents, getCategoryTree, getCategoryTreeNew, getMainCategory, getOfferProductPrice, transporter, sendToEmail, activity } from "../helpers/common";
import Slider from "../models/Slider";
import ProductModel from "../models/Product";
import BlogModel from "../models/Blog";
import BlogTagModel from "../models/BlogTag";
import BrandModel from "../models/Brand";
import AdminCategoryModel from "../models/AdminCategory";
import HomeSettingModel from "../models/HomeSetting";
import nodemailer from 'nodemailer';
import Information from "../models/Information";
import UserEmailModel from "../models/UserEmail";
import RatingModel from "../models/Rating";
import VendorModel from "../models/VendorDetail";
import CountryModel from "../models/Country";
import StateModel from "../models/State";
import CityModel from "../models/City";
import FollowModel from "../models/Follow";
import CombinationProductModel from "../models/CombinationProduct";
import GiftCardCategoryModel from "../models/GiftCardCategory";
import GiftCardModel from "../models/GiftCard";
import AffiliateUser from "../models/AffiliateUser";
import PurchaseGiftCardModel from "../models/PurchaseGiftCard";
import cron from 'node-cron';
import PromotionalOfferModel from "../models/PromotionalOffer";
import SalesModel from "../models/Sales";
import wishlistModel from "../models/Wishlist";
import SubscribeModel from "../models/Subscibe";
import BannerModel from "../models/Banner";
import GiftCardDescriptionModel from "../models/GiftCardDescription";
import LoginHistoryModel from "../models/LoginHistory";
import storeModel from "../models/Store";
import CartModel from "../models/Cart";
import { vendorRegister } from "./vendor/Prelogin";
import UserModel from "../models/User";
import axios from 'axios';
import ipaddressModel from "../models/ipaddress";
import settingModel from "../models/Setting";
import visitModel from "../models/Visitcount";
import giftCardVisitModel from "../models/Giftcardvisitcount";

export const login = async (req: Request, resp: Response) => {
  try {
    const { email, password } = req.body;

    let checkUserEmailVerifyOrNot = await UserEmailModel.findOne({ email: email, status: 'Pending' });

    if (checkUserEmailVerifyOrNot) {
      return resp.status(400).json({ message: 'You cannot login. Please verify your email first.' });
    }

    const user = await User.findOne({
      $or: [{ email: email }, { mobile: email }],
      type: { $ne: 'google' }
    });

    if (!user) {
      return resp.status(400).json({ message: 'Invalid Email/Mobile or Password' });
    }

    if (user.status == false) {
      return resp.status(400).json({ message: 'You are blocked' });
    }

    bcrypt.compare(password, user.password, async (err, result) => {
      if (err) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
      }

      if (result) {
        const token = jwt.sign({ _id: user._id }, process.env.SECRET!);
        user.auth_key = token;

        await User.updateOne(
          { _id: user._id },
          { $push: { multipleTokens: { token, createdAt: new Date() } } }
        );

        await user.save();

        const sessionData = {
          user_id: user._id,
          login_time: new Date(),
          ip_address: req.ip,
          status: '1'
        };

        await LoginHistoryModel.create(sessionData);

        await activity(
          user._id,
          null,
          null,
          'login',
          `User ${user.name} logged in successfully.`
        );

        resp.status(200).json({ message: 'Login successfully', user, token });
      } else {
        resp.status(400).json({ message: 'Invalid Email/Mobile or Password' });
      }
    });
  } catch (error) {
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


export const sendPasswordResetEmail = async (req: Request, resp: Response) => {
  try {
    const email = req.body.email
    const user = await User.findOne({ email });
    if (!user) {
      return resp.status(400).json({ message: 'User not found' });
    }


    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + Number(process.env.RESET_LINK_EXPIRE || 3600000));

    await user.save();

    const templatePath = path.join(__dirname, '..', 'views', 'emailTempelate.ejs');
    const htmlContent = await ejs.renderFile(templatePath, {
      frontendUrl: process.env.USER_FRONTEND_URL,
      resetToken: resetToken
    });

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER!,
        pass: process.env.BREVO_PASS!,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.USEREMAIL_NAME,
      subject: 'Password Reset',
      html: htmlContent

    };

    try {
      await transporter.sendMail(mailOptions);
      return resp.status(200).json({ message: 'Mail sent successfully' });
    } catch (mailError) {
      console.error('Error sending email:', mailError);
      return resp.status(500).json({ message: 'Failed to send email. Please try again later.' });
    }

  } catch (err) {
    console.log(err)
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const resetPassword = async (req: Request, resp: Response) => {
  try {
    const { token, newPassword, check = false } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return resp.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    if (check) {
      return resp.status(200).json({ message: 'Token is valid' });
    }

    if (!newPassword) {
      return resp.status(400).json({ message: 'New Password is Required' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    await activity(
      user._id,
      null,
      null,
      'reset-password',
      `User ${user.name} reset their password successfully.`
    );

    return resp.status(200).json({ message: 'Password is successfully reset' });
  } catch (err) {
    console.error(err);
    throw new Error('Error resetting password');
  }
};

export const verifyEmail = async (req: Request, resp: Response) => {
  try {
    const { token } = req.query;

    if (!token) {
      return resp.status(400).json({ message: 'Verification token is required' });
    }

    const userEmailData = await UserEmailModel.findOne({ verifyToken: token });
    if (!userEmailData) {
      return resp.status(400).json({ message: 'Invalid token' });
    }

    userEmailData.status = "Confirmed";
    userEmailData.verifyToken = "";
    await userEmailData.save();

    const user = await User.findOne({ _id: userEmailData.user_id });
    if (!user) {
      return resp.status(400).json({ message: 'User not found' });
    }

    user.email = userEmailData.email;
    await user.save();

    await activity(
      user._id,
      null,
      null,
      'email-verification',
      `User ${user.name} verified their email successfully.`
    );

    return resp.status(200).json({ message: 'Email verified successfully' });

  } catch (err) {
    console.error(err);
    return resp.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};

export const adminSendPasswordResetEmail = async (req: Request, resp: Response) => {
  try {
    const email = req.body.email
    const user = await User.findOne({ email, designation_id: { $in: ['2', '3'] } });
    if (!user) {
      return resp.status(400).json({ message: 'User not found' });
    }


    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + Number(process.env.RESET_LINK_EXPIRE || 3600000));

    await user.save();

    const templatePath = path.join(__dirname, '..', 'views', 'emailTempelate.ejs');
    const htmlContent = await ejs.renderFile(templatePath, {
      frontendUrl: process.env.ADMIN_FRONTEND_URL,
      resetToken: resetToken
    });

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER!,
        pass: process.env.BREVO_PASS!,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.USEREMAIL_NAME,
      subject: 'Password Reset',
      html: htmlContent

    };

    try {
      await transporter.sendMail(mailOptions);
      return resp.status(200).json({ message: 'Mail sent successfully' });
    } catch (mailError) {
      console.error('Error sending email:', mailError);
      return resp.status(500).json({ message: 'Failed to send email. Please try again later.' });
    }

  } catch (err) {
    console.log(err)
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const adminResetPassword = async (req: Request, resp: Response) => {
  try {
    const { token, newPassword } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return resp.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return resp.status(200).json({ message: 'Password is successfully reset' });
  } catch (err) {
    console.error(err);
    throw new Error('Error resetting password');
  }
};



export const socialLogin = async (req: Request, resp: Response) => {
  try {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email, type: 'google' });
    const id_number = await generateCustomerUniqueId();

    const data: any = {
      type: 'google',
      name: req.body.name,
      email: email,
      image: req.body.picture,
      designation_id: '1',
      id_number: id_number
    }

    if (!user) {
      const newUser = await User.create(data);
      const token = jwt.sign({ _id: newUser._id }, process.env.SECRET!);
      newUser.auth_key = token;
      newUser.multipleTokens = [{ token, createdAt: new Date() }];
      await newUser.save();

      const sessionData = {
        user_id: newUser._id,
        login_time: new Date(),
        ip_address: req.ip,
        status: '1'
      };

      await LoginHistoryModel.create(sessionData);

      const userEmailData = {
        user_id: newUser._id,
        email: newUser.email,
        status: 'Confirmed',
        verifyToken: ''
      };

      await UserEmailModel.create(userEmailData);
      await activity(
        newUser._id,
        null,
        null,
        'social-login',
        `User ${newUser.name} logged in via social media successfully.`
      );
      return resp.status(200).json({ message: 'Login successfully', user: newUser, token });
    } else {
      const token = jwt.sign({ _id: user._id }, process.env.SECRET!);
      user.auth_key = token;

      await User.updateOne(
        { _id: user._id },
        { $push: { multipleTokens: { token } } }
      );

      await user.save();

      const sessionData = {
        user_id: user._id,
        login_time: new Date(),
        ip_address: req.ip,
        status: '1'
      };

      await activity(
        user._id,
        null,
        null,
        'social-login',
        `User ${user.name} logged in via social media successfully.`
      );

      await LoginHistoryModel.create(sessionData);

      return resp.status(200).json({ message: 'Login successfully', user, token });
    }

  } catch (error) {
    console.log(error);
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const registration = async (req: Request, resp: Response) => {
  try {
    if (req.body.password !== req.body.confirm_password) {
      return resp.status(400).json({ message: "Password and Confirm Password don't match" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const existingEmail = await User.findOne({ email: req.body.email.toLowerCase(), designation_id: '1' });
    const existingEmailInUserEmail = await UserEmailModel.findOne({ email: req.body.email.toLowerCase(), status: 'Pending' });
    const existingMobile = await User.findOne({ mobile: req.body.mobile, designation_id: '1' });

    if (existingEmail && existingEmailInUserEmail) {
      await User.findOneAndUpdate(
        { email: req.body.email.toLowerCase() },
        {
          $set: {
            name: req.body.name,
            mobile: req.body.mobile,
            password: hashedPassword,
            phone_code: req.body.phone_code,
          },
        },
        { new: true }
      );

      const verifyToken = crypto.randomBytes(20).toString('hex');

      existingEmailInUserEmail.verifyToken = verifyToken;
      await existingEmailInUserEmail.save();

      const templatePath = path.join(__dirname, '..', 'views', 'emailVerificationTemplate.ejs');
      const htmlContent = await ejs.renderFile(templatePath, {
        frontendUrl: process.env.FRONTEND_URL,
        resetToken: verifyToken,
      });

      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 2525,
        secure: false,
        auth: {
          user: process.env.BREVO_USER!,
          pass: process.env.BREVO_PASS!,
        },
      });

      const mailOptions = {
        to: existingEmail.email,
        from: process.env.USEREMAIL_NAME,
        subject: 'Email Verification',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);

      return resp.status(200).json({
        message: 'Email updated and verification email has been resent. Please check your inbox.',
      });
    }

    if (existingMobile) {
      return resp.status(400).json({ message: 'Mobile number already exists' });
    }

    const id_number = await generateCustomerUniqueId();
    const data: any = {
      type: 'manual',
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      mobile: req.body.mobile,
      password: hashedPassword,
      designation_id: '1',
      phone_code: req.body.phone_code,
      id_number: id_number,
    };

    const user = await User.create(data);
    user.auth_key = jwt.sign({ _id: user._id }, process.env.SECRET!);
    await user.save();

    const verifyToken = crypto.randomBytes(20).toString('hex');

    const sessionData = {
      user_id: user._id,
      login_time: new Date(),
      ip_address: req.ip,
      status: '1',
    };

    await LoginHistoryModel.create(sessionData);

    const userEmailData = {
      user_id: user._id,
      email: user.email,
      status: 'Pending',
      verifyToken: verifyToken,
    };

    await UserEmailModel.create(userEmailData);

    const templatePath = path.join(__dirname, '..', 'views', 'emailVerificationTemplate.ejs');
    const htmlContent = await ejs.renderFile(templatePath, {
      frontendUrl: process.env.FRONTEND_URL,
      resetToken: verifyToken,
    });

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER!,
        pass: process.env.BREVO_PASS!,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.USEREMAIL_NAME,
      subject: 'Email Verification',
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      return resp.status(200).json({
        message: 'Registered Successfully. Please check your email for verification.',
        user,
      });
    } catch (mailError) {
      console.error('Error sending email:', mailError);
      return resp.status(500).json({ message: 'Failed to send email. Please try again later.' });
    }

  } catch (error) {
    console.log(error);
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getCategoryList = async (req: Request, resp: Response) => {
  try {
    const query: any = {
      status: true,
    };

    if (req.query.slug) {
      query.parent_slug = req.query.slug;
      // query.parent_slug = { $regex: req.query.slug };
    } else {
      query.parent_slug = '';
    }

    const categories = await Category.find(query);

    const result = await Promise.all(categories.map(async (item) => {
      const subCategoryCheck = await Category.find({ parent_id: item._id });

      const exist = subCategoryCheck.length > 0;

      const modifiedSlug = item.slug.replace(/-/g, '/');


      return {
        _id: item._id,
        title: item.title,
        slug: modifiedSlug,
        parent_id: item.parent_id,
        parent_slug: item.parent_slug,
        image: item.image ? process.env.ASSET_URL + '/uploads/category/' + item.image : "",
        status: item.status,
        variant_id: item.variant_id,
        exist: exist,
        originalSlug: item.slug
      };
    }));

    result.sort((a, b) => {
      if (a.parent_slug === b.parent_slug) {
        return a.title.localeCompare(b.title);
      } else {
        return a.parent_slug.localeCompare(b.parent_slug);
      }
    });

    resp.status(200).json({
      message: 'Category List fetched successfully',
      category: result
    });
  } catch (error) {
    console.error('Error fetching category list:', error);
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const topRatedCategory = async (req: Request, resp: Response) => {
  try {
    const categories = await Category.find({ status: true, topRated: true }).sort({ _id: -1 });
    let base_url = process.env.ASSET_URL + '/uploads/category/';

    return resp.status(200).json({
      message: 'Category List fetched successfully',
      data: categories,
      base_url
    })
  } catch (error) {
    console.error('Error fetching category list:', error);
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getAdminCategory = async (req: Request, resp: Response) => {
  try {
    const type = req.body.type;

    const query: any = {
      status: true
    }

    if (type === 'special') {
      query.special = true;
    }

    if (type === 'popular') {
      query.popular = true;
    }

    const adminCategory = await AdminCategoryModel.find(query).sort({ _id: -1 });

    const baseurl = process.env.ASSET_URL + `/uploads/admin-category/`;

    const data = adminCategory.map(category => ({
      _id: category._id,
      title: category.title,
      tag: category.tag,
      slug: category.slug,
      special: category.special,
      popular: category.popular,
      image: baseurl + category.image,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    const adminCategoryCount = await AdminCategoryModel.countDocuments(query);

    return resp.status(200).json({ message: "Admin Category fetched successfully.", data, count: adminCategoryCount });
  } catch (error) {
    console.error('Error fetching category list:', error);
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getAdminSubcategory = async (req: Request, resp: Response) => {
  try {
    const id = req.body.id;

    const adminCategory = await AdminCategoryModel.find({ parent_id: id, status: true }).sort({ _id: -1 });

    const baseurl = process.env.ASSET_URL + `/uploads/admin-category/`;

    const data = adminCategory.map(category => ({
      _id: category._id,
      title: category.title,
      tag: category.tag,
      slug: category.slug,
      special: category.special,
      popular: category.popular,
      image: baseurl + category.image,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    return resp.status(200).json({ message: "Admin Sub Category fetched successfully.", data });
  } catch (error) {
    console.error('Error fetching category list:', error);
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getAdminMenuCategory = async (req: Request, resp: Response) => {
  try {
    const adminCategory = await AdminCategoryModel.find({ status: true, menuStatus: true }).sort({ _id: -1 }).populate('parent_id');

    const baseurl = process.env.ASSET_URL + `/uploads/admin-category/`;

    const data = adminCategory.map(category => ({
      _id: category._id,
      title: category.title,
      slug: category.slug,
      parent_id: category.parent_id,
      image: baseurl + category.image,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    return resp.status(200).json({ message: "Admin Menu Category fetched successfully.", data });
  } catch (error) {
    console.error('Error fetching category list:', error);
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getProductBySlug = async (req: Request, resp: Response) => {
  try {
    const slug = req.params.slug;
    const sortBy = req.query.sortBy as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const base_url = process.env.ASSET_URL + '/uploads/product/';
    const video_base_url = process.env.ASSET_URL + '/uploads/video/';

    const adminCategory = await AdminCategoryModel.findOne({ slug });

    if (!adminCategory) {
      return resp.status(404).json({ message: "Category not found" });
    }

    const tags = adminCategory.tag;
    const filter: any = {
      status: true,
      draft_status: false,
    };

    const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const conditions: any[] = [{ search_terms: { $in: tags } }];
    if (adminCategory.productsMatch === 'Product Title' && adminCategory.equalTo === 'is equal to' && adminCategory.value) {
      conditions.push({ product_title: { $regex: escapeRegExp(adminCategory.value), $options: 'i' } });
    } else if (adminCategory.productsMatch === 'Product Tag' && adminCategory.equalTo === 'is equal to' && adminCategory.value) {
      conditions.push({ search_terms: { $regex: escapeRegExp(adminCategory.value), $options: 'i' } });
    } else if (adminCategory.productsMatch === 'Product Title' && adminCategory.equalTo === 'is not equal to' && adminCategory.value) {
      conditions.push({ product_title: { $not: { $regex: escapeRegExp(adminCategory.value), $options: 'i' } } });
    } else if (adminCategory.productsMatch === 'Product Tag' && adminCategory.equalTo === 'is not equal to' && adminCategory.value) {
      conditions.push({ search_terms: { $not: { $regex: escapeRegExp(adminCategory.value), $options: 'i' } } });
    }

    filter['$or'] = conditions;

    // Step 1: Fetch products (only required fields)
    const skip = (page - 1) * limit;
    const sortOption: any =
      sortBy === 'asc' ? { sale_price: 1 } :
        sortBy === 'desc' ? { sale_price: -1 } :
          { createdAt: -1 };

    const products = await Product.find(filter)
      .select('_id product_title ratingAvg sale_price isCombination combinationData videos image videos product_bedge userReviewCount createdAt vendor_id zoom')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const productIds = products.map(p => p._id);
    const vendorIds = products.map(p => p.vendor_id);

    // Step 2: Fetch promotionData in bulk
    const allPromotions = await PromotionalOfferModel.find({
      product_id: { $in: productIds },
      vendor_id: { $in: vendorIds },
      status: true,
      expiry_status: { $ne: 'expired' }
    }).select('product_id promotional_title offer_type discount_amount qty').lean();

    // Step 3: Map promotions by product_id
    const promotionMap = new Map<string, any[]>();
    for (const promo of allPromotions) {
      const list = promotionMap.get(promo.product_id.toString()) || [];
      list.push(promo);
      promotionMap.set(promo.product_id.toString(), list);
    }

    // Step 4: Enrich and format response
    const enrichedProducts = await Promise.all(
      products.map(async (product: any) => {
        const promotionData = await PromotionalOfferModel.find({
          product_id: product._id,
          vendor_id: product.vendor_id,
          status: true,
          expiry_status: { $ne: 'expired' }
        });

        let finalPrice = +product?.sale_price;
        let originalPrice = +product?.sale_price;
        let promotion: any = null;

        if (promotionData.length > 0) {
          promotion = promotionData.reduce((best: any, promo: any) => {
            if (!promo?.qty && promo?.qty !== 0) return best;
            if (!best || (!best?.qty && best?.qty !== 0) || promo.qty < best.qty) {
              return promo;
            }
            return best;
          }, null);
        }

        if (product?.isCombination) {
          const mergedCombinations = product.combinationData?.map((i: any) => i.combinations).flat() || [];
          const minComboPrice = mergedCombinations
            .filter((obj: any) => +obj.price > 0)
            .reduce((min: any, obj: any) => Math.min(min, +obj.price), Infinity);

          originalPrice = minComboPrice === Infinity ? +product.sale_price : minComboPrice;
          finalPrice = originalPrice;

          if (promotion && typeof promotion.qty === 'number' && promotion.qty <= 1) {
            finalPrice = calculatePriceAfterDiscount(promotion.offer_type, +promotion.discount_amount, originalPrice);
          }
        } else {
          if (promotion && typeof promotion.qty === 'number' && promotion.qty <= 1) {
            finalPrice = calculatePriceAfterDiscount(promotion.offer_type, +promotion.discount_amount, +product.sale_price);
          }
        }

        return {
          _id: product._id,
          product_title: product.product_title,
          ratingAvg: product.ratingAvg || 0,
          originalPrice,
          finalPrice,
          sale_price: product.sale_price,
          zoom: product.zoom,
          isCombination: product.isCombination,
          combinationData: product.combinationData || [],
          videos: product.videos || [],
          image: product.image || [],
          product_bedge: product.product_bedge || '',
          userReviewCount: product.userReviewCount || 0,
          createdAt: product.createdAt,
          promotionData
        };
      })
    );

    const totalItems = await Product.countDocuments(filter);

    return resp.status(200).json({
      message: "Products fetched successfully.",
      products: enrichedProducts,
      base_url,
      video_base_url,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems
      }
    });

  } catch (error: any) {
    console.error('Error fetching category list:', error);
    return resp.status(500).json({
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
};


export const getPopularGiftProducts = async (req: Request, resp: Response) => {
  try {
    const data = await Product.find({ popular_gifts: "Yes" }).populate('category')
      .populate('brand_id')
      .populate('variant_id')
      .populate('variant_attribute_id');
    let base_url = process.env.ASSET_URL + '/uploads/product/';

    const products = await Promise.all(data.map(async (item: any) => {
      const promotionData = await PromotionalOfferModel.find({ product_id: { $in: item._id }, status: true, vendor_id: item.vendor_id, expiry_status: { $ne: 'expired' } })
      return {
        ...item.toObject(),
        promotionData: promotionData ? promotionData : {}
      }
    }));

    return resp.status(200).json({ message: "Product fetched successfully.", products, base_url });
  } catch (error) {
    console.error('Error fetching category list:', error);
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};
export const bigDiscountProducts = async (req: Request, resp: Response) => {
  try {
    const data = await Product.find({ discount: { $gte: 20 } }).populate('category')
      .populate('brand_id')
      .populate('variant_id')
      .populate('variant_attribute_id');
    let base_url = process.env.ASSET_URL + '/uploads/product/';

    const products = await Promise.all(data.map(async (item: any) => {
      const promotionData = await PromotionalOfferModel.find({ product_id: { $in: item._id }, status: true })
      return {
        ...item.toObject(),
        promotionData: promotionData ? promotionData : {}
      }
    }));
    return resp.status(200).json({ message: "Product fetched successfully.", products, base_url });
  } catch (error) {
    console.error('Error fetching category list:', error);
    resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// export const getProductList = async (req: Request, resp: Response) => {

//   try {
//     let pipeline: any[] = [];
//     pipeline.push({
//       $match: {
//         status: true
//       }
//     },
//       {
//         $lookup: {
//           from: 'variantproducts',
//           localField: '_id',
//           foreignField: 'product_id',
//           as: 'variantProducts',
//         },
//       },
//       {
//         $match: {
//           $or: [
//             { 'variantProducts.status': true },
//             { 'variantProducts': { $exists: false } },
//             { 'variantProducts': [] },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: '$variantProducts',
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $group: {
//           _id: "$_id",
//           category_id: { $first: "$category" },
//           product_title: { $first: "$product_title" },
//           bestseller: { $first: "$bestseller" },
//           top_rated: { $first: "$top_rated" },
//           variantProductId: { $first: "$variantProducts._id" },
//           discount_type: { $first: "$variantProducts.discount_type" },
//           discount_amount: { $first: "$variantProducts.discount_amount" },
//           delivery: { $first: "$variantProducts.delivery" },
//           delivery_amount: { $first: "$variantProducts.delivery_amount" },
//           image: { $first: "$variantProducts.image" },
//           sale_price: { $first: "$variantProducts.sale_price" },
//           slug: { $first: "$variantProducts.slug" }
//         }
//       },
//       {
//         $project: {
//           _id: 0
//         }
//       },
//     );

//     if (req.body.category_slug) {
//       const category = await Category.findOne({ slug: req.body.category_slug });
//       if (!category) {
//         return resp.status(400).json({ message: 'Category not found' });
//       }
//       const categoryId = new mongoose.Types.ObjectId(category._id);
//       pipeline.push(
//         {
//           $match: {
//             category_id: categoryId
//           }
//         }
//       );
//     }
//     if (req.body.bestseller) {
//       pipeline.push(
//         {
//           $match: {
//             bestseller: true
//           }
//         }
//       );
//     }
//     if (req.body.top_rated) {
//       pipeline.push(
//         {
//           $match: {
//             top_rated: true
//           }
//         }
//       );
//     }
//     const productResult = await Product.aggregate(pipeline);
//     console.log(productResult);
//     let result: any = [];

//     if (!productResult || productResult.length === 0) {

//       return resp.status(400).json({ message: "Product Not Found" });
//     } else {
//       result = productResult.map((item) => {
//         const firstImage = item.image[0] ? item.image[0] : null;
//         let base_url = ""

//         if (firstImage != null) {
//           base_url = req.protocol + '://' + req.get('host') + '/uploads/variant-product/';
//         }

//         let secondImage: any = null;

//         if (item.image[1]) {
//           secondImage = item.image[1]
//         }
//         const offerPrice = getOfferProductPrice(item.sale_price, item.discount_type, item.discount_amount);
//         return {
//           variant_productid: item.variantProductId,
//           name: item.product_title.charAt(0).toUpperCase() + item.product_title.slice(1),
//           sale_price: item.sale_price,
//           discount_type: item.discount_type,
//           discount_amount: item.discount_amount,
//           offer_price: offerPrice,
//           firstImage: firstImage,
//           secondImage: secondImage,
//           slug: item.slug,
//           bestseller: item.bestseller,
//           top_rated: item.top_rated,
//           base_url: base_url
//         }
//       })
//     }

//     return resp.status(200).json({
//       message: 'Product fetched successfully.',
//       result: result
//     });

//   } catch (error) {

//     return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

//   }

// }

function calculatePriceAfterDiscount(offer_type: string, discount: number, price: number): number {
  if (offer_type === 'flat') {
    return Math.max(0, price - discount);
  } else if (offer_type === 'percentage') {
    return Math.max(0, price - (price * discount) / 100);
  }
  return price;
}

async function searchProductQuery(q: any) {

  const regex = new RegExp('^' + q, 'i');
  const removeWords = ['for', 'the', 'and', 'of'];
  const splitSearchWord = q
    .trim()
    .split(/\s+/)
    .filter((word: any) => !removeWords.includes(word.toLowerCase()));

  const regexConditions = splitSearchWord.map((word: any) => ({
    title: { $regex: new RegExp('^' + word, 'i') }
  }));

  const productQuery = {
    status: true,
    $or: [
      { title: { $in: regexConditions } },
      { searchTerms: { $elemMatch: { $in: regexConditions } } }
    ]
  };

  const lowerSplitSearchWords = splitSearchWord.map((word: any) => word.toLowerCase());

  const categoryPipeline = [
    {
      $match: {
        $and: [
          {
            $or: splitSearchWord.map((word: string) => ({
              title: {
                $regex: new RegExp(`\\b${word}\\b`, 'i')
              }
            }))
          },
          { status: true }
        ]
      }
    },
    {
      $addFields: {
        restricted_keywords_lower: {
          $map: {
            input: { $ifNull: ["$restricted_keywords", []] },
            as: "item",
            in: { $toLower: "$$item" }
          }
        }
      }
    },
    {
      $addFields: {
        match_found: {
          $or: [
            {
              $eq: [{ $ifNull: ["$restricted_keywords", []] }, []]
            },
            {
              $gt: [
                {
                  $size: {
                    $setIntersection: [
                      "$restricted_keywords_lower",
                      lowerSplitSearchWords
                    ]
                  }
                },
                0
              ]
            }
          ]
        }
      }
    },
    {
      $match: {
        match_found: true
      }
    },

    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        restricted_keywords: 1
      }
    },
    {
      $limit: 10
    }
  ];


  const [categories, adminCategories, products] = await Promise.all([
    Category.aggregate(categoryPipeline),

    AdminCategoryModel.aggregate(categoryPipeline),

    Product.aggregate([
      { $match: productQuery },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: {
          path: '$categoryDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          product_title: 1,
          search_terms: 1,
          title: '$categoryDetails.title',
          slug: '$categoryDetails.slug',
          source: { $literal: 'product' }
        }
      },
      { $limit: 10 }
    ])

  ]);

  const combined = [
    ...categories.map(item => ({ ...item, source: 'category' })),
    ...adminCategories.map(item => ({ ...item, source: 'adminCategory' })),
    ...products.map(item => ({ ...item, source: 'products' }))
  ];


  const uniqueByTitle = Array.from(
    new Map(combined.map(item => [item.title.toLowerCase(), item])).values()
  );

  return uniqueByTitle;
}


export const searchProduct = async (req: Request, resp: Response) => {

  try {

    const q = req.query.q as string;

    const uniqueByTitle = await searchProductQuery(q);
    const paginatedResults = uniqueByTitle.slice(0, 10);

    return resp.status(200).json({
      message: 'Product fetched successfully.',
      data: paginatedResults,
    });

  } catch (error: any) {
    console.log(error);
    return resp.status(500).json({
      message: 'Error fetching products.',
      error: error.message,
      data: []
    });
  }


}

export const searchProductList = async (req: Request, resp: Response) => {
  const sortBy = req.query.sortBy as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10000000;
  const q = req.query.q as string;
  const removeWords = ['for', 'the', 'and', 'of'];
  const splitSearchWord = q
    .trim()
    .split(/\s+/)
    .filter((word: any) => !removeWords.includes(word.toLowerCase())); // Remove common words like 'for', 'the', etc.

  let filter: any = {
    isDeleted: false,
    draft_status: false,
    status: true
  };

  try {
    const uniqueByTitle = await searchProductQuery(q);
    const firstCategory = uniqueByTitle.length > 0 ? uniqueByTitle[0] : [];

    if (firstCategory.length === 0) {
      return resp.status(404).json({
        success: false,
        message: 'Category/Product not found, please try with another keyword.'
      });
    }

    let categoryId: any;
    let adminCategoryId: any;

    if (firstCategory.source === 'category' || firstCategory.source === 'products') {
      categoryId = firstCategory._id;
    }

    if (firstCategory.source === 'adminCategory') {
      adminCategoryId = firstCategory._id;
    }

    if (categoryId) {
      const getAllChildren = await getCategoryTreeNew(categoryId, splitSearchWord);
      const catID = [
        new mongoose.Types.ObjectId(categoryId),
        ...getAllChildren.map((e: any) => new mongoose.Types.ObjectId(e.id))
      ];

      const lastCategoryId = catID.length > 0 ? catID[catID.length - 1] : null;

      let matchProductTitle = '';
      let matchProductTag = '';
      let notMatchProductTitle = '';
      let notMatchProductTag = '';

      if (lastCategoryId) {
        const category = await Category.findOne({ _id: lastCategoryId, status: true });
        if (category) {
          if (category.productsMatch === 'Product Title' && category.equalTo === 'is equal to' && category.value) {
            matchProductTitle = category.value;
          } else if (category.productsMatch === 'Product Tag' && category.equalTo === 'is equal to' && category.value) {
            matchProductTag = category.value;
          } else if (category.productsMatch === 'Product Title' && category.equalTo === 'is not equal to' && category.value) {
            notMatchProductTitle = category.value;
          } else if (category.productsMatch === 'Product Tag' && category.equalTo === 'is not equal to' && category.value) {
            notMatchProductTag = category.value;
          }
        }
      }

      const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const conditions: any[] = [{ category: { $in: catID } }];
      if (matchProductTitle) conditions.push({ product_title: { $regex: escapeRegExp(matchProductTitle), $options: 'i' } });
      if (matchProductTag) conditions.push({ search_terms: { $regex: escapeRegExp(matchProductTag), $options: 'i' } });
      if (notMatchProductTitle) conditions.push({ product_title: { $not: { $regex: escapeRegExp(notMatchProductTitle), $options: 'i' } } });
      if (notMatchProductTag) conditions.push({ search_terms: { $not: { $regex: escapeRegExp(notMatchProductTag), $options: 'i' } } });

      filter['$and'] = conditions;
    }

    if (adminCategoryId) {
      const adminCondition: any = { _id: adminCategoryId };
      if (splitSearchWord.length > 0) {
        adminCondition.restricted_keywords = { $not: { $elemMatch: { $in: splitSearchWord } } };
      }

      const adminCategory = await AdminCategoryModel.findOne(adminCondition);

      if (!adminCategory) {
        return resp.status(404).json({ message: "Category not found" });
      }

      const tags = adminCategory.tag;

      let matchProductTitle = '';
      let matchProductTag = '';
      let notMatchProductTitle = '';
      let notMatchProductTag = '';

      if (adminCategory) {
        if (adminCategory.productsMatch == 'Product Title' && adminCategory.equalTo == 'is equal to' && adminCategory.value != '') {
          matchProductTitle = adminCategory.value;
        } else if (adminCategory.productsMatch == 'Product Tag' && adminCategory.equalTo == 'is equal to' && adminCategory.value != '') {
          matchProductTag = adminCategory.value;
        } else if (adminCategory.productsMatch == 'Product Title' && adminCategory.equalTo == 'is not equal to' && adminCategory.value != '') {
          notMatchProductTitle = adminCategory.value;
        } else if (adminCategory.productsMatch == 'Product Tag' && adminCategory.equalTo == 'is not equal to' && adminCategory.value != '') {
          notMatchProductTag = adminCategory.value;
        }
      }

      function escapeRegExp(text: any) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }

      const conditions: any[] = [{ search_terms: { $in: tags } }];

      if (matchProductTitle) {
        conditions.push({ product_title: { $regex: escapeRegExp(matchProductTitle), $options: 'i' } });
      }
      if (matchProductTag) {
        conditions.push({ search_terms: { $regex: escapeRegExp(matchProductTag), $options: 'i' } });
      }
      if (notMatchProductTitle) {
        conditions.push({
          product_title: {
            $not: { $regex: escapeRegExp(notMatchProductTitle), $options: 'i' }
          }
        });
      }
      if (notMatchProductTag) {
        conditions.push({
          search_terms: {
            $not: { $regex: escapeRegExp(notMatchProductTag), $options: 'i' }
          }
        });
      }

      filter['$or'] = conditions;
    }

    let query = ProductModel.find({ $or: [{ product_title: { $regex: new RegExp(q, 'i') } }, { search_terms: { $regex: new RegExp(q, 'i') } }] })
      .populate('vendor_id')
      .populate('category')
      .populate('brand_id')
      .populate('variant_id')
      .populate('variant_attribute_id')
      .populate('exchangePolicy')
      .populate({
        path: 'parent_id',
        populate: [
          { path: 'variant_id' },
          { path: 'variant_attribute_id' }
        ]
      });


    query = query.sort({ createdAt: -1 });

    const allProducts = await query.exec();

    const base_url = process.env.ASSET_URL + '/uploads/product/';
    const video_base_url = process.env.ASSET_URL + '/uploads/video/';

    const enrichedData = await Promise.all(
      allProducts.map(async (item: any) => {
        const promotionData = await PromotionalOfferModel.find({ product_id: item._id, status: true, expiry_status: 'active', vendor_id: item.vendor_id?._id });
        const vendorDetails = await VendorModel.findOne({ user_id: item.vendor_id?._id });

        let finalPrice = +item?.sale_price;
        let originalPrice = +item?.sale_price;

        let promotion: any = null;
        if (Array.isArray(promotionData) && promotionData.length > 0) {
          promotion = promotionData.reduce((best: any, promo: any) => {
            if (!promo?.qty && promo?.qty !== 0) return best;
            if (!best || (!best?.qty && best?.qty !== 0) || promo.qty < best.qty) {
              return promo;
            }
            return best;
          }, null);
        }

        if (item?.isCombination) {
          const mergedCombinations = item.combinationData?.map((i: any) => i.combinations).flat() || [];
          const minComboPrice = mergedCombinations
            .filter((obj: any) => +obj.price > 0)
            .reduce((min: any, obj: any) => Math.min(min, +obj.price), Infinity);

          originalPrice = minComboPrice === Infinity ? +item.sale_price : minComboPrice;
          finalPrice = originalPrice;

          if (promotion && typeof promotion.qty === 'number' && promotion.qty <= 1) {
            finalPrice = calculatePriceAfterDiscount(
              promotion.offer_type,
              +promotion.discount_amount,
              originalPrice
            );
          }
        } else {
          if (promotion && typeof promotion.qty === 'number' && promotion.qty <= 1) {
            finalPrice = calculatePriceAfterDiscount(
              promotion.offer_type,
              +promotion.discount_amount,
              +item.sale_price
            );
          }
        }

        return {
          ...item.toObject(),
          promotionData: promotionData || [],
          vendorDetails: vendorDetails || {},
          originalPrice,
          finalPrice
        };
      })
    );

    const rankedProducts = enrichedData.map((product: any) => {
      let points = 0;

      const titleOccurrences = (product.product_title.match(new RegExp(q, 'gi')) || []).length;
      points += titleOccurrences * 3;

      const searchTermOccurrences = (product.search_terms?.join(' ').match(new RegExp(q, 'gi')) || []).length;
      points += searchTermOccurrences * 2;

      const attributeOccurrences = (product.attributes?.join(' ').match(new RegExp(q, 'gi')) || []).length;
      points += attributeOccurrences;

      return { ...product, points, isPopularNow: product.product_bedge === 'Popular Now' };
    }).sort((a, b) => {
      if (b.isPopularNow && !a.isPopularNow) return 1;
      if (!b.isPopularNow && a.isPopularNow) return -1;

      return b.points - a.points;
    });

    const totalItems = rankedProducts.length;
    const paginatedData = rankedProducts.slice((page - 1) * limit, page * limit);

    return resp.status(200).json({
      message: 'Product fetched successfully.',
      data: paginatedData,
      base_url,
      video_base_url,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems
      }
    });
  } catch (error: any) {
    console.log(error);
    return resp.status(500).json({
      message: 'Error fetching products.',
      error: error.message,
      data: []
    });
  }
};

export const getProductList = async (req: Request, resp: Response) => {
  const categoryId = req.query.categoryId as string;
  const vendor_id = req.query.vendor_id as string;
  const sortBy = req.query.sortBy as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const q = req.query.q as string;

  const base_url = process.env.ASSET_URL + '/uploads/product/';
  const video_base_url = process.env.ASSET_URL + '/uploads/video/';

  let filter: any = {
    isDeleted: false,
    draft_status: false,
    status: true
  };

  try {
    if (categoryId) {
      const getAllChildren = await getCategoryTreeNew(categoryId);
      const catID = [
        new mongoose.Types.ObjectId(categoryId),
        ...getAllChildren.map((e: any) => new mongoose.Types.ObjectId(e.id))
      ];

      const lastCategoryId = catID.length > 0 ? catID[catID.length - 1] : null;

      let matchProductTitle = '';
      let matchProductTag = '';
      let notMatchProductTitle = '';
      let notMatchProductTag = '';

      if (lastCategoryId) {
        const category = await Category.findOne({ _id: lastCategoryId, status: true }).lean();
        if (category) {
          if (category.productsMatch === 'Product Title' && category.equalTo === 'is equal to' && category.value)
            matchProductTitle = category.value;
          else if (category.productsMatch === 'Product Tag' && category.equalTo === 'is equal to' && category.value)
            matchProductTag = category.value;
          else if (category.productsMatch === 'Product Title' && category.equalTo === 'is not equal to' && category.value)
            notMatchProductTitle = category.value;
          else if (category.productsMatch === 'Product Tag' && category.equalTo === 'is not equal to' && category.value)
            notMatchProductTag = category.value;
        }
      }

      const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const conditions: any[] = [{ category: { $in: catID } }];
      if (matchProductTitle) conditions.push({ product_title: { $regex: escapeRegExp(matchProductTitle), $options: 'i' } });
      if (matchProductTag) conditions.push({ search_terms: { $regex: escapeRegExp(matchProductTag), $options: 'i' } });
      if (notMatchProductTitle) conditions.push({ product_title: { $not: { $regex: escapeRegExp(notMatchProductTitle), $options: 'i' } } });
      if (notMatchProductTag) conditions.push({ search_terms: { $not: { $regex: escapeRegExp(notMatchProductTag), $options: 'i' } } });

      filter['$and'] = conditions;
    }

    if (q) {
      filter['$or'] = [
        { product_title: { $regex: new RegExp(q, 'i') } },
        { search_terms: { $regex: new RegExp(q, 'i') } }
      ];
    }

    if (vendor_id) {
      filter.vendor_id = vendor_id;
    }

    // Step 1: Get products with limited fields
    const skip = (page - 1) * limit;

    const allProducts = await ProductModel.find(filter)
      .select('_id product_title ratingAvg sale_price isCombination combinationData videos image product_bedge userReviewCount createdAt vendor_id zoom')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const productIds = allProducts.map(p => p._id);
    const vendorIds = allProducts.map(p => p.vendor_id);

    // Step 2: Bulk fetch promotions
    const allPromotions = await PromotionalOfferModel.find({
      product_id: { $in: productIds },
      vendor_id: { $in: vendorIds },
      status: true,
      expiry_status: { $ne: 'expired' }
    }).select('product_id promotional_title offer_type discount_amount qty').lean();

    // Step 3: Fetch vendorDetails
    const vendorMap: Record<string, string> = {};
    const vendorList = await VendorModel.find({ user_id: { $in: vendorIds } }).select('user_id shop_name').lean();
    vendorList.forEach(v => {
      vendorMap[v.user_id.toString()] = v.shop_name;
    });

    // Step 4: Map promotions by product
    const promoMap = new Map();
    for (const promo of allPromotions) {
      const list = promoMap.get(promo.product_id.toString()) || [];
      list.push(promo);
      promoMap.set(promo.product_id.toString(), list);
    }

    // Step 5: Enrich final response
    const enrichedData = await Promise.all(
      allProducts.map(async (item: any) => {
        const promotionData = await PromotionalOfferModel.find({ product_id: item._id, status: true, vendor_id: item.vendor_id?._id, expiry_status: { $ne: 'expired' } });
        const vendorDetails = await VendorModel.findOne({ user_id: item.vendor_id?._id });

        let finalPrice = +item?.sale_price;
        let originalPrice = +item?.sale_price;

        let promotion: any = null;
        if (Array.isArray(promotionData) && promotionData.length > 0) {
          promotion = promotionData.reduce((best: any, promo: any) => {
            if (!promo?.qty && promo?.qty !== 0) return best;
            if (!best || (!best?.qty && best?.qty !== 0) || promo.qty < best.qty) {
              return promo;
            }
            return best;
          }, null);
        }

        if (item?.isCombination) {
          const mergedCombinations = item.combinationData?.map((i: any) => i.combinations).flat() || [];
          const minComboPrice = mergedCombinations
            .filter((obj: any) => +obj.price > 0)
            .reduce((min: any, obj: any) => Math.min(min, +obj.price), Infinity);

          originalPrice = minComboPrice === Infinity ? +item.sale_price : minComboPrice;
          finalPrice = originalPrice;

          if (promotion && typeof promotion.qty === 'number' && promotion.qty <= 1) {
            finalPrice = calculatePriceAfterDiscount(
              promotion.offer_type,
              +promotion.discount_amount,
              originalPrice
            );
          }
        } else {
          if (promotion && typeof promotion.qty === 'number' && promotion.qty <= 1) {
            finalPrice = calculatePriceAfterDiscount(
              promotion.offer_type,
              +promotion.discount_amount,
              +item.sale_price
            );
          }
        }

        return {
          _id: item._id,
          product_title: item.product_title,
          ratingAvg: item.ratingAvg || 0,
          originalPrice,
          finalPrice,
          sale_price: item.sale_price,
          zoom: item.zoom,
          isCombination: item.isCombination,
          combinationData: item.combinationData || [],
          videos: item.videos || [],
          image: item.image || [],
          product_bedge: item.product_bedge || '',
          userReviewCount: item.userReviewCount || 0,
          createdAt: item.createdAt,
          promotionData,
          vendorDetails: {
            shop_name: vendorMap[item.vendor_id?.toString()] || ''
          }
        };
      })
    );

    // Step 6: Final sorting (if specified)
    if (sortBy === 'asc') {
      enrichedData.sort((a, b) => a.finalPrice - b.finalPrice);
    } else if (sortBy === 'desc') {
      enrichedData.sort((a, b) => b.finalPrice - a.finalPrice);
    }

    const totalItems = await ProductModel.countDocuments(filter);

    return resp.status(200).json({
      message: 'Product fetched successfully.',
      data: enrichedData,
      base_url,
      video_base_url,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems
      }
    });

  } catch (error: any) {
    console.error(error);
    return resp.status(500).json({
      message: 'Error fetching products.',
      error: error.message,
      data: []
    });
  }
};


export const getProductById = async (req: Request, resp: Response) => {
  const productId = req.query.productId as string;

  if (!productId) {
    return resp.status(400).json({
      message: 'No Product id found',
      data: []
    });
  }

  try {
    const data = await ProductModel.findOne({
      _id: productId,
      status: true,
      isDeleted: false,
      draft_status: false
    })
      .populate({ path: 'vendor_id', match: { status: true } })
      .populate({ path: 'category', match: { status: true } })
      .populate({ path: 'brand_id', match: { status: true } })
      .populate({ path: 'variant_id', match: { status: true } })
      .populate({ path: 'variant_attribute_id', match: { status: true } })
      .populate({ path: 'shipping_templates' })
      .populate({ path: 'exchangePolicy', match: { status: true } })
      .populate({
        path: 'parent_id',
        populate: [
          { path: 'variant_id', match: { status: true } },
          { path: 'variant_attribute_id', match: { status: true } }
        ]
      });

    if (!data) {
      return resp.status(404).json({
        message: 'Product not found or inactive.',
        data: []
      });
    }

    const decodedBulletPoints = Buffer.from(data.bullet_points || '', 'base64').toString('utf-8');
    const decodedDescription = Buffer.from(data.description || '', 'base64').toString('utf-8');
    data.description = decodedDescription;
    data.bullet_points = decodedBulletPoints;

    const category_chain: any[] = [];
    if (data?.category && typeof data.category === 'object' && data.category._id) {
      let currentCategory = data.category as any;
      while (currentCategory) {
        category_chain.unshift({
          _id: currentCategory._id,
          title: currentCategory.title,
          slug: currentCategory.slug
        });
        if (!currentCategory.parent_id) break;
        currentCategory = await Category.findOne({
          _id: currentCategory.parent_id,
          status: true
        });
      }
    }

    const combinationData = await CombinationProductModel.find({ product_id: data.parent_id });

    const base_url = process.env.ASSET_URL || '';

    const rating = await RatingModel.aggregate([
      { '$match': { product_id: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        '$lookup': {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { '$unwind': { path: '$user', preserveNullAndEmptyArrays: true } },
      { '$sort': { createdAt: -1 } },
      {
        '$group': {
          _id: '$user_id',
          latestRating: { $first: '$$ROOT' }
        }
      },
      { '$replaceRoot': { newRoot: '$latestRating' } },
      {
        '$project': {
          delivery_rating: 1,
          user_id: 1,
          product_id: 1,
          item_rating: 1,
          additional_comment: 1,
          recommended: 1,
          status: 1,
          createdAt: 1,
          user_name: '$user.name',
          user_image: {
            $cond: {
              if: { $and: [{ $ne: ['$user.image', null] }, { $regexMatch: { input: '$user.image', regex: '^https' } }] },
              then: '$user.image',
              else: {
                $cond: {
                  if: { $ne: ['$user.image', null] },
                  then: { $concat: [base_url, '/uploads/profileImage/', '$user.image'] },
                  else: ''
                }
              }
            }
          }
        }
      }
    ]);

    const vendorDetails = await VendorModel.findOne({ user_id: data.vendor_id?._id });
    const vendorDetailsData = {
      ...vendorDetails?.toObject(),
      vendor_shop_icon_url: `${base_url}/uploads/shop-icon/`
    };

    const promotionData = await PromotionalOfferModel.find({
      product_id: productId,
      vendor_id: data.vendor_id?._id,
      status: true,
      expiry_status: 'active'
    });

    let finalPrice = +data.sale_price;
    let originalPrice = +data.sale_price;
    let promotion: any = null;

    if (Array.isArray(promotionData) && promotionData.length > 0) {
      promotion = promotionData.reduce((best: any, promo: any) => {
        if (!promo?.qty && promo?.qty !== 0) return best;
        if (!best || (!best?.qty && best?.qty !== 0) || promo.qty < best.qty) {
          return promo;
        }
        return best;
      }, null);
    }

    if (data.isCombination) {
      const mergedCombinations = data.combinationData?.map((i: any) => i.combinations).flat() || [];
      const minComboPrice = mergedCombinations
        .filter((obj: any) => +obj.price > 0)
        .reduce((min: any, obj: any) => Math.min(min, +obj.price), Infinity);

      originalPrice = minComboPrice === Infinity ? +data.sale_price : minComboPrice;
      finalPrice = originalPrice;

      if (promotion && typeof promotion.qty === 'number' && promotion.qty <= 1) {
        finalPrice = calculatePriceAfterDiscount(
          promotion.offer_type,
          +promotion.discount_amount,
          originalPrice
        );
      }
    } else {
      if (promotion && typeof promotion.qty === 'number' && promotion.qty <= 1) {
        finalPrice = calculatePriceAfterDiscount(
          promotion.offer_type,
          +promotion.discount_amount,
          +data.sale_price
        );
      }
    }

    const cartEntry = await CartModel.findOne({ product_id: productId });
    const cartProductCount = cartEntry?.qty || 0;

    const allData = {
      ...data.toObject(),
      combinationData: data.isCombination === true ? data.combinationData : combinationData,
      vendor_details: vendorDetailsData,
      vendor_base_url: `${base_url}/uploads/vendor/`,
      promotionData,
      finalPrice,
      originalPrice,
      cartProductCount,
      categories: category_chain
    };

    return resp.status(200).json({
      message: 'Product fetched successfully.',
      data: allData,
      base_url,
      video_url: `${base_url}/uploads/video/`,
      image_url: `${base_url}/uploads/product/`,
      rating
    });
  } catch (error: any) {
    console.error(error);
    return resp.status(500).json({
      message: 'Error fetching product.',
      error: error.message,
      data: []
    });
  }
};

export const getSimilarProduct = async (req: Request, resp: Response) => {
  const productId = req.query.productId as string;

  if (!productId) {
    return resp.status(400).json({
      message: 'No Product id found',
      data: []
    });
  }

  try {
    const base_url = process.env.ASSET_URL || '';

    const product = await ProductModel.findOne({ _id: productId, status: true })
      .select('_id sale_price isCombination combinationData category vendor_id')
      .lean();

    if (!product) {
      return resp.status(404).json({ message: 'Product not found or inactive.', data: [] });
    }

    const allProducts = await ProductModel.find({
      category: product.category,
      _id: { $ne: productId },
      status: true,
      draft_status: false
    })
      .select('_id product_title ratingAvg sale_price isCombination combinationData videos image product_bedge userReviewCount createdAt vendor_id zoom')
      .limit(6)
      .lean();

    const vendorIds = allProducts.map(p => p.vendor_id?.toString());
    const vendors = await VendorModel.find({ user_id: { $in: vendorIds } }).select('user_id shop_name').lean();

    const vendorMap: Record<string, string> = {};
    vendors.forEach(v => {
      vendorMap[v.user_id.toString()] = v.shop_name;
    });

    const enrichedData = await Promise.all(
      allProducts.map(async (item: any) => {
        const promotionData = await PromotionalOfferModel.find({
          product_id: item._id,
          status: true,
          vendor_id: item.vendor_id?._id || item.vendor_id,
          expiry_status: { $ne: 'expired' },
        }).lean();

        let finalPrice = +item.sale_price;
        let originalPrice = +item.sale_price;

        let promotion: any = null;
        if (promotionData.length > 0) {
          promotion = promotionData.reduce((best: any, promo: any) => {
            if (!promo?.qty && promo?.qty !== 0) return best;
            if (!best || (!best?.qty && best?.qty !== 0) || promo.qty < best.qty) {
              return promo;
            }
            return best;
          }, null);
        }

        if (item.isCombination) {
          const mergedCombinations = item.combinationData?.flatMap((i: any) => i.combinations) || [];
          const minComboPrice = mergedCombinations
            .filter((obj: any) => +obj.price > 0)
            .reduce((min: number, obj: any) => Math.min(min, +obj.price), Infinity);

          originalPrice = minComboPrice === Infinity ? +item.sale_price : minComboPrice;
          finalPrice = promotion && promotion.qty <= 1
            ? calculatePriceAfterDiscount(promotion.offer_type, +promotion.discount_amount, originalPrice)
            : originalPrice;
        } else {
          finalPrice = promotion && promotion.qty <= 1
            ? calculatePriceAfterDiscount(promotion.offer_type, +promotion.discount_amount, +item.sale_price)
            : +item.sale_price;
        }

        return {
          _id: item._id,
          product_title: item.product_title,
          zoom: item.zoom,
          ratingAvg: item.ratingAvg || 0,
          originalPrice,
          finalPrice,
          sale_price: item.sale_price,
          isCombination: item.isCombination,
          combinationData: item.combinationData || [],
          videos: item.videos || [],
          image: item.image || [],
          product_bedge: item.product_bedge || '',
          userReviewCount: item.userReviewCount || 0,
          createdAt: item.createdAt,
          promotionData,
          vendorDetails: {
            shop_name: vendorMap[item.vendor_id?.toString()] || '',
          },
        };
      })
    );

    return resp.status(200).json({
      message: 'Similar products fetched successfully.',
      image_url: `${base_url}/uploads/product/`,
      video_url: `${base_url}/uploads/video/`,
      data: enrichedData
    });

  } catch (error: any) {
    console.error('Error fetching similar products:', error);
    return resp.status(500).json({
      message: 'Error fetching product.',
      error: error.message,
      data: []
    });
  }
};

export const getSimilarVendorProduct = async (req: Request, resp: Response) => {
  const productId = req.query.productId as string;

  if (!productId) {
    return resp.status(400).json({ message: 'No productId provided', data: [] });
  }

  try {
    const base_url = process.env.ASSET_URL || '';

    const originalProduct = await ProductModel.findOne({ _id: productId, status: true })
      .select('vendor_id')
      .lean();

    if (!originalProduct) {
      return resp.status(404).json({ message: 'Product not found', data: [] });
    }

    const allProducts = await ProductModel.find({
      vendor_id: originalProduct.vendor_id,
      _id: { $ne: productId },
      status: true,
      draft_status: false,
    })
      .select('_id product_title ratingAvg sale_price isCombination combinationData videos image product_bedge userReviewCount createdAt vendor_id zoom')
      .limit(6)
      .lean();

    const vendorIds = [...new Set(allProducts.map((p) => p.vendor_id?.toString()))];
    const vendors = await VendorModel.find({ user_id: { $in: vendorIds } }).select('user_id shop_name').lean();
    const vendorMap: Record<string, string> = {};
    vendors.forEach((v) => {
      vendorMap[v.user_id.toString()] = v.shop_name;
    });

    const enrichedData = await Promise.all(
      allProducts.map(async (item: any) => {
        const promotionData = await PromotionalOfferModel.find({
          product_id: item._id,
          status: true,
          vendor_id: item.vendor_id?._id,
          expiry_status: { $ne: 'expired' },
        }).lean();

        let finalPrice = +item.sale_price;
        let originalPrice = +item.sale_price;

        let promotion: any = null;
        if (promotionData.length > 0) {
          promotion = promotionData.reduce((best: any, promo: any) => {
            if (!promo?.qty && promo?.qty !== 0) return best;
            if (!best || (!best?.qty && best?.qty !== 0) || promo.qty < best.qty) {
              return promo;
            }
            return best;
          }, null);
        }

        if (item.isCombination) {
          const mergedCombinations = item.combinationData?.flatMap((i: any) => i.combinations) || [];
          const minComboPrice = mergedCombinations
            .filter((obj: any) => +obj.price > 0)
            .reduce((min: number, obj: any) => Math.min(min, +obj.price), Infinity);

          originalPrice = minComboPrice === Infinity ? +item.sale_price : minComboPrice;
          finalPrice = promotion && promotion.qty <= 1
            ? calculatePriceAfterDiscount(promotion.offer_type, +promotion.discount_amount, originalPrice)
            : originalPrice;
        } else {
          finalPrice = promotion && promotion.qty <= 1
            ? calculatePriceAfterDiscount(promotion.offer_type, +promotion.discount_amount, +item.sale_price)
            : +item.sale_price;
        }

        return {
          _id: item._id,
          product_title: item.product_title,
          ratingAvg: item.ratingAvg || 0,
          originalPrice,
          finalPrice,
          zoom: item.zoom,
          sale_price: item.sale_price,
          isCombination: item.isCombination,
          combinationData: item.combinationData || [],
          videos: item.videos || [],
          image: item.image || [],
          product_bedge: item.product_bedge || '',
          userReviewCount: item.userReviewCount || 0,
          createdAt: item.createdAt,
          promotionData,
          vendorDetails: {
            shop_name: vendorMap[item.vendor_id?.toString()] || '',
          },
        };
      })
    );

    return resp.status(200).json({
      message: 'Similar vendor products fetched successfully',
      image_url: `${base_url}/uploads/product/`,
      video_url: `${base_url}/uploads/video/`,
      data: enrichedData,
    });

  } catch (err: any) {
    console.error('getSimilarVendorProduct error:', err);
    return resp.status(500).json({
      message: 'Error fetching similar vendor products.',
      error: err.message,
      data: [],
    });
  }
};

export const getVariantSlug = async (req: Request, resp: Response) => {
  try {
    const attributes = req.body.attributes;
    const product_id = req.body.product_id;

    const productDetail = await VariantProduct.find({ product_id: product_id, variant_attribute_id: attributes, status: true });
    if (!productDetail) {

      return resp.status(400).json({ message: 'Product not found as per selected variant.' });

    }
    resp.status(200).json({ message: 'Product fetched successfully.', productDetail: productDetail })

  } catch (error) {

    console.log(error)
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getSlider = async (req: Request, resp: Response) => {
  try {
    const sliders = await Slider.find({ status: true }).sort({ _id: -1 });

    const data = sliders.map(slider => ({
      _id: slider._id,
      image: process.env.ASSET_URL + `/uploads/slider/` + slider.image,
      status: slider.status,
      createdAt: slider.createdAt,
      updatedAt: slider.updatedAt,
    }));

    console.log(data)

    resp.status(200).json({ message: 'Slider fetched successfully', result: data });
  } catch (error) {
    console.log(error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getCountry = async (req: Request, resp: Response) => {

  const contryList = await Country.find().sort({ name: 1 });

  return resp.status(200).json({ message: "Countries fetched successfully.", contryList })
}

export const getAllState = async (req: Request, resp: Response) => {
  try {

    const stateList = await State.find({ country_id: req.body.country_id }).sort({ name: 1 });
    return resp.status(200).json({ message: "States fetched successfully.", stateList })

  } catch (error) {
    console.log(error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getCityById = async (req: Request, resp: Response) => {
  try {
    const state_id = req.body.state_id;
    const cities = await City.find({ state_id: state_id }).sort({ name: 1 });
    resp.status(200).json({ message: 'City fetched successfully', result: cities });
  } catch (error) {
    console.log(error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getInformations = async (req: Request, resp: Response) => {
  try {
    const type = req.body.type;
    const information = await Information.findOne({ type: type });
    if (!information) {
      return resp.status(400).json({ message: 'Information not found' })
    }
    return resp.status(200).json({ message: 'Information fetched successfully.', information });

  } catch (error) {

    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

  }

}

export const getDescription = async (req: Request, resp: Response) => {
  try {
    const type = req.body.type;
    const information = await settingModel.findOne({ type: type });
    if (!information) {
      return resp.status(400).json({ message: 'Information not found' })
    }
    return resp.status(200).json({ message: 'Information fetched successfully.', information });

  } catch (error) {

    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });

  }
}

export const getBlog = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const query: any = {
      slug: slug
    }

    const blog = await BlogModel.findOne(query).populate('tag_id');

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    const baseurl = `${process.env.ASSET_URL}/uploads/blog/`;

    const data = {
      _id: blog._id,
      tag_id: blog.tag_id,
      title: blog.title,
      author_name: blog.author_name,
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

export const getRecommendedBlog = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const query: any = {
      slug: slug
    }

    const blog = await BlogModel.findOne(query);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    const tag_id = blog.tag_id;

    const recommendedBlog = await BlogModel.find({ tag_id: { $in: [tag_id] }, _id: { $ne: blog._id } }).sort({ _id: -1 }).populate('tag_id');

    const baseurl = `${process.env.ASSET_URL}/uploads/blog/`;

    const data = recommendedBlog.map(blog => ({
      _id: blog._id,
      tag_id: blog.tag_id,
      title: blog.title,
      slug: blog.slug,
      author_name: blog.author_name,
      description: blog.description,
      short_description: blog.short_description,
      image: baseurl + blog.image,
      status: blog.status,
      featured: blog.featured,
      createdAt: blog.updatedAt,
      updatedAt: blog.updatedAt
    }))

    return res.status(200).json({ message: "Recommended blog fetched successfully.", data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const blogTagsList = async (req: Request, res: Response) => {
  try {

    const blogTags = await BlogTagModel.find({ status: true });

    if (!blogTags) {

      return res.status(404).json({ message: "Blog Tags not found." });

    }

    return res.status(200).json({ message: "Blog list fetched successfully.", blogTags });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const blogList = async (req: Request, res: Response) => {
  try {
    console.log('aaaaa');

    const type = req.body.type;
    const search = req.body.search;
    const tag = req.body.tag;
    const tagId = req.body.tag_id;
    const offset = req.body.offset || 0;
    let limit = 12;

    const query: any = {
      status: true
    }

    if (tag) {
      const tagData = await BlogTagModel.findOne({ slug: tag });
      query.tag_id = tagId
    }

    if (tagId) {
      query.tag_id = new mongoose.Types.ObjectId(tagId)
    }

    if (type === 'featured') {
      query.featured = true;
      limit = 99999999999999999999999999;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const blogs = await BlogModel.find(query).populate('tag_id').sort({ _id: -1 }).skip(offset).limit(limit);

    const baseurl = process.env.ASSET_URL + `/uploads/blog/`;

    const data = blogs.map(blog => ({
      _id: blog._id,
      tag_id: blog.tag_id,
      author_name: blog.author_name,
      title: blog.title,
      description: blog.description,
      short_description: blog.short_description,
      image: baseurl + blog.image,
      status: blog.status,
      slug: blog.slug,
      featured: blog.featured,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt
    }));

    const blogCount = await BlogModel.countDocuments(query);

    return res.status(200).json({ message: "Blog list fetched successfully.", data, count: blogCount });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getBrands = async (req: Request, res: Response) => {
  try {
    const type = req.body.type;

    const query: any = {
      status: true
    }

    if (type === 'featured') {
      query.featured = true;
    }

    const brands = await BrandModel.find(query).sort({ _id: -1 });

    const baseurl = process.env.ASSET_URL + `/uploads/brand/`;

    const data = brands.map(brand => ({
      _id: brand._id,
      title: brand.title,
      slug: brand.slug,
      link: brand.link,
      image: baseurl + brand.image,
      featured: brand.featured,
      description: brand.description,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt
    }));

    const brandCount = await BrandModel.countDocuments(query);

    return res.status(200).json({ message: "Blog list fetched successfully.", data, count: brandCount });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const bestsellerCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.find({ status: true, bestseller: 'Yes' }).sort({ _id: -1 });
    const bestsellerData = category.map(item => ({
      _id: item._id,
      title: item.title,
    }));

    return res.status(200).json({ message: "Bestseller category fetched successfully.", data: bestsellerData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};
export const bestRatedProduct = async (req: Request, res: Response) => {
  try {
    const data = await Product.find({ ratingAvg: 5, status: true, draft_status: false, isDeleted: false }).sort({ _id: -1 }).limit(10).populate('vendor_id')
      .populate('category')
      .populate('brand_id')
      .populate('variant_id')
      .populate('variant_attribute_id');

    let base_url = process.env.ASSET_URL + '/uploads/product/'

    const product = await Promise.all(data.map(async (item: any) => {
      const promotionData = await PromotionalOfferModel.find({ product_id: { $in: item._id }, status: true, expiry_status: 'active', vendor_id: item.vendor_id._id })
      return {
        ...item.toObject(),
        promotionData: promotionData ? promotionData : {}
      }
    }));
    return res.status(200).json({ message: "Best rated product fetched successfully.", data: product, base_url });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getDeals = async (req: Request, res: Response) => {
  try {
    const deals = await HomeSettingModel.findOne({}).populate('box1_category').populate('box2_category').populate('box3_category').populate('box4_category');
    let base_url = process.env.ASSET_URL + `/uploads/deal/`;
    let box_url = process.env.ASSET_URL + `/uploads/admin-category/`;
    return res.status(200).json({ message: "Deals fetched successfully.", data: deals, base_url, box_url });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getCategoryBySlug = async (req: Request, resp: Response) => {
  try {
    const slug = req.params.slug;

    const query: any = {
      status: true,
      slug: slug
    }
    const categories = await Category.find(query);

    let data = await Promise.all(categories.map(async (category) => {
      let title = await buildCategoryBySlug(category._id);

      return title.map((item: any) => {
        return {
          _id: item._id,
          title: item.title,
          slug: item.slug,
        }
      })
    }));

    data = data.flat();

    return resp.status(200).json({ message: "Category retrieved successfully.", data });

  } catch (err) {
    console.log(err);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getAdminCategoryBySlug = async (req: Request, resp: Response) => {
  try {
    const slug = req.params.slug;

    const query: any = {
      status: true,
      slug: slug
    }
    const categories = await AdminCategoryModel.find(query);

    let data = await Promise.all(categories.map(async (category) => {
      let title = await buildAdminCategoryBySlug(category._id);

      return title.map((item: any) => {
        return {
          _id: item._id,
          title: item.title,
          slug: item.slug,
        }
      })
    }));

    data = data.flat();

    return resp.status(200).json({ message: "Admin Category retrieved successfully.", data });

  } catch (err) {
    console.log(err);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getVendorDetails = async (req: Request, resp: Response) => {
  try {
    const vendorId = req.body.vendorId;
    console.log("Vendor ID:", vendorId);

    if (!vendorId || vendorId.length === 0) {
      return resp.status(400).json({ message: "Vendor ID is required." });
    }

    const vendorData = await User.find({ _id: { $in: vendorId }, designation_id: '3' });
    console.log("Vendor Data:", vendorData);

    if (vendorData.length === 0) {
      return resp.status(404).json({ message: "No vendors found." });
    }

    const base_url = process.env.ASSET_URL ? process.env.ASSET_URL + '/uploads/vendor/' : '';
    console.log("Asset URL:", base_url);

    const data = await Promise.all(
      vendorData.map(async (item) => {
        const vendorDetails = await VendorModel.findOne({ user_id: item._id });
        console.log(`Vendor details for ${item._id}:`, vendorDetails);

        return {
          _id: item._id,
          name: item.name,
          email: item.email,
          mobile: item.mobile,
          image: item.image ? base_url + item.image : null,
          vendor: vendorDetails || {},
        };
      })
    );

    return resp.status(200).json({ message: "Vendor details fetched successfully.", data });
  } catch (err) {
    console.error("Error:", err);
    return resp.status(500).json({ message: "Something went wrong. Please try again." });
  }
};


export const getUserDetails = async (req: Request, resp: Response) => {
  try {
    const userId = req.body.userId;

    const vendorData = await User.find({ _id: { $in: userId }, designation_id: '1' });

    const data = vendorData.map((item) => {

      const image = item.image ? item.image : '';
      let baseUrl = '';

      if (image.includes("https")) {
        baseUrl = image
      } else if (image) {
        baseUrl = process.env.ASSET_URL + '/uploads/profileImage/' + image;
      }

      return {
        _id: item._id,
        name: item.name,
        email: item.email,
        mobile: item.mobile,
        image: baseUrl,
        customerId: item.id_number
      }
    });

    return resp.status(200).json({ message: "User details fetched successfully.", data });
  } catch (err) {
    console.log(err);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getVendorDetailsBySlug = async (req: Request, resp: Response) => {
  try {
    const slug = req.params.slug;
    const userId = req.query.userId;

    const vendorDetails = await VendorModel.findOne({ slug: slug });

    if (!vendorDetails) {
      return resp.status(500).json({ message: 'Vendor not found.' });
    }
    const vendor = await User.findOne({ _id: vendorDetails.user_id, designation_id: 3, status: true });

    if (!vendor) {
      return resp.status(500).json({ message: 'Vendor not found.' });
    }

    let followStatus = false;
    if (userId) {
      const follow = await FollowModel.findOne({ user_id: userId, vendor_id: vendor._id });
      if (follow) {
        followStatus = true
      }
    }

    const base_url = process.env.ASSET_URL + '/uploads/vendor/';
    const base_icon = process.env.ASSET_URL + '/uploads/shop-icon/';
    const video_url = process.env.ASSET_URL + '/uploads/shop-video/';
    const member_image_url = process.env.ASSET_URL + '/uploads/shop-photos/';

    const country = await CountryModel.findOne({ _id: vendor.country_id });
    const state = await StateModel.findOne({ _id: vendor.state_id });
    const city = await CityModel.findOne({ _id: vendor.city_id });

    const particularVendorReviews = await RatingModel.find({ vendor_id: vendor._id, status: 'approved' });

    const allData = {
      _id: vendor._id,
      vendor_name: vendor.name,
      vendor_email: vendor.email,
      vendor_mobile: vendor.mobile,
      vendor_country: country ? country.name : '',
      vendor_state: state ? state.name : '',
      vendor_city: city ? city.name : '',
      vendor_image: base_url + vendor.image,
      shop_title: vendorDetails.shop_title,
      slug: vendorDetails.slug,
      followStatus: followStatus,
      shop_icon: base_icon + vendorDetails.shop_icon,
      shop_announcement: vendorDetails.shop_announcement,
      buyers_message: vendorDetails.buyers_message,
      shop_name: vendorDetails.shop_name,
      members: vendorDetails.members,
      story_headline: vendorDetails.story_headline,
      shop_video: video_url + vendorDetails.shop_video,
      shop_photos: vendorDetails.shop_photos,
      description: vendorDetails.description,
      shop_policy: vendorDetails.shop_policy,
      shop_address: vendorDetails.shop_address,
      vendor_created_at: vendorDetails.createdAt,
      member_image_url: member_image_url,
      story_description: vendorDetails.story,
      reviews: particularVendorReviews
    }

    return resp.status(200).json({ message: "Vendor details fetched successfully.", data: allData });

  } catch (err) {
    console.log(err);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


export const getParticularVendorReviews = async (req: Request, resp: Response) => {
  try {
    const vendor_id = req.params.vendor_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const vendorDetails = await UserModel.findOne({ _id: vendor_id, designation_id: '3' });
    if (!vendorDetails) {
      return resp.status(404).json({ message: 'Vendor not found.' });
    }

    const userImageBaseUrl = process.env.ASSET_URL + '/uploads/profileImage/';
    const productImageBaseUrl = process.env.ASSET_URL + '/uploads/product/';

    const [reviews, total, avgRatingData] = await Promise.all([
      RatingModel.aggregate([
        {
          $match: {
            vendor_id: new mongoose.Types.ObjectId(vendor_id),
            status: 'approved',
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "userdata",
          }
        },
        { $unwind: { path: "$userdata", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "productdata",
          }
        },
        { $unwind: { path: "$productdata", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      RatingModel.countDocuments({
        vendor_id: vendor_id,
        status: 'approved',
      }),
      RatingModel.aggregate([
        {
          $match: {
            vendor_id: new mongoose.Types.ObjectId(vendor_id),
            status: 'approved',
          }
        },
        {
          $group: {
            _id: null,
            avgDeliveryRating: { $avg: { $toDouble: "$delivery_rating" } },
            avgItemRating: { $avg: { $toDouble: "$item_rating" } },
            overallRating: {
              $avg: {
                $avg: [
                  { $toDouble: "$delivery_rating" },
                  { $toDouble: "$item_rating" }
                ]
              }
            }
          }
        }
      ])
    ]);

    const ratingSummary = avgRatingData?.[0] || {
      avgDeliveryRating: 0,
      avgItemRating: 0,
      overallRating: 0
    };

    return resp.status(200).json({
      message: "Vendor reviews fetched successfully.",
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total,
      ratingAvg: ratingSummary.avgItemRating,
      image_url: userImageBaseUrl,
      product_image_url: productImageBaseUrl,
      data: reviews,
    });

  } catch (err) {
    console.log(err);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getVendorProductsBySlug = async (req: Request, resp: Response) => {
  try {
    const slug = req.params.slug;
    const category_id: any = req.query.category_id || null;
    const offset: any = req.query.offset || 0; // Ensure offset is a number
    const sortBy: any = req.query.sortBy;
    const limit = 12;

    const vendorDetails = await VendorModel.findOne({ slug: slug });
    const vendor = await User.findOne({ _id: vendorDetails?.user_id, designation_id: 3 });

    const query: any = {
      vendor_id: vendor?._id,
      status: true,
    };

    if (category_id) {
      const getChildCategory = await getAllChildCategory(category_id);
      const categoryIds = getChildCategory.map((item: any) => item._id);
      query.category = { $in: categoryIds };
    }

    // Sorting logic
    let sortQuery: any = {};
    if (sortBy === 'high_to_low') {
      sortQuery = { price: -1 };  // Sort by price descending
    } else if (sortBy === 'low_to_high') {
      sortQuery = { price: 1 };   // Sort by price ascending
    }

    const productCount = await Product.countDocuments(query);

    const product = await Product.find(query)
      .populate('category')
      .populate('brand_id')
      .populate('variant_id')
      .populate('variant_attribute_id')
      .sort(sortQuery) // Correct sorting applied here
      .skip(offset)
      .limit(limit);

    // Fallback to sorting products by price or sale_price
    product.sort((a: any, b: any) => {
      const priceA = a.price || a.sale_price || 0;
      const priceB = b.price || b.sale_price || 0;

      if (sortBy === 'high_to_low') {
        return priceB - priceA;
      } else if (sortBy === 'low_to_high') {
        return priceA - priceB;
      }
      return 0;
    });

    const base_url = process.env.ASSET_URL + '/uploads/product/';

    return resp.status(200).json({ message: "Vendor products fetched successfully.", data: product, base_url: base_url, productCount });

  } catch (err) {
    console.log(err);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getVendorCategoryBySlug = async (req: Request, resp: Response) => {
  try {
    const slug = req.params.slug;
    const vendorDetails = await VendorModel.findOne({ slug: slug });
    const vendor = await User.findOne({ _id: vendorDetails?.user_id, designation_id: 3 });

    const products = await Product.find({
      vendor_id: vendor?._id,
      status: true,
    });

    const categoryIds = [...new Set(products.map(product => product.category))];

    const categories = await Category.find({
      _id: { $in: categoryIds },
      status: true,
    });

    const parentCategories = await Promise.all(categories.map(async (category) => {
      const parent = await getMainCategory(category._id);
      return parent;
    }));

    const uniqueParentCategories = parentCategories.reduce((acc, parent) => {
      if (parent && !acc.has(parent._id.toString())) {
        acc.set(parent._id.toString(), parent);
      }
      return acc;
    }, new Map());

    const finalCategories = Array.from(uniqueParentCategories.values());

    const finaldata = await Promise.all(finalCategories.map(async (category: any) => {
      const getChildCategory = await getAllChildCategory(category._id);
      const categoryIds = getChildCategory.map((item: any) => item._id);

      const products = await Product.countDocuments({
        category: { $in: categoryIds },
        vendor_id: vendor?._id,
        status: true
      });

      const categoryProducts = await Product.find({
        category: { $in: categoryIds },
        vendor_id: vendor?._id,
        status: true
      });

      let saleCount = 0;
      let favCount = 0;

      const productIds = categoryProducts.map(p => p._id);

      if (productIds.length) {
        favCount = await wishlistModel.countDocuments({ product_id: { $in: productIds } });
        saleCount = await SalesModel.countDocuments({ product_id: { $in: productIds }, vendor_id: vendor?._id });
      }

      return {
        _id: category._id,
        title: category.title,
        slug: category.slug,
        count: categoryProducts.length,
        favourite_count: favCount,
        sale_count: saleCount
      };

    }));

    return resp.status(200).json({
      message: "Vendor categories fetched successfully.",
      data: finaldata
    });

  } catch (err) {
    console.log(err);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const getAllCategoryWithGiftCards = async (req: Request, resp: Response) => {
  try {
    const data = await GiftCardCategoryModel.aggregate([
      {
        $match: {
          status: true,
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "giftcards",
          localField: "_id",
          foreignField: "category_id",
          as: "giftcards",
          pipeline: [
            {
              $match: {
                status: true,
              },
            },
            {
              $addFields: {
                image: {
                  $cond: {
                    if: {
                      $ne: ["$image", ""],
                    },
                    then: {
                      $concat: [
                        `${process.env.ASSET_URL}/uploads/giftcard-images/`,
                        "$image",
                      ],
                    },
                    else: "",
                  },
                },
              },
            },
          ],
        },
      },
      {
        $match: {
          giftcards: { $ne: [] },
        },
      },
      {
        $sort: {
          sort_order: 1
        }
      },
      {
        $addFields: {
          image: {
            $cond: {
              if: {
                $ne: ["$image", ""],
              },
              then: {
                $concat: [
                  `${process.env.ASSET_URL}/uploads/giftcard-category-images/`,
                  "$image",
                ],
              },
              else: "",
            },
          },
        },
      },
    ]);

    return resp.status(200).json({
      message: "Gift card data fetched successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching gift card data:", error);
    return resp.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getGiftCardByCategoryId = async (req: Request, resp: Response) => {
  try {
    const categoryId = req.params.id;
    const data = await GiftCardModel.aggregate([
      {
        $match: {
          category_id: new mongoose.Types.ObjectId(categoryId),
          status: true,
        }
      },
      {
        $addFields: {
          image: {
            $cond: {
              if: {
                $ne: ["$image", ""],
              },
              then: {
                $concat: [
                  `${process.env.ASSET_URL}/uploads/giftcard-images/`,
                  "$image",
                ],
              },
              else: "",
            },
          },
        },
      },
    ]);

    return resp.status(200).json({
      message: "Gift card fetched successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching gift card data:", error);
    return resp.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getGiftCard = async (req: Request, resp: Response) => {
  const { id } = req.params;
  try {

    const giftCard = await GiftCardModel.findById(id).populate('category_id');
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
      description: giftCard.description,
      validity: giftCard.validity,
      image: imageUrl,
    };

    return resp.status(200).json({
      message: 'Gift card fetched successfully',
      data: data,
    });
  } catch (error) {
    console.error('Error fetching gift card:', error);
    return resp.status(500).json({
      message: 'Something went wrong. Please try again.',
    });
  }
};


export const addaffiliateUser = async (req: Request, resp: Response) => {
  const {
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
    password,
    confirm_password,
  } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    const existingAffiliateUser = await AffiliateUser.findOne({ email, $or: [{ status: 'pending' }, { status: 'approved' }] });

    if (existingUser || existingAffiliateUser) {
      return resp.status(400).json({ message: 'Email already exists.' });
    }

    if (password !== confirm_password) {
      return resp.status(400).json({ message: "Password and confirm password doesn't match." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAffiliateUser = new AffiliateUser({
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
      password: hashedPassword,
      show_password: password,
    });

    await newAffiliateUser.save();

    return resp.status(200).json({ message: 'Affiliate User created successfully.' });

  } catch (error) {
    console.error('Error adding user:', error);
    return resp.status(500).json({ error: 'Internal server error.' });
  }
};

export const mailCronJob = async (req: Request, resp: Response) => {

  cron.schedule('0 1 * * *', async () => {
    try {
      const startDay = resp.locals.currentdate().startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const endDay = resp.locals.currentdate().endOf('day').format('YYYY-MM-DD HH:mm:ss');

      const giftsToDeliverToday = await PurchaseGiftCardModel.find({
        delivery_date: {
          $gte: startDay,
          $lte: endDay,
        },
      });

      const userIds = [...new Set(giftsToDeliverToday.map((user) => user.user_id))];

      const users = await User.find({ _id: { $in: userIds } }).select('id email');

      const userDataMap = users.reduce((acc: any, user: any) => {
        acc[user._id.toString()] = user;
        return acc;
      }, {});

      for (const gift of giftsToDeliverToday) {
        const user = userDataMap[gift.user_id.toString()];

        const subject = `Your Gift Card Delivery`;
        const body = `Your gift card (Code: ${gift.gift_code}) is delivered today.`;

        await sendToEmail(gift.email, subject, body, user.email);

      }

      return resp.status(200).json({ message: 'Emails sent successfully to all users.' });
    } catch (error) {
      console.error('Error sending emails:', error);
      return resp.status(500).json({ message: 'Failed to send emails. Please try again later.' });
    }
  });
};

export const subscribe = async (req: Request, resp: Response) => {
  try {
    const { email } = req.body;

    if (!email || email.length === 0) {
      return resp.status(400).json({ message: 'Email is required.' });
    }

    const checkAlreadySubscribe = await SubscribeModel.findOne({ email: email.toLowerCase() });

    if (checkAlreadySubscribe) {
      return resp.status(400).json({ message: 'Already subscribed.' });
    }

    const data = new SubscribeModel({ email: email.toLowerCase() });

    await data.save();

    return resp.status(200).json({ message: 'Subscribed successfully.' });
  } catch (error) {
    console.log(error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const changeStatusOfMail = async (req: Request, res: Response) => {
  try {
    const { id, status } = req.query;

    if (!id || !status) {
      return res.status(400).send("Missing required parameters.");
    }

    const validStatuses = ["subscribe", "unsubscribe"];
    if (!validStatuses.includes(String(status))) {
      return res.status(400).send("Invalid status value.");
    }

    const updated = await SubscribeModel.updateOne(
      { _id: id },
      { $set: { status: status } }
    );

    if (updated.modifiedCount === 0) {
      return res.status(404).send("Subscriber not found or status unchanged.");
    }

    return res.send(`<h2>Your subscription status is now: ${status}</h2>`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Something went wrong.");
  }
};

export const getBanner = async (req: Request, resp: Response) => {
  try {
    const banners = await BannerModel.find({ status: true }).sort({ _id: -1 });

    const data = banners.map(banner => ({
      _id: banner._id,
      image: process.env.ASSET_URL + `/uploads/banner/` + banner.image,
      status: banner.status,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    }));

    resp.status(200).json({ message: 'Banner fetched successfully', result: data });
  } catch (error) {
    console.log(error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getGiftCardDescription = async (req: Request, resp: Response) => {
  try {
    const description = await GiftCardDescriptionModel.findOne();
    resp.status(200).json({ message: 'Description fetched successfully', result: description });
  } catch (error) {
    console.log(error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getStorebyVendorId = async (req: Request, resp: Response) => {
  try {
    const vendorId = req.params.vendorId;
    const store = await storeModel.find({ vendor_id: vendorId, status: true }).sort({ sort_order: 1 });
    if (store) {
      return resp.status(200).json({ message: 'Store found.', store: store });
    } else {
      return resp.status(404).json({ message: 'Store not found.' });
    }
  } catch (error) {
    console.log(error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getProductByVendorIdandStoreId = async (req: Request, res: Response) => {
  try {
    const {
      vendor_id,
      store_id,
      page = 1,
      limit = 10,
      sort_by = "relevance",
      search = "",
    } = req.body;

    const baseUrl = process.env.ASSET_URL + "/uploads/product/";
    const video_base_url = process.env.ASSET_URL + "/uploads/video/";

    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    const skip = (p - 1) * l;

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const query: any = {
      vendor_id,
      status: true,
      draft_status: false,
      isDeleted: false,
    };

    // --- Search filter (same as your current logic) ---
    if (search && String(search).trim() !== "") {
      const terms = String(search)
        .trim()
        .split(/\s+/)
        .map(escapeRegex)
        .filter(Boolean);

      if (terms.length) {
        const titleAnyWord = {
          $or: terms.map((t) => ({
            product_title: { $regex: t, $options: "i" },
          })),
        };

        const wholeString = {
          $regex: escapeRegex(String(search).trim()),
          $options: "i",
        };

        query.$or = [
          titleAnyWord,
          { description: wholeString },
          { sku_code: wholeString },
        ];
      }
    }

    // --- Store filter ---
    if (store_id !== "all") {
      const store = await storeModel.findOne({ _id: store_id, vendor_id }).lean();
      if (!store) {
        return res.status(404).json({ success: false, message: "Store not found" });
      }
      query._id = { $in: store.selected_products };
    }

    // --- Fetch products (no change needed in selection) ---
    const rawProducts = await ProductModel.find(query)
      .select(
        "product_title sale_price isCombination combinationData ratingAvg createdAt image videos zoom product_bedge userReviewCount"
      )
      .sort(sort_by === "newest" ? { createdAt: -1 } : {})
      .skip(skip)
      .limit(l)
      .lean();

    const productIds = rawProducts.map((p) => p._id);

    const allPromotions = await PromotionalOfferModel.find({
      product_id: { $in: productIds },
      status: true,
      expiry_status: "active",
      vendor_id,
    })
      .select("product_id qty offer_type discount_amount promotional_title")
      .lean();

    const promoMap = new Map<string, any[]>();
    for (const promo of allPromotions) {
      const k = String(promo.product_id);
      const list = promoMap.get(k) || [];
      list.push(promo);
      promoMap.set(k, list);
    }

    const calculatePriceAfterDiscount = (
      offer_type: string,
      discount_amount: number,
      price: number
    ) => {
      if (!price || !discount_amount) return price;
      if (offer_type === "percentage") {
        return Math.max(0, price - (price * discount_amount) / 100);
      }
      return Math.max(0, price - discount_amount);
    };

    const enrichedProducts = await Promise.all(
      rawProducts.map(async (item: any) => {
        const promotionData =
          promoMap.get(String(item._id)) ??
          (await PromotionalOfferModel.find({
            product_id: item._id,
            status: true,
            expiry_status: "active",
            vendor_id,
          }).lean());

        let finalPrice = +item.sale_price;
        let originalPrice = +item.sale_price;

        let bestPromo: any = null;
        if (Array.isArray(promotionData) && promotionData.length > 0) {
          bestPromo = promotionData.reduce((best: any, promo: any) => {
            if (!Number.isFinite(+promo?.qty)) return best;
            if (!best || !Number.isFinite(+best?.qty) || +promo.qty < +best.qty) return promo;
            return best;
          }, null);
        }

        if (item?.isCombination) {
          const merged = item.combinationData?.map((i: any) => i.combinations).flat() || [];
          const minCombo = merged
            .map((obj: any) => +obj.price)
            .filter((n: number) => Number.isFinite(n) && n > 0);
          originalPrice = minCombo.length ? Math.min(...minCombo) : +item.sale_price;
          finalPrice = originalPrice;

          if (bestPromo && typeof bestPromo.qty === "number" && bestPromo.qty <= 1) {
            finalPrice = calculatePriceAfterDiscount(
              bestPromo.offer_type,
              +bestPromo.discount_amount,
              originalPrice
            );
          }
        } else {
          if (bestPromo && typeof bestPromo.qty === "number" && bestPromo.qty <= 1) {
            finalPrice = calculatePriceAfterDiscount(
              bestPromo.offer_type,
              +bestPromo.discount_amount,
              +item.sale_price
            );
          }
        }

        return {
          _id: item._id,
          product_title: item.product_title,
          ratingAvg: item.ratingAvg || 0,
          originalPrice,
          finalPrice,
          sale_price: item.sale_price,
          isCombination: item.isCombination,
          combinationData: item.combinationData || [],
          videos: item.videos || [],
          image: item.image || [],
          product_bedge: item.product_bedge || "",
          userReviewCount: item.userReviewCount || 0,
          createdAt: item.createdAt,
          promotionData,
          zoom: item.zoom,
        };
      })
    );

    // ---- Relevance scoring (only when search is present) ----
    const searchStr = String(search || "").trim();
    if (searchStr) {
      const normalize = (s: string) =>
        s.toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();
      const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const q = normalize(searchStr);
      const qTokens = q.split(" ").filter(Boolean);
      const ngrams = (tokens: string[]) => {
        const arr: string[] = [];
        const maxN = Math.min(4, tokens.length);
        for (let n = maxN; n >= 1; n--) {
          for (let i = 0; i + n <= tokens.length; i++) {
            arr.push(tokens.slice(i, i + n).join(" "));
          }
        }
        return arr;
      };
      const qGrams = ngrams(qTokens);

      const scoreIt = (p: any) => {
        const title = normalize(String(p.product_title || ""));
        if (!title) return 0;

        let score = 0;

        // 1) Exact phrase (word-boundary) — strongest signal
        const exactWB = new RegExp(`\\b${esc(q)}\\b`, "i");
        if (exactWB.test(title)) score += 500;

        // 2) Longest phrase / n-gram matches with word-boundaries
        for (const gram of qGrams) {
          const re = new RegExp(`\\b${esc(gram)}\\b`, "i");
          if (re.test(title)) {
            const words = gram.split(" ").length;
            const base =
              words >= 4 ? 140 :
              words === 3 ? 120 :
              words === 2 ? 90  : 50;
            score += base;

            const pos = title.indexOf(gram);
            if (pos >= 0) score += Math.max(0, 40 - Math.min(40, pos));
          }
        }

        // 3) Token coverage ratio
        const titleTokens = title.split(" ").filter(Boolean);
        const titleSet = new Set(titleTokens);
        const hit = qTokens.filter((t) => titleSet.has(t)).length;
        if (qTokens.length > 0) {
          const coverage = hit / qTokens.length; // 0..1
          score += Math.round(coverage * 120);   // up to +120
        }

        // 4) Loose contains (non-boundary) as a small extra
        if (title.includes(q)) score += 40;

        // 5) Title length closeness
        const lenDelta = Math.abs(title.length - q.length);
        score += Math.max(0, 30 - Math.min(30, lenDelta));

        return score;
      };

      for (const p of enrichedProducts) {
        (p as any).__relevance = scoreIt(p);
      }

      // Primary: relevance; Secondary: chosen sort_by
      enrichedProducts.sort((a: any, b: any) => {
        const byRel = (b.__relevance || 0) - (a.__relevance || 0);
        if (byRel !== 0) return byRel;

        if (sort_by === "asc")   return a.finalPrice - b.finalPrice;
        if (sort_by === "desc")  return b.finalPrice - a.finalPrice;
        if (sort_by === "newest")
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        return 0;
      });

      // clean temp
      for (const p of enrichedProducts) delete (p as any).__relevance;
    } else {
      // --- No search: keep your existing price sorts ---
      if (sort_by === "asc") {
        enrichedProducts.sort((a: any, b: any) => a.finalPrice - b.finalPrice);
      } else if (sort_by === "desc") {
        enrichedProducts.sort((a: any, b: any) => b.finalPrice - a.finalPrice);
      }
      // 'newest' already applied at DB level
    }

    const totalDocs = await ProductModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      currentPage: p,
      totalPages: Math.ceil(totalDocs / l),
      totalItems: enrichedProducts.length,
      data: enrichedProducts,
      baseUrl,
      video_base_url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getBlockedCountry = async (req: Request, res: Response) => {
  try {
    const country = await CountryModel.find({ isBlocked: true }).sort({ _id: -1 });
    return res.status(200).json({ message: 'Country fetched successfully', result: country });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getLocationByIP = async (req: Request, res: Response) => {
  try {
    const ip = req.query.ip;

    if (!ip) {
      return res.status(400).json({ message: 'IP address is required.' });
    }

    const existing = await ipaddressModel.findOne({ ip });
    if (existing) {
      return res.status(200).json({
        message: 'IP location fetched from database.',
        data: existing.data
      });
    }

    const response = await axios.get(`http://ip-api.com/json/${ip}`);

    if (response.data && response.data.status === 'success') {

      const saved = await ipaddressModel.create({
        ip: ip,
        data: response.data
      });

      return res.status(200).json({
        message: 'IP location fetched and saved successfully.',
        data: saved,
      });
    } else {
      return res.status(404).json({ message: 'Could not fetch location for this IP.' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const increaseProductVisitCount = async (req: Request, resp: Response) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return resp.status(400).json({ message: 'Product ID is required.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const productVisit = await visitModel.findOne({
      product_id,
      date: today
    });

    if (productVisit) {
      productVisit.visit_count = (productVisit.visit_count || 0) + 1;
      await productVisit.save();
      return resp.status(200).json({
        message: 'Product visit count updated for today.',
        visit_count: productVisit.visit_count,
        date: today
      });
    } else {
      const newVisit = new visitModel({
        product_id,
        date: today,
        visit_count: 1
      });
      await newVisit.save();
      return resp.status(201).json({
        message: 'Product visit count initialized for today.',
        visit_count: 1,
        date: today
      });
    }
  } catch (error) {
    console.error('Error increasing product visit count:', error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const increaseGiftCardVisitCount = async (req: Request, resp: Response) => {
  try {
    const { gift_card_id } = req.body;

    if (!gift_card_id) {
      return resp.status(400).json({ message: 'Gift Card ID is required.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const giftCardVisit = await giftCardVisitModel.findOne({
      gift_card_id,
      date: today
    });

    if (giftCardVisit) {
      giftCardVisit.visit_count = (giftCardVisit.visit_count || 0) + 1;
      await giftCardVisit.save();
      return resp.status(200).json({
        message: 'Gift card visit count updated for today.',
        visit_count: giftCardVisit.visit_count,
        date: today
      });
    } else {
      const newVisit = new giftCardVisitModel({
        gift_card_id,
        date: today,
        visit_count: 1
      });
      await newVisit.save();
      return resp.status(201).json({
        message: 'Gift card visit count initialized for today.',
        visit_count: 1,
        date: today
      });
    }
  } catch (error) {
    console.error('Error increasing gift card visit count:', error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

export const getShopDetail = async (req: Request, resp: Response) => {
  try {
    let shop_name = req.query.name as string;

    if (!shop_name || shop_name.length === 0) {
      return resp.status(400).json({ message: 'Shop name is required.' });
    }

    const normalizedShopName = shop_name.trim().toLowerCase();

    const shop = await VendorModel.findOne({
      shop_name: { $regex: new RegExp('^' + normalizedShopName, 'i') }
    });

    if (!shop) {
      return resp.status(404).json({ message: 'Shop not found.' });
    }

    return resp.status(200).json({ message: 'Shop found.', shop: shop });
  } catch (error) {
    console.error(error);
    return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

