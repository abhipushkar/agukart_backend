import mongoose, { Schema, Document, model } from 'mongoose';

const VisitSchema = new Schema(
    {
        product_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        date: { 
            type: Date, 
            required: true, 
            index: true 
        },
        visit_count: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

const VisitModel = model('Visitcount', VisitSchema);

export default VisitModel;
