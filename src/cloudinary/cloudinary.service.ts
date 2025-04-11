import { Injectable } from '@nestjs/common';
import { v2 } from 'cloudinary';
import * as streamifier from 'streamifier';

import { CloudinaryResponse } from './cloudinary-response';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = v2.uploader.upload_stream((error, result) => {
        if (error) return reject(error);
        if (result) {
          resolve(result as CloudinaryResponse);
        } else {
          reject(new Error('Upload result is undefined'));
        }
      });

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}