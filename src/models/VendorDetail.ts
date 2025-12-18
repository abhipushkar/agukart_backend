import mongoose, { Schema, Document, model } from 'mongoose';
 
const vendorSchema = new Schema(
  {
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    shop_title: {
        type: String,
        default: '',
    },
    slug: {
        type: String,
        default: '',
    },
    shop_icon: {
        type: String,
        default: '',
    },
    shop_announcement: {
        type: String,
        default: '',
    },
    buyers_message: {
        type: String,
        default: '',
    },
    shop_name: {
        type: String,
        default: '',
    },
    shop_banner: [{
        image: { type: String},
        editedImage: {type: String},
        metaData: {
            scale: {type: Number, default: 0.0 },
            x : { type: Number, default: 0.0 },
            y : { type: Number, default: 0.0 } 
        }
    }],
    members: {
        type: JSON,
        default: [],
    },
    story_headline: {
        type: String,
        default: '',
    },
    story: {
        type: String,
        default: '',
    },
    shop_video: {
        type: String,
        default: '',
    },
    shop_photos: {
        type: JSON,
        default: [],
    },
    description: {
        type: String,
        default: '',
    },
    shop_policy: {
        type: String,
        default: '',
    },
    shop_address: {
        type: String,
        default: '',
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const VendorModel = model('VendorDetail', vendorSchema);

export default VendorModel;