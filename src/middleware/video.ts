import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/video';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, fileName);
    }
});

export const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Only videos are allowed'));
    }
    cb(null, true);
  },
  limits: { files: 2 } // Limit to 2 files
}).array('videos', 2); // Allow up to 2 videos
