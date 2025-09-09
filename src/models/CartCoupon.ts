import mongoose, { Schema, Document, model } from 'mongoose';

const cartCouponSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorDetail',
            required: true,
        },
        coupon_data: {
            type: Map,
            of: new mongoose.Schema({
                vendor_id: { type: String, required: true },
                coupon_code: { type: String, required: true },
                discount_amount: { type: Number, required: true },
            }, { _id: false }),
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const CartCouponModel = model('CartCoupon', cartCouponSchema);

export default CartCouponModel;
