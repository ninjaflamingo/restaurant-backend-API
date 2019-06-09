const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const Leaders = require("../models/leaders");
const authenticate = require("../authenticate");

const leaderRouter = express.Router();
leaderRouter.use(bodyParser.json());

/* stuff to tidy overall code */

let checkAdmin = [ authenticate.verifyUser, authenticate.verifyAdmin ];

/* routing logic: */

leaderRouter.route("/")
.get((req, res, next) => {
  Leaders.find({})
    .then((leaders) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(leaders)
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post([...checkAdmin], (req, res, next) => {
  Leaders.create(req.body)
    .then((leader) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(leader);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put([...checkAdmin], (req, res, next) => {
  res.statusCode = 403;
  res.end(`${req.method} not supported on /leaders`);
})
.delete([...checkAdmin], (req, res, next) => {
  Leaders.deleteMany({})
    .then((result) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(result)
    }, (err) => next(err))
    .catch((err) => next(err));
});

leaderRouter.route("/:leaderId")
.get((req, res, next) => {
  let { leaderId } = req.params;
  Leaders.findById(leaderId)
    .then((leader) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(leader)
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post([...checkAdmin], (req, res, next) => {
  let { leaderId } = req.params;
  res.statusCode = 403;
  res.end(`${req.method} operation not supported on /leaders/${leaderId}`);
})
.put([...checkAdmin], (req, res, next) => {
  let { leaderId } = req.params;
  let flags = [ { $set: req.body }, { new: true } ];
  Leaders.findByIdAndUpdate(leaderId, ...flags) // spread operator
    .then((leader) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(leader)
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete([...checkAdmin], (req, res, next) => {
  let { leaderId } = req.params;
  Leaders.findByIdAndRemove(leaderId)
    .then((result) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(result)
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = leaderRouter;
