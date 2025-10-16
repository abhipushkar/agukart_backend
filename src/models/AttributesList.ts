  import mongoose, { Schema, Document } from "mongoose";

  export interface IAttributeValue {
    value: string;
    sortOrder?: number;
    status?: boolean;
  }

  export interface ISubAttribute {
    name: string;
    type: "Text" | "Number" | "Yes/No" | "Dropdown" | "Compound";
    multiSelect?: boolean;
    values?: IAttributeValue[];
  }

  export interface IAttribute extends Document {
    name: string;
    type: "Text" | "Number" | "Yes/No" | "Dropdown" | "Compound";
    status: boolean;
    viewOnProductPage: boolean;
    viewInFilters: boolean;
    multiSelect?: boolean;
    values?: IAttributeValue[];
    subAttributes?: ISubAttribute[];
    isDeleted: boolean;
  }

  const AttributeValueSchema = new Schema<IAttributeValue>({
    value: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 1 },
    status: { type: Boolean, default: true },
  });

  const SubAttributeSchema = new Schema<ISubAttribute>({
    name: { type: String, required: true, trim: true },
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
      name: { type: String, required: true, trim: true },
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
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  );

  AttributeSchema.index(
    { name: 1 },
    {
      unique: true,
      collation: { locale: "en", strength: 2 },
      partialFilterExpression: { isDeleted: false },
    }
  );

  AttributeSchema.pre("save", function (next) {
    const doc = this as IAttribute;

    if (doc.subAttributes && doc.subAttributes.length > 0) {
      const names = doc.subAttributes.map((s) => s.name.trim().toLowerCase());
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        return next(
          new Error("Duplicate sub-attribute names are not allowed within the same attribute.")
        );
      }

      for (const sub of doc.subAttributes) {
        if (sub.values && sub.values.length > 0) {
          const valNames = sub.values.map((v) => v.value.trim().toLowerCase());
          const uniqueVals = new Set(valNames);
          if (valNames.length !== uniqueVals.size) {
            return next(
              new Error(
                `Duplicate values found in sub-attribute "${sub.name}". Each value must be unique.`
              )
            );
          }
        }
      }
    }

    if (doc.values && doc.values.length > 0) {
      const valNames = doc.values.map((v) => v.value.trim().toLowerCase());
      const uniqueVals = new Set(valNames);
      if (valNames.length !== uniqueVals.size) {
        return next(
          new Error("Duplicate dropdown values are not allowed within the same attribute.")
        );
      }
    }

    next();
  });

  export default mongoose.model<IAttribute>("AttributeList", AttributeSchema);
