import Joi from 'joi';
import mongoose from 'mongoose';

const objectId = Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
}, 'ObjectId validation');

export const loginValid = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const categoryValid = Joi.object({
    _id: Joi.string().required(),
    parent_id: objectId.optional().allow(null),
    description: Joi.string().required().messages({
        'string.empty': 'description is required'
    }),
    title: Joi.string().required().messages({
        'string.empty': 'Title is required'
    }),
    bestseller: Joi.string().required().valid('Yes', 'No').messages({
        'any.only': 'Bestseller must be one of [Yes, No]',
        'string.required': 'Bestseller is required'
    }),
    meta_title: Joi.string().required().messages({
        'string.empty': 'Meta title is required'
    }),
    meta_keywords: Joi.string().required().messages({
        'string.empty': 'Meta keywords is required'
    }),
    meta_description: Joi.string().required().messages({
        'string.empty': 'Meta description is required'
    }),
    variant_id: Joi.array().items(objectId).required().messages({
        'array.includes': 'Variant id must be a valid ObjectId'
    }),
    attributeList_id: Joi.array().items(objectId).required().messages({
        'array.includes': 'attribute List id must be a valid ObjectId'
    }),
    productsMatch: Joi.string().optional().allow(''),
    equalTo: Joi.string().optional().allow(''),
    value: Joi.string().optional().allow(''),
    restricted_keywords: Joi.array().optional().allow(''),
        conditions: Joi.array().items(
        Joi.object({
            field: Joi.string().required(),       
            operator: Joi.string().required(),      
            value: Joi.any().required()              
        })
    ).optional().default([]),

    conditionType: Joi.string()
        .valid('all', 'any')
        .optional()
        .default('all'),

    isAutomatic: Joi.boolean().optional().default(false),

    categoryScope: Joi.string()
        .valid('all', 'specific')
        .optional()
        .default('all'),

    selectedCategories: Joi.array()
        .items(objectId)
        .optional()
        .default([]),
});

export const statusValid = Joi.object({
    id: Joi.string().required(),
    status: Joi.required()
});

export const brandValid = Joi.object({
    _id: Joi.string().required(),
    title: Joi.string().required().messages({
        'string.empty': 'Title is required'
    }),
    description: Joi.string().required().messages({
        'string.empty': 'Description is required'
    }),
    link: Joi.string().required().messages({
        'string.empty': 'Link is required'
    }),
});

export const validateProfile = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Title is required'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
    }),
    mobile: Joi.string().pattern(/^[0-9]+$/).required(),
});

export const validateChangePassword = Joi.object({
    old_password: Joi.string().required(),
    new_password: Joi.string().min(8).required(),
    confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
        'any.only': 'Confirm password must match new password'
    })
});

export const informationValid = Joi.object({
    _id: Joi.string().required(),
    type: Joi.string().valid('Terms & Conditions', 'Privacy Policy').required(),
    description: Joi.string().required().label('Description')
        .messages({
            'string.empty': 'Description is required.',
        }),
});

export const vendorValid = Joi.object({
    _id: Joi.string().required(),
    name: Joi.string().required().messages({
        'string.empty': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
    }),
    mobile: Joi.string().pattern(/^[0-9]+$/).required().messages({
        'string.empty': 'Mobile is required',
    }),
    phone_code: Joi.string().required().messages({
        'string.empty': 'Phone code is required',
    }),
    gender: Joi.string().valid('male', 'female', 'others').required().messages({
        'string.empty': 'Gender is required',
        'any.only': 'Gender must be one of [male, female, others]'
    }),
    dob: Joi.string().required().messages({
        'string.empty': 'Date of Birth is required',
    }),
    country_id: Joi.string().required().messages({
        'string.empty': 'Country is required',
    }),
    state_id: Joi.string().required().messages({
        'string.empty': 'State is required',
    }),
    city_id: Joi.string().required().messages({
        'string.empty': 'City is required',
    }),
    password: Joi.string().min(8).required().messages({
        'string.empty': 'Password is required',
    }),
    confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Confirm password must match password'
    })
});

export const variantAttributeValid = Joi.object({
    _id: Joi.string().required(),
    variant: Joi.string().required().messages({
        'string.empty': 'Variant is required'
    }),
    attribute_value: Joi.string().required().messages({
        'string.empty': 'Attribute Value is required'
    }),

});

export const productValid = Joi.object({
    _id: Joi.string().required(),
    category: Joi.string().required().messages({
        'string.empty': 'Category is required'
    }),
    food_type: Joi.string().required().messages({
        'string.empty': 'Food Type is required'
    }),
    variant_id: Joi.string().required().messages({
        'string.empty': 'Variant is required'
    }),
    product_title: Joi.string().required().messages({
        'string.empty': 'Category Title is required'
    }),
    tax_ratio: Joi.number().integer().required().messages({
        'number.integer': 'Tax Ratio must be an integer',
        'number.base': 'Tax Ratio is required',
    }),
    short_description: Joi.string().required().messages({
        'string.empty': 'Short Description is required'
    }),
    description: Joi.string().required().messages({
        'string.empty': 'Description is required'
    }),
});

