const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../listing.js");

const MONGO_URL= "mongodb://127.0.0.1:27017/DwellGrid";
async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data.map((obj) => ({...obj, owner: "652d0081ae547c5d37e56b5f"}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initDB();