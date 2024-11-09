// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listing',
        required: true,
    },
    orderId: {
        type: String
    },
    status: {
        type: String
    },
    bookingDate: {
        type: Date,
        default: Date.now,
    },
});

const booking = mongoose.model('booking', bookingSchema);

module.exports = booking;
