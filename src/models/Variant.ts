import mongoose, { Schema, Document, model } from 'mongoose';
 
const variantSchema = new Schema(
  {
    variant_name: {
      type: String,
      required: true,
      unique:true
    },
    status: {
      type: Boolean,
      required: true,
      default:false
    },
    category_status: {
      type: Boolean,
      required: true,
      default:false
    },
    product_status: {
      type: Boolean,
      required: true,
      default:false
    },
    deletedAt:{
      type:Date,
      default:null
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const VariantModel = model('Variant', variantSchema);

export default VariantModel;
