import mongoose, { Schema, Document, model } from 'mongoose';
import ProductModel from './Product';
import CategoryModel from './Category';

const couponSchema = new Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    coupon_title: {
      type: String,
      default:'',
      required: true,
    },
    coupon_code: {
      type: String,
      required: true,
    },
    coupon_description: {
      type: String,
      default: ''
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    max_discount: {
      type: Number,
      default: 0,
    },
    discount_type: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    valid_for: {
      type: String,
      enum: ['all', 'new user', 'old user'],
      default: 'all',
    },
    start_date: {
      type: Date,
      required: true,
    },
    expiry_date: {
      type: Date,
      default:null
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
    status: {
      type: Boolean,
      required: true,
      default:true,
    },
    expiry_status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'active',
    },
    no_of_times:{
      type: Number,
      default:0
    },
    total_uses:{
      type: Number,
      default:0
    },
  },
  
  {
    timestamps: true,
    versionKey: false,
  }
);
const CouponModel = model('Coupon', couponSchema);

export default CouponModel;
