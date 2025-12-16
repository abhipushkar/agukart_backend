import { Request, Response } from "express";
import Cart from "../models/Cart";
import Address from "../models/Address";
import Sales from "../models/Sales";
import Salesdetail from "../models/Sales_detail";
import mongoose from "mongoose";
import VariantProduct from "../models/Variant-product";
import Product from "../models/Product";
import Comment from "../models/Comment";
import User from "../models/User";
import { RecordWithTtl } from "dns";
import bcrypt from 'bcrypt';
import { convertToWebP, getOfferProductPrice, generateUniqueGiftCode, sendToEmail, activity, vandorAndProductActivity } from "../helpers/common";
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import wishlistModel from "../models/Wishlist";
import ProductModel from "../models/Product";
import UserProductViewModel from "../models/UserProductView";
import UserEmailModel from "../models/UserEmail";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import CountryModel from "../models/Country";
import StateModel from "../models/State";
import CityModel from "../models/City";
import SalesDetailsModel from "../models/Sales_detail";
import RatingModel from "../models/Rating";
import followModel from "../models/Follow";
import CouponCartModel from "../models/CouponCart";
import VendorModel from "../models/VendorDetail";
import MessageModel from "../models/SenderMessage";
import CouponModel from "../models/Coupon";
import GiftCardCategoryModel from "../models/GiftCardCategory";
import PurchaseGiftCardModel from "../models/PurchaseGiftCard"
import GiftCardTransactionHistory from "../models/GiftCardTransactionHistory";
import GiftCardModel from "../models/GiftCard";
import GiftCardTransactionHistoryModel from "../models/GiftCardTransactionHistory";
import CartModel from "../models/Cart";
import CartCouponModel from "../models/CartCoupon";
import PromotionalOfferModel from "../models/PromotionalOffer";
import moment from "moment";
import LoginHistoryModel from "../models/LoginHistory";
import ParentCartModel from "../models/ParentCart";
const ejs = require('ejs');
import ReportModel from "../models/Report";
import transactionModel from "../models/transaction";
import AffilateUserModel from "../models/AffiliateUser";
import SalesModel from "../models/Sales";
import ActivityModel from "../models/Activity";
import ParentCart from "../models/ParentCart";
import voucherModel from "../models/Voucher";
import couponCart from "../models/CouponCart";
import got from "got";
import BuyerNoteModel from "../models/BuyerNote";

interface CustomRequest extends Request {
    user?: any;
    token?: any;
}

