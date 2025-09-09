import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface CustomRequest extends Request {
    filepath?: any; // Adjust the type according to your user object structure
}

const storage = multer.diskStorage({
    destination: (req:CustomRequest, file, cb) => {
        if (!fs.existsSync(path.join('uploads', req.filepath))) {
            fs.mkdirSync(path.join('uploads', req.filepath));
        }
        cb(null, 'uploads/'+req.filepath+'/'); // Specify the directory where you want to store the uploaded images
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});

export const upload = multer({ 
                            storage: storage,
                            fileFilter: (req, file, cb) => {
                                if (file.mimetype.startsWith('image/')) {
                                    cb(null, true);
                                } else {
                                    cb(new Error('Invalid file type. Only images are allowed.'));
                                }
                            },
                         });