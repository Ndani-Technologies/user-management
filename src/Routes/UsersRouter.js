const express = require("express");

const UserRouter = express.Router();
const passport = require("passport");
const bodyParser = require("body-parser");
const middleware = require("../middleware/middleware");

const userController = require("../Controller/userController");

UserRouter.post(
  "/login/callback",
  bodyParser.urlencoded({ extended: false }),
  passport.authenticate("saml", {
    failureRedirect: "/login",
    failureMessage: "error",
  }),
  userController.loginCallback
);

UserRouter.get("/login", passport.authenticate("saml"), userController.login);

UserRouter.get("/", middleware.isAdmin, userController.getAllUsers);

UserRouter.get("/user:id", middleware.isAdmin, userController.getUserById);

UserRouter.post("/", middleware.isAdmin, userController.createUser);

UserRouter.patch("/:id", userController.userUpdate);

UserRouter.delete("/:id", middleware.isAdmin, userController.userDelete);

module.exports = UserRouter;