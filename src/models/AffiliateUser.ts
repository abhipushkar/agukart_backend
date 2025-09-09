import mongoose, { Schema, Document, model } from 'mongoose';
 
const affiliateuserSchema = new Schema(
  {
    first_name:{
      type: String,
      default: '',
      required:true
    },
    last_name: {
      type: String,
      default: '',
    },
    mobile: {
      type: String,
      default: '',
      required:true
    },
    email: {
      type: String,
      required:true,
      default:'',
    },
    password: {
      type: String,
      default:''
    },
    confirm_password: {
      type: String,
      default:''
    },
    country_id: {
      type: Number,
      ref: 'country',
      required:true
    },
    state_id: {
      type: Number,
      ref: 'state',
      required:true
    },
    city_id: {
      type: Number,
      ref: 'city',
      required:true
    },
    address:{
      type: String,
      default: '',
      required:true
    },
    address_2:{
      type: String,
      default: '',
    },
    pin_code:{
      type: String,
      default: '',
      required:true
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['approved','rejected','pending']
    },
    show_password: {
      type:String,
      default:''
    },
    action_date:{
      type: Date,
      default:null
    },
    reject_remark:{
      type: String,
      default:''
    }
  },  
  {
    timestamps: true,
    versionKey: false,
  }
);

const AffiliateUserModel = model('AffiliateUser', affiliateuserSchema);

export default AffiliateUserModel;