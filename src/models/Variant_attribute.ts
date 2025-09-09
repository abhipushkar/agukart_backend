import mongoose, { Schema, Document, model } from 'mongoose';

const variantAttributeSchema = new Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      required: true,
    },
    attribute_value: {
      type: String,
      default: null,
    },
    sort_order: {
      type: String,
      default: null,
    },
    status: {
      type: Boolean,
      required: true,
      default:false
    },
    deleted_status: {
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

const VariantAttributeModel = model('VariantAttribute', variantAttributeSchema);

export default VariantAttributeModel;
