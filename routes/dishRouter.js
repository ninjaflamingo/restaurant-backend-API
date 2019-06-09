const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const Dishes = require("../models/dishes");
const authenticate = require("../authenticate");

const dishRouter = express.Router();
dishRouter.use(bodyParser.json());

/* stuff to tidy overall code */

let checkAdmin = [ authenticate.verifyUser, authenticate.verifyAdmin ];

let genError = (message, code) => {
  let err = new Error(message);
  err.statusCode = code;
  return err;
};

/*  routing logic */

dishRouter.route("/")
  .get((req, res, next) => {
    Dishes.find({})
      .populate('comments.author')
      .then((dishes) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(dishes);
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post([...checkAdmin], (req, res, next) => {
    Dishes.create(req.body)
      .then((dishes) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(dishes);
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .put([...checkAdmin], (req, res, next) => {
    res.statusCode = 403;
    res.end(`${req.method} not supported on /dishes`);
  })
  .delete([...checkAdmin], (req, res, next) => {
    Dishes.deleteMany({})
      .then((result) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(result);
      }, (err) => next(err))
      .catch((err) => next(err));
  });

dishRouter.route("/:dishId")
  .get((req, res, next) => {
    let { dishId } = req.params;

    Dishes.findById(dishId)
      .then((dish) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(dish);
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post([...checkAdmin], (req, res, next) => {
    let { dishId } = req.params;
    res.statusCode = 403;
    res.end(`${req.method} operation not supported on /dishes/${dishId}`);
  })
  .put([...checkAdmin], (req, res, next) => {
    let { dishId } = req.params;

    Dishes.findByIdAndUpdate(dishId, { $set: req.body }, { new: true })
      .then((dish) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(dish)
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .delete([...checkAdmin], (req, res, next) => {
    let { dishId } = req.params;

    Dishes.findByIdAndRemove(dishId)
      .then((result) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(result)
      }, (err) => next(err))
      .catch((err) => next(err));
  });
// admin shouldn't be able to remove comment
dishRouter.route("/:dishId/comments")
  .get((req, res, next) => {
    let { dishId } = req.params;

    Dishes.findById(dishId)
      .populate('comments.author')
      .then((dish) => {
        if(!!dish){
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(dish.comments)
        }else{
          return next(genError(`Dish ${dishId} not found`, 404));
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    let { dishId } = req.params;

    Dishes.findById(req.params.dishId)
      .then((dish) => {
          if(!!dish){
            req.body.author = req.user._id;
            dish.comments.push(req.body);
            dish.save().then((dish) => {
              Dishes.findById(dish._id)
                .populate("comments.author")
                .then((dish) => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(dish)
                })
            }, (err) => next(err));
          }else{
            return next(genError(`Dish ${dishId} not found`, 404));
          }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    let { dishId } = req.params;

    res.statusCode = 403;
    res.end(`${req.method} not supported on /dishes/${dishId}/comments`);
  })
  .delete([...checkAdmin], (req, res, next) => {
    let { dishId } = req.params;

    Dishes.findById(dishId)
      .then((dish) => {
        if(!!dish){
          for(var i = dish.comments.length - 1; i >= 0; i--){ // recursion
            dish.comments.id(dish.comments[i]._id).remove();
          }
          dish.save().then((dish) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(dish)
          }, (err) => next(err));
        }else{
          return next(genError(`Dish ${dishId} not found`, 404));
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  });

dishRouter.route("/:dishId/comments/:commentId")
  .get((req, res, next) => {
    let { dishId, commentId } = req.params;

    Dishes.findById(req.params.dishId)
      .populate("comments.author")
      .then((dish) => {
        if(!!dish && !!dish.comments.id(commentId)){
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(dish.comments.id(commentId))
        }else if(dish == null){
          return next(genError(`Dish ${dishId} not found`, 404));
        }else{
          return next(genError(`Comment ${commentId} not found`, 404));
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    let { dishId, commentId } = req.params;

    res.statusCode = 403;
    res.end(`${req.method} operation not supported on /dishes/${dishId}/comments/${commentId}`);
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    let { dishId, commentId } = req.params;
    let { rating, comment } = req.body;

    Dishes.findById(dishId)
      .then((dish) => {

        let author = dish.comments.id(commentId).author;

        if(!!dish && !!dish.comments.id(commentId) && author.equals(req.user._id)){

          if(req.body.rating)
            dish.comments.id(commentId).rating = rating;
          if(req.body.comment)
            dish.comments.id(commentId).comment = comment;

          dish.save().then((dish) => {
            Dishes.findById(dish._id)
              .populate("comments.author")
              .then((dish) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(dish)
              })
          }, (err) => next(err));

        }else if(dish == null){
          return next(genError(`Dish ${dishId} not found`, 404));
        }else if(dish.comments.id(commentId) == null){
          return next(genError(`Comment ${commentId} not found`, 404));
        }else if(author.equals(req.user._id) == false){
          return next(genError(`You can't modifiy comment ${commentId}`, 403));
        }else{
          return next(genError(`Something went wrong`, 500));
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    let { dishId, commentId } = req.params;

    Dishes.findById(dishId)
      .then((dish) => {
        let author = dish.comments.id(commentId).author;

        if(!!dish && !!dish.comments.id(commentId) && author.equals(req.user._id)){
          dish.comments.id(req.params.commentId).remove();
          dish.save().then((dish) => {
            Dishes.findById(dish._id)
              .populate("comments.author")
              .then((dish) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(dish)
              })
          }, (err) => next(err));
        }else if(dish == null){
          return next(genError(`Dish ${dishId} not found`, 404));
        }else if(dish.comments.id(commentId) == null){
          return next(genError(`Comment ${commentId} not found`, 404));
        }else if(author.equals(req.user._id) == false){
          return next(genError(`You are not the author of comment ${commentId} `, 403));
        }else{
          return next(genError(`Something went wrong`, 500));
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  });

module.exports = dishRouter;
