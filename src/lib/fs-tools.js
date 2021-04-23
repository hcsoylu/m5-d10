import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { readJSON, writeJSON, writeFile } = fs;

const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), "../data");

const moviesFolderPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/movies"
);

export const getMedias = async () =>
  await readJSON(join(dataFolderPath, "media.json"));

export const writeMedias = async (content) =>
  await writeJSON(join(dataFolderPath, "media.json"), content);

export const writeMoviesPictures = async (fileName, content) =>
  await writeFile(join(moviesFolderPath, fileName), content);
