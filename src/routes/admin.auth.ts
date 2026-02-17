import express from "express";
import multer from 'multer';

import {
    addCategory,
    categoryList,
    categoryChangeStatus,
    deleteCategory,
    getCategory,
    addBrand,
    brandList,
    brandChangeStatus,
    deleteBrand,
    getBrand,
    addVariant,
    variantList,
    variantChangeStatus,
    deleteVariant,
    getVariant,
    addVariantAttribute,
    variantAttributeList,
    variantAttributeChangeStatus,
    deleteVariantAttribute,
    getVariantAttribute,
    getAllActiveVariant,
    addProduct,
    uploadProductVideo,
    getAllActiveCategory,
    getProductList,
    productChangeStatus,
    deleteProduct,
    editProduct,
    changeTopRatedStatus,
    changeFeaturedStatus,
    getVariantDataByCategoryId,
    addVariantProduct,
    uploadImages,
    getVariantProductList,
    variantProductChangeStatus,
    deleteVariantProduct,
    editVariantProductByID,
    salesList,
    salesDetail,
    updateOrderStatus,
    orderReady,
    returnApprove,
    addCategoryImage,
    changePassword,
    addBrandImage,
    userList,
    getUserDetail,
    updateProfile,
    getProfile,
    getCategoryList,
    addSlider,
    sliderList,
    changeStatus,
    deleteSlider,
    getSlider,
    updateUserStatus,
    getAllActiveBrands,
    addOccasion,
    uploadOccassionImage,
    occassionList,
    deleteOccassion,
    occassionChangeStatus,
    getOccasion,
    getAllActiveOccassion,
    getParentCategory,
    getAdminParentcategory,
    variantCategoryChangeStatus,
    variantProductStatus,
    getChildCategory,
    addParentProduct,
    uploadDescImages,
    addParentProductImage,
    updateProductByField,
    fetchParentProduct,
    addBlog,
    uploadBlogImage,
    blogList,
    blogChangeStatus,
    blogFeaturedStatus,
    deleteBlog,
    getBlog,
    addBlogTag,
    tagBlogList,
    tagBlogChangeStatus,
    getTagBlog,
    getActiveTags,
    addAdminCategory,
    uploadAdminCategoryImage,
    adminCategoryList,
    adminCategoryChangeStatus,
    getAdminCategory,
    brandFeaturedChangeStatus,
    adminCategoryPopular,
    adminCategorySpecial,
    getAllSearchTerms,
    addDeal,
    getDeal,
    topRatedChangeStatus,
    changeAdminCategoryMenuStatus,
    getActiveAdminCategory,
    getInformation,
    updateInformation,
    addVendor,
    addVendorProfile,
    getVendor,
    getVendorById,
    changeVendorStatus,
    getProductBySku,
    orderHistory,
    getOrderInvoice,
    getAllActiveVendor,
    getRatingByType,
    getAllVendorProduct,
    changeRatingStatus,
    addShopIcon,
    uploadShopVideo,
    addShopPhotos,
    updateProductQuantity,
    addCoupon,
    getCoupon,
    deleteCoupon,
    changeCouponStatus,
    listCoupons,
    addPromotion,
    getPromotion,
    deletePromotion,
    changePromotionStatus,
    listPromotions,
    addGiftCard,
    listGiftCards,
    getGiftCard,
    changeGiftCardStatus,
    deleteGiftCard,
    uploadGiftCardImage,
    addGiftCardCategory,
    getGiftCardCategory,
    changeGiftCardCategoryStatus,
    deleteGiftCardCategory,
    listGiftCardCategories,
    uploadGiftCardCategoryImage,
    listActiveGiftCardCategories,
    getAffiliateUser,
    getAffiliateUserById,
    changeAffiliateUserStatus,
    updateAffiliateUser,
    getAffiliateReport,
    getAffiliateReportById,
    addShippingTemplate,
    getShippingTemplate,
    getShippingTemplateById,
    setDefaultTemplate,
    deleteShippingTemplate,
    getAllShippingTemplate,
    getSubscribeData,
    addBanner,
    bannerList,
    changeBannerStatus,
    deleteBanner,
    getBanner,
    addGiftCardDescription,
    getGiftCardDescription,
    addPolicy,
    getPolicy,
    policyChangeStatus,
    deletePolicy,
    getActivePolicy,
    policyList,
    sendMailToSubscribers,
    logout,
    changeBestSellerProduct,
    changePopularGiftProduct,
    addStoreSetting,
    getStoreSettings,
    storeSettingChangeStatus,
    deleteStoreSetting,
    getStoreSettingById,
    getGiftCardPurchaseHistory,
    resendMailForGiftCardCodeByAdmin,
    getProductByVendor,
    createStore,
    updateStore,
    deleteStore,
    getStore,
    getStoreById,
    updateStoreStatus,
    countryBlocked,
    getOrderHistory,
    getBlockedCountry,
    getStoreReport,
    getProductReport,
    getSingleReportById,
    extandGiftCardExpiryDate,
    setProductBedge,
    copySameProduct,
    addDraftProduct,
    addWalletBalanceByAdmin,
    updateUserProfile,
    resetPassword,
    getFavouriteProducts,
    getOrderHistorys,
    getDashboarData,
    getTopSellingProductbyMonth,
    generateToken,
    addDescription,
    getDescription,
    getSalesDataByMonthYear,
    getTopSalesByVendorAdmin,
    getTopSalesCountByVendorAdmin,
    getActivities,
    getProductAndVendorActivities,
    getSalesTrafficReport,
    getShopSaleReport,
    allChildProductDetails,
    getAllUsers,
    getAllCustomers,
    getGiftCards,
    changeProductSortOrder,
    addVoucher,
    getVouchers,
    changeVoucherStatus,
    deleteVoucher,
    getVoucherById,
    saveSalerNote,
    getOrderHistory2,
    getReviews,
    getFavoriteProducts,
    getUserDashboardData,
    createAttributeList,
    getAttributeList,
    getAttributeListById,
    updateAttributeList,
    deleteAttributeList,
    getAttributeListByCategoryId,
    deletedByAdmin,
    getCategoryFullDetails,
    deleteShopBanner,
    addShopBanner,
    getShopBanner,
    getRefundContext,
    refundSuborder,
    cancelSuborder,
    bulkChangeShippingTemplate,
    createUrlResource,
    getUrlList,
    getPublicPage,
    getUrlById,
    deleteUrlResource
} from "../controllers/admin/Postlogin";


