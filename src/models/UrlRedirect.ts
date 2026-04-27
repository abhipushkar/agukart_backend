import mongoose, { Schema, model} from "mongoose";

const urlRedirectSchema = new Schema(
    {
        oldSlug: {
            type: String,
            required: true,
            index: true
        },
        newSlug: {
            type: String,
            required: true,
            index: true
        },
        entityType: {
            type: String,
            enum: ['category', 'product', 'blog', 'store', 'admin-category'],
            required: true
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    { timestamps: true },
);

export default model('UrlRedirect', urlRedirectSchema);