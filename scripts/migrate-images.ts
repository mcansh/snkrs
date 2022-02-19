/* eslint-disable no-console */
import { installGlobals } from '@remix-run/node';
import streamToBlob from 'stream-to-blob';

import { prisma } from '~/db.server';
import { uploadImage } from '~/lib/upload-image.server';

installGlobals();

async function migrate() {
  let sneakers = await prisma.sneaker.findMany();

  console.log(
    `Migrating ${sneakers.length} sneaker${sneakers.length === 1 ? '' : 's'}...`
  );

  await Promise.allSettled(
    sneakers.map(async sneaker => {
      if (!sneaker.imagePublicId.startsWith('shoes/')) {
        console.log(`Skipping sneaker ${sneaker.id}...`);
        return;
      }

      let url = new URL(
        sneaker.imagePublicId,
        `https://${process.env.CLOUDINARY_CLOUDNAME}-res.cloudinary.com`
      );

      let promise = await fetch(url.toString());
      let image = await promise.blob();
      let blob = await streamToBlob(image.stream());
      let id = await uploadImage(blob);

      if (!id) {
        console.error(`Failed to migrate image for sneaker ${sneaker.id}`);
        return;
      }

      await prisma.sneaker.update({
        where: { id: sneaker.id },
        data: { imagePublicId: id },
      });

      console.log(`Migrated image for sneaker ${sneaker.id}`);
    })
  );
}

void migrate();