import validationMiddleware from "../utils/multivalidate";
import { loginValid, createStoreValid, updateStoreValid, updateStoreStatusValid, categoryValid, statusValid, validateChangePassword, brandValid, validateProfile, informationValid, vendorValid } from "../validators/adminvalidators";
import { upload } from "../middleware/fileupload";

const routes = express.Router();
routes.post('/change-password', validationMiddleware(validateChangePassword), changePassword)
routes.get('/get-profile', getProfile)
routes.post('/update-profile', validationMiddleware(validateProfile), updateProfile)
routes.get('/logout', logout)

//slider API's
routes.post('/add-slider', multer().single('file'), addSlider)
routes.get('/get-slider', sliderList)
routes.post('/update-slider-status', changeStatus)
routes.delete('/delete-slider/:id', deleteSlider)
routes.get('/edit-slider/:id', getSlider);

//Category API's
routes.post('/add-category', validationMiddleware(categoryValid), addCategory)
routes.post('/add-category-image', multer().fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), addCategoryImage);
routes.get('/get-category', categoryList)
routes.post('/change-status-category', validationMiddleware(statusValid), categoryChangeStatus);
routes.post('/change-toprated-status-category', topRatedChangeStatus);
routes.delete('/delete-category/:id', deleteCategory);
routes.get('/edit-category/:id', getCategory);

//User Module API's
routes.get('/user-list', userList)
routes.get('/get-user-by-id/:id', getUserDetail)
routes.post('/update-user-status/:id', updateUserStatus)

