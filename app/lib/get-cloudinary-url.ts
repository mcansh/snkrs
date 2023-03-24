import { buildUrl } from "cloudinary-build-url";
import type { TransformerOption } from "@cld-apis/types";

let sizes = [200, 400, 600];

export function getImageURLs(publicId: string) {
  return sizes
    .map(
      (size) =>
        `${getCloudinaryURL(publicId, {
          resize: {
            type: "pad",
            width: size,
            height: size,
          },
        })} ${size}w`
    )
    .join(", ");
}

export function getCloudinaryURL(
  publicId: string,
  transformations: TransformerOption
) {
  let url = buildUrl(publicId, {
    cloud: {
      secure: true,
      cloudName: "dof0zryca",
      useRootPath: true,
      privateCdn: true,
    },
    transformations: {
      quality: "auto",
      fetchFormat: "auto",
      background: "auto",
      ...transformations,
    },
  });
  return url;
}
