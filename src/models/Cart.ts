import mongoose, { Schema, Document, model } from 'mongoose';

const cartSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VariantProduct',
            required: true,
        },
        qty: {
            type: Number,
            required: true,
        },
        isCombination: {
            type: Boolean,
            default: false
        },
        customize: {
            type: String,
            enum: ['', 'Yes', 'No'],
            default: '',
        },
        customizationData: [
            {
                type: Schema.Types.Mixed,
                default: []
            }
        ],
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
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        affiliate_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        shipping_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shipping',
            default: null
        },
        shippingName: {
            type: String,
            default: 'standardShipping'
        },
        note: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const CartModel = model('Cart', cartSchema);

export default CartModel;
