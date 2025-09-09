import { Response, Request, NextFunction  } from "express"; 
import jwt from 'jsonwebtoken';

import User from '../models/User';
import mongoose from "mongoose";

interface CustomRequest extends Request {
    user?: any; // Adjust the type according to your user object structure
}

export const adminAuth = async (req:CustomRequest, resp:Response, next:NextFunction )=>{
    try {

        const authorizationHeader = req.headers['authorization'];

        if (!authorizationHeader) {
            return resp.status(401).send({ 
                message: 'Token not found in headers'
            });
        }

        const token = authorizationHeader.split(' ').pop();

        if (!token) {
            return resp.status(401).send({ 
                message: 'Token not found'
            });
        }


        const { _id } = jwt.verify(token, process.env.SECRET!) as { _id: string };

        const data = await User.findOne({ _id: new mongoose.Types.ObjectId(_id), "multipleTokens.token": token });

        if (data && data._id) {
            req.user=data;
            return next();
        } else {
            return resp.status(401).send({ 
                message: 'Token does not match any user'
            });
        }

    } catch (err) {

        return resp.status(401).send({
            message: "Invalid token"
        });
    }

} 

export default adminAuth;