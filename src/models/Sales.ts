import mongoose, { Schema, Document, model } from 'mongoose';

const salesSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        order_id: {
            type: String,
            required: true,
        },
        totalcreated_order: {
            type: Number,
            default:0
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        mobile: {
            type: String,
            required: true,
        },
        phone_code: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        address_line1: {
            type: String,
            required: true,
        },
        address_line2: {
            type: String,
            default:''
        },
        pincode: {
            type: String,
            default:''
        },
        payment_type: {
            type: String,
            enum: ['','1', '2'],
            default: '',
        },
        subtotal: {
            type: Number,
            required: true,
        },
        discount: {
            type: Number,
            required: true,
        },
        coupon_discount: {
            type: Number,
            required: true,
        },
        wallet_used: {
            type: Number,
            default: 0
        },
        promotional_discount: {
            type: Number,
            default: 0
        },
        shipping: {
            type: Number,
            required: true,
        },
        net_amount: {
            type: Number,
            required: true,
        },
        delivery: {
            type: Number,
            required: true,
        },
        payment_status: {
            type: String,
            required: true,
        },
        coupon_applied: {
            type: Map,
            of: new mongoose.Schema({
                vendor_id: { type: String, required: true },
                coupon_code: { type: String, required: true },
                discount_amount: { type: Number, required: true },
            }, { _id: false }),
        },
        voucher_dicount: {
            type: Number,
            default: 0
        },
        voucher_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Voucher',
            required: false,
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const SalesModel = model('Sales', salesSchema);

export default SalesModel;
