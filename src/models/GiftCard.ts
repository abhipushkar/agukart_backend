import mongoose, { Schema, Document, model } from 'mongoose';

const GiftCardSchema = new Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GiftCardCategory',
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    image_alt: {
      type: String,
      default: '',
    },
    validity: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    meta_title: {
      type: String,
      default: '',
    },
    meta_description: {
      type: String,
      default: '',
    },
    meta_keywords: {
      type: [String],
      default: [],
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const GiftCardModel = model('GiftCard', GiftCardSchema);

export default GiftCardModel;
