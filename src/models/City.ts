import mongoose, { Schema, Document, model } from 'mongoose';

const citySchema = new Schema(
    {
        _id: {
            type: Number,
        },
        name: {
            type: String
        },
        state_id: {
            type: Number,
            ref: 'state',
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const CityModel = model('City', citySchema);

export default CityModel;
