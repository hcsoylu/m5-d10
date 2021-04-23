import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { readJSON, writeJSON } = fs;

const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), "../data");

export const getMedias = async () =>
  await readJSON(join(dataFolderPath, "media.json"));

export const writeMedias = async (content) =>
  await writeJSON(join(dataFolderPath, "media.json"), content);
