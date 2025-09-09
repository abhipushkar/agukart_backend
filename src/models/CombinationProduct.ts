import mongoose, { Schema, Document, model } from 'mongoose';

const combinationProductSchema = new Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ParentProduct',
            required: true,
        },
        sku_product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        combination_id: {
            type: String,
            default: ''
        },
        sku_code: {
            type: String,
            default: ''
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const CombinationProductModel = model('CombinationProduct', combinationProductSchema);

export default CombinationProductModel;
