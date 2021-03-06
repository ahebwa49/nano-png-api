const express = require("express");
const path = require("path");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads");
  },
  filename: function(req, file, cb) {
    let newName;
    // console.log(file);
    let name = file.originalname;
    if (path.extname(name) === ".jpeg") {
      newName = name.slice(0, name.length - 5);
    } else {
      newName = name.slice(0, name.length - 4);
    }

    // console.log(path.extname(file.originalname));
    cb(null, newName + path.extname(file.originalname));
  }
});
// var upload = multer({ dest: "uploads/" });
const upload = multer({
  storage: storage
});

// var photo = multer({ dest: "photos/" });
const userController = require("../controllers/userController");

function routes(User) {
  const userRouter = express.Router();
  const controller = userController(User);

  userRouter
    .route("/register")
    .post(upload.single("avatar"), controller.Register);
  userRouter.route("/login").post(controller.Login);
  userRouter.route("/profile").get(controller.Profile);
  userRouter.route("/download/:fileName").get(controller.Download);
  userRouter.route("/photo").post(upload.single("avatar"), controller.Photo);
  return userRouter;
}

module.exports = routes;
