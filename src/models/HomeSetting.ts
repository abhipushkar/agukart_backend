import mongoose, { Schema, Document, model } from 'mongoose';

const HomeSettingSchema = new Schema(
  {
    header_text: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    deal_1: {
      type: String,
      default: ''
    },
    deal_2: {
      type: String,
      default: ''
    },
    deal_1_link: {
      type: String,
      default: ''
    },
    deal_2_link: {
      type: String,
      default: ''
    },
    box1_title: {
      type: String,
      default: ''
    },
    box1_category: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminCategory',
      default: []
    }],
    box2_title: {
      type: String,
      default: ''
    },
    box2_category: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminCategory',
      default: []
    }],
    box3_title: {
      type: String,
      default: ''
    },
    box3_category: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminCategory',
      default: []
    }],
    box4_title: {
      type: String,
      default: ''
    },
    box4_category: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminCategory',
      default: []
    }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const HomeSettingModel = model('HomeSetting', HomeSettingSchema);

export default HomeSettingModel;
