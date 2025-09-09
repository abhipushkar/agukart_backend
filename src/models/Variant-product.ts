import mongoose, { Schema, Document, model } from 'mongoose';

const variantProductSchema = new Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        variant_id: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Variant',
            required: true, 
        }],
        variant_attribute_id: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VariantAttribute',
            required: true,
        }],
        discount_type: {
            type: String,
            enum: ['1', '2'],
            default: '1',
        },
        discount_amount: {
            type: Number,
            required: true,
        },
        delivery: {
            type: String,
            enum: ['free', 'paid'],
            default: 'Free',
        },
        delivery_amount: {
            type: Number,
            default: 0,
        },
        image: [{
            type: String,
            required: true
        }],
        slug: {
            type: String,
            default: ''
        },
        stock: {
            type: Number,
            default: 0,
        },
        sale_price: {
            type: Number,
            default: null,
        },
        return_policy: {
            type: String,
            default: null,
        },
        meta_title: {
            type: String,
            default: null,
        },
        meta_keywords: {
            type: String,
            default: null,
        },
        meta_description: {
            type: String,
            default: null,
        },
        status: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const VariantProductModel = model('VariantProduct', variantProductSchema);

export default VariantProductModel;
