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
            coupon_code: { type: String, required: true },
            discount_amount: { type: Number, required: true },
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const CouponCartModel = model('couponCart', cartCouponSchema);

export default CouponCartModel;
