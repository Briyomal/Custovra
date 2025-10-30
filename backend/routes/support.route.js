import express from 'express';
import { 
  createSupportTicket,
  getUserSupportTickets,
  getSupportTicketById,
  addMessageToTicket,
  updateTicketStatus,
  getAllSupportTickets,
  addAdminReplyToTicket,
  adminUpdateTicketStatus,
  serveSupportFile
} from '../controllers/support.controller.js';
import { verifyToken, adminRoute } from '../middleware/verifyToken.js';
import multer from 'multer';
import { s3Storage } from '../utils/s3Storage.js';

// Configure multer with S3 for support ticket file uploads
const storage = s3Storage({
  folder: 'support_tickets'
});

const supportUpload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit for support files
  },
  fileFilter: (req, file, cb) => {
    // Allow only image types
    const allowedMimes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPG, JPEG, PNG, GIF) are allowed.'), false);
    }
  }
});

const router = express.Router();

// Customer routes
router.post('/', verifyToken, supportUpload.single('file'), createSupportTicket);
router.get('/', verifyToken, getUserSupportTickets);
router.get('/:ticketId', verifyToken, getSupportTicketById);
router.post('/:ticketId/message', verifyToken, supportUpload.single('file'), addMessageToTicket);
router.patch('/:ticketId/status', verifyToken, updateTicketStatus);

// Admin routes
router.get('/admin/all', verifyToken, adminRoute, getAllSupportTickets);
router.post('/:ticketId/admin-reply', verifyToken, adminRoute, supportUpload.single('file'), addAdminReplyToTicket);
router.patch('/:ticketId/admin-status', verifyToken, adminRoute, adminUpdateTicketStatus);

// Serve support ticket files - using asterisk to capture the entire file path
router.get('/file/*', serveSupportFile);

export default router;