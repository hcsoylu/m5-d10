import express from "express";
import cors from "cors";
import mediaRoutes from "./media/index.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  notFoundHandler,
  badRequestHandler,
  genericErrorHandler,
} from "./errorHandlers.js";

import listEndpoints from "express-list-endpoints";

const currentWorkingFile = fileURLToPath(import.meta.url);
const currentWorkingDirectory = dirname(currentWorkingFile);
const publicFolderDirectory = join(currentWorkingDirectory, "../public/movies");

const server = express();

const port = process.env.PORT || 5001;

server.use(cors());
server.use(express.json());

server.use(express.static(publicFolderDirectory));

server.use("/media", mediaRoutes);

server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

server.listen(port, () => console.log("server running", port));
