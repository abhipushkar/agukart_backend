import mongoose, { Schema, Document, model } from 'mongoose';

const adminCategorySchema = new Schema(
    {
        parent_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AdminCategory',
            default: null
        },
        tag: [{
            type: String,
            default: []
        }],
        title: {
            type: String,
            default: ''
        },
        slug: {
            type: String,
            default: ''
        },
        image: {
            type: String,
            default: ''
        },
        special: {
            type: Boolean,
            required: true,
            default: false
        },
        popular: {
            type: Boolean,
            required: true,
            default: false
        },
        menuStatus: {
            type: Boolean,
            required: true,
            default: false
        },
        status: {
            type: Boolean,
            required: true,
            default: false
        },
        productsMatch: {
            type: String,
            enum: ['', 'Product Title', 'Product Tag'],
            default: ''
        },
        equalTo: {
            type: String,
            enum: ['', 'is equal to', 'is not equal to'],
            default: ''
        },
        value: {
            type: String,
            default: ''
        },
        restricted_keywords: [
            {
                type: String,
                default: []
            }
        ],
        isAutomatic: {
            type: Boolean,
            default: false
        },
        categoryScope: {
            type: String,
            enum: ['all', 'specific'],
            default: 'all'
        },
        selectedCategories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: []
        }],
        conditionType: {
            type: String,
            enum: ['all', 'any'],
            default: 'all'
        },
        conditions: {
            type: Array,
            default: []
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const AdminCategoryModel = model('AdminCategory', adminCategorySchema);

export default AdminCategoryModel;
