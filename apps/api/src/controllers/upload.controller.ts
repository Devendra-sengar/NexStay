import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

/**
 * POST /api/upload/image
 * Accepts a single image file (multipart/form-data, field: "image")
 * Uploads to Cloudinary and returns the secure URL + public_id
 */
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    // Upload from buffer using upload_stream
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'nexstay/properties',
          transformation: [
            { width: 1200, height: 900, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result);
        }
      );
      stream.end(req.file!.buffer);
    });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err: any) {
    console.error('[upload] cloudinary error:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
};

/**
 * DELETE /api/upload/image
 * Deletes an image from Cloudinary by public_id
 */
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { public_id } = req.body;
    if (!public_id) {
      res.status(400).json({ success: false, message: 'public_id is required' });
      return;
    }
    await cloudinary.uploader.destroy(public_id);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Delete failed' });
  }
};
