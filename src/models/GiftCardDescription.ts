import mongoose, { Schema, Document, model } from 'mongoose';
 
const giftCardDescriptionSchema = new Schema(
  {
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const GiftCardDescriptionModel = model('GiftCardDescription', giftCardDescriptionSchema);

export default GiftCardDescriptionModel;
