import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth-middleware';
import { AppError } from '../utils/api-error';
import { ROLES } from '../utils/constants';
import { createReadUrlHandler, uploadFileHandler } from './upload-controller';

const uploadRouter: Router = Router();

const anyLoggedIn = authenticate([ROLES.USER, ROLES.EMPLOYER, ROLES.ADMIN]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});

uploadRouter.post(
  '/',
  anyLoggedIn,
  (req, res, next) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(400, 'UPLOAD_TOO_LARGE', 'File exceeds 25MB upload limit'));
        }
        return next(new AppError(400, 'UPLOAD_MULTER_ERROR', err.message));
      }
      if (err) return next(err);
      return next();
    });
  },
  uploadFileHandler,
);

uploadRouter.post('/read-url', anyLoggedIn, createReadUrlHandler);

export default uploadRouter;
