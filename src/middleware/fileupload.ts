import { Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

interface CustomRequest extends Request {
  filepath?: any; // Adjust the type according to your user object structure
}

const storage = multer.diskStorage({
  destination: (req: CustomRequest, file, cb) => {
    if (!fs.existsSync(path.join("uploads", req.filepath))) {
      fs.mkdirSync(path.join("uploads", req.filepath));
    }
    cb(null, "uploads/" + req.filepath + "/"); // Specify the directory where you want to store the uploaded images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 10 * 1024 * 1024,
    fileSize: 10 * 1024 * 1024,
    fields: 10000,
    files: 1000,
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".jpeg",
      ".jpg",
      ".png",
      ".gif",
      ".webp",
      ".pdf",
      ".doc",
      ".docx",
    ];

    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/x-pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const fileExt = path.extname(file.originalname).toLowerCase();

    if (
      allowedMimes.includes(file.mimetype) ||
      allowedExtensions.includes(fileExt)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, PDFs, and Word documents are allowed."
        )
      );
    }
  },
});
