import mongoose, { Schema, Document, model } from 'mongoose';

const stateSchema = new Schema(
    {
        _id: {
            type: Number,
        },
        name: {
            type: String
        },
        country_id: {
            type: Number,
            ref: 'country',
        }
        
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const StateModel = model('State', stateSchema);

export default StateModel;
