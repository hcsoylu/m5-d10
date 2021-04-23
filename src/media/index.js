import express from "express";
import uniqid from "uniqid";
import { check, validationResult } from "express-validator";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
const { dirname, join } = path;

const { writeFile } = fs;

const upload = multer({});

const router = express.Router();

import {
  getMedias,
  writeMedias,
  writeMoviesPictures,
} from "../lib/fs-tools.js";

const movieValidation = [
  check("Title").exists().withMessage("The media's title is required"),
  check("Year").isInt().exists().withMessage("A year is required: YYYY"),
  check("Type").exists().withMessage("Let us know what type of media this is"),
];

router.get("/", async (req, res, next) => {
  try {
    const medias = await getMedias();
    res.send(medias);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:imdbID", async (req, res, next) => {
  try {
    const medias = await getMedias();
    const mediaFound = medias.find(
      (media) => media.imdbID === req.params.imdbID
    );
    if (mediaFound) {
      res.send(mediaFound);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/", movieValidation, async (req, res, next) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const err = new Error();
      err.httpStatusCode = 400;
      err.message = validationErrors;
      next(err);
    } else {
      const medias = await getMedias();
      medias.push({
        ...req.body,
        imdbID: uniqid(),
        createdAt: new Date(),
        reviews: [],
      });
      await writeMedias(medias);
      res.status(201).send("ok");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put("/:imdbID", async (req, res, next) => {
  try {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      const err = new Error();
      err.httpStatusCode = 400;
      err.message = validationErrors;
      next(err);
    } else {
      const medias = await getMedias();

      const newMedias = medias.filter(
        (media) => media.imdbID !== req.params.imdbID
      );

      const modifiedMedia = {
        ...req.body,
        imdbID: req.params.imdbID,
        modifiedAt: new Date(),
        reviews: [],
      };

      newMedias.push(modifiedMedia);
      await writeMedias(newMedias);

      res.send(modifiedMedia);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/:imdbID", async (req, res, next) => {
  try {
    const medias = await getMedias();

    const newMedias = medias.filter(
      (media) => media.imdbID !== req.params.imdbID
    );

    writeMedias(newMedias);
    res.send("deleted");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:imdbID/reviews", async (req, res, next) => {
  try {
    const medias = await getMedias();

    const selectedMedia = medias.find(
      (media) => media.imdbID === req.params.imdbID
    );

    if (selectedMedia.reviews.length > 0) {
      res.send(selectedMedia.reviews);
    } else {
      res.send("no reviews yet");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/:imdbID/reviews", async (req, res, next) => {
  try {
    const medias = await getMedias();
    let selectedMedia = medias.find(
      (media) => media.imdbID === req.params.imdbID
    );

    if (selectedMedia) {
      const newReview = { ...req.body, id: uniqid(), createdAt: new Date() };

      selectedMedia.reviews = [...selectedMedia.reviews, newReview];

      res.send(selectedMedia);

      await writeMedias(medias);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put("/:imdbID/reviews/:id", async (req, res, next) => {
  try {
    let medias = await getMedias();
    let selectedMedia = medias.find(
      (media) => media.imdbID === req.params.imdbID
    );

    let reviews = selectedMedia.reviews;

    let review = reviews.find((review) => review.id === req.params.id);
    reviews = reviews.filter((review) => review.id !== req.params.id);

    const newReview = {
      ...review,
      ...req.body,
      updatedAt: new Date(),
    };

    reviews.push(newReview);

    selectedMedia.reviews = reviews;

    medias = medias.filter((media) => media.imdbID !== req.params.imdbID);

    medias.push(selectedMedia);

    await writeMedias(medias);

    res.send("changed");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/:imdbID/reviews/:id", async (req, res, next) => {
  try {
    let medias = await getMedias();
    let selectedMedia = medias.find(
      (media) => media.imdbID === req.params.imdbID
    );

    let reviews = selectedMedia.reviews;

    reviews = reviews.filter((review) => review.id !== req.params.id);

    selectedMedia.reviews = reviews;

    medias = medias.filter((media) => media.imdbID !== req.params.imdbID);

    medias.push(selectedMedia);

    await writeMedias(medias);
    res.send("deleted");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post(
  "/:imdbID/upload",
  multer().single("moviePoster"),
  async (req, res, next) => {
    try {
      console.log(req.file);
      await writeMoviesPictures(req.file.originalname, req.file.buffer);

      const { originalname } = req.file;

      const medias = await getMedias();
      const updatedDb = medias.map((media) =>
        media.imdbID === req.params.imdbID
          ? {
              ...media,
              Poster: `${req.protocol}://${req.hostname}:${process.env.PORT}/${originalname}`,
              lastUpdated: new Date(),
            }
          : media
      );

      await writeMedias(updatedDb);

      res.status(201).send("pic is uploaded");
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.get("/omdb/:omdbID", async (req, res, next) => {
  try {
    const url = `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=`;
    const response = await axios.get(url + req.params.omdbID);
    const data = response.data;
    console.log(response);
    if (data) {
      res.send(data);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log("ERROR!", error);
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const medias = await getMedias();

    if (req.query && req.query.Title) {
      const filteredMedia = medias.filter(
        (media) =>
          media.hasOwnProperty("Title") && media.Title === req.query.Title
      );

      res.send(filteredMedia);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

export default router;
