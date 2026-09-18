import mongoose, { Schema, model } from 'mongoose';

const conditionSchema = new Schema(
    {
        field: {
            type: String,
            required: true
        },
        operator: {
            type: String,
            enum: ['is equal to', 'is not equal to', 'starts with', 'ends with'],
            required: true
        },
        value: {
            type: Schema.Types.Mixed,
            default: ''
        }
    },
    { _id: false }
);

const conditionGroupSchema = new Schema(
    {
        conditionType: {
            type: String,
            enum: ['all', 'any'],
            default: 'all'
        },
        conditions: {
            type: [conditionSchema],
            default: []
        }
    },
    { _id: false }
);

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
            required: true,
            default: ''
        },

        fullSlug: {
            type: String,
            unique: true,
            index: true,
            required: true,
            default: ''
        },

        description: {
            type: String,
            default: ''
        },

        meta_title: {
            type: String,
            default: ''
        },

        meta_description: {
            type: String,
            default: ''
        },

        meta_keyword: {
            type: String,
            default: ''
        },

        search_terms: [{
            type: String,
            default: []
        }],

        image_alt: {
            type: String,
            default: ''
        },

        image: {
            type: String,
            default: ''
        },

        img_dimension: {
            type: String,
            enum: ['2x3', '4x3'],
            default: '2x3'
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
            default: true
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

        restricted_keywords: [{
            type: String,
            default: []
        }],

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
        conditionGroups: {
            type: [conditionGroupSchema],
            default: []
        },

        sortOrder: {
            type: Number,
            default: 0,
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const AdminCategoryModel = model('AdminCategory', adminCategorySchema);

export default AdminCategoryModel;