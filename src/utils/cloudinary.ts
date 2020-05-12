import { Cloudinary, Transformation } from 'cloudinary-core';

const cloudinary = new Cloudinary({ cloud_name: 'dof0zryca', secure: true });

function getCloudinaryURL(publicId: string, ...transformations: string[]) {
  const transforms: Transformation.Options = [
    ...new Set([...transformations, 'f_auto', 'q_auto']),
  ];

  return cloudinary.url(publicId, transforms);
}

export { getCloudinaryURL };
