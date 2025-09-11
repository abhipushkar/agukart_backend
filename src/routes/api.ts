import express from "express"; 
import auth from '../middleware/auth';

import user from '../routes/user';
import admin from '../routes/admin.auth';
import {
    login,
    socialLogin,
    getCategoryList,
    getProductList,
    getVariantSlug,
    registration,
    getSlider,
    searchProduct,
    searchProductList,
    getCountry,
    getAllState,
    getCityById,
    getProductById,
    sendPasswordResetEmail,
    resetPassword,
    adminSendPasswordResetEmail,
    adminResetPassword,
    getBlog,
    blogList,
    getBrands,
    getAdminCategory,
    getProductBySlug,
    getPopularGiftProducts,
    bigDiscountProducts,
    bestsellerCategory,
    bestRatedProduct,
    getDeals,
    topRatedCategory,
    getAdminMenuCategory,
    getRecommendedBlog,
    blogTagsList,
    getInformations,
    getAdminSubcategory,
    verifyEmail,
    getCategoryBySlug,
    getAdminCategoryBySlug,
    getUserDetails,
    getVendorDetails,
    getVendorDetailsBySlug,
    getVendorProductsBySlug,
    getVendorCategoryBySlug,
    getAllCategoryWithGiftCards,
    getGiftCard,
    addaffiliateUser,
    mailCronJob,
    getGiftCardByCategoryId,
    subscribe,
    getBanner,
    getGiftCardDescription,
    getProductByVendorIdandStoreId,
    getStorebyVendorId,
    getBlockedCountry,
    getParticularVendorReviews,
    changeStatusOfMail,
    getLocationByIP,
    getDescription,
    increaseProductVisitCount,
    increaseGiftCardVisitCount,
    getShopDetail,
    getSimilarProduct,
    getSimilarVendorProduct
} from "../controllers/Prelogin";

import {
    adminLogin
} from "../controllers/admin/Prelogin";

import { 
    vendorRegister,
} from "../controllers/vendor/Prelogin";

import validationMiddleware from "../utils/multivalidate";
import { otpsend, validateSignup, validateState, validateCity, validateInformation, validateDescription } from "../validators/validators";
import { loginValid } from "../validators/adminvalidators";
import adminAuth from "../middleware/adminauth";

const routes=express.Router();
  
// Common user routes
routes.post('/login', login)
routes.post('/send-passaword-reset-link', sendPasswordResetEmail)
routes.post('/reset-password', resetPassword)
routes.get('/verify-email', verifyEmail)
routes.post('/social-login', socialLogin)
routes.post('/registraion', validationMiddleware(validateSignup), registration)
routes.get('/get-category', getCategoryList)
routes.get('/top-rated-category', topRatedCategory)
routes.post('/get-admin-category', getAdminCategory)
routes.get('/get-admin-menu-category', getAdminMenuCategory)
routes.post('/getAdminSubcategory', getAdminSubcategory)
routes.get('/getProductBySlug/:slug', getProductBySlug)
routes.get('/getPopularGiftProducts', getPopularGiftProducts)
routes.get('/bigDiscountProducts', bigDiscountProducts)
routes.get('/get-slider',getSlider)
routes.get('/search-product', searchProduct)  
routes.get('/search-product-list', searchProductList)  
routes.get('/get-product', getProductList)  
routes.get('/get-blog-by-slug/:slug', getBlog);
routes.get('/get-recommended-blog/:slug', getRecommendedBlog);
routes.get('/get-blog-tags', blogTagsList);
routes.post('/get-blog', blogList);
routes.get('/get-productById', getProductById)
routes.get('/get-similar-product', getSimilarProduct);
routes.get('/get-similar-vendor-product', getSimilarVendorProduct);
routes.get('/bestsellerCategory', bestsellerCategory)
routes.get('/bestRatedProduct', bestRatedProduct)
routes.get('/get-variant-slug', getVariantSlug)
routes.post('/get-brands', getBrands)
routes.get('/get-deals', getDeals)
routes.get('/get-country', getCountry); 
routes.post('/get-states', validationMiddleware(validateState),getAllState);
routes.post('/get-city-by-id',validationMiddleware(validateCity),getCityById)
routes.post('/get-informations',validationMiddleware(validateInformation), getInformations);
routes.post('/get-description',validationMiddleware(validateDescription), getDescription)

routes.get('/get-category-by-slug/:slug', getCategoryBySlug);
routes.get('/get-admin-category-by-slug/:slug', getAdminCategoryBySlug);
routes.get('/getVendorDetailsBySlug/:slug', getVendorDetailsBySlug);
routes.get('/vendor-reviews/:vendor_id', getParticularVendorReviews);
routes.get('/getVendorProductsBySlug/:slug', getVendorProductsBySlug);
routes.get('/getVendorCategoryBySlug/:slug', getVendorCategoryBySlug);

// Common admin routes
routes.post('/admin-login', validationMiddleware(loginValid), adminLogin)
routes.post('/admin-send-passaword-reset-link', adminSendPasswordResetEmail)
routes.post('/admin-reset-password', resetPassword)
routes.post('/getUserDetails', getUserDetails)
routes.post('/getVendorDetails', getVendorDetails)

// Common vendor routes
routes.post('vendor/register',vendorRegister)


routes.get('/get-all-category-with-gift-card',getAllCategoryWithGiftCards)
routes.get('/getGiftCardByCategoryId/:id', getGiftCardByCategoryId)
routes.get('/get-gift-card/:id', getGiftCard)

//affiliate user
routes.post('/register-affiliate-user',addaffiliateUser)

routes.get('/cron-job',mailCronJob)

routes.post('/subscribe', subscribe)
routes.get('/changeMailStatus', changeStatusOfMail);
routes.get('/getBanners', getBanner)
routes.get('/getGiftCardDescription',getGiftCardDescription);

routes.get('/get-store-by-vendor-id/:vendorId', getStorebyVendorId)
routes.post('/get-product-by-vendor-id',getProductByVendorIdandStoreId)

routes.get('/get-blocked-country', getBlockedCountry)

routes.get('/get-country-by-ip', getLocationByIP)

routes.post('/increase-vist-count', increaseProductVisitCount);

routes.post('/increase-gift-card-visit-count', increaseGiftCardVisitCount);

routes.get('/get-shop-detail', getShopDetail);

routes.use('/user',auth, user);
routes.use('/admin', adminAuth, admin);

export default routes;

