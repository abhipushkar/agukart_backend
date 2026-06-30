import mongoose, {Schema, model } from "mongoose";

const refundItemSchema = new Schema({
    refund_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Refund',
        required: true,
        index: true
    },
    item_id: {
        type: String, 
        default: null,
        index: true
    },
    type: {
        type: String,
        enum: ["Item", "Shipping", "Voucher", "Coupon"],
        required: true
    },
    entered_refund_amount: {
        type: Number,
        required: true
    },
    net_refund_amount: {
        type: Number,
        required: true
    },
    reason_code: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
},
{
    timestamps: true,
    versionKey: false
}
);


export const RefundItemModel = model("RefundItem", refundItemSchema);