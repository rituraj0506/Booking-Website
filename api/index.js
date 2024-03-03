require("dotenv").config(); // for load eviroment variable
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const imageDownloader = require("image-downloader"); // upload from image link

const fs = require("fs"); // for upload file
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const User = require("./models/User.js");
const multer = require("multer"); // for upload photo
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "tererferwrwfwdw";
const Place = require("./models/place.js");
const Booking = require("./models/Booking.js");

// for register in place of fetch we use cors
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL);

// grab userData
function getUserDataFromToken(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.get("/test", (req, res) => {
  res.json("test ok");
});

app.post("/register", async (req, res) => {
  console.log(req.body);
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
  // console.log(userDoc);
});

app.post("/login", async (req, res) => {
  // grab email pass
  const { email, password } = req.body;
  console.log(req.body);
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    // check pass is correct or not

    const passok = bcrypt.compareSync(password, userDoc.password);

    if (passok) {
      // send respond with cookie
      jwt.sign(
        {
          email: userDoc.email,
          id: userDoc._id,
        },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(userDoc);
          console.log(token);
        }
      );
    } else res.status(422).json("pass not ok");
  } else {
    res.json("not found");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  //console.log(token);
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;

      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

// logout function
app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true); // set cookie to logout
});

// uplaod photo by link
app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  await imageDownloader.image({
    url: link,
    dest: __dirname + "/uploads/" + newName,
  });
  res.json(newName);
});

// upload photo via uload from device
const photosMiddleware = multer({ dest: "uploads" });
app.post("/upload", photosMiddleware.array("photos", 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace("uploads/", ""));
  }
  //console.log(uploadedFiles);
  res.json(uploadedFiles);
  //res.json(req.files);
});

//form data

app.post("/places", (req, res) => {
  const { token } = req.cookies;
  const {
    title,
    address,
    addedPhotos,
    description,
    price,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner: userData.id,
      price,
      price,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    });
    res.json(placeDoc);
  });
});

// places page (getting specific place for user)
app.get("/user-places", (req, res) => {
  // for grabing user id we need token
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

// get data from database to form that place
app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});
// posting new place
app.put("/places", async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.json("ok");
      // placeDoc.update();
    }
  });
});

// for index page
app.get("/places", async (req, res) => {
  res.json(await Place.find());
});

// booking form

app.post("/bookings", async (req, res) => {
  const userData = await getUserDataFromToken(req);

  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } =
    req.body; // we grap the info and put it into database
  Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user: userData.id,
  })
    .then((doc, err) => {
      res.json(doc);

      //if (err) throw (err, ));
    })
    .catch((err) => {
      throw err;
    });
});

// booking page

app.get("/bookings", async (req, res) => {
  console.log("GoodHi");
  const userData = await getUserDataFromToken(req);

  res.json(await Booking.find({ user: userData.id }).populate("place"));
});

app.listen(5000);
