import mongoose, { Schema, Document, model } from 'mongoose';

const blogSchema = new Schema(
  {
    tag_id: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogTag',
      required: true
    }],
    title:{
      type:String,
      default: ''
    },
    author_name:{
      type:String,
      default: ''
    },
    slug:{
      type:String,
      default: ''
    },
    short_description:{
      type:String,            
      default: ''    
    },
    description:{
      type:String,
      default: ''
    },
    image: {
      type: String,
      default:''
    },
    status: {
      type: Boolean,
      required: true,
      default:false
    },
    featured: {
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

const BlogModel = model('Blog', blogSchema);

export default BlogModel;
