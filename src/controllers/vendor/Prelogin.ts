import { Response, Request } from "express";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import User from '../../models/User';

export const vendorRegister = async (req: Request, resp: Response) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        if (user) {

            return resp.status(400).json({ message: "This user is already exists." });

        } else {
            const chkMobile = await User.findOne({ mobile: req.body.mobile });

            if (chkMobile) {

                return resp.status(400).json({ message: "This mobile is already associated with another user." });

            }

            let password = await bcrypt.hash(req.body.password, 10);

            const data: any = {
                name: req.body.name,
                mobile: req.body.mobile,
                email: req.body.email,
                password: password,
                designation_id: '3'
            }
            const user = await User.create(data);

            return resp.status(200).json({ message: "Registered Successfully.", success: true, user });
        }

    } catch (error) {
        resp.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};
