import { Cloudinary } from 'cloudinary-core';
import type { Transformation } from 'cloudinary-core';

const cloudinary = new Cloudinary({ cloud_name: 'dof0zryca', secure: true });

function getCloudinaryURL(
  publicId: string,
  transformOptions: Transformation.Options = {}
) {
  const transforms: Transformation.Options = {
    quality: 'auto',
    fetchFormat: 'auto',
    secure: true,
    background: 'auto',
    ...transformOptions,
  };

  const sortedTransforms = Object.keys(transforms)
    .sort((a, b) => a.localeCompare(b))
    .reduce<Transformation.Options>((accumulator, currentValue) => {
      accumulator[currentValue] = transforms[currentValue];
      return accumulator;
    }, {});

  return cloudinary.url(publicId, sortedTransforms);
}

export { getCloudinaryURL };
