import mongoose, { Schema, model } from 'mongoose';

const GiftCardTransactionHistorySchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    purchase_gift_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseGiftCard',
      default: null,
    },
    transaction_type: {
      type: String,
      enum: ['Dr', 'Cr'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    gift_card_image: { 
      type: String,  
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const GiftCardTransactionHistoryModel = model('GiftCardTransactionHistory', GiftCardTransactionHistorySchema);

export default GiftCardTransactionHistoryModel;