export const addToCart = async (req: CustomRequest, resp: Response) => {
    try {
        const customVariants = Array.isArray(req.body.variants) ? req.body.variants : [];
        const cart = await Cart.findOne({ user_id: req.user._id, product_id: req.body.product_id, isCombination: req.body.isCombination, variant_id: req.body.variant_id, variant_attribute_id: req.body.variant_attribute_id });
        let affiliateId: any = null;

        if (req.body.affiliate_id) {
            const affiliateData = await User.findOne({ affiliate_code: req.body.affiliate_id });
            if (affiliateData) {
                affiliateId = affiliateData._id
            }
        }

        if (cart) {
            await Cart.updateOne({
                user_id: req.user._id,
                product_id: req.body.product_id,
                vendor_id: req.body.vendor_id,
                isCombination: req.body.isCombination,
                variant_id: req.body.variant_id,
                variant_attribute_id: req.body.variant_attribute_id,
            }, { $set: { qty: req.body.qty, affiliate_id: affiliateId, customizationData: req.body.customizationData, price: req.body.price, original_price: req.body.original_price, note: req.body.note, variants: customVariants } });


            if (req.body.isCombination && cart.variant_id.length === 0 && cart.variant_attribute_id.length === 0) {
                cart.variant_id = req.body.variant_id;
                cart.variant_attribute_id = req.body.variant_attribute_id;
            }

            let productData = await Product.findOne({ _id: cart.product_id });

            await activity(
                req.user._id,
                req.body.product_id,
                req.body.vendor_id,
                'update-cart',
                `${productData?.product_title} updated cart.`,
            );

            await vandorAndProductActivity(
                req.user._id,
                req.body.product_id,
                req.body.vendor_id,
                "product",
                "update-cart",
                `${productData?.product_title} updated cart.`,
            )

            await cart.save();
            return resp.status(200).json({ message: 'Cart updated successfully.' });
        }
        else {
            const existingCart = await Cart.find({
                user_id: req.user._id,
                product_id: req.body.product_id,
                vendor_id: req.body.vendor_id,
                isCombination: req.body.isCombination,
            });

            for (const cart of existingCart) {
                if (
                    cart?.isCombination === true &&
                    cart?.variant_id.length === 0 &&
                    cart?.variant_attribute_id.length === 0
                ) {
                    cart.qty = req.body.qty;
                    cart.variant_id = req.body.variant_id;
                    cart.variant_attribute_id = req.body.variant_attribute_id;
                    cart.customizationData = req.body.customizationData;
                    cart.affiliate_id = affiliateId;
                    cart.price = req.body.price;
                    cart.original_price = req.body.original_price;
                    cart.note = req.body.note;
                    cart.variants = customVariants;
                    await cart.save();
                    const productData = await Product.findOne({ _id: cart.product_id });
                    await activity(
                        req.user._id,
                        req.body.product_id,
                        cart.vendor_id,
                        'product-update-cart',
                        `${productData?.product_title} updated cart.`,
                    );
                    await vandorAndProductActivity(
                        req.user._id,
                        cart.product_id,
                        null,
                        "product",
                        "update-cart",
                        `${productData?.product_title} updated cart.`,
                    )
                    return resp.status(200).json({ message: 'Cart updated successfully.' });
                }
            }

            const cart: any = {
                user_id: req.user._id,
                vendor_id: req.body.vendor_id,
                product_id: req.body.product_id,
                qty: req.body.qty,
                isCombination: req.body.isCombination,
                variant_id: req.body.variant_id,
                variant_attribute_id: req.body.variant_attribute_id,
                price: req.body.price,
                original_price: req.body.original_price,
                affiliate_id: affiliateId,
                customize: req.body.customize,
                customizationData: req.body.customizationData,
                shippingName: req.body.shippingName,
                shipping_id: req.body.shipping_id,
                variants: customVariants 
            }
            await Cart.create(cart);
            const productData = await Product.findOne({ _id: cart.product_id });
            await activity(
                req.user._id,
                req.body.product_id,
                req.body.vendor_id,
                'add-cart',
                `${productData?.product_title} added cart.`,
            );
            await vandorAndProductActivity(
                req.user._id,
                req.body.product_id,
                req.body.vendor_id,
                "product",
                "add-to-cart",
                `${productData?.product_title} added to cart.`,
            )
            return resp.status(200).json({ message: 'Product successfully added into cart.' })
        }
    } catch (err) {
        console.error(err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const listofCart = async (req: CustomRequest, resp: Response) => {
    const base_url = process.env.ASSET_URL + '/uploads/shop-icon/';
    const image_base_url = process.env.ASSET_URL + '/uploads/product/';
    try {
        const user_id = req.user._id;
        const addressId = req.query.address_id;
        const userObjectId = new mongoose.Types.ObjectId(user_id);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const pipeline: any = [
            { $match: { user_id: userObjectId } },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "productData",
                    pipeline: [
                        {
                            $lookup: {
                                from: "promotionaloffers",
                                let: { productId: "$_id", vendorId: "$vendor_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$status", true] },
                                                    { $ne: ["$expiry_status", "expired"] },
                                                    { $in: [{ $toObjectId: "$$productId" }, "$product_id"] },
                                                    { $eq: ["$vendor_id", "$$vendorId"] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: "promotionaloffers"
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
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
                                        {
                                            $gte: ["$date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalViews: { $sum: "$visit_count" }
                            }
                        }
                    ],
                    as: "viewData"
                }
            },
            {
                $lookup: {
                    from: "carts",
                    let: { pid: "$product_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$product_id", "$$pid"] }
                            }
                        },
                        {
                            $group: {
                                _id: "$user_id"
                            }
                        }
                    ],
                    as: "cartUsers"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "productData.vendor_id",
                    foreignField: "_id",
                    as: "vendorData"
                }
            },
            { $unwind: { path: "$vendorData", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "addresses",
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "addressData",
                    pipeline: [
                        {
                            $match: addressId
                                ? { _id: new mongoose.Types.ObjectId(addressId.toString()) }
                                : { default: "1" }
                        }
                    ]
                }
            },
            { $unwind: { path: "$addressData", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "couponcarts",
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "cartCouponData"
                }
            },
            {
                $lookup: {
                    from: "variants",
                    localField: "variant_id",
                    foreignField: "_id",
                    as: "variantDetails"
                }
            },
            {
                $lookup: {
                    from: "variantattributes",
                    localField: "variant_attribute_id",
                    foreignField: "_id",
                    as: "variantAttributeDetails"
                }
            },
            {
                $lookup: {
                    from: "shippings",
                    localField: "shipping_id",
                    foreignField: "_id",
                    as: "shippingData"
                }
            },
            {
                $addFields: {
                    vendorCoupon: {
                        $first: {
                            $filter: {
                                input: { $ifNull: ["$cartCouponData", []] },
                                as: "row",
                                cond: {
                                    $eq: [
                                        { $toString: "$$row.vendor_id" },
                                        { $toString: "$productData.vendor_id" } // replace if vendor_id path is different
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "vendordetails",
                    localField: "vendorData._id",
                    foreignField: "user_id",
                    as: "vendorDetails"
                }
            },
            { $unwind: { path: "$vendorDetails", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { vendor_id: "$productData.vendor_id" },
                    vendorName: { $first: "$vendorData.name" },
                    viewData: { $first: "$viewData" },
                    vendorIcon: { $first: { $concat: [base_url, "$vendorDetails.shop_icon"] } },
                    vendorShop: { $first: "$vendorDetails.shop_name" },
                    slug: { $first: "$vendorDetails.slug" },
                    shippingData: { $addToSet: "$shippingData" },
                    addressData: { $first: "$addressData" },
                    vendorItems: {
                        $push: {
                            cart_id: "$_id",
                            isCombination: "$isCombination",
                            customize: "$customize",
                            customizationData: "$customizationData",
                            variants: "$variants", 
                            variantData: "$variantDetails",
                            variantAttributeData: "$variantAttributeDetails",
                            variant_attribute_id: "$variant_attribute_id",
                            variant_id: "$variant_id",
                            combinationData: "$productData.combinationData",
                            promotionalOfferData: "$productData.promotionaloffers",
                            qty: "$qty",
                            product_id: "$product_id",
                            product_image: "$productData.image",
                            stock: "$productData.qty",
                            product_name: "$productData.product_title",
                            product_bedge: "$productData.product_bedge",
                            sale_price: "$price",
                            real_price: "$productData.sale_price",
                            original_price: "$original_price",
                            discount_amount: "$productData.discount_amount",
                            short_description: "$productData.description",
                            slug: "$productData.slug",
                            delivery_amount: "$productData.delivery_amount",
                            delivery: "$productData.delivery_type",
                            isDeleted: "$productData.isDeleted",
                            status: "$productData.status",
                            viewCount: { $size: "$viewData" },
                            cartAddedUserCount: { $size: "$cartUsers" }
                        }
                    },
                    vendorCoupon: { $first: { $ifNull: ["$vendorCoupon", null] } }
                }
            },
            { $sort: { "_id.vendor_id": 1 } },
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$vendorItems",
                            as: "item",
                            in: {
                                cart_id: "$$item.cart_id",
                                isCombination: "$$item.isCombination",
                                customize: "$$item.customize",
                                customizationData: "$$item.customizationData",
                                variants: "$$item.variants",
                                shippingData: "$shippingData",
                                addressData: "$addressData",
                                variantData: "$$item.variantData",
                                variantAttributeData: "$$item.variantAttributeData",
                                variant_attribute_id: "$$item.variant_attribute_id",
                                variant_id: "$$item.variant_id",
                                combinationData: "$$item.combinationData",
                                qty: "$$item.qty",
                                product_id: "$$item.product_id",
                                product_name: "$$item.product_name",
                                product_bedge: "$$item.product_bedge",
                                sale_price: "$$item.sale_price",
                                real_price: "$$item.real_price",
                                original_price: "$$item.original_price",
                                firstImage: {
                                    $concat: [image_base_url, { $arrayElemAt: ["$$item.product_image", 0] }]
                                },
                                slug: "$$item.slug",
                                stock: "$$item.stock",
                                isDeleted: "$$item.isDeleted",
                                status: "$$item.status",
                                promotionalOfferData: "$$item.promotionalOfferData",
                                viewCount: {
                                    $ifNull: [{ $arrayElemAt: ["$viewData.totalViews", 0] }, 0]
                                },
                                cartAddedUserCount: "$$item.cartAddedUserCount"
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    vendor_id: "$_id.vendor_id",
                    shippingData: 1,
                    addressData: 1,
                    viewData: 1,
                    vendorName: 1,
                    slug: 1,
                    vendorIcon: 1,
                    vendorShop: 1,
                    vendorCoupon: { $ifNull: ["$vendorCoupon", null] },
                    products: 1
                }
            }
        ];

        const cartResult = await CartModel.aggregate(pipeline);

        if (!cartResult || cartResult.length === 0) {
            await CartCouponModel.findOneAndDelete({ user_id: user_id });
            return resp.status(200).json({ message: "Cart list fetched successfully.", result: [] });
        }

        const formattedResult = await Promise.all(
            cartResult.map(async (item) => {
                const shippingData = item.shippingData?.flat() || [];
                const userCountry = item.addressData?.country;
                const shippingTypes = ["standardShipping", "expedited", "twoDays", "oneDay"];
                const combinedShipping: Record<string, any[]> = {
                    standardShipping: [],
                    expedited: [],
                    twoDays: [],
                    oneDay: []
                };

                if (userCountry && shippingData.length > 0) {
                    for (const shipping of shippingData) {
                        const template = shipping.shippingTemplateData;
                        for (const type of shippingTypes) {
                            const typeData = template[type] || [];
                            for (const option of typeData) {
                                if (option.region.includes(userCountry)) {
                                    combinedShipping[type].push({
                                        _id: shipping._id,
                                        title: shipping.title,
                                        minDays: Number(option.transitTime.minDays),
                                        maxDays: Number(option.transitTime.maxDays),
                                        perOrder: Number(option.shippingFee.perOrder),
                                        perItem: Number(option.shippingFee.perItem),
                                        region: option.region
                                    });
                                }
                            }
                        }
                    }
                }

                const matchedShippingOptions = Object.entries(combinedShipping)
                    .filter(([, options]) => options.length > 0)
                    .map(([type, options]) => ({ shippingType: type, options }));

                let totalAmount = 0;
                let discountAmount = 0;
                let discountEligibleAmount = 0;

                if (item.products?.length > 0) {
                    totalAmount = item.products.reduce((acc: any, prod: any) => {
                        return acc + Number(prod.sale_price) * Number(prod.qty);
                    }, 0);
                }

                let couponData: any = null;
                if (item.vendorCoupon?.vendor_id) {
                    couponData = await CouponModel.findOne(
                        { vendor_id: item.vendorCoupon.vendor_id },
                    {
                          coupon_code: 1,
                          discount_amount: 1,
                          discount_type: 1,
                          product_id: 1,
                          isSynced: 1  
                    });

                    if (couponData?.discount_type && couponData?.discount_amount) {
                        const allowedProductIds = (couponData.product_id || []).map((id: any) =>
                            id.toString()
                        );

                        discountEligibleAmount = item.products.reduce((acc: any, prod: any) => {
                            return allowedProductIds.includes(prod.product_id.toString())
                                ? acc + Number(prod.sale_price) * Number(prod.qty)
                                : acc;
                        }, 0);

                        const type = couponData.discount_type;
                        const value = Number(couponData.discount_amount);

                        discountAmount = type === "percentage" ? (discountEligibleAmount * value) / 100 : value;

                        discountAmount = Math.min(discountAmount, discountEligibleAmount);
                    }
                }

                return {
                    vendor_id: item.vendor_id,
                    slug: item.slug,
                    vendor_name: item.vendorName,
                    shippingAvailable: matchedShippingOptions.length > 0,
                    matchedShippingOptions,
                    shop_icon: item.vendorIcon,
                    shop_name: item.vendorShop,
                    vendor_coupon: item.vendorCoupon
                      ? {
                          ...item.vendorCoupon,
                          coupon_data: {
                              coupon_code: couponData?.coupon_code,
                              discount_amount: discountAmount,
                              isSynced: couponData?.isSynced ?? false
                          }
                        }
                     : null,
                    coupon_status: !!item.vendorCoupon,
                    totalAmount,
                    discountAmount,
                    products: item.products
                };
            })
        );

        const activeVendorIdsInCart = formattedResult.map((item: any) => item.vendor_id.toString());
        const cartCouponDoc = await couponCart.find({ user_id: user_id });

        if (cartCouponDoc.length > 0) {
            for (const item of cartCouponDoc) {
                if (!activeVendorIdsInCart.includes(item.vendor_id.toString())) {
                    await couponCart.findOneAndDelete({ user_id: user_id, vendor_id: item.vendor_id });
                }
            }
        }

        return resp.status(200).json({
            message: "Cart list fetched successfully.",
            result: formattedResult
        });
    } catch (error) {
        return resp.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

export const deleteCart = async (req: CustomRequest, resp: Response) => {
    try {
        const cart_id = req.body.cart_id;
        if (!cart_id) {
            return resp.status(400).json({ message: "Please Provide Cart Id" });
        }
        const cart = await Cart.findOneAndDelete({ _id: cart_id, user_id: req.user._id });
        if (!cart) {
            return resp.status(400).json({ message: "Cart Not Found" });
        }

        // remove parent vendor cart if any vendor product is not available in the user cart
        const checkOtherVendorProduct = await Cart.findOne({ user_id: cart.user_id, vendor_id: cart.vendor_id });

        if (!checkOtherVendorProduct) {
            await ParentCart.findOneAndDelete({ vendor_id: cart.vendor_id, user_id: cart.user_id });
        }

        const productData = await Product.findOne({ _id: cart.product_id });
        await activity(
            req.user._id,
            cart.product_id,
            cart.vendor_id,
            'delete-cart',
            `${productData?.product_title} deleted cart.`,
        );
        await vandorAndProductActivity(
            req.user._id,
            cart.product_id,
            cart.vendor_id,
            "product",
            "delete-cart",
            `${productData?.product_title} deleted product from cart.`,
        )
        return resp.status(200).json({ message: 'Cart Product Delete successfully.' });
    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}

export const deleteCompleteCart = async (req: CustomRequest, resp: Response) => {
    try {
        await Cart.deleteMany({ user_id: req.user._id });
        await activity(
            req.user._id,
            null,
            null,
            'delete-cart',
            `All Product deleted from cart.`,
        );
        return resp.status(200).json({ message: 'User Cart delete successfully.' });
    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}

export const addAddress = async (req: CustomRequest, resp: Response) => {
    try {
        const data: any = {
            user_id: req.user._id,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            country: req.body.country,
            mobile: req.body.mobile,
            email: req.user.email,
            phone_code: req.body.phone_code,
            address_line1: req.body.address_line1,
            address_line2: req.body.address_line2,
            state: req.body.state,
            city: req.body.city,
            pincode: req.body.pincode
        }
        if (req.body.default == '1') {
            await Address.updateMany(
                { user_id: req.user._id },
                { $set: { default: 0 } }
            )
            data.default = '1';
        }
        if (req.body._id === 'new') {
            await Address.create(data);
            await activity(
                req.user._id,
                null,
                null,
                'add-address',
                `Address added for user ${req.user.name}.`,
            );
            resp.status(200).json({ message: 'Address Added Successfully' });
        } else {

            await Address.updateOne(
                { _id: req.body._id },
                { $set: data }
            );

            await activity(
                req.user._id,
                null,
                null,
                'update-address',
                `Address updated for user ${req.user.name}.`,
            );

            return resp.status(200).json({ message: 'Address updated successfully.' });
        }
    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}


export const deleteAddress = async (req: CustomRequest, resp: Response) => {
    try {

        const address_id = req.body.address_id;

        const existingAddress = await Address.findOne({ _id: address_id, user_id: req.user._id });

        if (!existingAddress) {
            return resp.status(404).json({ message: 'Address not found.' });
        }

        await Address.deleteOne({ _id: address_id, user_id: req.user._id });

        await activity(
            req.user._id,
            null,
            null,
            'delete-address',
            `Address deleted for user ${req.user.name}.`,
        );

        return resp.status(200).json({ message: 'Address deleted successfully.' });


    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}

export const getAddress = async (req: CustomRequest, resp: Response) => {
    try {
        const { limit, offset } = req.query;
        const user_id = req.user._id;

        const limitNum = parseInt(limit as string, 10) || 10;
        const offsetNum = parseInt(offset as string, 10) || 0;

        const totalAddresses = await Address.countDocuments({ user_id: user_id });
        const totalPages = Math.ceil(totalAddresses / limitNum);

        const addresses = await Address.find({ user_id: user_id })
            .sort({ default: -1, _id: -1 }) // Sort by default (1 first), then by _id in descending order
            .skip(offsetNum * limitNum)
            .limit(limitNum);

        if (!addresses || addresses.length === 0) {
            return resp.status(404).json({ message: 'Address not found.' });
        }

        return resp.status(200).json({ message: 'Address fetched successfully.', addresses, addressLength: totalAddresses, totalPages });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

export const getAddressById = async (req: CustomRequest, resp: Response) => {
    try {
        const address_id = req.params.id;
        const address = await Address.findOne({ _id: address_id, user_id: req.user._id });
        return resp.status(200).json({ message: 'Address fetched successfully.', address });
    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}

export const checkoutAddressEligibility = async (userId: any, addressId: any, vendorId: any = "") => {

    // check address
    const addressResult = await Address.findOne({ _id: new mongoose.Types.ObjectId(addressId as string) })

    if (!addressResult) {

        return {
            status: false,
            message: 'Address not found.'
        }

    }

    const addressCountry = addressResult.country || 'India';

    let pipeline = [
        {
            $match: {
                user_id: new mongoose.Types.ObjectId(userId),
                ...(vendorId ? { vendor_id: new mongoose.Types.ObjectId(vendorId) } : {})
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'vendor_id',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            _id: 1
                        }
                    },
                    {
                        $lookup: {
                            from: 'vendordetails',
                            localField: "_id",
                            foreignField: "user_id",
                            pipeline: [
                                {
                                    $project: {
                                        shop_name: 1
                                    }
                                }
                            ],
                            as: 'vendorprofile'
                        }
                    }
                ],
                as: 'vendorDetails'
            }
        },
        {
            $unwind: {
                path: "$vendorDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                vendorShopName: {
                    $ifNull: ["$vendorDetails.vendorprofile.shop_name", null]
                }
            }
        },
        {
            $lookup: {
                from: 'carts',
                localField: 'vendor_id',
                foreignField: 'vendor_id',
                pipeline: [
                    {
                        $match: {
                            user_id: new mongoose.Types.ObjectId(userId)
                        }
                    },
                    {
                        $lookup: {
                            from: 'shippings',
                            localField: 'shipping_id',
                            foreignField: '_id',
                            pipeline: [
                                {
                                    $project: {
                                        shippingTemplateData: 1
                                    }
                                }
                            ],
                            as: 'shippingDetail'
                        }
                    },
                    {
                        $unwind: {
                            path: '$shippingDetail',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            shipping_id: 1,
                            shippingName: 1,
                            shippingDetail: 1
                        }
                    }
                ],
                as: 'cartData'
            }
        },
        {
            $project: {
                createdAt: 0,
                updatedAt: 0,
                vendorDetails: 0,
            }
        }
    ];

    const getVendorCartData = await ParentCart.aggregate(pipeline);

    if (!getVendorCartData) {

        return {
            status: false,
            message: 'No items in your cart.'
        }

    }


    let errorVendorName = "";
    getVendorCartData.forEach((carts) => {

        const applyVendorShippingTemplate = carts.vendor_data[0].shippingName;
        // check shipping in the related cart products;

        let allowCountries = [];

        for (let cart of (carts.cartData)) {

            if (applyVendorShippingTemplate === "standardShipping") {

                for (let region of (cart?.shippingDetail?.shippingTemplateData.standardShipping)) {

                    allowCountries.push(...region?.region)

                }

            }

            if (applyVendorShippingTemplate === "expedited") {

                for (let region of (cart?.shippingDetail?.shippingTemplateData.expedited)) {

                    allowCountries.push(...region?.region)

                }
            }

            if (applyVendorShippingTemplate === "twoDays") {

                for (let region of (cart?.shippingDetail?.shippingTemplateData.twoDays)) {

                    allowCountries.push(...region?.region)

                }
            }

            if (applyVendorShippingTemplate === "oneDay") {

                for (let region of (cart?.shippingDetail?.shippingTemplateData.oneDay)) {

                    allowCountries.push(...region?.region)

                }
            }

        }

        const getUniqueCountries = [...new Set(allowCountries)];

        if (!getUniqueCountries.includes(addressCountry)) {

            errorVendorName = getVendorCartData[0]?.vendorShopName;
            return;

        }

    })

    if (errorVendorName) {

        return {
            status: false,
            message: `${getVendorCartData[0]?.vendorShopName} doesn't allow the delivery for your country`
        }


    }


    return {
        status: true,
        message: 'Allowing delhivery for your country'
    }

}

export const checkout = async (req: CustomRequest, resp: Response) => {
    let error = false;
    try {

        const checkoutEliginbilityData = await checkoutAddressEligibility(req.user._id, req.body.address_id);

        if (!checkoutEliginbilityData.status) {

            return resp.status(400).json({ message: checkoutEliginbilityData.message });
        }

        const totalSales = await Sales.countDocuments();

        const currentDate = new Date();
        const year = currentDate.getFullYear(); // e.g., 2024
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based, so add 1 and pad to 2 digits
        const date = String(currentDate.getDate()).padStart(2, '0'); // Pad date to 2 digits
        let hours = currentDate.getHours();
        let minutes = currentDate.getMinutes();
        let milliseconds = currentDate.getMilliseconds();

        const orderId = `ord${year}${month}${date}${hours}${minutes}${milliseconds}`;

        const address = await Address.findById({ _id: new mongoose.Types.ObjectId(req.body.address_id) });

        const pipeline = [
            {
                $match: {
                    'user_id': new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product_data"
                }
            },
            {
                $unwind: {
                    path: "$product_data",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "parentcarts",
                    localField: "vendor_id",
                    foreignField: "vendor_id",
                    pipeline: [
                        {
                            $match: {
                                user_id: new mongoose.Types.ObjectId(req.user._id)
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'vendor_id',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: 'vendordetails',
                                            localField: "_id",
                                            foreignField: "user_id",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        shop_name: 1
                                                    }
                                                }
                                            ],
                                            as: 'vendorprofile'
                                        }
                                    }
                                ],
                                as: 'vendorDetails'
                            }
                        },
                        {
                            $lookup: {
                                from: "shippings",
                                localField: "shipping_id",
                                foreignField: "_id",
                                as: "shippingData"
                            }
                        }
                    ],
                    as: "parentCartData"
                }
            },
            {
                $unwind: {
                    path: "$parentCartData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    qty: 1,
                    product_id: 1,
                    delivery_amount:
                        "$product_data.delivery_amount",
                    delivery:
                        "$product_data.delivery_type",
                    sale_price: "$price",
                    original_price: "$original_price",
                    discount_type: "$product_data.discount_type",
                    discount_amount: "$product_data.discount_amount",
                    isCombination: "$product_data.isCombination",
                    customize: "$customize",
                    customizationData: "$customizationData",
                    variant_id: "$variant_id",
                    variant_attribute_id: "$variant_attribute_id",
                    affiliate_id: "$affiliate_id",
                    shipping_id: "$shipping_id",
                    shippingName: "$shippingName",
                    parentCartData: 1
                    // parentCartData: {
                    //     $cond: {
                    //         if: { $isArray: "$parentCartData.vendor_data" },
                    //         then: "$parentCartData.vendor_data",
                    //         else: []
                    //     }
                    // }
                }
            }
        ]
        const cartResult = await Cart.aggregate(pipeline);

        let subTotal = 0;
        let totalShipping = 0;
        let discount = 0;
        let discountAmount = 0;
        let netAmount = 0;
        let usedWalletAmount = 0;
        let voucherDiscount = Number(req.body.voucher_discount || 0);
        let promotionDiscount = 0;
        let delivery = 0;
        let parentCartData: any = {};

        if (!address || (address && address?.country === "")) {

            return resp.status(400).json({
                status: false,
                message: 'User selected address country not found.'
            });

        }

        const cartCoupon = await CartCouponModel.find({ user_id: req.user._id });
        let couponCode = '';

        if (cartResult.length !== 0) {

            await Promise.all(cartResult.map(async (item) => {

                const offerPrice = getOfferProductPrice(item.sale_price, item.discount_type, item.discount_amount);
                const shippingAmount = item.delivery_amount;
                subTotal += item.sale_price * item.qty;

                if (item.delivery === 'paid') {
                    totalShipping += shippingAmount * item.qty;
                }

                discount += (item.sale_price - offerPrice) * item.qty;
                // promotionDiscount += (item.original_price - item.sale_price) * item.qty

                const shippingName = item.parentCartData?.vendor_data?.[0]?.shippingName;
                const shippingTemplateData = item.parentCartData?.shippingData?.[0]?.shippingTemplateData;
                const shippingOptions = {
                    standardShipping: shippingTemplateData?.standardShipping,
                    expedited: shippingTemplateData?.expedited,
                    twoDays: shippingTemplateData?.twoDays,
                    oneDay: shippingTemplateData?.oneDay,
                };

                const selectedShipping = shippingOptions[shippingName as keyof typeof shippingOptions] || [];

                let perOrderFee = 0;
                for (const option of selectedShipping) {
                    if (option?.region?.includes(address?.country)) {
                        if (item.parentCartData) {
                            delivery += (option?.shippingFee?.perItem || 0) * item.qty;
                            perOrderFee = (option?.shippingFee?.perOrder || 0)
                        }
                        break; // exit after first match
                    }
                }

                const parentCartVendorData = item.parentCartData;
                parentCartVendorData.vendor_data[0].perOrder = parseFloat(perOrderFee.toString());
                parentCartData[parentCartVendorData.vendor_id] = parentCartVendorData;

            }));

            for (const vendorId in parentCartData) {
                const data = parentCartData[vendorId];

                if (data.vendor_data[0]?.perOrder <= 0) {

                    return resp.status(200).json({ status: false, message: `${data.vendorDetails[0].vendorprofile[0].shop_name} doesn't allow the delivery for your selected address country` });

                }
                delivery += data.vendor_data[0]?.perOrder;
            }

            netAmount = subTotal - promotionDiscount
            if (cartCoupon.length > 0) {
                // for (let coupon of cartCoupon) {
                //     discountAmount += coupon?.discount_amount;
                //     couponCode = coupon?.coupon_code;
                // }
            }

            netAmount = netAmount - discountAmount;

            netAmount -= voucherDiscount;

            netAmount += totalShipping;
            netAmount += delivery;

            if (req.body.wallet == '1' && couponCode == '') {
                const user = await User.findOne({ _id: req.user._id });
                let walletAmount = 0;
                if (user) {
                    walletAmount = user.wallet_balance;
                    if (walletAmount > netAmount) {
                        usedWalletAmount = netAmount;
                        netAmount = 0;
                    } else if (walletAmount < netAmount) {
                        usedWalletAmount = walletAmount;
                        netAmount -= walletAmount;
                    }
                }
            }

        } else {
            error = true;
            return resp.status(400).json({ message: 'No items in your cart.' })
        }



        const salesData: any = {
            user_id: req.user._id,
            order_id: orderId,
            name: address?.first_name || '' + address?.last_name || '',
            email: address?.email,
            mobile: address?.mobile,
            phone_code: address?.phone_code,
            country: address?.country,
            state: address?.state,
            city: address?.city,
            address_line1: address?.address_line1,
            address_line2: address?.address_line2,
            pincode: address?.pincode,
            payment_type: req.body.payment_type,
            subtotal: subTotal,
            shipping: totalShipping,
            discount: discount,
            voucher_id: req.body.voucher_id ? new mongoose.Types.ObjectId(req.body.voucher_id) : null,
            voucher_dicount: voucherDiscount || 0,
            net_amount: netAmount,
            payment_status: '0',
            coupon_discount: discountAmount,
            coupon_applied: cartCoupon.length > 0 ? cartCoupon : null,
            wallet_used: usedWalletAmount,
            promotional_discount: promotionDiscount,
            delivery: delivery
        }

        function removeHtmlTags(str: string): string {
            return str.replace(/<\/?[^>]+(>|$)/g, "");
        }

        await Promise.all(cartResult.map(async (item) => {

            const productData = await Product.findOne({ _id: item.product_id });
            if (!productData) {
                error = true;
                return resp.status(400).json({ message: "Product not found." })
            }
            let currentQty = Number(productData?.qty);

            if (item?.isCombination) {
                productData.combinationData.forEach((element: any, index: any) => {
                    element.combinations.forEach((comb: any) => {

                        let matchVariantAttrId: string[][] = item?.variant_attribute_id.map((attrId: string) =>
                            [attrId]
                        );

                        if (item?.variant_attribute_id.length > 1) {
                            for (let i = 0; i < item?.variant_attribute_id.length; i++) {
                                for (let j = i + 1; j < item?.variant_attribute_id.length; j++) {
                                    matchVariantAttrId.push([item?.variant_attribute_id[i], item?.variant_attribute_id[j]]);
                                }
                            }
                        }
                        matchVariantAttrId.forEach((attrId: any) => {
                            const attrIdStr = attrId.toString();
                            const attrIdArray = attrIdStr.split(',');

                            const isMatch =
                                comb.combIds.length === attrIdArray.length &&
                                comb.combIds.every((id: string) => attrIdArray.includes(id));

                            if (isMatch) {
                                currentQty = comb.qty ? comb.qty : item.qty;
                            }
                        });
                    })
                })
            }

            if (currentQty == 0) {
                error = true;
                return resp.status(400).json({ message: `${removeHtmlTags(productData.product_title)} is out of stock` })
            }

            const updatedQty = currentQty - Number(item?.qty);

            if (updatedQty < 0) {
                error = true;
                return resp.status(400).json({ message: `${removeHtmlTags(productData.product_title)} is out of stock` });
            }

        }));

        if (!error) {
            const sales = await Sales.create(salesData);

            const saleId = sales._id;
            if (cartResult.length !== 0) {
                await Promise.all(cartResult.map(async (item) => {
                    const couponData = cartCoupon?.find((coupon: any) => coupon.vendor_id?.toString() === (item.vendor_id?.toString()) || null);
                    const shippingData = item.parentCartData?.shippingData?.[0] || null;
                    const promotionalOfferData = (item.original_price > item.sale_price)
                        ? {
                            discount: item.original_price - item.sale_price,
                            type: item.discount_type,
                            amount: item.discount_amount
                        }
                        : null;

                    const productResultPipeline = [
                        {
                            $match: { '_id': new mongoose.Types.ObjectId(item.product_id) }
                        },
                        {
                            $lookup: {
                                from: "parentproducts",
                                localField: "parent_id",
                                foreignField: "_id",
                                as: "parentData"
                            }
                        },
                        {
                            $unwind: {
                                path: "$parentData",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "vendor_id",
                                foreignField: "_id",
                                as: "vendorData"
                            }
                        },
                        {
                            $unwind: {
                                path: "$vendorData",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                product_title: 1,
                                product_id: "$_id",
                                variant_attribute_id:
                                    "$parentData.variant_attribute_id",
                                discount_type: "$discount_type",
                                discount_amount: "$discount_amount",
                                delivery: "$delivery",
                                delivery_amount: "$delivery_amount",
                                image: "$image",
                                vendor_id: "$vendor_id",
                                vendor_name: "$vendorData.name",
                                slug: "$slug",
                                stock: "$stock",
                                sale_price: "$sale_price",
                                offer_price: "$offer_price",
                                return_policy: "$return_policy",
                                meta_title: "$meta_title",
                                meta_keywords: "$meta_keywords",
                                meta_description: "$meta_description"
                            }
                        }
                    ]

                    const aggregation = await Product.aggregate(productResultPipeline)

                    const productResult = aggregation[0];
                    const productData = await Product.findOne({ _id: new mongoose.Types.ObjectId(item.product_id) });
                    if (!productData) {
                        error = true;
                        return resp.status(400).json({ message: "Product not found." })
                    }
                    let currentQty = Number(productData?.qty);

                    if (item?.isCombination) {
                        productData.combinationData.forEach((element: any, index: any) => {
                            element.combinations.forEach((comb: any) => {

                                let matchVariantAttrId: string[][] = item?.variant_attribute_id.map((attrId: string) =>
                                    [attrId]
                                );

                                if (item?.variant_attribute_id.length > 1) {
                                    for (let i = 0; i < item?.variant_attribute_id.length; i++) {
                                        for (let j = i + 1; j < item?.variant_attribute_id.length; j++) {
                                            matchVariantAttrId.push([item?.variant_attribute_id[i], item?.variant_attribute_id[j]]);
                                        }
                                    }
                                }
                                matchVariantAttrId.forEach((attrId: any) => {
                                    const attrIdStr = attrId.toString();
                                    const attrIdArray = attrIdStr.split(',');

                                    const isMatch =
                                        comb.combIds.length === attrIdArray.length &&
                                        comb.combIds.every((id: string) => attrIdArray.includes(id));

                                    if (isMatch) {
                                        currentQty = comb.qty ? comb.qty : productData.qty;
                                    }
                                });
                            })
                        })
                    }
                    const updatedQty = currentQty - Number(item?.qty);
                    let finalQty = updatedQty.toString();

                    const data: any = {
                        user_id: req.user._id,
                        vendor_id: productResult?.vendor_id,
                        vendor_name: productResult?.vendor_name,
                        sale_id: saleId,
                        order_id: orderId,
                        product_id: productResult?.product_id,
                        productData: productData ? productData : {},
                        qty: item?.qty,
                        isCombination: item?.isCombination,
                        customize: item?.customize,
                        customizationData: item?.customizationData,
                        sub_total: item?.sale_price * item?.qty,
                        amount: (item?.sale_price * item?.qty),
                        variant_id: item?.variant_id,
                        variant_attribute_id: item?.variant_attribute_id,
                        affiliate_id: item.affiliate_id ? item.affiliate_id : null,
                        promotional_discount: (item.original_price - item.sale_price),
                        shippingId: item.shipping_id,
                        shippingName: item.shippingName,
                        deliveryData: item.parentCartData[0],
                        couponData: couponData,
                        shippingData: shippingData,
                        promotionalOfferData: promotionalOfferData
                    }

                    if (item?.isCombination) {
                        productData.combinationData.forEach((element: any, index: any) => {
                            element.combinations.forEach((comb: any, ind: any) => {

                                let matchVariantAttrId: string[][] = item?.variant_attribute_id.map((attrId: string) =>
                                    [attrId]
                                );

                                if (item?.variant_attribute_id.length > 1) {
                                    for (let i = 0; i < item?.variant_attribute_id.length; i++) {
                                        for (let j = i + 1; j < item?.variant_attribute_id.length; j++) {
                                            matchVariantAttrId.push([item?.variant_attribute_id[i], item?.variant_attribute_id[j]]);
                                        }
                                    }
                                }

                                matchVariantAttrId.forEach((attrId: any) => {
                                    const attrIdStr = attrId.toString();
                                    const attrIdArray = attrIdStr.split(',');

                                    const isMatch =
                                        comb.combIds.length === attrIdArray.length &&
                                        comb.combIds.every((id: string) => attrIdArray.includes(id));

                                    if (isMatch) {
                                        if (element.combinations[ind].qty == "") {
                                            productData.qty = finalQty
                                        } else {
                                            element.combinations[ind].qty = finalQty;
                                        }
                                        productData.combinationData[index] = element;
                                    }
                                });

                            })
                        })
                    } else {
                        productData.qty = finalQty;
                    }
                    await productData.save();

                    await Salesdetail.create(data);
                }));
            }
            await Cart.deleteMany({ user_id: req.user._id });
            await ParentCartModel.deleteMany({ user_id: req.user._id });
            await CartCouponModel.deleteOne({ user_id: req.user._id });
            await CouponModel.updateOne({ coupon_code: couponCode }, { $inc: { total_uses: 1 } });

            if (req.body.wallet == '1' && couponCode == '') {
                const transactionHistorydata = {
                    user_id: req.user._id,
                    transaction_type: 'Dr',
                    amount: usedWalletAmount,
                    description: 'Used Amount for Shopping',
                }
                await User.updateOne({ _id: req.user._id }, { $inc: { wallet_balance: -usedWalletAmount } });
                await GiftCardTransactionHistoryModel.create(transactionHistorydata);
            }
            const updateUser = await User.findOne({ _id: req.user._id });
            await activity(
                req.user._id,
                null,
                null,
                'checkout',
                'Checkout successfully with order ID: ' + orderId,
            );
            return resp.status(200).json({ message: 'Checkout successfully', orderId: orderId, updateUser: updateUser });
        }


    } catch (error) {
        error = true
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}

export const getAccessToken = async () => {
    try {
        const response = await got.post('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
            form: {
                grant_type: 'client_credentials',
            },
            username: "AYKXmGSaIYk_P8R1brliTpBwrpi2hA8y5yulQMmi4XLByhWw1rvfdtoefzWkm0nUvSQ86123jZYOuaWq",
            password: "ECTyKQDW5kwDmCxXHj3miWDYXyaNhEOPg_S87zJnIV8XBW-6TTtztez08_I7-_iaGIZVF5g_RFGGqZsV",
        });

        const data = JSON.parse(response.body);
        const newAccessToken = data.access_token;
        return newAccessToken;
    } catch (error: any) {
    }
};

export const createOrder = async (req: CustomRequest, resp: Response) => {
    try {
        const accessToken = await getAccessToken();

        const response = await got.post("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            json: {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        reference_id: "PUHF",
                        description: "Your purchase description",
                        amount: {
                            currency_code: "EUR",
                            value: "10.00",
                            breakdown: {
                                item_total: {
                                    currency_code: "EUR",
                                    value: "10.00"
                                }
                            }
                        },
                        items: [
                            {
                                name: "item",
                                description: "description",
                                quantity: "1",
                                unit_amount: {
                                    currency_code: "EUR",
                                    value: "10.00"
                                }
                            }
                        ],
                        shipping: {
                            address: {
                                address_line_1: "1234 Main Street",
                                address_line_2: "Apt 101",
                                admin_area_2: "San Francisco",
                                admin_area_1: "CA",
                                postal_code: "94105",
                                country_code: "US"
                            }
                        }
                    }
                ],
                payment_source: {
                    paypal: {
                        experience_context: {
                            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
                            payment_method_selected: "PAYPAL",
                            brand_name: "Dekhohub-Volaity store",
                            shipping_preference: "SET_PROVIDED_ADDRESS",
                            locale: "en-US",
                            user_action: "PAY_NOW",
                            return_url: "https://api-m.sandbox.paypal.com/complete-payment",
                            cancel_url: "https://api-m.sandbox.paypal.com/complete-payment"
                        }
                    }
                }
            },
            responseType: 'json'
        });
        return resp.status(200).json({ success: "order created successfully", data: response.body });
    } catch (error: any) {
        console.error('Error creating PayPal order:', error.response?.body || error.message);
        return resp.status(400).json({ message: 'Bad Request. Please check your request data.', details: error.response?.body || error.message });
    }
};

