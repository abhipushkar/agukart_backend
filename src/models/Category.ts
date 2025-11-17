import mongoose, { Schema, Document, model } from 'mongoose';

const categorySchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      default: ''
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    parent_slug: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    topRatedImage: {
      type: String,
      default: ''
    },
    bestseller: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    status: {
      type: Boolean,
      required: true,
      default: false
    },
    topRated: {
      type: Boolean,
      required: true,
      default: false
    },
    attributeList_id: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttributeList' ,
      default: []
    }],
    variant_id: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      default: []
    }],
    description: {
      type: String,
      default: null
    },
    meta_title: {
      type: String,
      default: null
    },
    meta_keywords: {
      type: String,
      default: null
    },
    meta_description: {
      type: String,
      default: null
    },
    productsMatch: {
      type: String,
      enum: ['', 'Product Title', 'Product Tag'],
      default: ''
    },
    equalTo: {
      type: String,
      enum: ['', 'is equal to', 'is not equal to'],
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    restricted_keywords: [
      {
        type: String,
        default: []
      }
    ],
    conditions: {
      type: Array,
      default: []
    },
    conditionType: {
      type: String,
      enum: ['all', 'any'],
      default: 'all'
    },
    isAutomatic: {
      type: Boolean,
      default: false
    },
    categoryScope: {
      type: String,
      enum: ['all', 'specific'],
      default: 'all'
    },
    selectedCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: []
    }]
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const CategoryModel = model('Category', categorySchema);

export default CategoryModel;
