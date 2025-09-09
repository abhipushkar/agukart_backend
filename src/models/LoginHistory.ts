import mongoose, { Schema, Document, model } from 'mongoose';

const loginHistorySchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        login_time: {
            type: Date,
            default: Date.now,
        },
        logout_time: {
            type: Date,
            default: null,
        },
        ip_address: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['1', '0'],
            default: '1',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const LoginHistoryModel = model('LoginHistory', loginHistorySchema);

export default LoginHistoryModel;
