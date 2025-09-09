import mongoose, { Schema, Document, model } from 'mongoose';

const addressSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        first_name: {
            type:String,
            default: '',
        },
        last_name: {
            type:String,
            default: '',
        },
        country: {
            type:String,
            default: '',
        },
        mobile: {
            type:String,
            default: '',
        },
        email: {
            type:String,
            default: '',
        },
        phone_code: {
            type:String,
            default: '',
        },
        address_line1: {
            type:String,
            default: '',
        },
        address_line2: {
            type:String,
            default: '',
        },
        state: {
            type:String,
            default: '',
        },
        city: {
            type:String,
            default: '',
        }, 
        pincode: {
            type: String,
            default: '',
        }, 
        default: {
            type: String,
            enum: ['1', '0'],
            default: '0',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const AddressModel = model('Address', addressSchema);

export default AddressModel;
