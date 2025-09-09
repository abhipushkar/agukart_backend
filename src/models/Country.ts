import mongoose, { Schema, Document, model } from 'mongoose';

const countrySchema = new Schema(
    {
        _id: {
            type: Number,
        },
        sortname: {
            type: String
        },
        name: {
            type: String
        },
        isBlocked:{
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const CountryModel = model('Country', countrySchema);

export default CountryModel;
