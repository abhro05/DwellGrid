const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware.js");
const Listing = require("../listing.js");
const Review = require("../models/review.js");


//Reviews
router.post("/", validateReview, isLoggedIn, wrapAsync(async(req, res) => {
    console.log(req.params.id)
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    console.log(newReview);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created");
    res.redirect(`/listings/${listing._id}`);
}));

//Review Delete
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync( async(req, res) => {
    let {id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "New Review Deleted");
    res.redirect(`/listings/${id}`);
}));

module.exports = router;