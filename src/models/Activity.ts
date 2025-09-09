import mongoose, { Schema, Document, model } from 'mongoose';

const activitySchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            default: null,
        },
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorDetail',
            default: null,
        },
        activity_type: {
            type: String,
            enum: ['follow','registration','login','reset-password','email-verification','social-login','logout','update-cart','product-update-cart','add-cart','Wishlist','delete-cart','reset-password','add-address','update-address','delete-address','checkout','user-cancel-order','return-product','gift-card','radeem-gift-card'],
            required: true,
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

const ActivityModel = model('Activity', activitySchema);

export default ActivityModel;
