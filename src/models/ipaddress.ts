import mongoose, { Schema, Document, model } from 'mongoose';
 
const ipaddress = new Schema(
  {
    ip:{
        type: String,
        default: null,
    },
    data:{
        type: JSON,
        default: null,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ipaddressModel = model('ipaddress', ipaddress);

export default ipaddressModel;
