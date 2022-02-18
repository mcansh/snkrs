import type { UploadHandler } from 'remix';
import cuid from 'cuid';
import streamToBlob from 'stream-to-blob';

export let MAX_FILE_SIZE = 1024 * 1024 * 10; // 10 MB (Cloudflare limit)

interface UploadResult {
  result: {
    id: string;
    filename: string;
    uploaded: string;
    variants: Array<string>;
  } | null;
  result_info: null;
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
}

export function createUploadHandler(
  mediaInputNames: Array<string>
): UploadHandler {
  return async ({ name, stream }) => {
    if (!mediaInputNames.includes(name)) {
      stream.resume();
      return;
    }

    const filename = cuid();

    let blob = await streamToBlob(stream);

    const body = new FormData();
    body.append('file', blob, filename);

    let url = new URL(
      `/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      'https://api.cloudflare.com'
    );

    const uploadPromise = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
      },
      body,
    });

    let response = (await uploadPromise.json()) as UploadResult;

    if (response.success && response.result) {
      return response.result.id;
    }

    throw new Error(
      `Cloudflare upload failed: ${response.errors.map(error => error.message)}`
    );
  };
}

// export async function uploadImage(file: File) {
//   const body = new FormData();
//   body.append('file', file, file.name);

//   let url = new URL(
//     `/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
//     'https://api.cloudflare.com'
//   );

//   const uploadPromise = await fetch(url.toString(), {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
//     },
//     body,
//   });

//   let response = await uploadPromise.json();

//   console.log(response);

//   const isFileUploaded = response.status === 'success';

//   // ... File is uploaded to CF Images
// }
