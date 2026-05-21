import mongoose, { Schema, Document, model } from 'mongoose';

const brandSchema = new Schema(
  {
    title:{
      type:String,
      required: true
    },
    slug:{
      type:String,            
      default: ''    
    },
    image: {
      type: String,
      default:''
    },
    image_alt: {
      type: String,
      default:''
    },
    link: {
      type: String,
      default:''
    },
    description:{
      type:String,
      required: true
    },
    meta_title: {
      type: String,
      default:''
    },
    meta_description: {
      type: String,
      default:''
    },
    meta_keywords: {
      type: [String],
      default:[]
    },
    featured: {
      type: Boolean,
      required: true,
      default:false
    },
    status: {
      type: Boolean,
      required: true,
      default:false
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const BrandModel = model('Brand', brandSchema);

export default BrandModel;
