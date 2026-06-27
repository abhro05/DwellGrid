const Listing = require("./listing");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect('/listings');
    }
    // Assuming req.user holds the logged‑in user
    if (!req.user || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.validateListing = (req, res, next) => {
    // Support both nested "listing" object and flat "listing[field]" keys (from multipart forms)
    let body = req.body;
    if (!body.listing) {
        const parsed = {};
        for (const key of Object.keys(body)) {
            const match = key.match(/^listing\[(.+)\]$/);
            if (match) {
                parsed[match[1]] = body[key];
            }
        }
        if (Object.keys(parsed).length) {
            body = { ...body, listing: parsed };
        }
    }
    const {error} = listingSchema.validate(body);
    if (error) {
        const errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        // Ensure req.body.listing is populated for downstream handlers
        req.body = body;
        next();
    }
}

module.exports.validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    }
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect('/listings');
    }
    // Assuming req.user holds the authenticated user
    if (!req.user || !review.author.equals(req.user._id)) {
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
}