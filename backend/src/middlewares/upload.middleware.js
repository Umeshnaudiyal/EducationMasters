import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer storage to match database structure: /uploads/YYYY/MM/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Path relative to backend root directory: uploads/2026/09/
    const uploadDir = path.join(process.cwd(), 'uploads', `${year}`, `${month}`);

    // Create directory recursively if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${basename}_${Date.now()}${ext}`;
    cb(null, uniqueFilename);
  },
});

// File filter for images (WebP, JPG, JPEG, PNG, GIF, SVG, AVIF)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();

  const isExtValid = allowedExtensions.includes(ext);
  const isMimeValid = mimeType.startsWith('image/') || allowedExtensions.some(e => mimeType.includes(e.replace('.', '')));

  if (isExtValid || isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image format "${ext || file.originalname}". Allowed formats: WEBP, JPG, JPEG, PNG, GIF, SVG, AVIF.`), false);
  }
};

export const MAX_FILE_SIZE_BYTES = 300 * 1024; // 300 KB limit

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES }, // 300 KB limit
});
