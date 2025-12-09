import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export class UploadService {
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  // Upload file to local storage
  async uploadToLocal(
    file: Express.Multer.File,
    folder: string = 'medical-records'
  ): Promise<string> {
    try {
      // Create upload directory if it doesn't exist
      const uploadPath = path.join(this.uploadDir, folder);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadPath, fileName);

      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Return URL to access file
      const fileUrl = `${this.baseUrl}/uploads/${folder}/${fileName}`;

      logger.info(`File uploaded to local storage: ${filePath}`);

      return fileUrl;
    } catch (error) {
      logger.error('Error uploading to local storage:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  // Delete file from local storage
  async deleteFromLocal(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      // URL format: http://localhost:3000/uploads/medical-records/filename.pdf
      const urlParts = fileUrl.split('/uploads/');
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL');
      }

      const relativePath = urlParts[1];
      const filePath = path.join(this.uploadDir, relativePath);

      // Delete file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`File deleted from local storage: ${filePath}`);
      }
    } catch (error) {
      logger.error('Error deleting from local storage:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  // Validate file type
  validateFileType(mimetype: string): boolean {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    return allowedTypes.includes(mimetype);
  }

  // Validate file size
  validateFileSize(size: number): boolean {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
    return size <= maxSize;
  }

  // Get file from local storage
  getFilePath(fileUrl: string): string {
    const urlParts = fileUrl.split('/uploads/');
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL');
    }

    const relativePath = urlParts[1];
    return path.join(this.uploadDir, relativePath);
  }
}

export default new UploadService();