export const vendorWiseCheckout = async (req: CustomRequest, resp: Response) => {
    let error = false;
    try {
        const checkoutEliginbilityData = await checkoutAddressEligibility(
            req.user._id,
            req.body.address_id,
            req.body.vendor_id
        );

        if (!checkoutEliginbilityData.status) {
            return resp.status(400).json({ message: checkoutEliginbilityData.message });
        }

        const vendorId = req.body.vendor_id;
        const shop_count = req.body.shop_count;
        const totalSales = await Sales.countDocuments();
        const currentDate = new Date();
        const year = currentDate.getFullYear(); // e.g., 2024
        const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is zero-based, so add 1 and pad to 2 digits
        const date = String(currentDate.getDate()).padStart(2, "0"); // Pad date to 2 digits
        let hours = currentDate.getHours();
        let minutes = currentDate.getMinutes();
        let milliseconds = currentDate.getMilliseconds();

        const orderId = `ord${year}${month}${date}${hours}${minutes}${milliseconds}`;

        const address = await Address.findById({
            _id: new mongoose.Types.ObjectId(req.body.address_id),
        });

        const pipeline = [
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(req.user._id),
                    vendor_id: new mongoose.Types.ObjectId(vendorId),
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product_data",
                },
            },
            {
                $unwind: {
                    path: "$product_data",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "parentcarts",
                    localField: "vendor_id",
                    foreignField: "vendor_id",
                    pipeline: [
                        {
                            $match: {
                                user_id: new mongoose.Types.ObjectId(req.user._id),
                            },
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "vendor_id",
                                foreignField: "_id",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: "vendordetails",
                                            localField: "_id",
                                            foreignField: "user_id",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        shop_name: 1,
                                                    },
                                                },
                                            ],
                                            as: "vendorprofile",
                                        },
                                    },
                                ],
                                as: "vendorDetails",
                            },
                        },
                        {
                            $lookup: {
                                from: "shippings",
                                localField: "shipping_id",
                                foreignField: "_id",
                                as: "shippingData",
                            },
                        },
                    ],
                    as: "parentCartData",
                },
            },
            {
                $unwind: {
                    path: "$parentCartData",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    qty: 1,
                    product_id: 1,
                    delivery_amount: "$product_data.delivery_amount",
                    delivery: "$product_data.delivery_type",
                    sale_price: "$price",
                    original_price: "$original_price",
                    discount_type: "$product_data.discount_type",
                    discount_amount: "$product_data.discount_amount",
                    isCombination: "$product_data.isCombination",
                    customize: "$customize",
                    customizationData: "$customizationData",
                    variant_id: "$variant_id",
                    variant_attribute_id: "$variant_attribute_id",
                    affiliate_id: "$affiliate_id",
                    shipping_id: "$shipping_id",
                    shippingName: "$shippingName",
                    parentCartData: 1,
                },
            },
        ];

        if (!address || (address && address?.country === "")) {
            return resp.status(400).json({
                status: false,
                message: "User selected address country not found.",
            });
        }

        const cartResult = await Cart.aggregate(pipeline);

        let subTotal = 0;
        let totalShipping = 0;
        let discount = 0;
        let discountAmount = 0;
        let netAmount = 0;
        let wallet_balance_new = 0;
        let usedWalletAmount = 0;
        let promotionDiscount = 0;
        let delivery = 0;
        let parentCartData: any = {};

        // NEW: voucher amount (same behavior as checkout)
        let voucherDiscount = Number(req.body.voucher_discount || 0);

        const cartCoupon = await CartCouponModel.findOne({ user_id: req.user._id });
        let couponCode = "";

        if (cartResult.length !== 0) {
            await Promise.all(
                cartResult.map(async (item) => {
                    const offerPrice = getOfferProductPrice(
                        item.sale_price,
                        item.discount_type,
                        item.discount_amount
                    );

                    const couponData = await couponCart.findOne({ vendor_id: req.body.vendor_id, user_id: req.user._id });
                    const couponDatas = couponData ? couponData : null;

                    if (couponDatas) {
                        const couponData = await CouponModel.findOne({
                            vendor_id: couponDatas.vendor_id
                        });

                        if (couponData?.discount_type && couponData?.discount_amount) {
                            const allowedProductIds = (couponData.product_id || []).map((id: any) =>
                                id.toString()
                            );

                            const discountEligibleAmount = allowedProductIds.includes(item.product_id.toString()) ? Number(item.sale_price) * Number(item.qty) : 0;
                            const type = couponData.discount_type;
                            const value = Number(couponData.discount_amount);

                            discountAmount = type === "percentage" ? (discountEligibleAmount * value) / 100 : value;

                            discountAmount = Math.min(discountAmount, discountEligibleAmount);
                        }
                    }

                    subTotal += item.sale_price * item.qty + (item.parentCartData?.vendor_data[0]?.perItem * item.qty) + (item.parentCartData?.vendor_data[0]?.perOrder / cartResult.length) - discountAmount - (voucherDiscount / shop_count);


                    discount += (item.sale_price - offerPrice) * item.qty;
                    promotionDiscount += (item.original_price - item.sale_price) * item.qty;

                    const shippingName = item.parentCartData?.vendor_data?.[0]?.shippingName;
                    const shippingAmount = item.parentCartData?.vendor_data[0]?.perOrder * item.qty;

                    const shippingTemplateData =
                        item.parentCartData?.shippingData?.[0]?.shippingTemplateData;
                    const shippingOptions = {
                        standardShipping: shippingTemplateData?.standardShipping,
                        expedited: shippingTemplateData?.expedited,
                        twoDays: shippingTemplateData?.twoDays,
                        oneDay: shippingTemplateData?.oneDay,
                    };

                    const selectedShipping =
                        shippingOptions[shippingName as keyof typeof shippingOptions] || [];

                    let perOrderFee = 0;
                    for (const option of selectedShipping) {
                        if (option?.region?.includes(address?.country)) {
                            if (item.parentCartData) {
                                delivery += (option?.shippingFee?.perItem || 0) * item.qty;
                                perOrderFee = option?.shippingFee?.perOrder || 0;
                            }
                            break; // exit after first match
                        }
                    }

                    const parentCartVendorData = item.parentCartData;
                    parentCartVendorData.vendor_data[0].perOrder = parseFloat(
                        perOrderFee.toString()
                    );
                    parentCartData[parentCartVendorData.vendor_id] = parentCartVendorData;
                })
            );

            // loop for vendor product data
            for (const vendorId in parentCartData) {
                const data = parentCartData[vendorId];

                if (data.vendor_data[0]?.perOrder <= 0) {
                    return resp.status(200).json({
                        status: false,
                        message: `${data.vendorDetails[0].vendorprofile[0].shop_name} doesn't allow the delivery for your selected address country`,
                    });
                }
                delivery += data.vendor_data[0]?.perOrder;
            }

            // --- totals (order matches main checkout) ---
            netAmount = subTotal - promotionDiscount;

            if (cartCoupon && cartCoupon.coupon_data) {
                for (const [vendorId, couponDetails] of cartCoupon.coupon_data) {
                    discountAmount += couponDetails.discount_amount;
                    couponCode = couponDetails.coupon_code;
                }
            }

            netAmount = netAmount - discountAmount;
            netAmount -= voucherDiscount;
            wallet_balance_new = netAmount;
            netAmount += totalShipping;
            netAmount += delivery;

            if (req.body.wallet == "1") {
                const user = await User.findOne({ _id: req.user._id });
                let walletAmount = 0;
                if (user) {
                    walletAmount = user.wallet_balance;
                    if (walletAmount > netAmount) {
                        usedWalletAmount = wallet_balance_new;
                        netAmount = 0;
                    } else if (walletAmount < netAmount) {
                        usedWalletAmount = walletAmount;
                        netAmount -= walletAmount;
                    }
                }
            }
            // --- end totals ---

        } else {
            error = true;
            return resp.status(400).json({ message: "No items in your cart." });
        }

        const salesData: any = {
            user_id: req.user._id,
            order_id: orderId,
            name: address?.first_name || "" + address?.last_name || "",
            email: address?.email,
            mobile: address?.mobile,
            phone_code: address?.phone_code,
            country: address?.country,
            state: address?.state,
            city: address?.city,
            address_line1: address?.address_line1,
            address_line2: address?.address_line2,
            pincode: address?.pincode,
            payment_type: req.body.payment_type,
            subtotal: subTotal,
            shipping: totalShipping,
            discount: discount,
            net_amount: netAmount,
            payment_status: "0",
            coupon_discount: discountAmount,
            coupon_applied: cartCoupon?.coupon_data,
            wallet_used: subTotal,
            promotional_discount: promotionDiscount,
            delivery: delivery,

            // NEW: voucher fields (same names as in checkout)
            voucher_id: req.body.voucher_id
                ? new mongoose.Types.ObjectId(req.body.voucher_id)
                : null,
            voucher_dicount: (voucherDiscount) / shop_count || 0,
        };

        function removeHtmlTags(str: string): string {
            return str.replace(/<\/?[^>]+(>|$)/g, "");
        }

        await Promise.all(
            cartResult.map(async (item) => {
                const productData = await Product.findOne({ _id: item.product_id });
                if (!productData) {
                    error = true;
                    return resp.status(400).json({ message: "Product not found." });
                }
                let currentQty = Number(productData?.qty);

                if (item?.isCombination) {
                    productData.combinationData.forEach((element: any, index: any) => {
                        element.combinations.forEach((comb: any) => {
                            let matchVariantAttrId: string[][] = item?.variant_attribute_id.map(
                                (attrId: string) => [attrId]
                            );

                            if (item?.variant_attribute_id.length > 1) {
                                for (let i = 0; i < item?.variant_attribute_id.length; i++) {
                                    for (let j = i + 1; j < item?.variant_attribute_id.length; j++) {
                                        matchVariantAttrId.push([
                                            item?.variant_attribute_id[i],
                                            item?.variant_attribute_id[j],
                                        ]);
                                    }
                                }
                            }
                            matchVariantAttrId.forEach((attrId: any) => {
                                const attrIdStr = attrId.toString();
                                const attrIdArray = attrIdStr.split(",");

                                const isMatch =
                                    comb.combIds.length === attrIdArray.length &&
                                    comb.combIds.every((id: string) => attrIdArray.includes(id));

                                if (isMatch) {
                                    currentQty = comb.qty ? comb.qty : item.qty;
                                }
                            });
                        });
                    });
                }

                if (currentQty == 0) {
                    error = true;
                    return resp
                        .status(400)
                        .json({ message: `${removeHtmlTags(productData.product_title)} is out of stock` });
                }

                const updatedQty = currentQty - Number(item?.qty);

                if (updatedQty < 0) {
                    error = true;
                    return resp
                        .status(400)
                        .json({ message: `${removeHtmlTags(productData.product_title)} is out of stock` });
                }
            })
        );

        if (!error) {
            const sales = await Sales.create(salesData);

            const saleId = sales._id;
            if (cartResult.length !== 0) {
                await Promise.all(
                    cartResult.map(async (item) => {
                        const productResultPipeline = [
                            {
                                $match: { _id: new mongoose.Types.ObjectId(item.product_id) },
                            },
                            {
                                $lookup: {
                                    from: "parentproducts",
                                    localField: "parent_id",
                                    foreignField: "_id",
                                    as: "parentData",
                                },
                            },
                            {
                                $unwind: {
                                    path: "$parentData",
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "vendor_id",
                                    foreignField: "_id",
                                    as: "vendorData",
                                },
                            },
                            {
                                $unwind: {
                                    path: "$vendorData",
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                            {
                                $project: {
                                    product_title: 1,
                                    product_id: "$_id",
                                    variant_attribute_id: "$parentData.variant_attribute_id",
                                    discount_type: "$discount_type",
                                    discount_amount: "$discount_amount",
                                    delivery: "$delivery",
                                    delivery_amount: "$delivery_amount",
                                    image: "$image",
                                    vendor_id: "$vendor_id",
                                    vendor_name: "$vendorData.name",
                                    slug: "$slug",
                                    stock: "$stock",
                                    sale_price: "$sale_price",
                                    offer_price: "$offer_price",
                                    return_policy: "$return_policy",
                                    meta_title: "$meta_title",
                                    meta_keywords: "$meta_keywords",
                                    meta_description: "$meta_description",
                                },
                            },
                        ];

                        const aggregation = await Product.aggregate(productResultPipeline);

                        const productResult = aggregation[0];
                        const productData = await Product.findOne({
                            _id: new mongoose.Types.ObjectId(item.product_id),
                        });
                        if (!productData) {
                            error = true;
                            return resp.status(400).json({ message: "Product not found." });
                        }
                        let currentQty = Number(productData?.qty);

                        if (item?.isCombination) {
                            productData.combinationData.forEach((element: any, index: any) => {
                                element.combinations.forEach((comb: any) => {
                                    let matchVariantAttrId: string[][] = item?.variant_attribute_id.map(
                                        (attrId: string) => [attrId]
                                    );

                                    if (item?.variant_attribute_id.length > 1) {
                                        for (let i = 0; i < item?.variant_attribute_id.length; i++) {
                                            for (let j = i + 1; j < item?.variant_attribute_id.length; j++) {
                                                matchVariantAttrId.push([
                                                    item?.variant_attribute_id[i],
                                                    item?.variant_attribute_id[j],
                                                ]);
                                            }
                                        }
                                    }
                                    matchVariantAttrId.forEach((attrId: any) => {
                                        const attrIdStr = attrId.toString();
                                        const attrIdArray = attrIdStr.split(",");

                                        const isMatch =
                                            comb.combIds.length === attrIdArray.length &&
                                            comb.combIds.every((id: string) => attrIdArray.includes(id));

                                        if (isMatch) {
                                            currentQty = comb.qty ? comb.qty : productData.qty;
                                        }
                                    });
                                });
                            });
                        }
                        const updatedQty = currentQty - Number(item?.qty);
                        let finalQty = updatedQty.toString();
                        const shippingAmount = (item.parentCartData?.vendor_data[0]?.perItem * item.qty) + (item.parentCartData?.vendor_data[0]?.perOrder / cartResult?.length);

                        const couponData = await couponCart.findOne({ vendor_id: req.body.vendor_id, user_id: req.user._id });
                        const couponDatas = couponData ? couponData : null;

                        if (couponDatas) {
                            const couponData = await CouponModel.findOne({
                                vendor_id: couponDatas.vendor_id
                            });

                            if (couponData?.discount_type && couponData?.discount_amount) {
                                const allowedProductIds = (couponData.product_id || []).map((id: any) =>
                                    id.toString()
                                );

                                const discountEligibleAmount = allowedProductIds.includes(item.product_id.toString()) ? Number(item.sale_price) * Number(item.qty) : 0;
                                const type = couponData.discount_type;
                                const value = Number(couponData.discount_amount);

                                discountAmount = type === "percentage" ? (discountEligibleAmount * value) / 100 : value;

                                discountAmount = Math.min(discountAmount, discountEligibleAmount);
                            }
                        }

                        const deliveryDataObj = {
                            vendor_id: item.parentCartData?.vendor_id || null,
                            shippingId: item.shipping_id || item.parentCartData?.shipping_id || null,
                            shippingName: item.parentCartData?.vendor_data?.[0]?.shippingName || null,
                            perItem: item.parentCartData?.vendor_data?.[0]?.perItem ?? 0,
                            perOrder: item.parentCartData?.vendor_data?.[0]?.perOrder ?? 0,
                            note: item.parentCartData?.vendor_data?.[0]?.note || "",
                            minDate: item.parentCartData?.vendor_data?.[0]?.minDate || null,
                            maxDate: item.parentCartData?.vendor_data?.[0]?.maxDate || null,
                            shippingTemplateData: item.parentCartData?.shippingData?.[0]?.shippingTemplateData || null,
                        };

                        const data: any = {
                            user_id: req.user._id,
                            vendor_id: productResult?.vendor_id,
                            vendor_name: productResult?.vendor_name,
                            sale_id: saleId,
                            order_id: orderId,
                            product_id: productResult?.product_id,
                            productData: productData ? productData : {},
                            qty: item?.qty,
                            isCombination: item?.isCombination,
                            customize: item?.customize,
                            customizationData: item?.customizationData,
                            sub_total: item?.sale_price * item?.qty,
                            amount: item?.sale_price * item?.qty,
                            variant_id: item?.variant_id,
                            variant_attribute_id: item?.variant_attribute_id,
                            affiliate_id: item.affiliate_id ? item.affiliate_id : null,
                            promotional_discount: item.original_price - item.sale_price,
                            shippingId: item.shipping_id,
                            shippingName: item.parentCartData?.vendor_data?.[0]?.shippingName,
                            shippingAmount: shippingAmount,
                            couponData: couponDatas,
                            couponDiscountAmount: discountAmount,
                            deliveryData: deliveryDataObj,
                            original_price: item.original_price
                        };

                        if (item?.isCombination) {
                            productData.combinationData.forEach((element: any, index: any) => {
                                element.combinations.forEach((comb: any, ind: any) => {
                                    let matchVariantAttrId: string[][] = item?.variant_attribute_id.map(
                                        (attrId: string) => [attrId]
                                    );

                                    if (item?.variant_attribute_id.length > 1) {
                                        for (let i = 0; i < item?.variant_attribute_id.length; i++) {
                                            for (let j = i + 1; j < item?.variant_attribute_id.length; j++) {
                                                matchVariantAttrId.push([
                                                    item?.variant_attribute_id[i],
                                                    item?.variant_attribute_id[j],
                                                ]);
                                            }
                                        }
                                    }

                                    matchVariantAttrId.forEach((attrId: any) => {
                                        const attrIdStr = attrId.toString();
                                        const attrIdArray = attrIdStr.split(",");

                                        const isMatch =
                                            comb.combIds.length === attrIdArray.length &&
                                            comb.combIds.every((id: string) => attrIdArray.includes(id));

                                        if (isMatch) {
                                            if (element.combinations[ind].qty == "") {
                                                productData.qty = finalQty;
                                            } else {
                                                element.combinations[ind].qty = finalQty;
                                            }
                                            productData.combinationData[index] = element;
                                        }
                                    });
                                });
                            });
                        } else {
                            productData.qty = finalQty;
                        }
                        await productData.save();

                        await Salesdetail.create(data);
                    })
                );
            }
            await Cart.deleteMany({ user_id: req.user._id, vendor_id: vendorId });
            await ParentCartModel.deleteMany(
                { user_id: req.user._id, vendor_id: vendorId },
                {
                    $pull: {
                        vendor_data: {
                            vendor_id: new mongoose.Types.ObjectId(vendorId),
                        },
                    },
                }
            );
            await couponCart.deleteOne({ user_id: req.user._id, vendor_id: vendorId });
            await CartCouponModel.deleteOne({ user_id: req.user._id });
            await CouponModel.updateOne(
                { coupon_code: couponCode },
                { $inc: { total_uses: 1 } }
            );

            if (req.body.wallet == "1" && couponCode == "") {
                const transactionHistorydata = {
                    user_id: req.user._id,
                    transaction_type: "Dr",
                    amount: usedWalletAmount,
                    description: "Used Amount for Shopping",
                };
                await User.updateOne(
                    { _id: req.user._id },
                    { $inc: { wallet_balance: -usedWalletAmount } }
                );
                await GiftCardTransactionHistoryModel.create(transactionHistorydata);
            }
            const updateUser = await User.findOne({ _id: req.user._id });
            return resp
                .status(200)
                .json({ message: "Checkout successfully", orderId: orderId, updateUser: updateUser });
        }
    } catch (error) {
        error = true;
        return resp
            .status(500)
            .json({ message: "Something went wrong. Please try again." });
    }
};

