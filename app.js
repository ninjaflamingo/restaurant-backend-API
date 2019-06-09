const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const authenticate = require('./authenticate');
const config = require('./config');

const mongoose = require("mongoose");
const Dishes = require("./models/dishes");
const Favorites = require("./models/favorite");
const User = require('./models/user.js');


const url = config.mongoUrl;
const connection = mongoose.connect(url);

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const dishRouter = require("./routes/dishRouter");
const leaderRouter = require("./routes/leaderRouter");
const promoRouter = require("./routes/promoRouter");
const favoriteRouter = require("./routes/favoriteRouter");

connection.then((db) => {
  console.log(`Connected to ${url}`)
}, (err) => { console.log(err)});

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(express.static(path.join(__dirname, 'public')));
app.use("/dishes", dishRouter);
app.use("/leaders", leaderRouter);
app.use("/promotions", promoRouter);
app.use("/favorites", favoriteRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.statusCode || 500);
  res.render('error');
});

module.exports = app;
