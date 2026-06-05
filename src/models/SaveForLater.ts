import mongoose, { Schema, model } from "mongoose";

const saveForLaterSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    qty: {
      type: Number,
      default: 1
    },

    isCombination: {
      type: Boolean,
      default: false
    },

    customize: {
      type: String,
      enum: ["", "Yes", "No"],
      default: ""
    },

    customizationData: [
      {
        type: Schema.Types.Mixed
      }
    ],

    variant_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant"
      }
    ],

    variant_attribute_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VariantAttribute"
      }
    ],

    variants: [
      {
        variantName: String,
        attributeName: String
      }
    ],

    saved_price: {
      type: Number,
      default: 0
    },

    saved_original_price: {
      type: Number,
      default: 0
    },

    affiliate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    shipping_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping",
      default: null
    },

    shippingName: {
      type: String,
      default: "standardShipping"
    },

    note: {
      type: String,
      default: ""
    },

    movedFromCartAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

saveForLaterSchema.index({ user_id: 1 });
saveForLaterSchema.index({
  user_id: 1,
  product_id: 1
});

const SaveForLater = model("SaveForLater", saveForLaterSchema);

export default SaveForLater;