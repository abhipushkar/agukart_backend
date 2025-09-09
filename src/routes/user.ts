import express from "express";

import {
    addToCart,
    listofCart,
    deleteCart,
    deleteCompleteCart,
    addAddress,
    deleteAddress,
    getAddress,
    checkoutAddressEligibility,
    checkout,
    subOrderList,
    userCancelOrder,
    returnProduct,
    orderFeedback,
    getProfile,
    updateProfile,
    getAddressById,
    changePassword,
    uploadProfileImage,
    updateProfileImage,
    getWishlist,
    addDeleteWishlist,
    addViewedProducts,
    recentlyViewedProducts,
    becauseViewedProducts,
    getEmail,
    sendEmailVerificationLink,
    changeEmail,
    cancelEmail,
    getCartDetails,
    getOrderDetailsById,
    orderList,
    getOrderDetail,
    searchOrder,
    sendRating,
    followVendor,
    getFollowVendor,
    sendMessageID,
    getMessageId,
    purchaseGiftCard,
    // listGiftCardTransactions,
    redeemGiftCard,
    listUserGiftCardTransactions,
    createReport,
    checkCouponForProduct,
    removeCouponForProduct,
    resendMailForGiftCardCode,
    logout,
    addParentCart,
    verifyToken,
    getVendorCartDetails,
    vendorWiseCheckout,
    createOrder,
    checkVoucherForProduct,
    saveNote,
    getUserOrders
} from "../controllers/Postlogin";

import multer from 'multer';
import validationMiddleware from "../utils/multivalidate";
import { otpsend, validateChangeEmail, validateSignup } from "../validators/validators";

const routes = express.Router();
routes.post('/add-viewed-products', addViewedProducts)
routes.get('/recently-viewed-products', recentlyViewedProducts) 
routes.get('/because-viewed-products', becauseViewedProducts) 
routes.get('/get-profile', getProfile)
routes.get('/get-email', getEmail)
routes.get('/logout', logout)
routes.post('/change-email',validationMiddleware(validateChangeEmail), changeEmail)
routes.post('/send-email-verification',sendEmailVerificationLink)
routes.post('/cancel-email',cancelEmail)
routes.post('/update-profile', updateProfile)
routes.post('/upload-profile-image',multer().single('profileImage'), uploadProfileImage)
routes.post('/update-profile-image',multer().single('profileImage'), updateProfileImage)
routes.post('/add-to-cart', addToCart)
routes.get('/cart-list', listofCart)
routes.post('/add-parent-cart', addParentCart)
routes.get('/get-wishlist',getWishlist )
routes.post('/add-delete-wishlist',addDeleteWishlist)
routes.post('/delete-cart', deleteCart)
routes.post('/delete-complete-cart', deleteCompleteCart)
routes.post('/change-password', changePassword)

routes.post('/add-address', addAddress)
routes.post('/delete-address', deleteAddress)
routes.get('/get-address', getAddress)
routes.get('/get-address-by-id/:id', getAddressById)

routes.get('/getOrderDetailsById/:orderId', getOrderDetailsById)

routes.get('/getCartDetails',getCartDetails)
routes.get('/getVendorCartDetails/:id',getVendorCartDetails)
routes.get('/check-checkoutadress-eligibility', checkoutAddressEligibility)
routes.post('/checkout', checkout)
routes.post('/create-order', createOrder);
routes.post('/vendorWiseCheckout', vendorWiseCheckout)
routes.get('/orderList', orderList)
routes.get('/getOrderDetail/:orderId', getOrderDetail)
routes.get('/searchorder',searchOrder)

routes.post('/sendRating', sendRating)

routes.post('/sub-order-list', subOrderList)
routes.post('/user-cancel-order', userCancelOrder)
routes.post('/return-product', returnProduct)
routes.post('/order-feedback', orderFeedback)

routes.post('/follow-vendor', followVendor)
routes.get('/get-follow-vendor', getFollowVendor)

routes.post('/sendMessageID', sendMessageID)
routes.get('/getMessageId', getMessageId)

routes.post('/purchase-gift-card',purchaseGiftCard)
routes.post('/resendMailForGiftCardCode',resendMailForGiftCardCode)
routes.post('/redeem-gift-card',redeemGiftCard)
routes.post('/check-coupon-for-product', checkCouponForProduct);
routes.post('/remove-coupon-for-product', removeCouponForProduct);
routes.post('/check-voucher-for-product', checkVoucherForProduct)

routes.get('/user-gift-card-transaction-history/:type',listUserGiftCardTransactions)

routes.post('/create-report', createReport); 

routes.get('/verify-token', verifyToken)

routes.post('/save-note', saveNote)

routes.get('/get-user-orders', getUserOrders)

export default routes;

