import multer from 'multer';
import { uploadFileToS3, generateEmployeePhotoKey, generateFormLogoKey } from './s3.js';
import concat from 'concat-stream';

/**
 * Custom S3 storage engine for multer
 */
class S3Storage {
  constructor(options = {}) {
    this.options = options;
  }

  _handleFile(req, file, cb) {
    // Get file buffer
    file.stream.pipe(concat(async (data) => {
      try {
        // Add buffer to file object for controllers to use
        file.buffer = data;
        
        // For now, we'll just pass the file info to the controller
        // The controller will handle the actual upload with consistent keys
        cb(null, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: data.length,
          buffer: data
        });
      } catch (error) {
        cb(error);
      }
    }));
  }

  _removeFile(req, file, cb) {
    // File removal would be handled separately if needed
    cb(null);
  }
}

/**
 * Factory function to create S3 storage instance
 * @param {object} options - Storage options
 * @returns {S3Storage} - S3 storage instance
 */
export const s3Storage = (options) => {
  return new S3Storage(options);
};

export default s3Storage;