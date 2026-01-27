import mongoose, { Schema, Document, model } from 'mongoose';

const salesDetailsSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        order_id: {
            type: String,
        },
        sale_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sales',
            required: true,
        },
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        vendor_name:{
            type: String,
            default: ''
        },
        sub_order_id: {
            type: String,
            default: '',
        },
        item_id: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        is_approve: {
            type: String,
            default: ''
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        productData:{
            type: Object,
            default: {}
        },
        qty: {
            type: Number,
            required: true,
        },
        sub_total: {
            type: Number,
            required: true,
        },
        promotional_discount: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        amount: {
            type: Number,
            required: true,
        },
        delivery: {
            type: Number,
            default: 0
        },
        reject_date: {
            type: Date,
            default: null
        },
        confirmed_date: {
            type: Date,
            default: null
        },
        shipped_date: {
            type: Date,
            default: null
        },
        delivered_date: {
            type: Date,
            default: null
        },
        shipping_couriername: {
            type: String,
            default: ''
        },
        shipping_couriernumber: {
            type: String,
            default: ''
        },
        usercancel_remark: {
            type: String,
            default: ''
        },
        return_remark: {
            type: String,
            default: ''
        },
        return_status: {
            type: String,
            default: ''
        },
        return_amount: {
            type: String,
            default: ''
        },
        admin_returnremark: {
            type: String,
            default: ''
        },
        order_status: {
            type: String,
            enum: ['new', 'unshipped', 'in-progress', 'completed', 'cancelled'],
            default: 'new',
        },
        delivery_status: { 
            type: String,
            enum: ['No tracking', 'Pre transit', 'In transit', 'Delivered', 'Cancelled'],
            default: 'No tracking',
        },
        ratingStatus: {
            type: Boolean,
            required: true,
            default: false
        },
        isCombination: {
            type: Boolean,
            default: false
        },
        variant_id: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Variant',
            default: []
        }],
        variant_attribute_id: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VariantAttribute',
            default: []
        }],
        variants: [{
            variantName: { type: String },
            attributeName: { type: String }
        }],
        original_price: {
            type: Number,
            default: 0
        },
        affiliate_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        customize: {
            type: String,
            enum: ['', 'Yes', 'No'],
            default: '',
        },
        customizationData: [
            {
                type: Schema.Types.Mixed
            }
        ],
        shippingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shipping',
            default: null
        },
        shippingName: {
            type: String,
            default: ''
        },
        shippingAmount: {
            type: Number,
            default: ''
        },
        couponData: {
            type: Object,
            default: {}
        },
        refunded_cash_amount: {
            type: Number,
            default: 0
        },
        refunded_voucher_amount: {
            type: Number, 
            default: 0
        },
        shipping_refunded_amount: {
            type: Number,
            default: 0
        },
        couponDiscountAmount: {
            type: Number,
            default: 0
        },
        deliveryData: {
            type: Object,
            default: {}
        },
        buyer_note:{
            type: String,
            default: ''
        },
        seller_note:{
            type: String,
            default: ''
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const SalesDetailsModel = model('SalesDetails', salesDetailsSchema);

export default SalesDetailsModel;
