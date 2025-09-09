import express from "express"; 

import route from '../routes/api';

const routes=express.Router();
  
routes.use('/api', route);

export default routes;

