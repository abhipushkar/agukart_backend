import mongoose, { Schema, Document, model } from 'mongoose';

const GiftCardCategorySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      default: '',
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: '', 
    },
    sort_order:{
      type: Number,
      required:true,
      default:0,
    },
    description: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const GiftCardCategoryModel = model('GiftCardCategory', GiftCardCategorySchema);

export default GiftCardCategoryModel;
