import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware';
import { uploadImage, deleteImage } from '../controllers/upload.controller';

const router = Router();

// Store file in memory buffer (no disk writes)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
  },
});

// POST /api/upload/image  — upload single image
router.post('/image', protect, upload.single('image'), uploadImage);

// DELETE /api/upload/image — delete by public_id
router.delete('/image', protect, deleteImage);

export default router;
