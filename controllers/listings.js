const Listing = require("../listing")

module.exports.index = async(req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews", populate:{
        path: "author",
    }}).populate("owner");
    if(!listing){
        req.flash("error", "Listing does not exist");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;
    console.log('Received body:', req.body);
    // Expect nested `listing` object as validated by middleware.
    let data = req.body.listing;
    // If the request is multipart (handled by multer), the fields are flat like "listing[title]"
    if (!data) {
        data = {};
        for (const key of Object.keys(req.body)) {
            const match = key.match(/^listing\[(.+)\]$/);
            if (match) {
                data[match[1]] = req.body[key];
            }
        }
    }
    // Attach uploaded image path if present
    if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
    }
    const newListing = new Listing(data);
    // Associate the logged‑in user as the owner, if available.
    newListing.owner = req.user ? req.user._id : undefined;
    newListing.image = {url, filename};
    await newListing.save();
    req.flash("success", "New Listing Created!");
    return res.redirect("/listings");
};

module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
};