// Brand API's
routes.post('/add-brand', validationMiddleware(brandValid), addBrand)
routes.post('/add-brand-image', multer().single('file'), addBrandImage);
routes.get('/get-brand', brandList)
routes.post('/change-status-brand', brandChangeStatus);
routes.post('/change-featured-status-brand', brandFeaturedChangeStatus);
routes.delete('/delete-brand/:id', deleteBrand);
routes.get('/edit-brand/:id', getBrand);

// Variant API's
routes.post('/add-variant',  (req, res, next) => {
    (req as any).filepath = 'variant';
    next();
  },  upload.any(), addVariant)
routes.get('/get-variant', variantList)
routes.post('/change-status-variant', variantChangeStatus);
routes.post('/change-status-variant-category', variantCategoryChangeStatus);
routes.post('/change-status-variant-product', variantProductStatus);
routes.delete('/delete-variant/:id', deleteVariant);
routes.get('/edit-variant/:id', getVariant);
routes.get('/get-variant-by-category/:id', getVariantDataByCategoryId);
routes.get('/get-attributeList-by-category/:id', getAttributeListByCategoryId);

// Variant Attribute API's
routes.get('/get-all-active-variants', getAllActiveVariant)

routes.post('/add-variant-attribute', addVariantAttribute);
routes.get('/get-variant-attribute', variantAttributeList)
routes.post('/change-status-variant-attribute', variantAttributeChangeStatus);
routes.delete('/delete-variant-attribute/:id', deleteVariantAttribute);
routes.get('/edit-variant-attribute/:id', getVariantAttribute);

// Variant Attribute API's
routes.get('/get-all-active-category', getAllActiveCategory);
routes.post('/category-full-detail', getCategoryFullDetails);
routes.get('/get-parent-category', getParentCategory)
routes.get('/get-admin-parent-category', getAdminParentcategory)
routes.get('/get-child-category', getChildCategory)

// Attribute List API's
routes.post('/create-attribute-list', createAttributeList);
routes.get('/get-attribute-list', getAttributeList);
routes.get('/get-attribute-detail/:id', getAttributeListById);
routes.post('/update-attribute-list/:id', updateAttributeList);
routes.delete('/delete-attribute-list/:id', deleteAttributeList);

// URL apis
routes.post("/createUrl", (req: any, res, next) => {
  req.filepath = "url";
  next();
}, upload.single("file"), createUrlResource);
routes.get("/url-list", getUrlList);
routes.get("/url-page/:slug", getPublicPage);
routes.get("/url-page-by-id/:id", getUrlById);
routes.delete("/delete-url/:id", deleteUrlResource);

// Product API's
routes.post('/update-product-by-field', updateProductByField )
routes.post(
  '/add-product',
  (req, res, next) => {
    (req as any).filepath = 'product';
    next();
  },
  upload.any(), addProduct);

routes.post('/upload-product-video', uploadProductVideo);
routes.get('/get-active-occassion', getAllActiveOccassion);
routes.post('/add-product-images', uploadImages);
routes.post('/add-description-images', uploadDescImages);
routes.get('/get-product', getProductList)
routes.get('/get-active-brands', getAllActiveBrands)
routes.post('/change-status-product', productChangeStatus);
routes.post('/change-product-sort-order', changeProductSortOrder)
routes.post('/changeBestSellerProduct', changeBestSellerProduct);
routes.post('/changePopularGiftProduct', changePopularGiftProduct);
routes.get('/delete-product/:id', deleteProduct);
routes.put('/deleted-by-admin/:id', deletedByAdmin);
routes.get('/edit-product/:id', editProduct);
routes.post('/copy-same-product', copySameProduct);
routes.post('/getActivePolicy', getActivePolicy)

//  top rated product API's
routes.post("/change-top-rated-status", changeTopRatedStatus);

// featured product API's
routes.post("/change-featured-status", changeFeaturedStatus);

