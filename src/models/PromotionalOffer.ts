import mongoose, { Schema, Document, model } from 'mongoose';

const PromotionalOfferSchema = new Schema(
  {
    promotional_title: {
      type: String,
      required: true,
      unique: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    purchased_items: {
      type: String,
      default: '',
    },
    product_id: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    }],
    removed_product_id: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    }],
    start_date: {
      type: Date,
      required: true,
    },
    expiry_date: {
      type: Date,
      default: null
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    expiry_status:{
      type: String,
      enum: ['active', 'expired'],
      default: 'active'
    },
    offer_type: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    promotion_type: {
      type: String,
      enum: [
        'qty_per_product',   // quantity based on each product
        'qty_total_shop',    // quantity based on total products in shop
         'amount', ],
      required: true,
    },
    discount_amount: {
      type: Number,
      required: true,
    },
    qty: {
      type: Number,
      default: 0,
    },
    offer_amount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const PromotionalOfferModel = model('PromotionalOffer', PromotionalOfferSchema);

export default PromotionalOfferModel;
