const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const Promotions = require("../models/promotions");
const authenticate = require("../authenticate");

const promoRouter = express.Router();
promoRouter.use(bodyParser.json());

/* stuff to tidy overall code */

let checkAdmin = [ authenticate.verifyUser, authenticate.verifyAdmin ];

/* routing logic: */

promoRouter.route("/")
.get((req, res, next) => {
  Promotions.find({})
    .then((promotions) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(promotions)
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post([...checkAdmin], (req, res, next) => {
  Promotions.create(req.body)
    .then((promotion) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(promotion);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put([...checkAdmin], (req, res, next) => {
  res.statusCode = 403;
  res.end(`${req.method} not supported on /promotions`);
})
.delete([...checkAdmin], (req, res, next) => {
  Promotions.deleteMany({})
    .then((result) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(result)
    }, (err) => next(err))
    .catch((err) => next(err));
});

promoRouter.route("/:promoId")
.get((req, res, next) => {
  let { promoId } = req.params;
  Promotions.findById(promoId)
    .then((promotion) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(promotion)
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post([...checkAdmin], (req, res, next) => {
  let { promoId } = req.params;
  res.statusCode = 403;
  res.end(`${req.method} operation not supported on /promotions/${promoId}`);
})
.put([...checkAdmin], (req, res, next) => {
  let { promoId } = req.params;
  let flags = [ { $set: req.body }, { new: true } ];
  Promotions.findByIdAndUpdate(promoId, ...flags)
    .then((promotion) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(promotion)
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete([...checkAdmin], (req, res, next) => {
  let { promoId } = req.params;
  Promotions.findByIdAndRemove(promoId)
    .then((result) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(result)
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = promoRouter;