// routes.get('/get-variant-by-product/:id', getVariantProductDataById)
routes.post('/add-variant-product', addVariantProduct)
routes.get('/get-variant-product/:id', getVariantProductList)
routes.post('/change-status-variant-product', variantProductChangeStatus);
routes.delete('/delete-variant-product/:id', deleteVariantProduct);
routes.get('/edit-variant-product/:id', editVariantProductByID);

// Sales API's
routes.get('/sales-list/:type', salesList)
routes.post('/update-order-status', updateOrderStatus)
routes.post('/order-history', orderHistory)
routes.post('/getOrderInvoice', getOrderInvoice)
// routes.post('/sales-detail/:type', salesDetail)
// routes.post('/order-ready', orderReady)
// routes.post('/return-approve', returnApprove)

// Refund and Cancel ApI's
routes.get('/refund-context/:sub_order_id', getRefundContext);
routes.post('/refund/:sub_order_id', refundSuborder);
routes.post('/cancel/:sub_order_id', cancelSuborder);
// Occassion API's
routes.post('/add-occassion', addOccasion);
routes.post('/add-occassion-image', multer().single('file'), uploadOccassionImage);
routes.get('/get-occassion', occassionList);
routes.post('/change-status-occassion', occassionChangeStatus);
routes.delete('/delete-occassion/:id', deleteOccassion);
routes.get('/get-occassion-by-id/:id', getOccasion);


// Add Parent Product
routes.post('/add-parent-product',   (req, res, next) => {
    (req as any).filepath = 'parentVariant';
    next();
  },  upload.any(), addParentProduct);
routes.get('/fetch-parent-product/:id', fetchParentProduct)
routes.post('/add-parent-product-image', multer().single('file'), addParentProductImage)

//Blog api
routes.post('/add-blog', addBlog);
routes.post('/add-blog-image', multer().single('file'), uploadBlogImage);
routes.get('/get-blog', blogList);
routes.post('/change-status-blog', blogChangeStatus);
routes.post('/change-featured-blog', blogFeaturedStatus);
routes.delete('/delete-blog/:id', deleteBlog);
routes.get('/get-blog-by-id/:id', getBlog);

//Blog Tag api
routes.post('/add-blog-tag', addBlogTag);
routes.get('/get-blog-tag', tagBlogList);
routes.post('/change-status-blog-tag', tagBlogChangeStatus);
routes.get('/get-blog-tag-by-id/:id', getTagBlog);

routes.get('/getActiveTagBlog', getActiveTags);
routes.get('/getAllSearchTerms', getAllSearchTerms);

// Admin Category API's
routes.post('/add-admin-category', addAdminCategory);
routes.post('/add-admin-category-image', multer().single('file'), uploadAdminCategoryImage);
routes.get('/get-admin-category', adminCategoryList);
routes.post('/change-admin-status-category', adminCategoryChangeStatus);
routes.post('/change-category-popular', adminCategoryPopular);
routes.post('/change-category-special', adminCategorySpecial);
routes.post('/changeAdminCategoryMenuStatus', changeAdminCategoryMenuStatus);
routes.get('/get-admin-category-by-id/:id', getAdminCategory);

routes.get('/getActiveAdminCategory', getActiveAdminCategory);
// Setting Api
routes.post('/add-deal', multer().fields([{ name: 'deal1', maxCount: 1 }, { name: 'deal2', maxCount: 1 }]), addDeal); 
routes.get('/get-deal', getDeal);

//Information API 
routes.get('/information/:type',getInformation);
routes.post('/update-information',validationMiddleware(informationValid), updateInformation)

// Vendor API
routes.post('/add-vendor', addVendor)
routes.post('/add-vendor-profile', multer().single('file'), addVendorProfile)
routes.post('/add-shop-icon', multer().single('file'), addShopIcon)
routes.post('/add-shop-video', uploadShopVideo);
routes.post('/add-shop-photos',multer().single('file'), addShopPhotos);
routes.post('/add-shop-banner', multer().fields([
  { name: 'image', maxCount: 1 },
  { name: 'editedImage', maxCount: 1 }
]),
addShopBanner
);
routes.get('/get-shop-banner', getShopBanner);
routes.post('/delete-shop-banner', deleteShopBanner);
routes.get('/get-vendor',getVendor)
routes.get('/get-vendor-by-id/:id', getVendorById)
routes.post('/change-vendor-status', changeVendorStatus)

