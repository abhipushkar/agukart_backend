import mongoose, { Schema, Document } from "mongoose";

export interface IAttributeValue {
  value: string;        // option value like "Red", "Small"
  sortOrder?: number;   // ordering
  status?: boolean;     // active/inactive
}

export interface ISubAttribute {
  name: string;                  // sub-attribute name
  type: "Text" | "Number" | "Yes/No" | "Dropdown" | "Compound"; 
  multiSelect?: boolean;         // if dropdown supports multiple
  values?: IAttributeValue[];    // only for dropdown type
}

export interface IAttribute extends Document {
  name: string;
  type: "Text" | "Number" | "Yes/No" | "Dropdown" | "Compound";
  status: boolean;
  viewOnProductPage: boolean;
  viewInFilters: boolean;
  multiSelect?: boolean;          // only for dropdown
  values?: IAttributeValue[];     // dropdown values
  subAttributes?: ISubAttribute[]; // compound attributes
  isDeleted: boolean;
}

const AttributeValueSchema = new Schema<IAttributeValue>({
  value: { type: String, required: true },
  sortOrder: { type: Number, default: 1 },
  status: { type: Boolean, default: true },
});

const SubAttributeSchema = new Schema<ISubAttribute>({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["Text", "Number", "Yes/No", "Dropdown", "Compound"],
    required: true,
  },
  multiSelect: { type: Boolean, default: false },
  values: [AttributeValueSchema],
});

const AttributeSchema = new Schema<IAttribute>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["Text", "Number", "Yes/No", "Dropdown", "Compound"],
      required: true,
    },
    status: { type: Boolean, default: true },
    viewOnProductPage: { type: Boolean, default: false },
    viewInFilters: { type: Boolean, default: false },
    multiSelect: { type: Boolean, default: false },
    values: [AttributeValueSchema],
    subAttributes: [SubAttributeSchema],

    // Soft delete
    isDeleted: { type: Boolean, default: false}
  },
  { timestamps: true }
);

export default mongoose.model<IAttribute>("AttributeList", AttributeSchema);
