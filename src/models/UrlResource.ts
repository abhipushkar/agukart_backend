import mongoose, { Schema, Document } from "mongoose";

export interface IUrlResource extends Document {
  name: string;
  description: string;
  file: string;
  slug: string;
  link: string;
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const UrlResourceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    file: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    link: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUrlResource>(
  "UrlResource",
  UrlResourceSchema
);