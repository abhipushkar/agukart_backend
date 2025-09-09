import mongoose, { Schema, Document, model } from 'mongoose';

const policySchema = new Schema(
    {
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        policyTitle: {
            type: String,
            required: true,
            default: '',
        },
        returns: {
            type: Boolean,
            required: true,
            default: false,
        },
        exchange: {
            type: Boolean,
            required: true,
            default: false,
        },
        returnExchangeTime: {
            type: Number,
            required: true,
            default: 0
        },
        description: {
            type: String,
            default: '',
        },
        status: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const PolicyModel = model('Policy', policySchema);

export default PolicyModel;
