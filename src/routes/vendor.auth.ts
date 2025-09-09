import express from "express";   

import auth from '../middleware/auth';
import  validationMiddleware  from "../utils/multivalidate"; 
import { otpsend  } from "../validators/validators"; 

const routes=express.Router();

// routes.use('/user/',auth,userRoute )

export default routes;

