import { Cloudinary, Transformation } from 'cloudinary-core';

const cloudinary = new Cloudinary({ cloud_name: 'dof0zryca', secure: true });

function getCloudinaryURL(
  publicId: string,
  transformations: Transformation.Options = {}
) {
  const transforms: Transformation.Options = {
    ...transformations,
    fetchFormat: 'auto',
    quality: 'auto',
  };

  return cloudinary.url(publicId, transforms);
}

export { getCloudinaryURL };