// Coupon API's
routes.post('/add-coupon', addCoupon)
routes.get('/get-coupon/:id',getCoupon)
routes.get('/delete-coupon/:id',deleteCoupon)
routes.post('/change-coupon-status', changeCouponStatus)
routes.get('/list-coupons', listCoupons)

// Promotion API's
routes.post('/add-promotion', addPromotion)
routes.get('/get-promotion/:id',getPromotion)
routes.get('/delete-promotion/:id',deletePromotion)
routes.post('/change-promotion-status', changePromotionStatus)
routes.get('/list-promotions', listPromotions)

//Gift Card Category API's
routes.post('/add-gift-card-category', addGiftCardCategory)
routes.post('/add-gift-card-category-image',multer().single('file'), uploadGiftCardCategoryImage);
routes.get('/get-gift-card-category/:id', getGiftCardCategory)
routes.get('/delete-gift-card-category/:id', deleteGiftCardCategory)
routes.post('/change-gift-card-category-status', changeGiftCardCategoryStatus)
routes.get('/list-gift-card-categories', listGiftCardCategories)

// Gift Card API's
routes.post('/add-gift-card', addGiftCard)
routes.post('/add-gift-card-image',multer().single('file'), uploadGiftCardImage);
routes.get('/get-gift-card/:id', getGiftCard)
routes.get('/delete-gift-card/:id', deleteGiftCard)
routes.post('/change-gift-card-status', changeGiftCardStatus)
routes.get('/list-gift-cards', listGiftCards)
routes.get('/active-gift-card-categories',listActiveGiftCardCategories)
routes.get('/getGiftCardPurchaseHistory/:type', getGiftCardPurchaseHistory)
routes.post('/resendMailForGiftCardCodeByAdmin', resendMailForGiftCardCodeByAdmin)

routes.get('/getProductBySku/:sku', getProductBySku)

routes.get('/getAllActiveVendor',getAllActiveVendor)

routes.get('/getRatingByType/:type', getRatingByType)
routes.get('/getAllVendorProduct', getAllVendorProduct)
routes.post('/changeRatingStatus', changeRatingStatus)

routes.post('/updateProductQuantity', updateProductQuantity)

//affiliate user api's
routes.get('/get-affiliate-user/:status', getAffiliateUser)
routes.get('/get-affiliate-user-by-id/:id',getAffiliateUserById)
//update affiliate user
routes.post('/change-affiliate-user-status', changeAffiliateUserStatus);
routes.post('/update-affiliate-commission', changeAffiliateUserStatus);
routes.post('/update-affiliate-user',updateAffiliateUser)

routes.get('/getAffiliateReport', getAffiliateReport)
routes.get('/getAffiliateReport/:id', getAffiliateReportById)

// Shipping Module
routes.post('/addShippingTemplate', addShippingTemplate)
routes.get('/getShippingTemplate', getShippingTemplate)
routes.get('/getShippingTemplateById/:id', getShippingTemplateById)
routes.post('/setDefaultTemplate', setDefaultTemplate)
routes.post('/deleteShippingTemplate', deleteShippingTemplate)
routes.post('/bulkChangeShippingTemplate', bulkChangeShippingTemplate)

routes.get('/getAllShippingTemplate/:id', getAllShippingTemplate)

// Subscribe Module
routes.get('/getSubscribeData', getSubscribeData)
routes.post('/sendMailToSubscribers', sendMailToSubscribers)

// Banner API's
routes.post('/add-banner', multer().single('file'), addBanner)
routes.get('/get-banner', bannerList)
routes.post('/update-banner-status', changeBannerStatus)
routes.delete('/delete-banner/:id', deleteBanner)
routes.get('/edit-banner/:id', getBanner);

