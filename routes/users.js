/* express */
const express = require("express");
const router = express.Router();
/* middleware */
const bodyParser = require("body-parser");
const authenticate = require("../authenticate");
const passport = require("passport");
/* database */
const User = require("../models/user");

router.use(bodyParser.json());

router.get('/', authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.find({}, (err, users) => {
    if(!!users){
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    }else{
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.json(err);
    }
  });
});

router.post("/signup", (req, res, next) => {
  let { username, password, firstname, lastname } = req.body;

  User.register(new User({ username: username }), password, (err, user) => {
    if(err){
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json(err);
    }else{

      if(firstname)
        user.firstname = firstname;
      if(lastname)
        user.lastname = lastname;

      user.save((err, user) => {
        if(err){
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err})
          return; // exit function if err
        }
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({ success: true, status: 'You have successfully registered' })
        });
      });
    }
  });
});


router.post('/login', passport.authenticate('local'), (req, res) => {
  let token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, token: token, status: 'You are logged in' })
});

module.exports = router;
