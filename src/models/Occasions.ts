import mongoose, { Schema, model } from 'mongoose';

const occassionSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default:''
    },
    status: {
      type: Boolean,
      required: true,
      default: false
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const OccassionModel = model('Occassion', occassionSchema);

export default OccassionModel;
