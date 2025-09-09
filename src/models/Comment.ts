import mongoose, { Schema, Document, model } from 'mongoose';

const commentSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sale_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sales',
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        rating: {
            type: String,
            default: '',
        },
        comment: {
            type: String,
            default: '',
        }

    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const CommentModel = model('Comment', commentSchema);

export default CommentModel;
