import type { Transformation } from 'cloudinary-core';
import { Cloudinary } from 'cloudinary-core';

const cloudinary = new Cloudinary({ cloud_name: 'dof0zryca', secure: true });

function getCloudinaryURL(
  publicId: string,
  transformOptions: Transformation.Options = {}
) {
  const transforms: Transformation.Options = {
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
    ...transformOptions,
  };

  return cloudinary.url(publicId, transforms);
}

export { getCloudinaryURL };
