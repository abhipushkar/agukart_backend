import mongoose, { Schema, Document, model } from 'mongoose';

interface VoucherDocument extends Document {
  type: 'product' | 'shop';
  wiseType: 'select wise' | 'all';
  product_skus: string[];
  shop_ids: string[];
  startDate?: Date;
  endDate?: Date;
  promotionTitle?: string;
  description?: string;
  claim_code?: string;
  usage_limits: number;
  type_of_users?: 'all' | 'oldusers' | 'newusers';
  auto_voucher: 'yes' | 'no';
  term_of_use?: string;
  max_amount?: number;
  discount_amount: number;
  discount_type: String;
  status: boolean;
  voucher_limit: number;
  cart_amount: Number;
}

const VoucherSchema = new Schema<VoucherDocument>(
  {
    type: {
      type: String,
      enum: ['product', 'shop'],
      required: true,
    },
    wiseType: {
      type: String,
      enum: ['select wise', 'all'],
      default: 'select wise',
    },
    product_skus: {
      type: [String],
      default: [],
    },
    shop_ids: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    promotionTitle: {
      type: String,
    },
    description: {
      type: String,
    },
    claim_code: {
      type: String,
    },
    usage_limits: {
      type: Number,
    },
    type_of_users: {
      type: String,
      enum: ['all', 'oldusers', 'newusers'],
    },
    auto_voucher: {
      type: String,
      enum: ['yes', 'no'],
      default: 'no',
    },
    term_of_use: {
      type: String,
    },
    cart_amount: {
      type: Number
    },
    max_amount: {
      type: Number,
    },
    discount_amount: {
      type: Number,
    },
    status: {
      type: Boolean,
      default: true
    },
    voucher_limit: {
      type: Number
    },
    discount_type: {
      type: String,
      enum: ['percentage', 'flat']
    }
  },
  {
    timestamps: true,
  }
);

const VoucherModel = model<VoucherDocument>('Voucher', VoucherSchema);

export default VoucherModel;
