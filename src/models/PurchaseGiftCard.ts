import mongoose, { Schema, Document, model } from 'mongoose';

const PurchaseGiftCardSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gift_card_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GiftCard',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    qty: {
      type: Number,
      required: true,
      default: 1,
    },
    delivery_date: {
      type: Date,
      required: true,
    },
    gift_code:{
      type:String,
      required:true,
    },
    isRedeemed:{
      type:String,
      enum:['0','1'],
      default:0,
    },
    redeemedAt:{
      type:Date,
      default:null,
    },
    expiry_date:{
      type: Date,
      default: null
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const PurchaseGiftCardModel = model('PurchaseGiftCard', PurchaseGiftCardSchema);

export default PurchaseGiftCardModel;
