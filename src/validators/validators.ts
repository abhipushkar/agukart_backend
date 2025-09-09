import Joi from 'joi';

export const validateSignup = Joi.object({
    name: Joi.string().required(),
    phone_code: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().min(8).required(),
    confirm_password: Joi.string().min(8).required(),
    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required()
});

export const validateChangeEmail = Joi.object({
    email: Joi.string().required().email(),
    confirm_email: Joi.string().required().email(),
    password: Joi.string().required(),
});

export const validateInformation = Joi.object({
    type: Joi.string().valid('Terms & Conditions', 'Privacy Policy').required().messages({
        'any.only': "Type must be one of ['Terms & Conditions', 'Privacy Policy']"
    }),
});

export const validateDescription = Joi.object({
    type: Joi.string().valid('Affiliate','Our Top Brands', 'Our Top Store', 'Wholesale', 'About Agukart', 'Contact Shop', 'Contact Us').required().messages({
        'any.only': "Type must be one of ['Affiliate','Our Top Brands', 'Our Top Store', 'Wholesale', 'About Agukart', 'Contact Shop', 'Contact Us']"
    }),
});

export const validateState = Joi.object({
    country_id: Joi.required()
});

export const validateCity = Joi.object({
    state_id: Joi.required()
});

export const otpsend = Joi.object({
  type: Joi.string().valid('mobile', 'gmail').required(),
  mobile: Joi.when('type', {
    is: 'mobile',
    then: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  gmail: Joi.when('type', {
    is: 'gmail',
    then: Joi.string().email().required(),
    otherwise: Joi.string().allow('').optional(),
  }),
});

export const validateLogin = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^\d+$/).required()
});

export const validateCategory = Joi.object({
    _id: Joi.string().required(),
    title: Joi.string().required(),
    parent_id: Joi.string()
});

export const validateCheckout = Joi.object({
    address_id: Joi.string().required(),
    name: Joi.when('address_id', {
        is: '0',
        then: Joi.string().required(),
    }),
    email: Joi.when('address_id', {
        is: '0',
        then: Joi.string().required().email(),
    }),
    mobile: Joi.when('address_id', {
        is: '0',
        then: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    }),
    phone_code: Joi.when('address_id', {
        is: '0',
        then: Joi.string().required(),
    }),
    address_line1: Joi.when('address_id', {
        is: '0',
        then: Joi.string().required(),
    }),
    address_line2: Joi.when('address_id', {
        is: '0',
        then: Joi.string().required(),
    }),
    state: Joi.when('address_id', {
        is: '0',
        then: Joi.string().required(),
    }),
    city: Joi.when('address_id', {
        is: '0',
        then: Joi.string().required(),
    }),
    pincode: Joi.when('address_id', {
        is: '0',
        then: Joi.string().required(),
    }),
});

export const validateUpdateProfile = Joi.object({
    dob: Joi.date().iso().max('now').required().
    messages({
        'string.empty': 'Date of birth is required',
        'date.format': 'Invalid date of birth format',
        'date.max': 'Date of birth must be in the past',
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
    }), 
}); 

export const validateLoanRequest = Joi.object({
    loan_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).length(24).required().label('Loan ID')
    .messages({
        'string.required': 'Loan ID is required.',
        'string.pattern.base': 'Invalid Loan ID.',
    })
}); 

export const validateincomeDetail = Joi.object({
    loan_refno: Joi.string().required().label('Loan Ref No.')
    .messages({ 
        'string.empty': 'Loan Ref. is required.', 
    }), 
    employeement_type: Joi.string().valid('Student', 'Salaried', 'Self Employed').required().label('Employeement Type').messages({
        'any.only': 'Employment type must be one of [Student, Salaried, Self Employed]',
        'string.required': 'Employment type is required',
    }),
    monthly_salary: Joi.string().regex(/^\d+$/).required().label('Monthly Salary').messages({
        'string.pattern.base': 'Invalid monthly salary format',
        'string.required': 'Monthly salary is required',
    }),
    company_name: Joi.string().regex(/^[A-Za-z\s]+$/).required().messages({
        'string.pattern.base':'Invalid Company Name',
        'string.required':'Company Name is required'
    }),
}); 

export const validateUploadPancard = Joi.object({
    loan_refno: Joi.string().required().label('Loan Ref No.')
    .messages({ 
        'string.empty': 'Loan Ref. is required.', 
    }),
}); 

