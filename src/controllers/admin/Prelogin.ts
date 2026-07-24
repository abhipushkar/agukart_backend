import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import User from "../../models/User";
import { sendToEmail } from "../../helpers/common"

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

export const Login = async (req: Request, resp: Response) => {
    try {
        const { email, password } = req.body;

        const user: any = await User.findOne({
            email,
            designation_id: { $in: [2, 3] }
        });

        if (!user) {
            return resp.status(400).json({ message: "Invalid Email or Password" });
        }

        const result = await bcrypt.compare(password, user.password);

        if (!result) {
            return resp.status(400).json({ message: "Invalid Email or Password" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await User.updateOne(
            { _id: user._id },
            {
                login_otp: otp,
                login_otp_expires: new Date(Date.now() + 5 * 60 * 1000)
            }
        );

        let otpEmail = "";

        if (user.designation_id === 2) {
            otpEmail = process.env.ADMIN_LOGIN_OTP_EMAIL!;
        } else if (user.designation_id === 3) {
            otpEmail = process.env.VENDOR_LOGIN_OTP_EMAIL!;
        }

        const subject = "Agukart Login OTP";

        const body = `
            <h2>Agukart Login Verification</h2>

            <p><b>Name :</b> ${user.name}</p>
            <p><b>Email :</b> ${user.email}</p>
            <p><b>Role :</b> ${user.designation_id === 2 ? "Admin" : "Vendor"}</p>

            <h1>${otp}</h1>

            <p>This OTP will expire in 5 minutes.</p>
        `;

        await sendToEmail(
            otpEmail,
            subject,
            body,
            ""
        );

        return resp.status(200).json({
            status: true,
            message: "OTP sent successfully.",
            email: user.email
        });

    } catch (error) {
        return resp.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
};



export const verifyLoginOtp = async (req: Request, resp: Response) => {
    try {

        const { email, otp } = req.body;

        const user: any = await User.findOne({
            email,
            designation_id: { $in: [2, 3] }
        });

        if (!user) {
            return resp.status(400).json({
                message: "User not found."
            });
        }

        if (!user.login_otp || user.login_otp !== otp) {
            return resp.status(400).json({
                message: "Invalid OTP."
            });
        }

        if (!user.login_otp_expires || new Date() > new Date(user.login_otp_expires)) {
            return resp.status(400).json({
                message: "OTP has expired."
            });
        }

        const token = jwt.sign(
            { _id: user._id },
            process.env.SECRET!
        );

        await User.updateOne(
            { _id: user._id },
            {
                $push: {
                    multipleTokens: {
                        token
                    }
                },
                $set: {
                    login_otp: "",
                    login_otp_expires: null
                }
            }
        );

        const userData: any = user.toObject();

        delete userData.login_otp;
        delete userData.login_otp_expires;

        return resp.status(200).json({
            status: true,
            message: "Login successfully.",
            token,
            user: userData
        });

    } catch (error) {
        return resp.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
};