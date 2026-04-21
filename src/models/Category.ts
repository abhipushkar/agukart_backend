import { required } from 'joi';
import mongoose, { Schema, Document, model } from 'mongoose';

const categorySchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      index: true
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    parent_slug: {
      type: String,
      default: '',
      index: true
    },
    fullSlug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    image: {
      url: {
      type: String,
      default: ''
      },
      alt: {
        type: String,
        default: ''
      }
    },
    topRatedImage: {
      url: {
        type: String,
        default: ''
      },
      alt: {
        type: String,
        default: ''
      }
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
    showInProductListing: {
      type: Boolean,
      default: true
    },
    showInMainUI: {
      type: Boolean,
      default: true
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
    search_terms: [{
      type: String,
      default: [],
    }],
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
