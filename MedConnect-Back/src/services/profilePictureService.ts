import uploadService from './uploadService';
import userRepository from '../repositories/userRepository';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import logger from '../utils/logger';

export class ProfilePictureService {
  // Upload profile picture
  async uploadProfilePicture(userId: number, file: Express.Multer.File): Promise<string> {
    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Invalid file type. Only JPG and PNG images allowed.', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError('File size exceeds 5MB limit', HTTP_STATUS.BAD_REQUEST);
    }

    // Get current user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Delete old profile picture if exists
    if (user.profile_picture) {
      try {
        await uploadService.deleteFromLocal(user.profile_picture);
      } catch (error) {
        logger.warn(`Failed to delete old profile picture: ${error}`);
      }
    }

    // Upload new profile picture
    const fileUrl = await uploadService.uploadToLocal(file, 'profile-pictures');

    // Update user profile
    await userRepository.update(userId, { profile_picture: fileUrl });

    logger.info(`Profile picture uploaded for user_id=${userId}`);

    return fileUrl;
  }

  // Delete profile picture
  async deleteProfilePicture(userId: number): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!user.profile_picture) {
      throw new AppError('No profile picture to delete', HTTP_STATUS.BAD_REQUEST);
    }

    // Delete file
    await uploadService.deleteFromLocal(user.profile_picture);

    // Update user profile
    //await userRepository.update(userId, { profile_picture: null });
    await userRepository.update(userId, { profile_picture: '' });

    logger.info(`Profile picture deleted for user_id=${userId}`);
  }
}

export default new ProfilePictureService();