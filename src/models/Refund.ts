import { ref, required } from "joi";
import mongoose, {Schema, model} from "mongoose";

const refundSchema = new Schema({
    sale_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sales',
        required: true
    },
    order_id: {
        type: String,
        required: true
    },
    sub_order_id: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ["Failed","Processed"],
        default: "Processed",
        index: true
    },
    performed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    performed_role: {
        type: String,
        enum: ["Admin", "Vendor"],
        required: true
    },
    notes: {
        type: String,
        default: "",
    },
},
{
    timestamps: true,
    versionKey: false
}
);


export const RefundModel = model("Refund", refundSchema);