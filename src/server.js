import express from "express";
import cors from "cors";
import mediaRoutes from "./media/index.js";
import {
  notFoundHandler,
  badRequestHandler,
  genericErrorHandler,
} from "./errorHandlers.js";

import listEndpoints from "express-list-endpoints";

const server = express();

const port = process.env.PORT || 5001;

const whitelist = [process.env.FE_URL_DEV, process.env.FE_URL_PROD];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      next(new Error("Not allowed by CORS"));
    }
  },
};

server.use(cors(corsOptions));
server.use(express.json());

server.use("/media", mediaRoutes);

server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

server.listen(port, () => console.log("server running", port));
