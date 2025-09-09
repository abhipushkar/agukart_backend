import mongoose, { Schema, model } from 'mongoose';

const userEmailSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        email: {
            type: String,
            default: ''
        },
        verifyToken:{
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Failed'],
            default: 'Pending'
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const UserEmailModel = model('UserEmail', userEmailSchema);

export default UserEmailModel;