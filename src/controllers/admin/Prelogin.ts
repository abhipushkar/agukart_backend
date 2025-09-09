import { Response, Request } from "express";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import User from '../../models/User';

export const adminLogin = async (req: Request, resp: Response) => {
  try {
      const { email, password } = req.body;
      const user = await User.findOne({ email:email, designation_id : {$in : ['2','3']}});

      if (!user) {
          return resp.status(400).json({ message: 'User not found.' });
      }

      bcrypt.compare(password, user.password, async (err, result) => {
          if (err) {
            return resp.status(500).json({ message: 'Something went wrong. Please try again.' });
          }
          if (result) {

            let token = jwt.sign({ _id: user._id }, process.env.SECRET!);
            await User.updateOne(
              { _id: user._id },
              { $push: { multipleTokens: { token } } }
            );
        
            resp.status(200).json({ message: 'Login successfully', user, token: token });
          } else {
            
            resp.status(400).json({ message: 'Invalid Email or Password' });
          }
      });
  } catch (error) {
      resp.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};