const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const User = require("./users.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: {
        url: String,
        filename: String
    },
    price: {
        type: Number,
        required: [true, "Price must be a number"],
    },
    city: {
        type: String,
    },
    country: {
        type: String,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    houseno: {
        type: String
    },
    availablerooms: {
        type: String
    },
    facilities: {
        type: String
    },
    address: {
        type: String
    },
    state: {
        type: String,
    },
    status:{
        type:String,
        default: 'Vacant'
   }

});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
})

const listing = mongoose.model("listing", listingSchema);

module.exports = listing;