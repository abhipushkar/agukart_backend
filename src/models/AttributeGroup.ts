import mongoose, { Schema, Document } from "mongoose";

export interface IAttributeGroup extends Document {
  name: string;
  slug: string;
  order: number;
  status: boolean;
  isDeleted: boolean;
}

const AttributeGroupSchema = new Schema<IAttributeGroup>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    order: { type: Number, default: 1 },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<IAttributeGroup>("AttributeGroup", AttributeGroupSchema);