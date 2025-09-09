import mongoose, { Schema, Document, model } from 'mongoose';

const productandvendorSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        activity_type: {
            type: String,
            enum: ['update-cart','add-to-cart','wishlist','follow','delete-cart'],
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            default: null,
        },
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            default: null,
        },
        type: {
            type: String,
            enum: ['product','vendor']
        },
        description: {
            type: String,
            default: '',
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const productAndVedorActivityModel = model('productactivity', productandvendorSchema);

export default productAndVedorActivityModel;
