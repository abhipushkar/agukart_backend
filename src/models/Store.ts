import mongoose, { Schema, Document, model } from 'mongoose';

const storeschema = new Schema(
    {
        store_name:{
            type:String,
            required:true,
            unique:true,
        },
        product_select:{
            type:String,
            enum:["Products Name","Products SKU"]
        },
        selected_sku_codes:[
            {
                type:String,
                required:true,
            }
        ],
        selected_products:[
            {
                type:Schema.Types.ObjectId,
                ref:'Product',
                required:true,
            }
        ],
        sort_order:{
            type:Number,
            required:true,
        },
        vendor_id:{
            type:Schema.Types.ObjectId,
            ref:'Vendor',
            required:true,
        },
        status:{
            type:Boolean,
            default:true,
        }
    }
);

const StoreModel = model('Store', storeschema);

export default StoreModel;
