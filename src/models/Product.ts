import mongoose, { Schema, Document, model } from 'mongoose';

const productSchema = new Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'User'
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null
    },
    exchangePolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Policy',
      default: null
    },
    variant_id: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      default: []
    }],
    variant_attribute_id: [{
      type: mongoose.Schema.Types.ObjectId,
      default: [],
      ref: 'VariantAttribute'
    }],
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParentProduct',
      default: null
    },
    product_title: {
      type: String,
      default: ''
    },
    product_type: {
      type: String,
      default: '',
    },
    tax_ratio: {
      type: Number,
      default: '0',
    },
    customize: {
      type: String,
      enum: ['', 'Yes', 'No'],
      default: '',
    },
    bullet_points: {
      type: String,
      default: '',
    },
    search_terms: [{
      type: String,
      default: [],
    }],
    sku_code: {
      type: String
    },
    tax_code: {
      type: String,
      default: '',
    },
    shipping_templates: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipping',
      default: null
    },
    price: {
      type: Number,
      default: 0,
    },
    sale_price: {
      type: Number,
      default: 0,
    },
    sale_start_date: {
      type: Date,
      default: null,
    },
    sale_end_date: {
      type: Date,
      default: null,
    },
    qty: {
      type: String,
      default:0
    },
    max_order_qty: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
    production_time: {
      type: String,
      default: '',
    },
    can_offer: {
      type: String,
      default: '',
    },
    gift_wrap: {
      type: String,
      default: '',
    },
    restock_date: {
      type: Date,
      default: null,
    },
    image: [{
      type: String,
      default: []
    }],
    altText: [{
      type: String,
      default: [],
    }],
    videos: [{
      type: String,
      default: [],
    }],
    launch_date: {
      type: Date,
      default: null,
    },
    release_date: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      default: ''
    },
    description_image: [{
      type: String,
      default: [],
    }],
    status: {
      type: Boolean,
      default: true,
    },
    top_rated: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    gender: [{
      type: String,
      default: [],
    }],
    size: {
      type: String,
      default: '',
    },
    product_size: {
      type: String,
      default: '',
    },
    size_map: {
      type: String,
      default: '',
    },
    color_textarea: {
      type: String,
      default: '',
    },
    color_map: {
      type: String,
      default: '',
    },
    style_name: {
      type: String,
      default: '',
    },
    shipping_weight: {
      type: String,
      default: '',
    },
    shipping_weight_unit: {
      type: String,
      default: '',
    },
    display_dimension_length: {
      type: String,
      default: '',
    },
    display_dimension_width: {
      type: String,
      default: '',
    },
    display_dimension_height: {
      type: String,
      default: '',
    },
    display_dimension_unit: {
      type: String,
      default: '',
    },
    package_dimension_height: {
      type: String,
      default: '',
    },
    package_dimension_length: {
      type: String,
      default: '',
    },
    package_dimension_width: {
      type: String,
      default: '',
    },
    package_dimension_unit: {
      type: String,
      default: '',
    },
    package_weight: {
      type: String,
      default: '',
    },
    package_weight_unit: {
      type: String,
      default: '',
    },
    unit_count: {
      type: String,
      default: '',
    },
    unit_count_type: {
      type: String,
      default: '',
    },
    how_product_made: {
      type: String,
      default: '',
    },
    occasion: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Occasions',
      default: []
    }],
    design: {
      type: String,
      default: '',
    },
    material: [{
      type: String,
      default: []
    }],
    price_shipping_cost: {
      type: Number,
    },
    your_minimum_price: {
      type: Number,
    },
    your_maximum_price: {
      type: Number,
    },
    discount: {
      type: Number
    },
    delivery_type: {
      type: String,
      enum: ['free', 'paid'],
      default: 'free',
    },
    delivery_amount: {
      type: Number,
      default: 0,
    },
    slug: {
      type: String,
      default: ''
    },
    stock: {
      type: Number,
      default: 0,
    },
    return_policy: {
      type: String,
      default: null,
    },
    meta_title: {
      type: String,
      default: null,
    },
    meta_keywords: {
      type: String,
      default: null,
    },
    meta_description: {
      type: String,
      default: null,
    },
    bestseller: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    popular_gifts: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    ratingAvg: {
      type: Number,
      default: 0,
    },
    product_bedge:{
      type:String,
      default: ''
    },
    userReviewCount: {
      type: Number,
      default: 0,
    },
    isCombination:{
      type: Boolean,
      default: false
    },
    combinationData: [
      {
        type: Schema.Types.Mixed,  // Use Mixed type if you need to store full documents
      }
    ],
    variations_data: [
      {
        type: Schema.Types.Mixed
      }
    ],
    dynamicFields:{
       type: Schema.Types.Mixed
    },
    form_values: {
      type: Object,
      default: {}
    },
    customizationData: {
      type: Object,
      default: {}
    },
    tabs: [
      {
        type: Schema.Types.Mixed
      }
    ],
    isDeleted:{
      type: Boolean,
      default: false
    },
    deletedByVendor:{
    type: Boolean,
    default: false
    },
    draft_status:{
      type: Boolean,
      default: true
    },
    sort_order: {
      type: Number,
      default: 0
    },
    zoom: {
      type: Object,
      default: {},
    },
    inActiveReason: {
      type: String,
      default: '' 
    },
    deletedVariantIds: [{
      type: String
    }]
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ProductModel = model('Product', productSchema);

export default ProductModel;
