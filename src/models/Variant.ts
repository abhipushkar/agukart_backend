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
    guide_name: {
    type: String,
    default: ""
    },
    guide_file: {
    type: String,
    default: ""
    },
    guide_description:{
    type: String,
    default: '',
    },
    guide_type: {
    type: String,
    enum: ["image", "pdf", ""],
    default: "",
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