export const orderList = async (req: CustomRequest, resp: Response) => {
    try {
        const user_id = req.user._id;
        const startDate = req.query.startDate ? resp.locals.currentdate(req.query.startDate).startOf('day').toDate() : null;
        const endDate = req.query.endDate ? resp.locals.currentdate(req.query.endDate).endOf('day').toDate() : null;

        const offset = parseInt(req.query.offset as string) || 0;
        const limit = 10;

        let pipe: any[] = [];

        pipe.push(
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id)
                }
            },
            {
                $lookup: {
                    from: "salesdetails",
                    localField: "_id",
                    foreignField: "sale_id",
                    as: "saleDetaildata",
                    pipeline: [
                        {
                            $lookup: {
                                from: "variants",
                                localField: "variant_id",
                                foreignField: "_id",
                                as: "variantData"
                            }
                        },
                        {
                            $lookup: {
                                from: "variantattributes",
                                localField: "variant_attribute_id",
                                foreignField: "_id",
                                as: "variantAttributeData"
                            }
                        },
                        {
                            $lookup: {
                                from: "variantdetails",
                                localField: "variant_id",
                                foreignField: "variant_id",
                                as: "variantDetail"
                            }
                        },
                        {
                            $unwind: {
                                path: "$variantDetail",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: "vendordetails",
                                localField: "vendor_id",
                                foreignField: "user_id",
                                as: "vendorData"
                            }
                        },
                        {
                            $unwind: {
                                path: "$vendorData",
                                preserveNullAndEmptyArrays: true
                            }
                        }
                    ]
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
            }
        );

        if (startDate && endDate) {
            pipe.push({
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            });
        }

        pipe.push(
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
                    userName: "$userData.name",
                    userEmail: "$userData.email",
                    saleDetaildata: 1,
                    createdAt: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: offset
            },
            {
                $limit: limit
            }
        );

        const sales = await Sales.aggregate(pipe);
        const salesCount = await Sales.countDocuments({ user_id: user_id });
        const base_url = process.env.ASSET_URL + "/uploads/product/";
        const shop_base_url = process.env.ASSET_URL + "/uploads/shop-icon/";

        return resp.status(200).json({
            message: "Sales list fetched successfully.",
            sales,
            base_url,
            shop_base_url,
            salesCount
        });

    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
};

