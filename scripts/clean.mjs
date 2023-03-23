#!/usr/bin/env node

import path from "node:path";
import { deleteAsync } from "del";
import kleur from "kleur";
import Gitignore from "gitignore-fs";
import { globSync } from "glob";

import remixConfig from "../remix.config.mjs";

async function clean() {
  let cwd = process.cwd();
  let gitignore = new Gitignore();

  let files = await globSync("**/*", {
    absolute: true,
    ignore: ["node_modules/**/*", ".husky/**/*", ".env"],
    nodir: true,
    cwd,
  });

  let filesToDelete = files.filter((file) => {
    return gitignore.ignoresSync(file);
  });

  let deleted = await deleteAsync([
    ...filesToDelete,
    remixConfig.cacheDirectory,
  ]);

  if (deleted.length > 0) {
    let deletedPaths = deleted.map((file) => path.relative(cwd, file));
    console.log(`✨ Deleted the following files and directories`);
    console.log(
      kleur.red(deletedPaths.map((file) => "👉 " + file).join("\n") + "\n")
    );
  }
}

clean().then(
  () => {
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
