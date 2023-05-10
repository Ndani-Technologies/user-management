const axios = require("axios");
const mongoose = require("mongoose");
const session = require("express-session");
const User = require("../Models/User");
const env = require("../configs/dev");
const { redisClient } = require("../middleware/redisClient");

const loginCallback = async (req, res) => {
  const userLogin = "";
  session.userLogin = req.user;
  const message = { msg: "ssoComplete" };
  const serializeMsg = JSON.stringify(req.user);
  const script = `window.opener.postMessage(${serializeMsg}, '*');`;
  res.send(`<script>${script}</script>`);
};
const getLoggedInUser = async (req, res, next) => {
  try {
    const userlogged = session.userLogin;
    User.findById(userlogged.id)
      .populate("role")
      .populate({
        path: "role",
        populate: {
          path: "permissions",
          model: "Permissions",
        },
      })
      .then((user) => {
        if (user.role === "user") {
          res.json({
            success: true,
            status: 200,
            message: " simple user found",
          });
        }
        res.json({ data: user });
      })
      .catch((err) => next(err));
  } catch (err) {
    next(err);
  }
};
const registerCallback = async (req, res) => {
  res.json({ user: req.user });
};
const getAllUsers = async (req, res, next) => {
  const cacheKey = "USERS";
  const cache = await redisClient.get(cacheKey);
  if (cache === "") {
    res.status(200).json({
      success: true,
      message: "users found",
      data: JSON.parse(cache),
    });
    return;
  }
  try {
    User.find()
      .populate("role")
      .populate({
        path: "role",
        populate: {
          path: "permissions",
          model: "Permissions",
        },
      })
      .then(
        async (users) => {
          if (users.length === 0) {
            res.status(404).json({
              success: false,
              message: "users not found",
            });
            return;
          }
          await redisClient.set(cacheKey, JSON.stringify(users));
          res.status(200).json({
            success: true,
            message: "Users found",
            data: users,
          });
        },
        (err) => next(err)
      );
  } catch (err) {
    next(err);
  }
};
const getUserById = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  try {
    User.findById(req.params.id)
      .populate("role")
      .populate({
        path: "role",
        populate: {
          path: "permissions",
          model: "Permissions",
        },
      })
      .then(
        (user) => {
          res
            .status(200)
            .json({ success: true, message: "User found", data: user });
        },
        (err) => next(err)
      );
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  const user = new User(req.body);
  User.create(user)
    .then(
      (newUser) => {
        res
          .status(201)
          .json({ success: true, message: "User created", data: newUser });
      },
      (err) => next(err)
    )
    .catch((err) => {
      next(err);
    });
};

const userUpdate = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  const user = await User.findById(req.params.id);
  if (user.email === "" || req.body.email === "") {
    return res.status(500).json({
      success: false,
      message: "email is required attribute",
    });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const { body } = req;
  if (body.timezone) {
    if (user.country) {
      try {
        const response = await axios.get(
          `https://timezone.abstractapi.com/v1/current_time/?api_key=${env.timezoneKey}=${user.country}`
        );
        body.timezone = response.data.gmt_offset;
      } catch (error) {
        return next(error);
      }
    } else {
      try {
        const response = await axios.get(
          `https://timezone.abstractapi.com/v1/current_time/?api_key=${env.timezoneKey}=${req.body.country}`
        );
        body.timezone = `GMT ${response.data.gmt_offset}`;
      } catch (error) {
        return next(error);
      }
    }
  }

  user.set(body);

  user
    .save()
    .then(() => {
      res
        .status(200)
        .json({ success: true, message: "User updated", data: user });
    })
    .catch((err) => next(err));
};

