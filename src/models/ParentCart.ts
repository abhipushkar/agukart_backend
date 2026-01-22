import mongoose, { Schema, Document, model } from 'mongoose';

const parentCartSchema = new Schema(
    {   
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
        },
        shipping_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shipping',
            default: null,
        },
        vendor_data: [
            {
                vendor_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                product_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                shipping_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Shipping',
                    default: null,
                },
                shippingName: {
                    type: String,
                    default: '',
                },
                minDate: {
                    type: Date,
                    default: '', 
                },
                maxDate: {
                    type: Date,
                    default: '',
                },
                perOrder: {
                    type: Number,
                    default: 0,
                },
                perItem: {
                    type: Number,
                    default: 0,
                }, 
                region: {
                    type: [String],
                    default: []
                },
                note: {
                    type: String,
                    default: '',
                },
                seller_note: {
                    type: String,
                    default: '',
                }
            }
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const ParentCartModel = model('ParentCart', parentCartSchema);

export default ParentCartModel;