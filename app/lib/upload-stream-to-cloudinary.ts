import type { Readable } from 'stream';

import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

import { cloudinary } from './cloudinary.server';

function uploadFromStream(
  stream: Readable
): Promise<UploadApiResponse | UploadApiErrorResponse> {
  return new Promise((resolve, reject) => {
    const uploader = cloudinary.v2.uploader.upload_stream(
      { folder: 'shoes' },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    stream.pipe(uploader);
  });
}

export { uploadFromStream };
