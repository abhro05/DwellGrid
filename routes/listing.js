const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer = require('multer');
const { storage } = require("../cloudconfig.js");
const upload = multer({ storage });

router
    .route('/')
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single('listing[image]'), 
        validateListing,
        wrapAsync(listingController.createListing)
    );

// New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    .get(isLoggedIn, wrapAsync(listingController.showListing))
    .put(
        isLoggedIn, 
        isOwner, 
        upload.single('listing[image]'), // FIX: Added multer to parse the multipart edit form
        validateListing, 
        wrapAsync(listingController.updateListing)
    )
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// FIX: Added the missing Edit Route to prevent the 404 error
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editListing));

module.exports = router;