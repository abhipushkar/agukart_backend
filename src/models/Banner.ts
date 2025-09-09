import mongoose, { Schema, Document, model } from 'mongoose';

const bannerSchema = new Schema(
  {
    image: {
      type: String,
      default:''
    },
    status: {
      type: Boolean,
      required: true,
      default: false
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const BannerModel = model('Banner', bannerSchema);

export default BannerModel;
