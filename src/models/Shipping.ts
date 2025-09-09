import mongoose, { Schema, Document, model } from 'mongoose';

const shippingSchema = new Schema(
    {
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        title: {
            type: String,
            required: true,
            unique: true
        },
        shippingTemplateData: {
            type: Object,
            default: {}
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const ShippingModel = model('Shipping', shippingSchema);

export default ShippingModel;
