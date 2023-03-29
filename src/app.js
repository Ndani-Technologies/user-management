const express = require("express");
const createError = require("http-errors");
const path = require("path");
require("dotenv/config");

const app = express();
const cors = require("cors");
const passport = require("passport");
const expresssession = require("express-session");
const MongoStore = require("connect-mongo");

const mongoose = require("mongoose");
const UserRouter = require("./Routes/UsersRouter");
const env = require("./configs/dev");

const url = env.mongoUrl;
const connect = mongoose.connect(url);

connect.then(
  () => {
    console.log("connected Correctly");
  },
  (err) => {
    console.log(err);
  }
);

app.use(
  expresssession({
    secret: env.secrectKey,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ mongoUrl: env.mongoUrl }),
    // cookie: { secure: true }
  })
);
app.use(cors({ origin: "*" }));
app.use(express.static("./assets"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use("/user", UserRouter);

app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  res.status(err.status || 404);
  res.json({
    error: {
      status: err.status || 404,
      message: err.message || req.session.message,
      success: false,
    },
  });
});

module.exports = app;