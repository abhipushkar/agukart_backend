import { required } from 'joi';
import mongoose, { Schema, Document, model } from 'mongoose';

const ratingSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        saledetail_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SalesDetails',
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorDetails',
            required: true,
        },
        delivery_rating: {
            type: String,
            enum: ['1', '2', '3', '4', '5'],
            required: true,
        },
        item_rating: {
            type: String,
            enum: ['1', '2', '3', '4', '5'],
            required: true,
        },
        additional_comment: {
            type: String,
            required: true,
        },
        recommended: {
            type: Boolean,
            required: true,
            default: false
        },
        status: {
            type: String,
            enum: ['pending', 'approved','rejected'],
            default: 'approved'
        },
        reject_remark: {
            type: String,
            default: ''
        },
        approved_date: {
            type: Date,
            default: null
        },
        rejected_date: {
            type: Date,
            default: null
        }

    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const RatingModel = model('Rating', ratingSchema);

export default RatingModel;
