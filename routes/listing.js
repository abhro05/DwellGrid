const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../listing.js");
const { isLoggedIn, isOwner,validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");


const multer = require('multer');
const { storage } = require("../cloudconfig.js");
const upload = multer({ storage });

router
    .route('/')
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single('listing[image]'), (req, res) => {
            res.send(req.file);
        }, // handle multipart image upload
        validateListing,
        wrapAsync(listingController.createListing)
    )
//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    .get( isLoggedIn, wrapAsync(listingController.showListing))
    .put( isLoggedIn, isOwner, validateListing, wrapAsync(listingController.updateListing))
    .delete( isLoggedIn, isOwner, wrapAsync(listingController.destroyListing))


//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editListing));

module.exports = router;