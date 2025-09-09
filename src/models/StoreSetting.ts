import mongoose, { Schema, Document, model } from 'mongoose';

const storeSettingSchema = new Schema(
    {
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        type: {
            type: String,
            required: true
        },
        store_name: {
            type: String,
            required: true,
            unique: true
        },
        product_id: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            default: []
        }],
        sort_order: {
            type: Number,
            default: 0,
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

const StoreSettingModel = model('StoreSetting', storeSettingSchema);

export default StoreSettingModel;
