import { handleResponse } from "../helpers/response";
import { Response, Request, NextFunction } from "express";

const validationMiddleware = (schema: any) => (req: Request, res: Response, next: NextFunction) => {

  const dataToValidate = Object.keys(req.body).length !== 0 ? req.body : req.query;

  // Validate the data against the schema
  const validationResult = schema.validate(dataToValidate, { abortEarly: false });

  if (validationResult.error) {
    const errors = validationResult.error.details.map((detail: any) => {
      return {
        field: detail.context.key,
        message: detail.message,
      };
    });

    const result: any = {};  
    result.message = errors;
    result.success = false;

    handleResponse(res, 400, result);
    
  } else { 
    next();
  }
};

export default validationMiddleware;
