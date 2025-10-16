import mongoose, { Schema, Document, model } from 'mongoose';

const variantAttributeSchema = new Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      required: true,
    },
    attribute_value: {
      type: String,
      default: null,
    },
    sort_order: {
      type: Number,
      default: null,
    },
    status: {
      type: Boolean,
      required: true,
      default:false
    },
    thumbnail: {
    type: String,
    default: ''
    },
    preview_image: {
    type: String,
    default: ''
    },
    main_images:{
    type: [String],
    default: []
    },
    deleted_status: {
      type: Boolean,
      required: true,
      default:false
    },
    deletedAt:{
      type:Date,
      default:null
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

variantAttributeSchema.index(
  { variant: 1, attribute_value: 1 },
  { unique: true, partialFilterExpression: { deleted_status: false } }
);

const VariantAttributeModel = model('VariantAttribute', variantAttributeSchema);

export default VariantAttributeModel;
