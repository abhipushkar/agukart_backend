import mongoose, { Schema, Document, model } from 'mongoose';

const reportSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['ip', 'policy'],
    },
    reporttype: {
      type: String,
      required: true,
      enum: ['shop', 'product'],
    },

    ownershipDeclaration: String,
    firstName: String,
    lastName: String,
    companyName: String,
    jobTitle: String,
    country: String,
    state: String,
    city: String,
    zipCode: String,
    address: String,
    email: String,
    phone: String,
    ipType: String,
    ipOwner: String,
    educationalAvailable: String,
    educationalUrl: String,
    intellectualProperty: String,
    ownsintellectualProperty: String,
    educationResource: String,
    ipData: mongoose.Schema.Types.Mixed,
    report_id: {
      type: String,
      default: '',
    },

    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    status:{
      type: String,
      enum: ['pending', 'resolved', 'rejected', 'hold'],
      default: 'pending'
    },

    reason: String,
    description: String,
  },
  { timestamps: true }
);

reportSchema.pre('validate', function (next) {
  const doc: any = this;

  if (doc.type === 'ip') {
    if (doc.reporttype === 'shop' && !doc.store_id) {
      return next(new Error('store_id is required for IP type and shop report'));
    }
    if (doc.reporttype === 'product' && !doc.product_id) {
      return next(new Error('product_id is required for IP type and product report'));
    }
  }

  if (doc.type === 'policy') {
    if (!doc.reason || !doc.description) {
      return next(new Error('reason and description are required for policy reports'));
    }

    if (doc.reporttype === 'shop' && !doc.store_id) {
      return next(new Error('store_id is required for policy type and shop report'));
    }

    if (doc.reporttype === 'product' && !doc.product_id) {
      return next(new Error('product_id is required for policy type and product report'));
    }
  }

  next();
});

const reportModel = model('Report', reportSchema);

export default reportModel;
