import mongoose, { Schema, Document, model } from 'mongoose';

const messageSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message_id : [{
        type:String,
        default: []
    }]
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const MessageModel = model('Message', messageSchema);

export default MessageModel;