export const validateUploadAdhaarcard = Joi.object({
    loan_refno: Joi.string().required().label('Loan Ref No.')
    .messages({ 
        'string.empty': 'Loan Ref. is required.', 
    }),
}); 

export const validateUploadSelfieImage = Joi.object({
    loan_refno: Joi.string().required().label('Loan Ref No.')
    .messages({ 
        'string.empty': 'Loan Ref. is required.', 
    }),
}); 

export const validAdhaarNo = Joi.object({
    loan_refno: Joi.string().required().label('Loan Ref No.')
    .messages({ 
        'string.empty': 'Loan Ref. is required.', 
    }),
    adhaarno: Joi.string().required().pattern(/^[0-9]{12}$/).message('Aadhaar number must be a 12-digit numeric value')
});
 
export const validPancardNo = Joi.object({
    loan_refno: Joi.string().required().label('Loan Ref No.')
    .messages({ 
        'string.empty': 'Loan Ref. is required.', 
    }),
    pancardno: Joi.string().required().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/).message('Invalid PAN card format. It should be in the format ABCDE1234F')
});

export const validreferanceDetail = Joi.object({
    loan_refno: Joi.string().required().label('Loan Ref No.')
    .messages({ 
        'string.empty': 'Loan Ref. is required.', 
    }),
    referncecontact_type: Joi.string().valid('Father', 'Mother', 'Spouse').required().label('Provide Contact Referance').messages({
        'any.only': 'Provide Contact Referance must be one of [Father, Mother, Spouse]',
        'string.required': 'Provide Contact Referance is required',
    }),
    referance_phonenumber: Joi.string().length(10).pattern(/^[0-9]+$/).required().label('Referance Phone Number'),
    referancefriend_name: Joi.string().regex(/^[A-Za-z\s]+$/).required().messages({
        'string.pattern.base':'Invalid Friend Referance Name',
        'string.required':'Friend Referance Name is required'
    }),
    referancefriend_phonenumber: Joi.string().length(10).pattern(/^[0-9]+$/).required().label('Referance Phone Number'), 
});


export const validGeneralInfo = Joi.object({
    loan_refno: Joi.string().required().label('Loan Ref No.')
    .messages({ 
        'string.empty': 'Loan Ref. is required.', 
    }), 
    marital_status: Joi.string().valid('Single', 'Married', 'Divorced').required().label('Marrital Status').messages({
        'any.only': 'Provide Marrital Status must be one of [Single, Married, Divorced]',
        'string.required': 'Provide Marrital Status is required',
    }),
    education: Joi.string().valid('Bachelors', 'Masters', 'Doctorate', 'Diploma', 'All India Senior School Certification (12th)', 'Secondary School Certification (10th)').required().label('Education').messages({
        'any.only': 'Provide Education must be one of [Bachelors, Masters, Doctorate, Diploma, All India Senior School Certification (12th)], Secondary School Certification (10th)',
        'string.required': 'Provide Education is required',
    }),
    occupation_id: Joi.string().required(),
    address_as_kyc: Joi.string().valid('Yes', 'No', 'Divorced').required().label('Address as KYC').messages({
        'any.only': 'Provide Address as KYC must be one of [Yes, No]',
        'string.required': 'Provide Address as KYC is required',
    }),
    pincode: Joi.string().when('address_as_kyc',{
        is:'No',
        then:Joi.string().required()
    }),
    address1: Joi.string().when('address_as_kyc',{
        is:'No',
        then:Joi.string().required().label('Address 1')
    }),
    address2: Joi.string().when('address_as_kyc',{
        is:'No',
        then:Joi.string().required().label('Address 2')
    }),
    residence_type: Joi.string().valid('Rented', 'Owned', 'PG', 'Office Provided', 'Others').required().label('Residence').messages({
        'any.only': 'Provide Residence Type must be one of [Rented, Owned, PG, Office Provided, Others',
        'string.required': 'Provide Education is required',
    })
});

export const validUpdateFinalLoanReq = Joi.object({
    loan_refno: Joi.string().required().label('Loan Ref No.')
    .messages({ 
        'string.empty': 'Loan Ref. is required.', 
    }), 
    needed_amount: Joi.string().required().label('Needed Amount').messages({ 
        'string.empty': 'Needed Amount is required',
    }),
    account_number: Joi.string().required().label('Account Number').messages({
        'string.empty': 'Account number is required',
    }),
    ifsc_code: Joi.string()
    .regex(/^[A-Z]{4}[0][A-Z0-9]{6}$/)
    .message('Invalid IFSC code. IFSC should be in the format: ABCD0123456'),
});



 