import mongoose, { Schema, Document, model } from 'mongoose';

const blogTagSchema = new Schema(
  {
    title:{
      type:String,
      default: ''
    },
    slug:{
      type:String,
      default: ''
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

const BlogTagModel = model('BlogTag', blogTagSchema);

export default BlogTagModel;
