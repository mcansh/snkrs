import path from "node:path";
import fse from "fs-extra";
import svgstore from "svgstore";
import { globSync } from "glob";
import prettier from "prettier";

let HEROICONS_PATH = path.join(process.cwd(), "node_modules/heroicons");
let CUSTOM_ICON_DIR = path.join(process.cwd(), "app", "assets", "icons");

let HEROICONS_OUT_DIR = path.join("app", "components", "heroicons");

let OUTFILE = path.join(process.cwd(), HEROICONS_OUT_DIR, "sprite.svg");
let COMPONENT_FILE = path.join(process.cwd(), HEROICONS_OUT_DIR, "index.tsx");

let RELATIVE_OUTFILE = path.relative(process.cwd(), OUTFILE);
let RELATIVE_COMPONENT_FILE = path.relative(process.cwd(), COMPONENT_FILE);

let js = String.raw;

async function createSprite(inputDir) {
  let icons = globSync(`${inputDir}/**/*.svg`, { nodir: true });

  let relative = path.relative(process.cwd(), inputDir);
  let count = icons.length === 1 ? "icon" : "icons";
  console.log(`Found ${icons.length} ${count} in ./${relative}`);

  let sprites = new Map();

  for (let icon of icons) {
    let relative = path.relative(inputDir, icon);
    let basename = path.basename(icon);
    let iconName = basename.replace(".svg", "");
    // if the icon is in a subdirectory, add the subdirectory name to the icon name
    if (basename !== relative) {
      let dir = relative.split(path.sep);
      iconName = dir.slice(0, dir.length - 1).join(":") + ":" + iconName;
    }
    let content = await fse.readFile(icon, "utf-8");
    sprites.set(iconName, content);
  }

  return sprites;
}

async function compile() {
  await fse.ensureDir(HEROICONS_OUT_DIR);
  let heroicons = await createSprite(HEROICONS_PATH);
  let custom = await createSprite(CUSTOM_ICON_DIR);

  let all_icons = [...heroicons, ...custom];
  let all_names = [...all_icons].map(([name]) => name);

  let sprites = svgstore();
  for (let [name, content] of all_icons) {
    sprites.add(name, content);
  }

  let component = js`
    import iconsHref from "./sprite.svg";

    export type SpriteName = ${[...all_names]
      .map((icon) => `"${icon}"`)
      .join(" | ")};

    export type SpriteProps = { name: SpriteName; } & JSX.IntrinsicElements["svg"];

    export function Svg({ name, ...svgProps }: SpriteProps) {
      return (
        <svg {...svgProps} aria-hidden="true">
          <use href={iconsHref + "#" + name} />
        </svg>
      );
    }
  `;

  await Promise.all([
    fse.writeFile(
      OUTFILE,
      await prettier.format(sprites.toString(), { parser: "html" }),
    ),
    fse.writeFile(
      COMPONENT_FILE,
      await prettier.format(component, { parser: "typescript" }),
    ),
  ]);

  console.log(`Created ${RELATIVE_OUTFILE} and ${RELATIVE_COMPONENT_FILE}`);
}

compile();