export const getOrderDetail = async (req: CustomRequest, resp: Response) => {

    try {
        const orderId = req.params.orderId;
        const sales = await Sales.findOne({ order_id: orderId, user_id: req.user._id });

        if (!sales) {
            return resp.status(400).json({ message: 'Invalid Order Id.' });
        }

        const pipeline: any = [
            {
                $match: {
                    sale_id: new mongoose.Types.ObjectId(sales._id)
                }
            },
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
            }
        ];

        const salesDetails = await SalesDetailsModel.aggregate(pipeline)

        const base_url = process.env.ASSET_URL + '/uploads/product/';
        const data = {
            ...sales.toJSON(),
            sales_details: salesDetails
        }

        return resp.status(200).json({ message: "Order details fetched successfully.", data, base_url });


    } catch (error: any) {
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
            error: error.message,
            data: []
        });
    }

}
function escapeRegexChars(searchStr: string) {
    return searchStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export const searchOrder = async (req: CustomRequest, resp: Response) => {
    try {
        const searchParams: any = req.query.searchParams;
        const escapedSearchParams = escapeRegexChars(searchParams);

        const pipeline: any[] = [
            {
                '$match': {
                    'user_id': req.user._id,
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
                '$match': {
                    '$or': [
                        { 'order_id': { $regex: escapedSearchParams, $options: 'i' } }, // Search by order_id
                        { 'saleDetaildata.productData.product_title': { $regex: escapedSearchParams, $options: 'i' } }, // Search by product_name
                    ]
                }
            },
            {
                '$group': {
                    '_id': '$order_id',
                    'user_id': { '$first': '$user_id' },
                    'order_id': { '$first': '$order_id' },
                    'createdAt': { '$first': '$createdAt' },
                    'saleDetaildata': { '$push': '$saleDetaildata' } // Group matching sales details
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'user_id': 1,
                    'order_id': 1,
                    'createdAt': 1,
                    'saleDetaildata': 1,
                }
            },
            {
                '$sort': {
                    'createdAt': -1
                }
            }
        ];

        const base_url = process.env.ASSET_URL + '/uploads/product/';
        let sales = [];

        if (searchParams) {
            sales = await Sales.aggregate(pipeline);
        }

        return resp.status(200).json({
            message: 'Orders retrieved successfully.',
            data: sales,
            base_url
        });
    } catch (error: any) {
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
            error: error.message,
            data: []
        });
    }
}

