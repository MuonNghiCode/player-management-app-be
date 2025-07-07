require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var methodOverride = require("method-override");
const cors = require("cors");
// Import routers
var indexRouter = require("./routes/index");
var authRouter = require("./routes/authRouter");
var playerRouter = require("./routes/playerRouter");
var teamRouter = require("./routes/teamRouter");
var accountRouter = require("./routes/accountRouter");

var app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Database connection
const mongoose = require("mongoose");
const URI = process.env.MONGO_URI;
mongoose.connect(URI);

mongoose.connection.on("connected", () => {
  console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

// Session configuration
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Middleware to make session messages available to views
app.use((req, res, next) => {
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  res.locals.session = req.session;
  delete req.session.success;
  delete req.session.error;
  next();
});

// Route handlers
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/players", playerRouter);
app.use("/teams", teamRouter);
app.use("/accounts", accountRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
