import { buildUrl } from 'cloudinary-build-url';
import type { TransformerOption } from '@cld-apis/types';

function getCloudinaryURL(
  publicId: string,
  transformations: TransformerOption
) {
  let url = buildUrl(publicId, {
    cloud: {
      secure: true,
      cloudName: 'dof0zryca',
      useRootPath: true,
      privateCdn: true,
    },
    transformations: {
      quality: 'auto',
      fetchFormat: 'auto',
      background: 'auto',
      ...transformations,
    },
  });
  return url;
}

export { getCloudinaryURL };
