import { Cloudinary, Transformation } from 'cloudinary-core';

const cloudinary = new Cloudinary({ cloud_name: 'dof0zryca', secure: true });

function getCloudinaryURL(
  publicId: string,
  transformOptions: Transformation.Options = {}
) {
  const transforms: Transformation.Options = {
    fetchFormat: 'auto',
    quality: 'auto',
    ...transformOptions,
  };

  return cloudinary.url(publicId, transforms);
}

export { getCloudinaryURL };
