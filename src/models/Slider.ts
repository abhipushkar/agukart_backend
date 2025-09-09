import mongoose, { Schema, Document, model } from 'mongoose';

const sliderSchema = new Schema(
  {
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

const SliderModel = model('Slider', sliderSchema);

export default SliderModel;
