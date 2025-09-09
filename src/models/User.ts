import { required } from 'joi';
import mongoose, { Schema, Document, model } from 'mongoose';

const userSchema = new Schema(
  {
    id_number: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['', 'manual', 'google'],
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
    phone_code: {
      type: String,
      default: '',
    },
    mobile: {
      type: String,
      default: '',
    },
    auth_key: {
      type: String,
      default: ''
    },
    multipleTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    email: {
      type: String,
      default: ''
    },
    designation_id: {
      type: Number,
      default: '2',
    },
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AffiliateUser',
      default: null
    },
    otp: {
      type: Number,
      default: '',
    },
    password: {
      type: String,
      default: ''
    },
    confirm_password: {
      type: String,
      default: ''
    },
    status: {
      type: Boolean,
      default: true
    },
    dob: {
      type: String,
      default: ''
    },
    occupation: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    country_id: {
      type: Number,
      ref: 'country',
    },
    state_id: {
      type: Number,
      ref: 'state',
    },
    city_id: {
      type: Number,
      ref: 'city',
    },
    gender: {
      type: String,
      enum: ['', 'male', 'female', 'others'],
      default: '',
    },
    showPassword: {
      type: String,
      default: ''
    },
    wallet_balance: {
      type: Number,
      default: 0
    },
    affiliate_code: {
      type: String,
      default: ''
    },
    affiliate_commission: {
      type: Number,
      default: 0
    },
    profession: {
      type: String,
      default: ''
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

const UserModel = model('User', userSchema);

export default UserModel;