routes.get('/getGiftCardDescription',getGiftCardDescription);
routes.post('/addGiftCardDescription', addGiftCardDescription)

// Policy APIs
routes.post('/add-policy', addPolicy)
routes.get('/get-policy', policyList)
routes.post('/update-policy-status', policyChangeStatus)
routes.delete('/delete-policy/:id', deletePolicy)
routes.get('/edit-policy/:id', getPolicy);

// Store Setting APIs
routes.post('/add-store-setting', addStoreSetting)
routes.get('/get-store-setting', getStoreSettings)
routes.post('/update-store-setting-status', storeSettingChangeStatus)
routes.delete('/delete-store-setting/:id', deleteStoreSetting)
routes.get('/edit-store-setting/:id', getStoreSettingById);

// get product by vendor id
routes.get('/get-product-by-vendor-id', getProductByVendor)

//create store
routes.post('/create-store', validationMiddleware(createStoreValid), createStore)
routes.post('/update-store', validationMiddleware(updateStoreValid), updateStore)
routes.get('/delete-store/:id',deleteStore)
routes.get('/get-store', getStore)
routes.get('/get-store-by-id/:id', getStoreById)
routes.post('/change-store-status', validationMiddleware(updateStoreStatusValid), updateStoreStatus);

// country blocked
routes.post('/country-blocked', countryBlocked)

//order history
routes.post('/getOrderHistory', getOrderHistory)

//order history
routes.post('/getUserOrderHistory', getOrderHistory2)
routes.post('/getReviews', getReviews),
routes.post('/getFavoriteProducts', getFavoriteProducts)

//get blocked country
routes.get('/get-blocked-country', getBlockedCountry)

// add description for setting
routes.post('/add-description', addDescription)

routes.get('/get-description/:type', getDescription)

//get store report
routes.get('/get-store-report', getStoreReport)

// get product report
routes.get('/get-product-report', getProductReport)

// get particular report by id
routes.get('/get-single-report/:id', getSingleReportById)

// extand gift card expiry date
routes.post('/extend-gift-card-expiry-date', extandGiftCardExpiryDate)

routes.post('/set-product-bedge', setProductBedge);

routes.post('/add-draft-product', (req, res, next) => {
    (req as any).filepath = 'product';
    next();
  },
  upload.any(), addDraftProduct)

routes.post('/add-wallet-balance-by-admin', addWalletBalanceByAdmin)

routes.post("/update-user-profile", updateUserProfile)

routes.post('/reset-password', resetPassword)

routes.get('/user-favourite-products', getFavouriteProducts)

routes.post('/user-order-history', getOrderHistorys);

routes.get('/get-dashboard-data', getDashboarData)

routes.get('/get-user-dashboard-data', getUserDashboardData)

routes.get('/get-top-selling-product-by-month', getTopSellingProductbyMonth)

routes.post('/generate-token', generateToken)

routes.get('/get-sales-data-by-month-year', getSalesDataByMonthYear)

routes.get('/get-top-sales-data-by-vendor', getTopSalesByVendorAdmin)

routes.get('/get-top-sales-count-data-by-vendor', getTopSalesCountByVendorAdmin)

routes.get('/get-activities', getActivities);

routes.get('/get-product-and-vendor-activities', getProductAndVendorActivities);

routes.get('/get-sales-traffic-report', getSalesTrafficReport)

routes.get('/get-shop-sales-report', getShopSaleReport)

routes.get('/all-child-products', allChildProductDetails)

routes.get('/get-all-users', getAllUsers)

routes.get('/get-all-customers', getAllCustomers);

routes.get('/get-gift-cards', getGiftCards)

routes.post('/add-voucher', addVoucher);

routes.get('/get-vouchers', getVouchers);

routes.get('/get-voucher-by-id/:id', getVoucherById);

routes.post('/change-voucher-status', changeVoucherStatus);

routes.get('/delete-voucher/:id', deleteVoucher)

routes.post('/save-seller-note', saveSalerNote)

export default routes;