const userDelete = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.json({ success: false, message: "User Doesn't exist" });
  }
  User.findByIdAndDelete(req.params.id)
    .then(
      () => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json({ success: true, message: "User Deleted" });
      },
      (err) => next(err)
    )
    .catch((err) => next(err));
};
const userTwoCompare = async (req, res, next) => {
  try {
    const userId1 = req.params.id1;
    const userId2 = req.params.id2;
    const users = await User.find({ _id: { $in: [userId1, userId2] } });
    res.status(200).json({
      success: true,
      message: "Comparison successful",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
const userThreeCompare = async (req, res, next) => {
  try {
    const userId1 = req.params.id1;
    const userId2 = req.params.id2;
    const userId3 = req.params.id3;
    const users = await User.find({
      _id: { $in: [userId1, userId2, userId3] },
    });
    res.status(200).json({
      success: true,
      message: "Comparison successful",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
const userFourCompare = async (req, res, next) => {
  try {
    const userId1 = req.params.id1;
    const userId2 = req.params.id2;
    const userId3 = req.params.id3;
    const userId4 = req.params.id4;
    const users = await User.find({
      _id: { $in: [userId1, userId2, userId3, userId4] },
    });
    res.status(200).json({
      success: true,
      message: "Comparison successful",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
const createBenchmark = async (req, res, next) => {
  try {
    const loggedUserId = session.userLogin.id;
    const benchmark = {
      title: req.body.title,
      country: req.body.country,
      userId: loggedUserId,
    };
    const response = await axios.post("http://localhost:5001/benchmarking", {
      title: benchmark.title,
      country: benchmark.country,
      userId: benchmark.userId,
    });
    if (response) {
      res.json(response.data);
    }
  } catch (error) {
    next(error);
  }
};
const createCategory = async (req, res, next) => {
  try {
    const { titleEng, titleAr, titleFr, titleSp, language } = req.body;
    const cat = {
      language: req.body.language,
      titleEng: "",
      titleFr: "",
      titleSp: "",
      titleAr: "",
    };
    if (cat.language) {
      if (titleEng) {
        cat.titleEng = titleEng;
        cat.titleAr = "";
        cat.titleFr = "";
        cat.titleSp = "";
      }
      if (titleAr) {
        cat.titleAr = titleAr;
        cat.titleFr = "";
        cat.titleSp = "";
        cat.titleEng = "";
      }
      if (titleFr) {
        cat.titleFr = titleFr;
        cat.titleAr = "";
        cat.titleSp = "";
        cat.titleEng = "";
      }
      if (titleSp) {
        cat.titleSp = titleSp;
        cat.titleFr = "";
        cat.titleAr = "";
        cat.titleEng = "";
      }
      cat.language = language;
    } else {
      cat.titleEng = titleEng;
      cat.language = "English";
    }
    const response = await axios.post("http://localhost:5001/category", {
      language: cat.language,
      titleEng: cat.titleEng,
      titleAr: cat.titleAr,
      titleFr: cat.titleFr,
      titleSp: cat.titleSp,
    });
    if (response) {
      res.json(response.data);
    }
  } catch (error) {
    next(error);
  }
};
const createAnswerByUser = async (req, res, next) => {
  const { answerOption, includeExplanation, language } = req.body;
  try {
    let answer;
    if (language) {
      answer = await axios.post("http://localhost:5001/answer", {
        answerOption,
        includeExplanation,
        language,
      });
    } else {
      answer = await axios.post("http://localhost:5001/answer", {
        answerOption,
        includeExplanation,
      });
    }
    res.json(answer.data);
  } catch (error) {
    next(error);
  }
};
const createAnswer = async (req, res, next) => {
  const { answerOption, includeExplanation, language } = req.body;
  try {
    let answer;
    if (language) {
      answer = await axios.post("http://localhost:5001/answer", {
        answerOption,
        includeExplanation,
        language,
      });
    } else {
      answer = await axios.post("http://localhost:5001/answer", {
        answerOption,
        includeExplanation,
      });
    }
    res.json(answer.data);
  } catch (error) {
    next(error);
  }
};
const createQuestions = async (req, res, next) => {
  const questionnaire = {
    status: req.body.status,
    visible: req.body.visible,
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    answerOption: req.body.answerOption,
  };
  try {
    const response = await axios.post("http://localhost:5001/questionnaire", {
      status: questionnaire.status,
      visible: questionnaire.visible,
      title: questionnaire.title,
      description: questionnaire.description,
      category: questionnaire.category,
      answerOption: questionnaire.answerOption,
    });
    res.json(response.data);
  } catch (err) {
    next(err);
  }
};
const getAllBenchmarks = async (req, res, next) => {
  try {
    const response = await axios.get("http://localhost:5001/benchmarking");
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};
const getBenchmarkById = async (req, res, next) => {
  try {
    const benchmarkid = req.params.id;
    const response = await axios.get(
      `http://localhost:5001/benchmarking/${benchmarkid}`
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginCallback,
  getAllUsers,
  getUserById,
  createUser,
  userUpdate,
  userDelete,
  registerCallback,
  getLoggedInUser,
  userTwoCompare,
  userThreeCompare,
  userFourCompare,
  createBenchmark,
  createAnswerByUser,
  createCategory,
  createAnswer,
  createQuestions,
  getAllBenchmarks,
  getBenchmarkById,
};