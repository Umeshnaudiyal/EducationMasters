import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Resolve the base uploads directory reliably (supports Webzu, custom mounts, or local dev)
export const getUploadsBaseDir = () => {
  if (process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim()) {
    return path.resolve(process.env.UPLOADS_DIR.trim());
  }
  return path.resolve(process.cwd(), 'uploads');
};

// Configure Multer diskStorage to match database structure: /uploads/YYYY/MM/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const baseDir = getUploadsBaseDir();
    const uploadDir = path.join(baseDir, `${year}`, `${month}`);

    try {
      // Create directory recursively with read/write permissions
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
      }
      cb(null, uploadDir);
    } catch (err) {
      console.warn(`[UPLOAD] Primary upload directory "${uploadDir}" not writable (${err.message}). Attempting fallback.`);
      // Fallback for environments with restricted root permissions
      try {
        const fallbackDir = path.join('/tmp', 'uploads', `${year}`, `${month}`);
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true, mode: 0o755 });
        }
        cb(null, fallbackDir);
      } catch (fallbackErr) {
        cb(new Error(`Server storage error: Could not create upload directory. Please ensure directory write permissions are granted on the host.`));
      }
    }
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

export const MAX_FILE_SIZE_BYTES = 200 * 1024; // Strict 200 KB limit

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES }, // 200 KB limit
});
