const jwt = require("jsonwebtoken");
var ObjectID = require("mongodb").ObjectID;
const bcrypt = require("bcryptjs");
const Jimp = require("jimp");
const { exec } = require("child_process");
var fs = require("fs"); //Load the filesystem module

// Setup tinify.
var tinify = require("tinify");
tinify.key = "3Ml5SJht1QnKW5lZjlM4CLjGnQR58s8J";

require("dotenv").config();

function userController(User) {
  function Register(req, res) {
    // console.log(req.file);
    User.findOne({ username: req.body.username })
      .then(user => {
        if (user) {
          return res.status(400).send({
            error:
              "The email address you have entered is already associated with another account."
          });
        } else {
          var profile = `http://localhost:4000/${req.file.filename}`;

          var hash = bcrypt.hashSync(req.body.password, 12);

          User.create(
            {
              username: req.body.username,
              profile: profile,
              phoneNumber: req.body.phoneNumber,
              address: req.body.address,
              nickname: req.body.nickname,
              dateOfBirth: req.body.dateOfBirth,
              book: req.body.book,
              spouse: req.body.spouse,
              password: hash
            },
            function(err, user) {
              if (err) return res.status(500).send("Error inserting the user");

              // create a token
              var token = jwt.sign({ id: user._id }, process.env.APP_SECRET, {
                expiresIn: 86400 // expires in 24 hours
              });
              res.status(200).send({ auth: true, token, user });
            }
          );
        }
      })
      .catch(error => {
        console.log(error);
      });
  }
  function Login(req, res) {
    // console.log(req.body.username);
    User.findOne({ username: req.body.username })
      .then(user => {
        if (!user) {
          // console.log("user not found");
          return res.status(400).send({
            error: "Invalid email or password"
          });
        } else {
          // console.log("user found");
          if (!bcrypt.compareSync(req.body.password, user.password)) {
            return res.status(400).send({
              error: "Invalid email or password"
            });
          }
          // create a token
          var token = jwt.sign({ id: user._id }, process.env.APP_SECRET, {
            expiresIn: 86400 // expires in 24 hours
          });

          return res.status(200).send({ auth: true, user, token });
        }
      })
      .catch(error => {
        console.log(error);
      });
  }
  function Profile(req, res) {
    // console.log("Profile endpoint has been hit");
    const userToken = req.headers.authorization;
    try {
      token = userToken.split(" ");
    } catch (e) {
      return res.status(401).send("unauthorized");
    }

    try {
      decoded = jwt.verify(token[1], process.env.APP_SECRET);
    } catch (e) {
      return res.status(401).send("unauthorized");
    }
    var userId = decoded.id;

    User.findOne({ _id: userId })
      .then(user => {
        res.status(200).json(user);
        req.user = user;
      })
      .catch(error => console.log(error));
  }
  const Photo = async (req, res) => {
    let file = req.file;
    const originalFileSizeInBytes = file.size;
    console.log(originalFileSizeInBytes);
    file.newpath = `outcome/${file.filename}`;
    console.log(file);
    const compressPhoto = async file => {
      var source = tinify.fromFile(file.path);

      await source.toFile(file.newpath);
    };
    await compressPhoto(file);

    fs.readdir("./outcome", function(err, files) {
      if (err) throw err;
      console.log(files);
      console.log(files.indexOf(file.filename));
      if (files.indexOf(file.filename) >= 0) {
        const stats = fs.statSync(`./outcome/${file.filename}`);
        const newFileSizeInBytes = stats["size"];
        console.log(newFileSizeInBytes);

        return res.status(200).json({
          link: `https://backend.tinierpng.com/${file.filename}`,
          originalFileSizeInBytes: originalFileSizeInBytes,
          filename: file.filename,
          newFileSizeInBytes: newFileSizeInBytes,
          isCompressing: false,
          finished: true
        });
      }
    });
  };

  function Download(req, res) {
    const filename = req.params.fileName;
    console.log(`ready to download ${filename}`);
  }

  return { Register, Login, Profile, Photo, Download };
}

module.exports = userController;
