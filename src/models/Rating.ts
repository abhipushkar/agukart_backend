import mongoose, { Schema, Document, model } from "mongoose";

const ratingSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    saledetail_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesDetails",
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorDetail",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    customer_service_rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    delivery_rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    item_rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    is_locked: {
      type: Boolean,
      default: false,
    },
    locked_at: {
      type: Date,
      default: null,
    },
    locked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    additional_comment: {
      type: String,
      required: true,
    },
    recommended: {
      type: Boolean,
      required: true,
      default: false,
    },
    seller_reply: {
      message: {
        type: String,
        default: "",
      },
      replied_at: {
        type: Date,
        default: null,
      },
      replied_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    is_hidden: {
      type: Boolean,
      default: false,
    },
    hidden_at: {
      type: Date,
      default: null,
    },
    is_flagged: {
      type: Boolean,
      default: false,
    },
    flag_reason: {
      type: String,
      default: "",
    },
    flagged_at: {
      type: Date,
      default: null,
    },
    internal_note: {
        note: String,
        created_at: {
          type: Date,
          default: Date.now,
        },
        created_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
    },
    buyer_note: {
        note: String,
        created_at: {
          type: Date,
          default: Date.now,
        },
        created_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
    },
    seller_note: {
        note: String,
        created_at: {
          type: Date,
          default: Date.now,
        },
        created_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
    },
    is_edited: {
      type: Boolean,
      default: false,
    },
    edited_at: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["new", "approved", "rejected"],
      default: "new",
    },
    reject_remark: {
      type: String,
      default: "",
    },
    approved_date: {
      type: Date,
      default: null,
    },
    rejected_date: {
      type: Date,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const RatingModel = model("Rating", ratingSchema);

export default RatingModel;
