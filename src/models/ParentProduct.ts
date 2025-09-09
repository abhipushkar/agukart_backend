import { string } from 'joi';
import mongoose, { Schema, Document, model } from 'mongoose';

const parentProductSchema = new Schema(
    {
        product_title: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        image: {
            type: String,
            default: '',
        },
        sub_category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        },
        // seller_sku
        seller_sku: {
            type: String,
            required: true,
        },
        sku: {
            type: Array,
            default: []
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
        }]
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const ParentProductModel = model('ParentProduct', parentProductSchema);

export default ParentProductModel;