export const variantValid = Joi.object({
    _id: Joi.string().required(),
    variant_name: Joi.string().required().messages({
        'string.empty': 'Variant name is required'
    }),
});

export const loanValid = Joi.object({
    _id: Joi.string().required(),
    title: Joi.string().required().messages({
        'string.empty': 'Loan Title is required'
    }),
    duration: Joi.string().required().messages({
        'string.empty': 'Loan Duration is required'
    }),
    min_loan_amount: Joi.string().required().messages({
        'string.empty': 'Minimum loan Amount is required'
    }),
    max_loan_amount: Joi.string().required().messages({
        'string.empty': 'Maximum loan Amount is required'
    }),
    processing_fee: Joi.string().required().messages({
        'string.empty': 'Processing Fee is required'
    }),
    interest_rate: Joi.string().required().messages({
        'string.empty': 'Interest rate is required'
    }),
    required_documents: Joi.string().required().messages({
        'string.empty': 'Required documents is required'
    }),
    eligibility_criteria: Joi.string().required().messages({
        'string.empty': 'Eligibility criteria is required'
    }),
    description: Joi.string().required().messages({
        'string.empty': 'Description is required'
    }),
});

export const approveLoan = Joi.object({
    approve_Id: Joi.string().required(),
    disbursed_amount: Joi.number().integer().required().messages({
        'number.integer': 'Disbursed Amount must be an integer',
        'number.base': 'Disbursed Amount is required',
    }),
    disbursed_interestrate: Joi.number().integer().required().messages({
        'number.integer': 'Disbursed Interest Rate must be an integer',
        'number.base': 'Disbursed Interest Rate is required',
    }),
    disbursed_timeduration: Joi.number().integer().required().messages({
        'number.integer': 'Disbursed Time Duration must be an integer',
        'number.base': 'Disbursed Time Duration is required',
    }),
    disbursed_timedurationtype: Joi.string().required().messages({
        'string.empty': 'Disbursed duration type is required'
    })
});

export const rejectLoan = Joi.object({
    reject_id: Joi.string().required(),
    reject_reason: Joi.string().required().messages({
        'string.empty': 'Reject Reason is required'
    }),
});

export const documentValid = Joi.object({
    _id: Joi.string().required(),
    required_document: Joi.string().required().messages({
        'string.empty': 'Document is required'
    }),
});

export const createStoreValid = Joi.object({
    store_name: Joi.string().min(3).required(),

    product_select: Joi.string()
        .valid('Products Name', 'Products SKU')
        .required(),

    selected_sku_codes: Joi.alternatives().conditional('product_select', {
        is: 'Products SKU',
        then: Joi.array().items(Joi.string().required()).min(1).required()
            .messages({ 'array.min': 'At least one SKU code is required when product_select is "Products SKU"' }),
        otherwise: Joi.forbidden()
    }),

    selected_products: Joi.alternatives().conditional('product_select', {
        is: 'Products Name',
        then: Joi.array()
            .items(
                Joi.string().custom((value, helpers) => {
                    if (!mongoose.Types.ObjectId.isValid(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }, 'ObjectId Validation')
            )
            .min(1)
            .required()
            .messages({ 'array.min': 'At least one product is required when product_select is "Products Name"' }),
        otherwise: Joi.forbidden()
    }),

    sort_order: Joi.number().integer().min(0).required()
});

export const updateStoreValid = Joi.object({
    _id: Joi.string().required(),
    store_name: Joi.string().min(3).required(),

    product_select: Joi.string()
        .valid('Products Name', 'Products SKU')
        .required(),

    selected_sku_codes: Joi.alternatives().conditional('product_select', {
        is: 'Products SKU',
        then: Joi.array().items(Joi.string().required()).min(1).required()
            .messages({ 'array.min': 'At least one SKU code is required when product_select is "Products SKU"' }),
        otherwise: Joi.forbidden()
    }),

    selected_products: Joi.alternatives().conditional('product_select', {
        is: 'Products Name',
        then: Joi.array()
            .items(
                Joi.string().custom((value, helpers) => {
                    if (!mongoose.Types.ObjectId.isValid(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }, 'ObjectId Validation')
            )
            .min(1)
            .required()
            .messages({ 'array.min': 'At least one product is required when product_select is "Products Name"' }),
        otherwise: Joi.forbidden()
    }),

    sort_order: Joi.number().integer().min(0).required()
})

export const updateStoreStatusValid = Joi.object({
    id: Joi.string().required(),
    status: Joi.boolean().required(),
})
    