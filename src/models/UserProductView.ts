import mongoose, { Schema, Document, model } from 'mongoose';

const userProductViewSchema = new Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const UserProductViewModel = model('UserProductView', userProductViewSchema);

export default UserProductViewModel;
