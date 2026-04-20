if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");

// ✅ Routers
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// ✅ DB URL
const dbURL =
  process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

// ✅ MongoDB Connection
mongoose
  .connect(dbURL)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log("DB Error:", err));

// ✅ Mongo Store
const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: {
    secret: process.env.SECRET || "mysupersecret",
  },
  touchAfter: 24 * 60 * 60,
});

store.on("error", (e) => {
  console.log("Session Store Error", e);
});

// ✅ Session Config
app.use(
  session({
    store,
    secret: process.env.SECRET || "mysupersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);

app.use(flash());

// ✅ Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ✅ View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Global Variables
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// ✅ Home Route (IMPORTANT FIX)
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// ✅ Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// ✅ 404 Handler
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// ✅ ✅ FIXED Error Handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  console.log(err);
  res.status(statusCode).render("error.ejs", { message });
});

// ✅ Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});