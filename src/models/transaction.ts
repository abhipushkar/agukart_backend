import mongoose, { Schema, model } from 'mongoose';

const Transactionhistory = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    transaction_id:{
      type: String,
      required: true,
    },
    message:{
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const transactionHistory = model('transaction', Transactionhistory);

export default transactionHistory;
