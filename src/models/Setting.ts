import mongoose, { Schema, Document, model } from 'mongoose';
 
const settingSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Affiliate','Our Top Brands', 'Our Top Store', 'Wholesale', 'About Agukart', 'Contact Shop', 'Contact Us'],
      default: ''
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SettingModel = model('Setting', settingSchema);

export default SettingModel;
