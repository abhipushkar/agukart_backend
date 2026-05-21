import mongoose, { Schema, Document, model } from 'mongoose';
 
const informationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Terms & Conditions', 'Privacy Policy'],
      default: ''
    },
    description: {
      type: String,
      default: '',
    },
    meta_title: {
      type: String,
      default: '',
    },
    meta_description: {
      type: String,
      default: '',
    },
    meta_keywords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const InformationModel = model('Information', informationSchema);

export default InformationModel;
