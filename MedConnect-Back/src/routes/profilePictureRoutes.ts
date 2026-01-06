import { Router } from 'express';
import profilePictureController from '../controllers/profilePictureController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Upload profile picture
router.post(
  '/upload',
  authenticate,
  upload.single('profile_picture'),
  profilePictureController.uploadProfilePicture
);

// Delete profile picture
router.delete(
  '/',
  authenticate,
  profilePictureController.deleteProfilePicture
);

export default router;