import { Response } from 'express'; 

/** Class representing a Response. */
class ApiResponse {
  /**
   * Gets Response data
   *
   * @param {number} status status of API call
   * @param {object} data Response Data
   */
  constructor(public status: number, public data: object) {}
}

/** Class representing an Error Response. */
class ErrorResponse {
  /**
   * Setup a new Error Response
   *
   * @param {number} status code of error
   * @param {string} message error explanation
   * @param {object} error original error object
   */
  constructor(public status: number, public message: string, public error: object = {}) {}
}

/**
 * Handle response
 *
 * @param {Response} res http response object
 * @param {number} status http status code of the response
 * @param {object} data containing data to be returned
 */
export const handleResponse = (res: Response, status: number = 200, data: object) => {
  const response = new ApiResponse(status, data); 
  res.status(status).json({status:status,validation:true,data:data});
};

/**
 * Handle error response
 *
 * @param {Response} res http response object
 * @param {number} status http status code of the response
 * @param {string} message error message
 * @param {object} error error object
 */

export const handleErrorResponse = (res: Response, status: number = 500, message: string, error: object) => {
  const response = new ErrorResponse(status, message, error);
  res.status(status).json(response);
};
