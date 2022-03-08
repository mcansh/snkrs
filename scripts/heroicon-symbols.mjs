import path from 'path';
import { promises as fs } from 'fs';

import { optimize, createContentItem } from 'svgo';
import prettier from 'prettier';

let HEROCIONS_PATH = path.join(process.cwd(), 'node_modules/heroicons');
let HEROCIONS_SOLID_PATH = path.join(HEROCIONS_PATH, 'solid');
let HEROCIONS_OUTLINE_PATH = path.join(HEROCIONS_PATH, 'outline');

let OUTDIR = path.join(process.cwd(), 'app/icons');
let OUTDIR_SOLID = path.join(OUTDIR, 'solid');
let OUTDIR_OUTLINE = path.join(OUTDIR, 'outline');

async function wrapSymbol(inputPath, outputDir) {
  let ext = path.extname(inputPath);
  let base = path.basename(inputPath, ext);
  let content = await fs.readFile(inputPath, 'utf-8');
  let outputPath = path.join(outputDir, `${base}.svg`);

  let result = optimize(content, {
    path: inputPath,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: {
              active: false,
            },
            removeDimensions: {
              active: true,
            },
          },
        },
      },
      {
        name: 'wrapInSymbol',
        type: 'perItem',
        fn: item => {
          if (item.type === 'element') {
            if (item.name === 'svg') {
              let { xmlns, ...attributes } = item.attributes;

              for (let attribute in attributes) {
                if (Object.hasOwn(attributes, attribute)) {
                  delete item.attributes[attribute];
                }
              }

              let children = item.children;

              item.children = [
                createContentItem({
                  type: 'element',
                  name: 'symbol',
                  attributes: { ...attributes, id: base },
                  children,
                }),
              ];
            }
          }
        },
      },
    ],
  });

  return fs.writeFile(
    outputPath,
    prettier.format(result.data, { parser: 'html' })
  );
}

async function compile() {
  // 1. verify all output directories exist
  await Promise.all([
    fs.mkdir(OUTDIR_OUTLINE, { recursive: true }),
    fs.mkdir(OUTDIR_SOLID, { recursive: true }),
  ]);

  // 2. get all svg icons from heroicons
  let [solid, outline] = await Promise.all([
    fs.readdir(HEROCIONS_SOLID_PATH),
    fs.readdir(HEROCIONS_OUTLINE_PATH),
  ]);

  // 3. generate icons
  await Promise.all([
    ...solid.map(icon =>
      wrapSymbol(path.join(HEROCIONS_SOLID_PATH, icon), OUTDIR_SOLID)
    ),
    ...outline.map(icon =>
      wrapSymbol(path.join(HEROCIONS_OUTLINE_PATH, icon), OUTDIR_OUTLINE)
    ),
  ]);
}

compile();
