import mongoose, { Schema, Document, model } from 'mongoose';

const subscribeSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    status:{
      type: String,
      enum: ['subscribe', 'unsubscribe'],
      default: 'subscribe'
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SubscribeModel = model('Subscribe', subscribeSchema);

export default SubscribeModel;
