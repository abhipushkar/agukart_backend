import mongoose, {Query} from "mongoose";

const deliveryServiceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true
        },
        description: {
            type: String,
            trim: true
        },
        logo: {
            type: String,
        },
        tracking_url: {
            type: String, // https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_id}
            required: true
        },
        supportDirectTracking: {
            type: Boolean,
            default: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    { timestamps: true }
);

deliveryServiceSchema.pre(/^find/, function (this: Query<any, any>, next) {
  this.where({ isDeleted: false });
  next();
});
export default mongoose.model("DeliveryService", deliveryServiceSchema);
