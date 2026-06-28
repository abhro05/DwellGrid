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
    console.log('Received body:', req.body);
    let data = req.body.listing;
    
    // Fallback for multipart form parsing
    if (!data) {
        data = {};
        for (const key of Object.keys(req.body)) {
            const match = key.match(/^listing\[(.+)\]$/);
            if (match) {
                data[match[1]] = req.body[key];
            }
        }
    }

    // --- GOOGLE MAPS GEOCODING API LOGIC ---
    const address = `${data.location}, ${data.country}`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const geoResponse = await fetch(geocodeUrl);
    const geoData = await geoResponse.json();

    if (geoData.status !== "OK" || !geoData.results.length) {
        req.flash("error", "Could not find that location. Please try a more specific address.");
        return res.redirect("/listings/new");
    }

    const { lat, lng } = geoData.results[0].geometry.location;
    const geometry = {
        type: "Point",
        coordinates: [lng, lat]
    };
    // ------------------------------------------

    const newListing = new Listing(data);
    newListing.owner = req.user ? req.user._id : undefined;
    
    if (req.file) {
        newListing.image = { url: req.file.path, filename: req.file.filename };
    }
    
    newListing.geometry = geometry; 

    await newListing.save();
    req.flash("success", "New Listing Created!");
    return res.redirect("/listings");
};

module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing){
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings"); 
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let data = req.body.listing;

    // FIX: Re-fetch coordinates so the map marker moves if the location is edited!
    const address = `${data.location}, ${data.country}`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const geoResponse = await fetch(geocodeUrl);
    const geoData = await geoResponse.json();

    // If the new address is valid, update the geometry payload
    if (geoData.status === "OK" && geoData.results.length > 0) {
        const { lat, lng } = geoData.results[0].geometry.location;
        data.geometry = {
            type: "Point",
            coordinates: [lng, lat]
        };
    }

    // Update listing with new text data and new coordinates
    let listing = await Listing.findByIdAndUpdate(id, {...data});
    
    // Update image if a new one was uploaded
    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        let savedListing = await listing.save();
    }
    
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