export const subOrderList = async (req: CustomRequest, resp: Response) => {
    try {
        const pipeline = [
            {
                '$match': {
                    'sale_id': new mongoose.Types.ObjectId(req.body.sale_id)
                }
            }, {
                '$lookup': {
                    'from': 'variantproducts',
                    'localField': 'product_id',
                    'foreignField': '_id',
                    'as': 'variantProductData'
                }
            }, {
                '$unwind': {
                    'path': '$variantProductData',
                    'preserveNullAndEmptyArrays': true
                }
            }
        ]
        const aggregation = await Salesdetail.aggregate(pipeline);
        if (aggregation.length === 0) {
            return resp.status(400).json({ message: 'Order not found.' })
        } else {
            return resp.status(200).json({ message: 'Order fetched successfully.', order: aggregation })
        }

    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}

export const userCancelOrder = async (req: CustomRequest, resp: Response) => {
    try {
        const usercancel_remark = req.body.usercancel_remark;
        const id = req.body.id;

        const query = { _id: id }
        const updateData = { $set: { order_status: '4', usercancel_remark: usercancel_remark } }
        await Salesdetail.updateOne(query, updateData);
        await activity(
            req.user._id,
            null,
            null,
            'user-cancel-order',
            'Order cancelled successfully with order ID: ' + id
        );
        resp.status(200).json({ message: 'Your order is cancelled successfully and your amount is credited in your account soon.' })

    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}

export const returnProduct = async (req: CustomRequest, resp: Response) => {
    try {
        const return_remark = req.body.return_remark;
        const id = req.body.id;

        const query = { _id: id }
        const updateData = { $set: { order_status: '4', return_remark: return_remark, return_status: 'Pending' } }
        await Salesdetail.updateOne(query, updateData);
        await activity(
            req.user._id,
            null,
            null,
            'return-product',
            'Return request sent successfully with order ID: ' + id
        );
        resp.status(200).json({ message: 'Return request sent successfully so please wait now till admin approval.' })

    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}

export const orderFeedback = async (req: CustomRequest, resp: Response) => {
    try {
        const comment = req.body.comment;
        const rating = req.body.rating;
        const product_id = req.body.product_id;
        const sale_id = req.body.sale_id;
        const existingComment = await Comment.findOne({ sale_id: sale_id });

        if (existingComment) {
            return resp.status(400).json({ message: 'You have already give the feedback.' })
        }

        await Comment.create({ user_id: req.user._id, product_id: product_id, sale_id: sale_id, rating: rating, comment: comment });
        resp.status(200).json({ message: 'Comment Added Successfully.' })

    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
}

export const getProfile = async (req: CustomRequest, resp: Response) => {

    try {
        const user = await User.findOne({ _id: req.user._id, designation_id: { $in: ['1', '4'] } });

        if (!user) {

            return resp.status(400).json({ message: 'Invalid User.' });

        }

        const country = await CountryModel.findOne({ _id: user.country_id });
        const state = await StateModel.findOne({ _id: user.state_id });
        const city = await CityModel.findOne({ _id: user.city_id });

        const userEmailData = await UserEmailModel.findOne({ user_id: user._id, status: { $in: ['Pending', 'Confirmed'] } }).sort({ _id: -1 });

        const image = user.image ? user.image : '';
        let baseUrl = '';

        if (image.includes("https")) {
            baseUrl = image
        } else if (image) {
            baseUrl = process.env.ASSET_URL + '/uploads/profileImage/' + image;
        }

        const data = {
            _id: user._id,
            name: user.name,
            email: user.email,
            email_verified: userEmailData ? userEmailData.status : 'Pending',
            phone_code: user.phone_code,
            mobile: user.mobile,
            profession: user.profession,
            dob: user.dob,
            image: baseUrl,
            gender: user.gender,
            country: country ? country.name : '',
            state: state ? state.name : '',
            city: city ? city.name : '',
            wallet_balance: user.wallet_balance,
            designation_id: user.designation_id,
            affiliate_code: user.affiliate_code ? user.affiliate_code : '',
            createdAt: resp.locals.currentdate(user.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
        }

        return resp.status(200).json({ message: 'Profile fetched successfully.', data });

    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getEmail = async (req: CustomRequest, resp: Response) => {

    try {
        const userEmailData = await UserEmailModel.findOne({
            user_id: req.user._id,
            status: { $in: ['Pending', 'Confirmed'] }
        }).sort({ _id: -1 });

        if (!userEmailData) {
            return resp.status(400).json({ message: 'Email not found.' });
        }
        const userEmailChangeCount = await UserEmailModel.countDocuments({ user_id: req.user._id, status: { $in: ['Pending', 'Confirmed'] } });

        let showButton = false;
        if (userEmailChangeCount > 1) {
            showButton = true;
        }
        const data = {
            email: userEmailData.email,
            status: userEmailData.status,
            showCancelButton: showButton
        }

        return resp.status(200).json({ message: 'User Email fetched successfully.', data });

    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const sendEmailVerificationLink = async (req: CustomRequest, resp: Response) => {
    try {

        const email = req.body.email
        const user_email = req.user.email;
        const user = await User.findOne({ email: user_email, designation_id: '1' });
        const verifyToken = crypto.randomBytes(20).toString('hex');
        const userEmailData = await UserEmailModel.findOne({ user_id: user?._id, email: user?.email });

        if (userEmailData) {
            userEmailData.verifyToken = verifyToken;
            await userEmailData.save();
        }

        if (!user) {
            return resp.status(400).json({ message: 'User not found' });
        }

        const templatePath = path.join(__dirname, '..', 'views', 'emailVerificationTemplate.ejs');
        const htmlContent = await ejs.renderFile(templatePath, {
            frontendUrl: process.env.FRONTEND_URL,
            resetToken: verifyToken
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
            html: htmlContent

        };

        try {
            await transporter.sendMail(mailOptions);
            return resp.status(200).json({ message: "Email sent Successfully.", user });
        } catch (mailError) {
            console.error('Error sending email:', mailError);
            return resp.status(500).json({ message: 'Failed to send email. Please try again later.' });
        }


    } catch (err) {
        resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const changeEmail = async (req: CustomRequest, resp: Response) => {
    try {

        const email = req.body.email;
        const confirm_email = req.body.confirm_email;
        const password = req.body.password;

        if (email !== confirm_email) {
            return resp.status(400).json({ message: 'Email and confirm email should be same.' });
        }

        const user = await User.findOne({ email: req.user.email, type: 'manual' });

        if (!user) {
            return resp.status(400).json({ message: 'Invalid Email.' });
        }

        bcrypt.compare(password, user.password, async (err, result) => {
            if (err) {
                return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
            }

            if (result) {
                const userEmailData = await UserEmailModel.findOne({
                    user_id: user._id,
                    status: 'Pending'
                }).sort({ _id: -1 });

                if (userEmailData) {
                    return resp.status(400).json({ message: 'You cannot change email. Please verify your email.' });
                }

                const verifyToken = crypto.randomBytes(20).toString('hex');

                const changeMailData = {
                    user_id: user._id,
                    email: req.body.email,
                    verifyToken: verifyToken
                }

                await UserEmailModel.create(changeMailData);

                const templatePath = path.join(__dirname, '..', 'views', 'emailVerificationTemplate.ejs');
                const htmlContent = await ejs.renderFile(templatePath, {
                    frontendUrl: process.env.FRONTEND_URL,
                    resetToken: verifyToken
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
                    to: req.body.email,
                    from: process.env.USEREMAIL_NAME,
                    subject: 'Email Verification',
                    html: htmlContent

                };

                try {
                    await transporter.sendMail(mailOptions);
                    return resp.status(200).json({ message: "Email changed Successfully. Please verify your email", user });
                } catch (mailError) {
                    console.error('Error sending email:', mailError);
                    return resp.status(500).json({ message: 'Failed to send email. Please try again later.' });
                }

            } else {
                resp.status(400).json({ message: 'Invalid Password' });
            }
        });

    } catch (err) {
        resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const cancelEmail = async (req: CustomRequest, resp: Response) => {
    try {

        const email = req.body.email;

        const userEmailData = await UserEmailModel.findOne({
            user_id: req.user._id,
            email: email,
        }).sort({ _id: -1 });

        if (!userEmailData) {
            return resp.status(400).json({ message: 'Invalid Email.' });
        }

        userEmailData.status = 'Failed';
        userEmailData.verifyToken = '';
        await userEmailData.save();

        return resp.status(200).json({ message: 'Email cancelled successfully.' });

    } catch (err) {
        resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const updateProfile = async (req: CustomRequest, resp: Response) => {

    try {
        const user = await User.findOne({ _id: req.user._id, designation_id: "1" });

        if (!user) {
            return resp.status(400).json({ message: 'Invalid User.' });
        }

        const { email, mobile, name, dob, phone_code } = req.body;

        // if (email !== user.email) {
        //     const emailExists = await User.findOne({ email: email });
        //     if (emailExists) {
        //         return resp.status(400).json({ message: 'Email already exists' });
        //     }
        // }

        // if (mobile !== user.mobile) {
        //     const mobileExists = await User.findOne({ mobile: mobile });
        //     if (mobileExists) {
        //         return resp.status(400).json({ message: 'Mobile number already exists' });
        //     }
        // }

        user.name = name;
        user.dob = dob;
        user.email = email;
        user.mobile = mobile;
        user.phone_code = phone_code;
        user.country_id = req.body.country_id;
        user.state_id = req.body.state_id;
        user.city_id = req.body.city_id;
        user.gender = req.body.gender;
        user.occupation = req.body.occupation;
        user.profession = req.body.profession;
        await user.save();

        return resp.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};


export const updateProfileImage = async (req: CustomRequest, resp: Response) => {
    try {
        const user = await User.findOne({ _id: req.user._id, designation_id: "1" });
        if (!user) {
            return resp.status(400).json({ message: 'Invalid User.' });
        }

        // Check if a file is provided
        if (!req.file) {
            return resp.status(400).json({ message: 'Profile image is required' });
        }

        // Validate file type
        if (!req.file.mimetype.startsWith('image/')) {
            return resp.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
        }

        const ext = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;

        const uploadsDir = path.join('uploads', 'profileImage');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const destinationPath = path.join(uploadsDir, fileName);

        await convertToWebP(req.file.buffer, destinationPath);
        // Delete the old image if it exists
        if (user.image) {
            const oldImagePath = path.join('uploads', 'profileImage', user.image);
            if (fs.existsSync(oldImagePath)) {
                await fs.promises.unlink(oldImagePath);
            }
        }

        user.image = fileName;
        await user.save();

        return resp.status(200).json({ message: 'Profile image updated successfully.' });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const uploadProfileImage = async (req: CustomRequest, resp: Response) => {
    try {

        if (!req.file) {
            return resp.status(400).json({ message: 'Profile image is required' });
        }

        const categoryImageFile = req.file;
        const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        if (!validImageTypes.includes(categoryImageFile.mimetype)) {
            return resp.status(400).json({ message: 'Invalid file type. Only .jpg, .gif, .png are allowed.' });
        }
        if (categoryImageFile.size > 10 * 1024 * 1024) {
            return resp.status(400).json({ message: 'File size must be smaller than 10 MB.' });
        }
        let fileName = (Date.now() + '-' + Math.round(Math.random() * 1E9)) + '.webp';
        const uploadDir = path.join('uploads/profileImage');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const destinationPath = path.join(uploadDir, fileName);

        await convertToWebP(categoryImageFile.buffer, destinationPath)
        const query = { _id: req.user._id };
        const updateData = { $set: { image: fileName } };
        await User.updateOne(query, updateData);

        return resp.status(200).json({ message: 'Image uploaded and converted to WebP successfully.' });

    } catch (err) {
        console.error('Error during image upload:', err);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const changePassword = async (req: CustomRequest, resp: Response) => {
    try {
        const oldPassword = req.body.oldPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;
        const user = await User.findOne({ _id: req.user._id });

        if (!user) {
            return resp.status(400).json({ message: 'Invalid User.' });
        }

        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return resp.status(400).json({ message: 'Old password is incorrect.' });
        }

        if (newPassword !== confirmPassword) {
            return resp.status(400).json({ message: 'New password and confirm password does not match.' });
        }
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return resp.status(400).json({ message: 'Old password does not match.' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.multipleTokens = [];
        await user.save();
        await activity(
            req.user._id,
            null,
            null,
            'reset-password',
            'User changed password successfully',
        );
        return resp.status(200).json({ status: true, message: 'Password changed successfully.' });
    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getWishlist = async (req: CustomRequest, resp: Response) => {
    try {
        const user = req.user._id
        let pipeline: any = [
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user)
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product_id",
                    pipeline: [
                        {
                            $project: {
                                product_title: 1,
                                sku_code: 1,
                                qty: 1,
                                image: 1,
                                combinationData: 1,
                                isCombination: 1,
                                price: 1,
                                original_price: 1,
                                vendor_id: 1,
                                sale_price: 1,
                                customize: 1,
                                customizationData: 1,
                                product_bedge: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$product_id",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "variants",
                    localField: "variant_id",
                    foreignField: "_id",
                    as: "variantDetails",
                },
            },
            {
                $lookup: {
                    from: "variantattributes",
                    localField: "variant_attribute_id",
                    foreignField: "_id",
                    as: "variantAttributeDetails",
                },
            },
        ]
        let wishlist = await wishlistModel.aggregate(pipeline)

        let base_url = process.env.ASSET_URL + '/uploads/product/';
        return resp.status(200).json({ message: 'Fetched successfully.', wishlist, base_url });
    }
    catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addDeleteWishlist = async (req: CustomRequest, resp: Response) => {
    try {
        const user = req.user._id
        const { product_id, price, original_price, isCombination, variant_id, variant_attribute_id } = req.body;
        let wishlist = await wishlistModel.findOne({ user_id: user, product_id: product_id, isCombination: isCombination, variant_id: variant_id, variant_attribute_id: variant_attribute_id, price: price, original_price: original_price })
        if (wishlist) {
            await wishlistModel.findOneAndDelete({ user_id: user, product_id: product_id, isCombination: isCombination, variant_id: variant_id, variant_attribute_id: variant_attribute_id, price: price, original_price: original_price })
        }
        else {
            await wishlistModel.create({ user_id: user, product_id: product_id, isCombination: isCombination, variant_id: variant_id, variant_attribute_id: variant_attribute_id, price: price, original_price: original_price })
        }
        const productData = await ProductModel.findOne({ _id: product_id });
        await activity(
            req.user._id,
            req.body.product_id,
            null,
            'Wishlist',
            `${wishlist ? 'Deleted' : 'Added'} product to wishlist`,
        );
        await vandorAndProductActivity(
            req.user._id,
            req.body.product_id,
            null,
            "product",
            "wishlist",
            `${wishlist ? 'Deleted' : 'Added'} product to wishlist`,
        )
        return resp.status(200).json({ message: 'Data added successfully..' });
    }
    catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addViewedProducts = async (req: CustomRequest, resp: Response) => {
    try {
        const data: any = {
            user_id: req.user._id,
            product_id: req.body.product_id
        }
        const vendor = await ProductModel.findOne({ _id: data.product_id });
        data.vendor_id = vendor?.vendor_id

        const userView = await UserProductViewModel.findOne(data);
        if (!userView) {
            await UserProductViewModel.create(data);
        }

        return resp.status(200).json({
            message: 'Product viewed successfully.',
        });

    } catch (error: any) {
        return resp.status(500).json({
            message: 'Error fetching product.',
            error: error.message,
            data: []
        });
    }
};

export const recentlyViewedProducts = async (req: CustomRequest, resp: Response) => {
    try {
        const data = await UserProductViewModel.find({ user_id: req.user._id });

        const productIds = data.map((item) => item.product_id);

        const products = await ProductModel.find({ _id: { $in: productIds } }).populate('vendor_id')
            .populate('category')
            .populate('brand_id')
            .populate('variant_id')
            .populate('variant_attribute_id');

        let base_url = process.env.ASSET_URL + '/uploads/product/';

        return resp.status(200).json({
            message: 'Product fetched successfully.',
            data: products,
            base_url
        });

    } catch (error: any) {
        return resp.status(500).json({
            message: 'Error fetching product.',
            error: error.message,
            data: []
        });
    }
};

export const becauseViewedProducts = async (req: CustomRequest, resp: Response) => {
    try {

        const data = await UserProductViewModel.find({ user_id: req.user._id });

        const productIds = data.map((item) => item.product_id);

        const products = await ProductModel.find({ _id: { $in: productIds } }).select('search_terms');

        const uniqueSearchTerms = [
            ...new Set(products.flatMap((item: any) => item.search_terms))
        ];

        const productData = await ProductModel.find({ search_terms: { $in: uniqueSearchTerms }, _id: { $nin: productIds } });
        let base_url = process.env.ASSET_URL + '/uploads/product/';

        return resp.status(200).json({
            message: 'Product fetched successfully.',
            productData: productData,
            base_url
        })

    } catch (error: any) {
        return resp.status(500).json({
            message: 'Error fetching product.',
            error: error.message,
            data: []
        });
    }
};

export const getCartDetails = async (req: CustomRequest, resp: Response) => {
    try {
        let errorMessage;

        const pipeline = [
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(req.user._id),
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product_data",
                },
            },
            {
                $unwind: {
                    path: "$product_data",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "parentcarts",
                    localField: "vendor_id",
                    foreignField: "vendor_id",
                    pipeline: [
                        {
                            $match: {
                                user_id: new mongoose.Types.ObjectId(req.user._id),
                            },
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "vendor_id",
                                foreignField: "_id",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: "vendordetails",
                                            localField: "_id",
                                            foreignField: "user_id",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        shop_name: 1,
                                                    },
                                                },
                                            ],
                                            as: "vendorprofile",
                                        },
                                    },
                                ],
                                as: "vendorDetails",
                            },
                        },
                        {
                            $lookup: {
                                from: "shippings",
                                localField: "shipping_id",
                                foreignField: "_id",
                                as: "shippingData",
                            },
                        },
                    ],
                    as: "parentCartData",
                },
            },
            {
                $unwind: {
                    path: "$parentCartData",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    qty: 1,
                    product_id: 1,
                    vendor_id: 1,
                    delivery_amount: "$product_data.delivery_amount",
                    delivery: "$product_data.delivery_type",
                    sale_price: "$price",
                    offer_price: "$offer_price",
                    discount_type: "$product_data.discount_type",
                    discount_amount: "$product_data.discount_amount",
                    parentCartData: 1,
                },
            },
        ];

        const cartResult = await Cart.aggregate(pipeline);

        let subTotal = 0;
        let discount = 0;
        let netAmount = 0;
        let delivery = 0;
        let discountAmount = 0;
        let usedWalletAmount = 0;
        let voucherDiscount = Number(req.query.voucher_discount) || 0;
        let parentCartData: any = {};

        const cartCoupons = await couponCart.find({ user_id: req.user._id });

        let addressData = { country: "India" };
        if (req.query.address_id && mongoose.Types.ObjectId.isValid(req.query.address_id.toString())) {
            const addressQuery = await Address.findOne({ _id: new mongoose.Types.ObjectId(req.query.address_id.toString()) });
            if (addressQuery) {
                addressData = addressQuery;
            }
        }

        if (!addressData?.country) {
            return resp.status(400).json({
                status: false,
                message: "User selected address country not found.",
            });
        }

        await Promise.all(cartResult.map(async (item) => {
            const offerPrice = getOfferProductPrice(item.sale_price, item.discount_type, item.discount_amount);
            const shippingAmount = item.delivery_amount;

            subTotal += item.sale_price * item.qty;
            discount += (item.sale_price - offerPrice) * item.qty;

            const shippingName = item.parentCartData?.vendor_data?.[0]?.shippingName;
            const shippingTemplateData = item.parentCartData?.shippingData?.[0]?.shippingTemplateData;

            const shippingOptions = {
                standardShipping: shippingTemplateData?.standardShipping,
                expedited: shippingTemplateData?.expedited,
                twoDays: shippingTemplateData?.twoDays,
                oneDay: shippingTemplateData?.oneDay,
            };

            const selectedShipping = shippingOptions[shippingName as keyof typeof shippingOptions] || [];
            let perOrderFee = 0;

            for (const option of selectedShipping) {
                if (option?.region?.includes(addressData?.country)) {
                    delivery += (option?.shippingFee?.perItem || 0) * item.qty;
                    perOrderFee = option?.shippingFee?.perOrder || 0;
                    break;
                }
            }

            const parentCartVendorData = item.parentCartData;
            if (parentCartVendorData?.vendor_data?.[0]) {
                parentCartVendorData.vendor_data[0].perOrder = parseFloat(perOrderFee.toString());
                parentCartData[parentCartVendorData.vendor_id] = parentCartVendorData;
            }
        }));

        for (const vendorId in parentCartData) {
            const data = parentCartData[vendorId];

            if (data.vendor_data[0]?.perOrder <= 0) {
                errorMessage = `${data.vendorDetails[0].vendorprofile[0].shop_name} doesn't allow the delivery for your selected address country`;
            }

            delivery += data.vendor_data[0]?.perOrder;
        }

        // ✅ Apply accurate coupon discount logic
        if (cartCoupons?.length > 0) {
            for (const coupon of cartCoupons) {
                const couponData = await CouponModel.findOne({
                    vendor_id: coupon?.vendor_id
                });

                if (!couponData) continue;

                const eligibleProductIds = (couponData.product_id || []).map((id: any) => id.toString());
                const vendorCartItems = cartResult.filter(
                    (item) => item.vendor_id.toString() === coupon?.vendor_id.toString()
                );
                const eligibleAmount = vendorCartItems.reduce((sum, item) => {
                    return eligibleProductIds.includes(item.product_id.toString())
                        ? sum + Number(item.sale_price) * Number(item.qty)
                        : sum;
                }, 0);

                let vendorDiscount = 0;

                if (couponData.discount_type === "percentage") {
                    vendorDiscount = (eligibleAmount * couponData.discount_amount) / 100;
                } else {
                    vendorDiscount = couponData.discount_amount;
                }

                discountAmount += Math.min(vendorDiscount, eligibleAmount);
            }
        }

        netAmount = subTotal - discountAmount - voucherDiscount + delivery;

        if (req.query.wallet === "1") {
            const user = await User.findOne({ _id: req.user._id });
            const walletBalance = user?.wallet_balance || 0;

            if (walletBalance > netAmount) {
                usedWalletAmount = netAmount;
                netAmount = 0;
            } else {
                usedWalletAmount = walletBalance;
                netAmount -= walletBalance;
            }
        }

        const data = {
            subTotal,
            couponDiscount: discountAmount,
            discount,
            voucherDiscount,
            delivery,
            netAmount,
            walletAmount: usedWalletAmount,
        };

        if (errorMessage) {
            return resp.status(200).json({
                status: false,
                message: errorMessage,
                data,
                cartResult,
            });
        }

        return resp.status(200).json({
            status: true,
            message: "Cart details fetched successfully.",
            data,
            cartResult,
        });
    } catch (error: any) {
        return resp.status(500).json({
            message: "Error fetching Cart Details.",
            error: error.message,
            data: [],
        });
    }
};

export const getVendorCartDetails = async (req: CustomRequest, resp: Response) => {
    try {
        let errorMessage;
        const vendor_id = req.params.id;
        const pipeline = [
            {
                $match: {
                    'user_id': new mongoose.Types.ObjectId(req.user._id),
                    'vendor_id': new mongoose.Types.ObjectId(vendor_id)
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product_data"
                }
            },
            {
                $unwind: {
                    path: "$product_data",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "parentcarts",
                    localField: "vendor_id",
                    foreignField: "vendor_id",
                    pipeline: [
                        {
                            $match: {
                                user_id: new mongoose.Types.ObjectId(req.user._id)
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'vendor_id',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: 'vendordetails',
                                            localField: "_id",
                                            foreignField: "user_id",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        shop_name: 1
                                                    }
                                                }
                                            ],
                                            as: 'vendorprofile'
                                        }
                                    }
                                ],
                                as: 'vendorDetails'
                            }
                        },
                        {
                            $lookup: {
                                from: "shippings",
                                localField: "shipping_id",
                                foreignField: "_id",
                                as: "shippingData"
                            }
                        }
                    ],
                    as: "parentCartData"
                }
            },
            {
                $unwind: {
                    path: "$parentCartData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    qty: 1,
                    product_id: 1,
                    vendor_id: 1,
                    delivery_amount:
                        "$product_data.delivery_amount",
                    delivery:
                        "$product_data.delivery_type",
                    sale_price: "$price",
                    offer_price: "$offer_price",
                    discount_type: "$product_data.discount_type",
                    discount_amount: "$product_data.discount_amount",
                    parentCartData: 1
                    // parentCartData: {
                    //     $cond: {
                    //         if: { $isArray: "$parentCartData.vendor_data" },
                    //         then: "$parentCartData.vendor_data",
                    //         else: []
                    //     }
                    // }

                }
            }
        ]


        const cartResult = await Cart.aggregate(pipeline);
        // return resp.status(200).json({ message: 'Cart fetched successfully.', cartResult });
        let subTotal = 0;
        let totalShipping = 0;
        let discount = 0;
        let netAmount = 0;
        let delivery = 0;
        let discountAmount = 0;
        let usedWalletAmount = 0;
        let parentCartData: any = {};

        // if (cartResult.length !== 0) {

        const cartCoupon = await couponCart.find({ user_id: req.user._id });

        let addressData;
        if (req.query.address_id && mongoose.Types.ObjectId.isValid((req.query.address_id).toString())) {

            addressData = await Address.findOne({ _id: new mongoose.Types.ObjectId((req.query.address_id).toString()) });
        }

        if (!addressData || (addressData && addressData?.country === "")) {

            return resp.status(400).json({
                status: false,
                message: 'User selected address country not found.'
            });

        }

        await Promise.all(cartResult.map(async (item) => {
            const offerPrice = getOfferProductPrice(item.sale_price, item.discount_type, item.discount_amount);
            const shippingAmount = item.delivery_amount;
            subTotal += item.sale_price * item.qty;

            if (item.delivery === 'paid') {
                totalShipping += shippingAmount * item.qty;
            }

            discount += (item.sale_price - offerPrice) * item.qty;

            const shippingName = item.parentCartData?.vendor_data?.[0]?.shippingName;
            const shippingTemplateData = item.parentCartData?.shippingData?.[0]?.shippingTemplateData;
            const shippingOptions = {
                standardShipping: shippingTemplateData?.standardShipping,
                expedited: shippingTemplateData?.expedited,
                twoDays: shippingTemplateData?.twoDays,
                oneDay: shippingTemplateData?.oneDay,
            };

            const selectedShipping = shippingOptions[shippingName as keyof typeof shippingOptions] || [];

            let perOrderFee = 0;
            for (const option of selectedShipping) {
                if (option?.region?.includes(addressData?.country)) {
                    if (item.parentCartData) {
                        delivery += (option?.shippingFee?.perItem || 0) * item.qty;
                        perOrderFee = (option?.shippingFee?.perOrder || 0)
                    }
                    break; // exit after first match
                }
            }

            const parentCartVendorData = item.parentCartData;
            parentCartVendorData.vendor_data[0].perOrder = parseFloat(perOrderFee.toString());
            parentCartData[parentCartVendorData.vendor_id] = parentCartVendorData;
        }));


        for (const vendorId in parentCartData) {
            const data = parentCartData[vendorId];


            if (data.vendor_data[0]?.perOrder <= 0) {

                errorMessage = `${data.vendorDetails[0].vendorprofile[0].shop_name} doesn't allow the delivery for your selected address country`;

            }
            delivery += data.vendor_data[0]?.perOrder;
        }

        netAmount = subTotal;

        // const couponDoc = await CouponModel.findOne({ vendor_id: req.params.id });

        // if (couponDoc) {
        //     if (couponDoc.discount_type == 'percentage') {
        //         discountAmount = (netAmount * couponDoc.discount_amount) / 100;
        //     } else {
        //         discountAmount = Number(couponDoc.discount_amount);
        //     }
        // }
        const appliedCoupon = await CouponCartModel.findOne({
        user_id: req.user._id,
        vendor_id: req.params.id
        });

       if (appliedCoupon?.coupon_data?.discount_amount) {
         discountAmount = appliedCoupon.coupon_data.discount_amount;
        }




        netAmount = netAmount - discountAmount;

        if (req.query.wallet == '1') {
            const user = await User.findOne({ _id: req.user._id });
            let walletAmount = 0;
            if (user) {
                walletAmount = user.wallet_balance;
                if (walletAmount > netAmount) {
                    usedWalletAmount = netAmount;
                    netAmount = 0;
                } else if (walletAmount < netAmount) {
                    usedWalletAmount = walletAmount;
                    netAmount -= walletAmount;
                }
            }
        }

        // } else {
        //     return resp.status(200).json({ message: 'No items in your cart.' })
        // }

        netAmount += totalShipping;
        netAmount += delivery;

        const data = {
            subTotal: subTotal,
            couponDiscount: discountAmount,
            discount: discount,
            delivery: delivery,
            netAmount: netAmount,
            walletAmount: usedWalletAmount
        }

        if (errorMessage) {

            return resp.status(200).json({ status: false, message: errorMessage, data })
        } else {
            return resp.status(200).json({ status: true, message: "Cart details fetched successfully.", data })
        }

    } catch (error: any) {
        return resp.status(500).json({
            message: 'Error fetching Cart Details.',
            error: error.message,
            data: []
        });
    }
}

export const getOrderDetailsById = async (req: CustomRequest, resp: Response) => {
    try {
        const orderId = req.params.orderId;
        const sales = await Sales.findOne({ order_id: orderId, user_id: req.user._id });

        if (!sales) {
            return resp.status(400).json({ message: 'Invalid Order Id.' });
        }

        const salesDetails = await SalesDetailsModel.find({ sale_id: sales._id, order_status: { $in: ['new', 'unshipped'] } }).populate('product_id', 'product_title image').populate('variant_id').populate('variant_attribute_id');
        const base_url = process.env.ASSET_URL + '/uploads/product/';
        const data = {
            ...sales.toJSON(),
            sales_details: salesDetails
        }

        return resp.status(200).json({ message: "Order details fetched successfully.", data, base_url });


    } catch (error: any) {
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
            error: error.message,
            data: []
        });
    }
}

export const sendRating = async (req: CustomRequest, resp: Response) => {
    try {
        const delivery_rating = req.body.delivery_rating;
        const item_rating = req.body.item_rating;
        const additional_comment = req.body.additional_comment;
        const recommended = req.body.recommended;
        const saleDetailId = req.body.saleDetailId;
        const vendor_id = req.body.vendor_id;

        const saleDetailData = await SalesDetailsModel.findOne({ _id: saleDetailId });
        if (!saleDetailData) {
            return resp.status(400).json({ message: 'Invalid Sale Detail Id.' });
        }

        const checkExistRating = await RatingModel.findOne({ user_id: req.user._id, saledetail_id: saleDetailId });
        if (checkExistRating) {
            return resp.status(400).json({ message: 'Already rated.' });
        }

        const data = {
            delivery_rating: delivery_rating,
            item_rating: item_rating,
            additional_comment: additional_comment,
            recommended: recommended,
            saledetail_id: saleDetailId,
            user_id: req.user._id,
            product_id: saleDetailData.product_id,
            vendor_id: vendor_id
        }
        saleDetailData.ratingStatus = true;

        await saleDetailData.save();
        await RatingModel.create(data);

        return resp.status(200).json({ message: "Rating sent successfully." });

    } catch (error: any) {
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
            error: error.message,
            data: []
        });
    }
}

export const followVendor = async (req: CustomRequest, resp: Response) => {
    try {
        const user = req.user._id;
        const vendorId = req.body.vendorId
        let follow = await followModel.findOne({ user_id: user, vendor_id: vendorId })
        if (follow) {
            await followModel.findOneAndDelete({ user_id: user, vendor_id: vendorId })
        }
        else {
            await followModel.create({ user_id: user, vendor_id: vendorId })
        }
        await activity(
            req.user._id,
            null,
            req.body.vendorId,
            'follow',
            follow ? 'Unfollow' : 'Follow' + ' vendor',
        )
        await vandorAndProductActivity(
            req.user._id,
            null,
            req.body.vendorId,
            "vendor",
            "follow",
            `${follow ? 'Unfollowed' : 'Followed'} vendor`,
        )
        return resp.status(200).json({ message: 'Vendor followed successfully.' });
    }
    catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getFollowVendor = async (req: CustomRequest, resp: Response) => {
    try {
        const user = req.user._id;
        let follow = await followModel.find({ user_id: user })
        const data = await Promise.all(follow.map(async (item) => {
            const vendor = await User.findOne({ _id: item.vendor_id });
            const shop = await VendorModel.findOne({ user_id: vendor?._id });
            let base_url = process.env.ASSET_URL + '/uploads/shop-icon/';
            return {
                ...item.toJSON(),
                vendor_name: vendor?.name,
                slug: shop?.slug,
                shop_icon: shop?.shop_icon ? base_url + shop?.shop_icon : null
            }

        }))
        return resp.status(200).json({ message: 'Followed Vendor fetched successfully.', data: data });
    }
    catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const sendMessageID = async (req: CustomRequest, resp: Response) => {
    try {
        const user = req.user._id;
        const message_id = req.body.message_id;
        const alreadyExistMessage = await MessageModel.findOne({ user_id: user });
        const data = {
            user_id: user,
            message_id: message_id
        }

        if (alreadyExistMessage) {
            await MessageModel.findByIdAndUpdate(alreadyExistMessage._id, data);
        }

        const senderMessage = await MessageModel.create(data);

        return resp.status(200).json({ message: "Added successfully.", senderMessage });
    }
    catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getMessageId = async (req: CustomRequest, resp: Response) => {
    try {
        const user = req.user._id;
        let senderMessage: any = [];
        const data = await MessageModel.findOne({ user_id: user }).populate('user_id', 'name email mobile');
        if (data != null) {
            senderMessage = data
        }
        return resp.status(200).json({ message: "Message fetched successfully.", senderMessage });
    }
    catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const purchaseGiftCard = async (req: CustomRequest, resp: Response) => {
    const {
        gift_card_id,
        amount,
        email,
        name,
        message,
        qty,
        delivery_date,
    } = req.body;
    const user_id = req.user._id;

    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const date = String(currentDate.getDate()).padStart(2, '0');
        let hours = currentDate.getHours();
        let minutes = currentDate.getMinutes();
        let milliseconds = currentDate.getMilliseconds();

        const orderId = `gord${year}${month}${date}${hours}${minutes}${milliseconds}`;
        let gift_code = await generateUniqueGiftCode();
        const giftCard = await GiftCardModel.findOne({ _id: gift_card_id }) as any;
        const purchaseGiftCardInstance = new PurchaseGiftCardModel({
            user_id,
            amount,
            email,
            gift_code: gift_code,
            gift_card_id,
            name,
            message,
            qty,
            delivery_date,
            orderId: orderId,
            expiry_date: moment(delivery_date).add(giftCard.validity, 'days').format('YYYY-MM-DD HH:mm:ss'),
        });

        let giftCardData = await GiftCardModel.findOne({ _id: gift_card_id });
        await purchaseGiftCardInstance.save();

        if (resp.locals.currentdate(delivery_date).format('YYYY-MM-DD') == resp.locals.currentdate().format('YYYY-MM-DD')) {
            const subject = "Gift Card Code";
            const expiryDateFormatted = moment(delivery_date).add(giftCardData?.validity, 'days').format('DD-MMM-YYYY');

            const body = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                
                <div style="text-align: center;">
                    <h1 style="color: #4CAF50; font-size: 22px; margin-bottom: 5px;">You've Received a Gift Card!</h1>
                    <p style="font-size: 13px; color: #777; margin-bottom: 20px;">Enjoy exclusive benefits and discounts using this card.</p>
                </div>

                <div style="border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
                    <img src="${process.env.ASSET_URL}/uploads/giftcard-images/${giftCardData?.image}" 
                        alt="Gift Card" 
                        style="width: 100%;height: auto; border-radius: 10px; border: 1px solid #ddd; margin-bottom: 10px;" />

                    <h2 style="text-align:center; font-size: 20px; margin: 10px 0;">${message}</h2>

                    <table width="100%" style="margin-top: 10px; font-size: 14px;">
                        <tr>
                            <td style="font-weight: bold;">₹ ${purchaseGiftCardInstance.amount}</td>
                            <td align="right" style="color: #777;font-weight:bold">Agukart gift card</td>
                        </tr>
                    </table>

                    <p style="font-size: 12px; color: #555; margin-top: 8px;">Expiry Date: ${expiryDateFormatted}</p>
                </div>

                <div style="text-align:center; margin: 25px 0;">
                    <p style="font-size: 13px; margin-bottom: 10px;">Use the code below during checkout on <strong>Agukart.com</strong></p>
                    <div style="font-size: 16px; font-weight: bold; background: #eee; padding: 10px 20px; border: 1px dashed #333; display: inline-block; border-radius: 5px;">${gift_code}</div>
                </div>

                <div style="padding: 15px; background-color: #f5f5f5; border-radius: 8px; margin-bottom: 20px;">
                    <p style="font-size: 13px; margin: 8px 0;"><strong>Amount:</strong> ₹${purchaseGiftCardInstance.amount}</p>
                    <p style="font-size: 13px; margin: 8px 0;"><strong>Order ID:</strong> ${purchaseGiftCardInstance.orderId}</p>
                    <p style="font-size: 13px; margin: 8px 0;"><strong>Valid Until:</strong> ${giftCardData?.validity} days</p>
                </div>

                <p style="text-align: center; color: #aaa; font-size: 12px;">Thank you for choosing us. Happy gifting!</p>
            </div>
            `;

            const user = await User.findOne({ _id: user_id });
            if (!user) {
                return resp.status(400).json({ message: 'User not found' });
            }
            await sendToEmail(email, subject, body, user.email);
        }

        await activity(
            req.user._id,
            null,
            null,
            'gift-card',
            'Purchased a Gift Card',
        );

        return resp.status(200).json({
            message: 'Gift card purchased successfully',
            giftCard: purchaseGiftCardInstance,
        });

    } catch (error) {
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
        });
    }
};

export const resendMailForGiftCardCode = async (req: CustomRequest, resp: Response) => {

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

export const redeemGiftCard = async (req: CustomRequest, res: Response) => {
    try {
        const { gift_code } = req.body;
        const user_id = req.user._id;
        const purchase_gift = await PurchaseGiftCardModel.findOne({ gift_code: gift_code, isRedeemed: "0" });

        if (!purchase_gift) {
            return res.status(404).json({ message: 'Gift card not found.' });
        }
        const gift_card = await GiftCardModel.findById(purchase_gift.gift_card_id);
        if (!gift_card) {
            return res.status(404).json({ message: 'Gift card details not found' });
        }

        const user: any = await User.findById(user_id);
        user.wallet_balance += purchase_gift.amount;
        await user.save();
        await PurchaseGiftCardModel.updateOne({ _id: purchase_gift._id }, { isRedeemed: "1", redeemedAt: new Date() });

        const transaction = new GiftCardTransactionHistoryModel({
            user_id,
            purchase_gift_id: purchase_gift._id,
            transaction_type: 'Cr',
            amount: purchase_gift.amount,
            description: gift_card.title,
            gift_card_image: gift_card.image,
        });
        await transaction.save();
        await activity(
            req.user._id,
            null,
            null,
            'radeem-gift-card',
            'Redeemed a Gift Card',
        )
        return res.status(200).json({
            message: 'Gift card redeemed successfully and wallet updated',
            user: user,
            transaction: transaction
        });
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const listUserGiftCardTransactions = async (req: CustomRequest, res: Response) => {
    try {
        const user_id = req.user._id;
        const type = req.params.type;
        const base_url = `${process.env.ASSET_URL}/uploads/giftcard-images/`;

        let data: any = [];
        if (type === "redeemed") {
            const transactions = await GiftCardTransactionHistoryModel.find({ user_id: user_id }).sort({ _id: -1 });

            data = transactions.map((transaction) => {
                const giftTransaction = transaction.toObject();
                const GiftCardTransaction = {
                    _id: giftTransaction._id,
                    user_id: giftTransaction.user_id,
                    transaction_type: giftTransaction.transaction_type,
                    amount: giftTransaction.amount,
                    description: giftTransaction.description,
                    createdAt: moment(giftTransaction.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                    gift_card_image: giftTransaction.gift_card_image
                        ? `${base_url}${giftTransaction.gift_card_image}`
                        : '',
                };
                return GiftCardTransaction;
            });
        }

        if (type === "purchased") {
            const transactions = await PurchaseGiftCardModel.find({ user_id: user_id }).sort({ _id: -1 }).populate('gift_card_id');

            data = transactions.map((transaction) => {
                const purchaseTransaction = transaction.toObject();
                const giftCard = purchaseTransaction.gift_card_id as any;
                const purchaseGiftCardTransaction = {
                    _id: purchaseTransaction._id,
                    orderId: purchaseTransaction.orderId,
                    user_id: purchaseTransaction.user_id,
                    transaction_type: 'Dr',
                    amount: purchaseTransaction.amount,
                    description: giftCard.title,
                    gift_card_image: giftCard.image
                        ? `${base_url}${giftCard.image}`
                        : '',
                    isRedeemed: purchaseTransaction.isRedeemed,
                    delivery_date: purchaseTransaction.delivery_date ? moment(purchaseTransaction.delivery_date).format('YYYY-MM-DD HH:mm:ss') : null,
                    redeemedAt: purchaseTransaction.redeemedAt ? moment(purchaseTransaction.redeemedAt).format('YYYY-MM-DD HH:mm:ss') : null,
                    createdAt: moment(purchaseTransaction.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                    expiryDate: moment(purchaseTransaction.delivery_date).add(giftCard.validity, 'days').format('YYYY-MM-DD HH:mm:ss'),
                };
                return purchaseGiftCardTransaction;
            });

        }

        if (type == "admin") {
            const transactions = await transactionModel.find({ user_id: user_id }).sort({ _id: -1 });
            data = transactions.map((transaction) => {
                const giftTransaction = transaction.toObject();
                const GiftCardTransaction = {
                    _id: giftTransaction._id,
                    user_id: giftTransaction.user_id,
                    transaction_type: giftTransaction.transaction_type,
                    amount: giftTransaction.amount,
                    transaction_id: giftTransaction.transaction_id,
                    createdAt: moment(giftTransaction.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                };
                return GiftCardTransaction;
            });
        }

        return res.status(200).json({ message: 'Transactions fetched successfully for user', transactions: data });
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const checkCouponForProduct = async (req: CustomRequest, resp: Response) => {
    try {
        let userStatus = 'all';
        const userData = await User.findOne({ _id: req.user._id });

        if (userData) {
            const sales = await Sales.find({ user_id: req.user._id });
            if (sales.length > 0) {
                userStatus = 'old user';
            } else {
                userStatus = 'new user';
            }
        }

        const { coupon_code, vendor_id } = req.body;

        if (!coupon_code) {
            return resp.status(400).json({ message: 'Coupon code is required' });
        }

        const pipiline = [
            {
                $match: {
                    vendor_id: new mongoose.Types.ObjectId(vendor_id),
                    coupon_code: coupon_code,
                    start_date: { $lte: new Date() },
                    expiry_date: { $gte: new Date() },
                    status: true,
                }
            }
        ]
        const coupon = await CouponModel.aggregate(pipiline);

        if (!coupon || coupon.length === 0) {
            return resp.status(400).json({ message: 'Coupon not applicable.' });
        }

        const couponData = coupon[0];

        if (couponData.no_of_times > 0) {
            if (couponData.no_of_times <= couponData.total_uses) {
                return resp.status(400).json({ message: 'Coupon not applicable.' });
            }
        }

        if (couponData.valid_for != 'all') {
            if (userStatus != couponData.valid_for) {
                return resp.status(400).json({ message: 'Coupon not applicable for your account.' });
            }
        }

        const cartData = await Cart.find({ vendor_id: vendor_id, user_id: req.user._id });

        const cartIds = cartData.map((item) => String(item._id));

        const product_ids = cartData.map((item) => String(item.product_id));
        const couponProductId = couponData.product_id.map((id: any) => String(id));

        const matchingProductIds = product_ids.filter((productId) =>
            couponProductId.includes(productId)
        );

        if (matchingProductIds.length > 0) {
            const productPromises = matchingProductIds.map((productId) => Product.findById(productId));
            const products = await Promise.all(productPromises);
            const promotionalAmount = await getPromotionAmount(req, resp);

            let couponAmount = 0;
            matchingProductIds.forEach(async (productId, index) => {
                const cartItem = cartData.find((item) => String(item.product_id) === productId && String(item._id) === cartIds[index]);
                const productData = products[index];
                const productPrice = (Number(cartItem?.price) * Number(cartItem?.qty)) || 0;
                let finalPrice = productPrice - (promotionalAmount || 0);
                if (cartItem) {
                    if (couponData.discount_type === 'percentage') {
                        couponAmount += (couponData.discount_amount) * cartItem.qty;
                    } else {

                        if (finalPrice > couponData.discount_amount) {
                            couponAmount += couponData.discount_amount;
                        } else {
                            couponAmount += finalPrice;
                        }
                    }

                    if (couponAmount > couponData.max_discount) {

                        couponAmount = couponData.max_discount;
                    }

                }
            });

            const existingCoupon = await couponCart.findOne({ user_id: req.user._id, vendor_id: vendor_id });

            if (existingCoupon) {
                return {
                    message: 'Already applied',
                    existingCoupon,
                    couponAmount
                }
            }

            await couponCart.create(
                {
                    user_id: req.user._id, vendor_id: vendor_id,
                    coupon_data: {
                        coupon_code: couponData.coupon_code,
                        discount_amount: couponAmount,
                    }
                }
            );

            return resp.status(200).json({ message: 'Coupon applied successfully.', couponAmount });
        } else {
            return resp.status(400).json({ message: 'Coupon not applicable for these products.' });
        }
    } catch (error: any) {
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
        });
    }
};


export const removeCouponForProduct = async (req: CustomRequest, resp: Response) => {
    try {

        const { coupon_code, vendor_id } = req.body;

        if (!coupon_code) {
            return resp.status(400).json({ message: 'Coupon code is required' });
        }

        const coupon = await couponCart.findOneAndDelete(
            { user_id: req.user._id, vendor_id: req.body.vendor_id }

        );
        return resp.status(200).json({ message: 'Coupon removed successfully.' });

    } catch (error: any) {
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
        });
    }
};

export const getPromotionAmount = async (req: CustomRequest, resp: Response) => {
    try {
        const user_id = req.user._id;
        const userObjectId = new mongoose.Types.ObjectId(user_id);

        const pipeline: any = [
            {
                $match: {
                    user_id: userObjectId,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "productData",
                },
            },
            {
                $unwind: {
                    path: "$productData",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "productData.vendor_id",
                    foreignField: "_id",
                    as: "vendorData",
                },
            },
            {
                $unwind: {
                    path: "$vendorData",
                    preserveNullAndEmptyArrays: true,
                },
            }, {
                $lookup: {
                    from: "vendordetails",
                    localField: "vendorData._id",
                    foreignField: "user_id",
                    as: "vendorDetails",
                },
            },
            {
                $unwind: {
                    path: "$vendorDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: {
                        vendor_id: "$productData.vendor_id",
                    },
                    vendorItems: {
                        $push: {
                            cart_id: "$_id",
                            qty: "$qty",
                            product_id: "$product_id",
                            price: "$price",
                            product_image: "$productData.image",
                            product_name: "$productData.product_title",
                            sale_price: "$productData.sale_price",
                            discount_amount: "$productData.discount_amount",
                            short_description: "$productData.description",
                            stock: "$productData.stock",
                            slug: "$productData.slug",
                            delivery_amount: "$productData.delivery_amount",
                            delivery: "$productData.delivery_type",
                        },
                    },
                    vendorCoupon: { $first: "$vendorCoupon" },
                },
            },
            {
                $sort: {
                    "_id.vendor_id": 1,
                },
            },
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$vendorItems",
                            as: "item",
                            in: {
                                cart_id: "$$item.cart_id",
                                qty: "$$item.qty",
                                product_id: "$$item.product_id",
                                product_name: "$$item.product_name",
                                sale_price: "$$item.sale_price",
                                slug: "$$item.slug",
                                price: "$$item.price",
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    vendor_id: "$_id.vendor_id",
                    products: 1,
                },
            },
        ];

        const cartResult = await CartModel.aggregate(pipeline);

        let promoAmount = 0;

        await Promise.all(
            cartResult.map(async (item: any) => {
                const productIds = item.products.map((product: any) => product.product_id);

                const promotionalData = await PromotionalOfferModel.find({
                    vendor_id: item.vendor_id,
                    status: true,
                    product_id: { $in: productIds },
                    start_date: { $lte: new Date() },
                    expiry_date: { $gte: new Date() },
                });

                await Promise.all(
                    promotionalData.map(async (promo: any) => {

                        const cartData = await Cart.aggregate([
                            {
                                $match: {
                                    product_id: { $in: promo.product_id },
                                    user_id: req.user._id,
                                },
                            },
                            {
                                $lookup: {
                                    from: "products",
                                    localField: "product_id",
                                    foreignField: "_id",
                                    as: "productData",
                                },
                            },
                            {
                                $unwind: {
                                    path: "$productData",
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalSum: { $sum: { $multiply: ["$price", "$qty"] } },
                                    totalQty: { $sum: "$qty" },
                                },
                            },
                        ]);

                        cartData.forEach((item) => {

                            if (item.totalQty >= promo.qty) {
                                if (promo.offer_type == 'percentage') {
                                    promoAmount += (item.totalSum * promo.discount_amount) / 100;
                                } else if (promo.offer_type == 'flat') {
                                    promoAmount += (promo.discount_amount < item.totalSum ? promo.discount_amount : item.totalSum);
                                }
                            }
                        });

                    })
                );
            })
        );

        return promoAmount;


    } catch (error) {

    }
}

export const logout = async (req: CustomRequest, resp: Response) => {

    try {
        await LoginHistoryModel.findOneAndUpdate({ ip_address: req.ip, user_id: req.user._id }, { $set: { logout_time: new Date() } });
        await User.updateOne({ _id: req.user._id }, { $set: { auth_key: '' }, $pull: { multipleTokens: { token: req.token } } });
        await activity(
            req.user._id,
            null,
            null,
            'logout',
            `User with name ${req.user.name} logged out`
        );
        return resp.status(200).json({ message: 'Logout successfully.' });
    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const addParentCart = async (req: CustomRequest, resp: Response) => {
    try {
        const { vendor_data, note } = req.body;
        const user_id = req.user._id;

        const cartData = await ParentCartModel.findOne({ user_id: user_id, vendor_id: new mongoose.Types.ObjectId(vendor_data.vendor_id) });

        vendor_data.note = note;

        if (cartData) {
            const existingVendorIndex = cartData.vendor_data.findIndex(
                (v: any) => v.vendor_id.toString() === vendor_data.vendor_id.toString()
            );

            if (existingVendorIndex !== -1) {
                cartData.vendor_data[existingVendorIndex] = vendor_data;
            } else {
                cartData.vendor_data.push(vendor_data);
            }

            if (vendor_data?.shipping_id) {

                cartData.shipping_id = new mongoose.Types.ObjectId(vendor_data.shipping_id);
            }

            await cartData.save();
            return resp.status(200).json({ message: 'Cart updated successfully.' });
        } else {
            await ParentCartModel.create({ user_id: user_id, vendor_id: new mongoose.Types.ObjectId(vendor_data.vendor_id), shipping_id: new mongoose.Types.ObjectId(vendor_data.shipping_id), vendor_data: [vendor_data] });
            return resp.status(200).json({ message: 'Cart created successfully.' });
        }
    } catch (error) {
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const saveNote = async (req: CustomRequest, resp: Response) => {
    try {
        const { vendor_id, note, product_id } = req.body;
        const user_id = req.user._id;

        const buyerNote = await BuyerNoteModel.create({
            user_id,
            vendor_id,
            product_id,
            buyer_note: note
        });

        return resp.status(200).json({ message: 'Buyer note saved successfully.', buyerNote });

    } catch (error) {
        console.error(error);
        return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

export const getUserOrders = async (req: CustomRequest, resp: Response) => {
    try {
        const user_id = req.user._id;

        const orders = await SalesModel.find({ user_id: new mongoose.Types.ObjectId(user_id) });

        const followedShops = await followModel.find({ user_id: new mongoose.Types.ObjectId(user_id) });

        const wishlist = await wishlistModel.find({ user_id: new mongoose.Types.ObjectId(user_id) });

        return resp.status(200).json({
            totalorders: orders?.length,
            followedShops: followedShops?.length,
            wishlist: wishlist?.length
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ success: false, message: 'Internal server error.' });
    }
}


export const createReport = async (req: CustomRequest, resp: Response) => {
    try {
        const { type, reporttype } = req.body;

        if (!type || !reporttype) {
            return resp.status(400).json({ error: 'type and reporttype are required' });
        }

        const user_id = req.user._id;

        const now = moment();
        const random = Math.floor(1000 + Math.random() * 9000);
        const report_id = `REP${now.format('DDMMYYYY')}${random}`;

        const reportData = {
            ...req.body,
            report_id,
            user_id,
        };

        const report = await ReportModel.create(reportData);

        resp.status(200).json({
            success: true,
            message: 'Report created successfully',
            report_id: report.report_id,
            report
        });

    } catch (err: any) {
        console.error(err);
        resp.status(500).json({ error: err.message || 'Internal server error' });
    }
};

export const verifyToken = async (req: Request, resp: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '').trim();

        if (!token) {
            return resp.status(400).json({ success: false, message: 'Authorization token is required.' });
        }

        const user = await User.findOne({ 'multipleTokens.token': token });

        if (!user) {
            return resp.status(404).json({ success: false, message: 'Token not found or invalid.' });
        }

        return resp.status(200).json({ success: true, message: 'Token verified successfully.', user });
    } catch (err: any) {
        console.error('Error verifying token:', err);
        return resp.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

export const checkVoucherForProduct = async (req: CustomRequest, resp: Response) => {
    try {
        let userStatus = 'all';
        const userData = await User.findOne({ _id: req.user._id });

        if (userData) {
            const sales = await Sales.find({ user_id: req.user._id });
            if (sales.length > 0) {
                userStatus = 'old user';
            } else {
                userStatus = 'new user';
            }
        }

        const { voucher_code } = req.body;

        if (!voucher_code) {
            return resp.status(400).json({ message: 'Voucher code is required' });
        }

        const voucher = await voucherModel.findOne({ claim_code: voucher_code });

        if (!voucher) {
            return resp.status(404).json({ message: 'Voucher not found' });
        }

        if (voucher.type_of_users !== 'all' && voucher.type_of_users !== userStatus) {
            return resp.status(400).json({ message: 'Voucher is not valid for you' });
        }

        const currentDate = moment().utc();

        if (voucher.startDate && currentDate.isBefore(moment(voucher.startDate))) {
            return resp.status(400).json({ message: 'Voucher is not yet valid' });
        }

        if (voucher.endDate && currentDate.isAfter(moment(voucher.endDate))) {
            return resp.status(400).json({ message: 'Voucher has expired' });
        }

        if (!voucher.status) {
            return resp.status(400).json({ message: 'Voucher is no longer active' });
        }

        let userCartData = await CartModel.find({ user_id: req.user._id });

        if (!userCartData || userCartData.length === 0) {
            return resp.status(400).json({ message: 'User cart not found or empty' });
        }

        const productIdsInCart = userCartData.flatMap((cartItem: any) => cartItem.product_id);

        const vendorInCart = userCartData.flatMap((cartItem: any) => cartItem.vendor_id);

        const cartTotal = userCartData.reduce((total: number, item: any) => total + item.price * item.qty, 0);

        let discount = 0;

        if (voucher.type === 'product') {
            const products = await ProductModel.find({ '_id': { $in: productIdsInCart } });
            if (voucher.wiseType === 'all') {
                const excludedProducts = products.filter((product: any) =>
                    voucher.product_skus.includes(product.sku_code)
                );

                if (excludedProducts.length > 0) {
                    return resp.status(400).json({ message: 'Voucher cannot be applied to certain products in your cart' });
                }

            } else if (voucher.wiseType === 'select wise') {
                const eligibleProducts = products.filter((product: any) =>
                    voucher.product_skus.includes(product.sku_code)
                );

                if (eligibleProducts.length === 0) {
                    return resp.status(400).json({ message: 'No eligible products in your cart for this voucher' });
                }
            }

            const discountAmount = voucher.discount_amount;
            if (voucher.discount_type === 'percentage') {
                discount = (cartTotal * discountAmount) / 100;
                if (voucher.max_amount && discount > voucher.max_amount) {
                    discount = voucher.max_amount;
                }
            } else if (voucher.discount_type === 'flat') {
                discount = discountAmount;
                if (voucher.max_amount && discount > voucher.max_amount) {
                    discount = voucher.max_amount;
                }
            }
        }

        if (voucher.type == "shop") {
            const stores = await VendorModel.find({ 'user_id': { $in: vendorInCart } });
            if (voucher.wiseType === 'all') {
                const excludedStores = stores.filter((store: any) =>
                    voucher.shop_ids.includes(store.user_id)
                );

                if (excludedStores.length > 0) {
                    return resp.status(400).json({ message: 'Voucher cannot be applied to certain stores in your cart' });
                }

            } else if (voucher.wiseType === 'select wise') {
                const eligibleStores = stores.filter((store: any) =>
                    voucher.shop_ids.includes(store.user_id)
                );

                if (eligibleStores.length === 0) {
                    return resp.status(400).json({ message: 'No eligible stores in your cart for this voucher' });
                }
            }

            const discountAmount = voucher.discount_amount;
            if (voucher.discount_type === 'percentage') {
                discount = (cartTotal * discountAmount) / 100;
                if (voucher.max_amount && discount > voucher.max_amount) {
                    discount = voucher.max_amount;
                }
            } else if (voucher.discount_type === 'flat') {
                discount = discountAmount;
                if (voucher.max_amount && discount > voucher.max_amount) {
                    discount = voucher.max_amount;
                }
            }
        }

        const pipeline: any = [
            {
                $lookup: {
                    from: "salesdetails",
                    localField: "_id",
                    foreignField: "sale_id",
                    as: "salesdata",
                    pipeline: [
                        {
                            $match: {
                                order_status: {
                                    $ne: "cancelled",
                                },
                            },
                        },
                    ],
                },
            },
            {
                $match: {
                    salesdata: {
                        $ne: [],
                    },
                },
            },
        ]

        let checkTotalLimitOfVoucher = await Sales.aggregate(pipeline);

        // if (voucher.voucher_limit < checkTotalLimitOfVoucher.length) {
        //     return resp.status(400).json({ message: 'Voucher limit reached' });
        // }

        let hasVoucherBeenUsed = 0;

        if (checkTotalLimitOfVoucher.length > 0) {
            checkTotalLimitOfVoucher.forEach((usage: any) => {
                if (usage.user_id === req.user._id) {
                    hasVoucherBeenUsed++;
                }
            });
        }

        if (voucher.usage_limits >= checkTotalLimitOfVoucher.length) {
            return resp.status(400).json({ message: 'You have already used this voucher' });
        }

        return resp.status(200).json({
            message: 'Voucher is valid for you',
            discount: discount,
            voucherDetails: voucher
        });

    } catch (error: any) {
        return resp.status(500).json({
            message: 'Something went wrong. Please try again.',
        });
    }
};


