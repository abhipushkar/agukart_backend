import mongoose, { Schema, Document, model } from 'mongoose';

const wishlistSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    isCombination: {
      type: Boolean,
      default: false
    },
    variant_id: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      default: []
    }],
    variant_attribute_id: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VariantAttribute',
      default: []
    }],
    original_price: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const wishlistModel = model('wishlist', wishlistSchema);

export default wishlistModel;
