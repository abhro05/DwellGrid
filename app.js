if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}
console.log(process.env.SECRET);

const express = require ("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL= "mongodb://127.0.0.1:27017/DwellGrid";

const dbUrl = process.env.ATLASDB_URL;

async function main() {
    await mongoose.connect(dbUrl);
}

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
})

// FIX: Added 'err' inside the parentheses
store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        // FIX: Wrap the timestamp in a new Date() object
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

//app.get("/", (req, res) => {
//    res.send("Hi, I am root");
//});


// 1. Session and Flash Initialization
app.use(session(sessionOptions));
app.use(flash());

// 2. Passport Initialization
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// 3. Locals Middleware (Safe to use req.flash and req.user here)
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    
    // This makes the API key available to every EJS file
    res.locals.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; 
    
    next();
});

app.get("/demouser", async (req, res) => {
    let fakeUser = new User({
        email: "student@gmail.com",
        username: "delta-student"
    });

    // FIX: Variable name matches the res.send variable
    let registeredUser = await User.register(fakeUser, "helloworld");
    res.send(registeredUser);
});

const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    }
}

const validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    }
}

// 4. Routes
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// Catch‑all for any unmatched route – placed after all other routes
app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let {statusCode=500, message="Something went wrong"} = err;
    res.status(statusCode).render("error.ejs", { err });
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});