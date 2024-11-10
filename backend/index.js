

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3002;

// lisitngs 
const listing = require("./models/listing.js");
// user
const User = require("./models/users.js");
// booking
const booking = require("./models/booking.js");

// to generate a token
const { createSecretToken } = require("./util/SecretToken.js");

//to check user authenticate or not
const { userVerification } = require("./middleware/AuthMiddleware.js");

const axios = require('axios');


// The cookie-parser manages cookie-based sessions
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// to fetch req.body data to server
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.json());


// Set up multer for image handling
const multer = require('multer');
const cloudinary = require('./util/cloudinaryConfig.js');

const storage = multer.diskStorage({});
const upload = multer({ storage });


// mongoose
const mongoose = require("mongoose");
// to get mongo url
const MONGO_URL = process.env.MONGO_URL;

// payment gateway
const crypto = require('crypto');
const { Cashfree } = require('cashfree-pg')

Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

function generateOrderId() {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256');
    hash.update(uniqueId);
    const orderId = hash.digest('hex');
    return orderId.substr(0, 12);
}



// To allow frontend port request to ouer server 
const cors = require("cors");

// const allowedOrigins = ['https://rentora.vercel.app', "http://localhost:3000"]; // Allow the specific frontend URL

// const corsOptions = {
//     origin: function (origin, callback) {
//         // Check if origin is in the allowed list
//         if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true, // Allow credentials (cookies, authorization headers)
// };

// // Apply the CORS middleware
// app.use(cors(corsOptions));


app.use(cors({
    origin: '*', // Temporarily allow all origins for testing
    credentials: true,  // Allow credentials (cookies, authorization headers, etc.)
}));


// for password encryption and dcryption
const bcrypt = require("bcrypt");

// to connect mongo database
mongoose.connect(MONGO_URL)
    .then(() => console.log("MongoDB is  connected successfully"))
    .catch((err) => console.error(err));

app.listen(PORT, () => {
    console.log(`Server is listning on ${PORT}`);
})



app.get('/allListings', async (req, res) => {
    try {
        console.log("req recieved")
        // console.log("Fetching listing for user ID:", req.user._id); // Debugging
        const allListings = await listing.find({});

        if (allListings) {
            res.json({ status: true, message: "holding feteched", allListings });
        } else {
            res.status(500).res.json({ status: false, message: "No lisitng found" });
        }
    } catch (error) {

        res.status(500).json({ success: false, message: 'Failed to fetch lisitng' });
    }
})

// to get listing details
app.get("/listings/:id", async (req, res) => {
    let { id } = req.params; // ID ko params se lete hain
    const findListing = await listing.findById(id).populate({ path: "reviews", populate: { path: "auther" } }).populate("owner");

    if (!findListing) {
        console.log("not found")
    }
    res.json({ listing: findListing }); // Data ko JSON format mein return karte hain
});

// signup
app.post("/signup", async (req, res) => {
    try {
        const { email, password, username, number, createdAt } = req.body;

        // Check if all fields are filled
        if (!email || !password || !username || !number) {
            return res.json({ message: 'All fields are required', success: false });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User already exists");
            return res.json({ message: "User already exists", success: false });
        }

        // Create a new user
        const user = await User.create({ email, password, username, number, createdAt });

        // Create token for the new user
        const token = createSecretToken(user._id);
        console.log(token)
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
            secure: true,
            sameSite: "None",
        });

        // Send success response with newly created user data
        res.status(201).json({ message: "User signed up successfully", success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", success: false });
    }
});


// login
app.post("/login", async (req, res) => {

    try {
        console.log("req recieved for login for user",)
        const { email, password } = req.body;
        // Check if the user is already logged in 
        if (!email || !password) {
            return res.json({ message: 'All fields are required' });
        }
        const currToken = req.cookies.token; // Get the token from cookies
        if (currToken && currToken !== 'undefined') {
            return res.status(400).json({ message: 'Please Logout to Login again' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'Incorrect password or email' });
        }

        const auth = await bcrypt.compare(password, user.password);
        if (!auth) {
            return res.json({ message: 'Incorrect password or email' });
        }
        console.log(user)
        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
            secure: true,
            sameSite: "None",
        });

        console.log("Token from frontend", token)
        res.status(200).json({ message: "User logged in successfully", success: true, user });
    } catch (error) {
        console.error(error);
    }
});


// to create a new listing
app.post('/addListing', userVerification, upload.single('image'), async (req, res) => {
    // console.log("Incoming Request URL:", req.url);
    // console.log(req.user)
    // let{title, houseno, availablerooms, facilities, price, description, status, address, city, state, country, image, }
    try {
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
        console.log(result.public_id)

        // Store the URL in MongoDB
        let url = result.secure_url
        let filename = result.public_id
        const newListing = new listing({
            title: req.body.title,
            houseno: req.body.houseno,
            availablerooms: req.body.availablerooms,
            facilities: req.body.facilities,
            price: req.body.price,
            description: req.body.description,
            status: req.body.status,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            image: { url, filename },
            owner: req.user.id,
            // Store Cloudinary URL here
        });

        await newListing.save();
        res.status(201).json({ success: true, message: 'Listing created successfully' });
        console.log("listing created")
    } catch (error) {
        console.error("Error creating listing:", error);
        res.status(500).json({ success: false, message: 'Error creating listing' });
    }
});

// edit listing
app.put('/listing/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const {
        title,
        houseno,
        availablerooms,
        facilities,
        price,
        description,
        status,
        address,
        city,
        state,
        country,
    } = req.body;

    try {
        // Existing listing ko dhoondho
        const existingListing = await listing.findById(id);
        if (!existingListing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        // Image ko process karo
        let image;
        if (req.file) {
            // Agar naye image ko upload kiya gaya hai
            const result = await cloudinary.uploader.upload(req.file.path);
            image = { url: result.secure_url, filename: result.public_id };
        } else {
            // Agar naye image nahi diya gaya hai, purani image ko rakh lo
            image = existingListing.image;
        }

        // Listing ko update karo
        existingListing.title = title;
        existingListing.houseno = houseno;
        existingListing.availablerooms = availablerooms;
        existingListing.facilities = facilities;
        existingListing.price = price;
        existingListing.description = description;
        existingListing.status = status;
        existingListing.address = address;
        existingListing.city = city;
        existingListing.state = state;
        existingListing.country = country;
        existingListing.image = image;

        await existingListing.save();
        res.status(200).json({ success: true, message: 'Listing updated successfully', existingListing });
    } catch (error) {
        console.error("Error updating listing:", error);
        res.status(500).json({ success: false, message: 'Error updating listing' });
    }
});

// delete listing
app.delete('/listing/:id', userVerification, async (req, res) => {
    console.log("req")
    const { id } = req.params;
    console.log(id)
    try {
        // Find the listing by ID
        const existingListing = await listing.findById(id);
        if (!existingListing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        // Delete image from Cloudinary if it exists
        if (existingListing.image && existingListing.image.filename) {
            await cloudinary.uploader.destroy(existingListing.image.filename);
        }

        // Delete listing from MongoDB
        await listing.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Listing deleted successfully' });
    } catch (error) {
        console.error("Error deleting listing:", error);
        res.status(500).json({ success: false, message: 'Error deleting listing' });
    }
});

// specific users listing
app.get('/seeListing/:id', userVerification, async (req, res) => {
    try {
        const id = req.params.id;
        const listings = await listing.find({ owner: id }); // Filter listings by owner ID
        if (listings.length > 0) {
            return res.json({ status: true, allListings: listings });
        }
        return res.json({ status: false, message: "No listings found" });
    } catch (error) {
        console.error("Error fetching listings:", error);
        return res.status(500).json({ status: false, message: "Server error" });
    }
});

// book a listing
// app.post('/createBooking/:id', userVerification, async (req, res) => {
//     console.log("Booking request received");
//     const listing_id = req.params.id;
//     const userId = req.user.id;

//     try {
//         // Check if the listing exists
//         const existingListing = await listing.findById(listing_id);
//         if (!existingListing) {
//             return res.status(404).json({ success: false, message: 'Listing not found' });
//         }

//         // Check if the listing is already occupied
//         if (existingListing.status === "Occupied") {
//             return res.status(400).json({ success: false, message: 'Listing is already occupied' });
//         }

//         // Create the booking
//         const newBooking = new booking({
//             user: userId,
//             listing: listing_id,
//             bookingDate: new Date(),
//         });
//         existingListing.status = "Occupied";
//         await newBooking.save();
//         await existingListing.save();

//         // Send success response
//         return res.json({ success: true, message: 'Booking created successfully', booking: newBooking });
//     } catch (error) {
//         console.error('Error creating booking:', error);
//         // Send error response
//         return res.status(500).json({ success: false, message: 'Failed to create booking' });
//     }
// });




// to get users booking

app.get('/getBooking/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        console.log("User ID:", userId);

        // Find bookings and populate the listing details
        const bookings = await booking.find({ userId: userId }).populate({ path: 'listingId', populate: { path: 'owner', model: 'User', select: 'username email' } });

        if (!bookings) {
            return res.status(404).json({ success: false, message: "No bookings found for this user." });
        }

        // console.log("Bookings with listing details:", bookings);
        console.log(bookings)
        res.json({ success: true, bookings });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ success: false, message: "Error fetching bookings from database" });
    }
});


app.delete('/cancelBooking/:bookingId', async (req, res) => {
    const bookingId = req.params.bookingId;
    console.log("Booking ID:", bookingId);

    try {
        // Find the booking by its ID
        const existingBooking = await booking.findById(bookingId);
        if (!existingBooking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // Get the associated listing ID from the booking
        const listingId = existingBooking.listingId;
        console.log("Listing ID:", listingId);

        // Update the listing status to "Vacant"
        await listing.findByIdAndUpdate(listingId, { status: 'Vacant' });

        // Delete the specific booking by its ID
        await booking.findByIdAndDelete(bookingId);

        res.json({ success: true, message: "Booking canceled and listing status updated" });
    } catch (error) {
        console.error("Error canceling booking:", error);
        res.status(500).json({ success: false, message: "Error canceling booking" });
    }
});

app.post("/createBooking/:id", userVerification, async (req, res) => {
    const listing_id = req.params.id;
    const userId = req.user.id;

    try {
        const existingListing = await listing.findById(listing_id);
        if (!existingListing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        // Check if the listing is already occupied
        if (existingListing.status === "Occupied") {
            return res.status(400).json({ success: false, message: 'Listing is already occupied' });
        }

        const user = await User.findById(userId);

        const options = {
            method: "POST",
            url: "https://sandbox.cashfree.com/pg/orders",
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': process.env.CLIENT_ID,
                'x-client-secret': process.env.CLIENT_SECRET,
            },
            data: {
                customer_details: {
                    customer_id: user._id.toString(),
                    customer_email: user.email,
                    customer_phone: user.number.toString(),
                    customer_name: user.username
                },
                order_meta: {
                    payment_methods: "cc,dc,upi",
                    notify_url: "https://webhook.site/c6844494-0754-44e1-a412-0795334b980e"
                },
                order_id: await generateOrderId(),
                order_amount: existingListing.price,
                order_currency: "INR"
            }
        };

        axios.request(options).then(function (response) {
            console.log(response.data);
            return res.status(200).json({ success: true, ...response.data });
        }).catch(function (error) {
            console.error("Error creating order:", error);
            return res.status(500).json({ success: false, message: "Error initiating payment session" });
        });
    } catch (err) {
        console.error("Error in createBooking route:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


app.get("/verify/:orderId/:userId/:id", async (req, res) => {
    const orderId = req.params.orderId;
    const userId = req.params.userId;
    const listingId = req.params.id;

    if (!userId || !listingId) {
        return res.status(400).json({ error: "User ID and Listing ID are required." });
    }

    try {
        const options = {
            method: "GET",
            url: `https://sandbox.cashfree.com/pg/orders/${orderId}`,
            headers: {
                accept: "application/json",
                "x-api-version": "2023-08-01",
                "x-client-id": process.env.CLIENT_ID,
                "x-client-secret": process.env.CLIENT_SECRET,
            },
        };

        const response = await axios.request(options);
        const orderStatus = response.data.order_status;
        console.log(response)
        if (orderStatus === "PAID") {
            const Booking = new booking({
                userId: userId,
                listingId: listingId,
                orderId: orderId,
                status: "PAID",
            });

            await Booking.save();
            const existingListing = await listing.findById(listingId);
            if (!existingListing) {
                return res.status(404).json({ success: false, message: 'Listing not found' });
            }

            if (existingListing.status === "Occupied") {
                return res.status(400).json({ success: false, message: 'Listing is already occupied' });
            }

            existingListing.status = "Occupied";
            await existingListing.save();
            console.log("Booking successful and saved in database.");
            return res.json({ success: true, status: "PAID", message: "Booking confirmed and saved!" });

        } else if (orderStatus === "ACTIVE") {
            console.log("Wait for payment to complete.");
            return res.json({ success: false, status: "ACTIVE", message: "Payment in process. Please wait." });
        } else {
            console.log("Payment failed.");
            return res.json({ success: false, status: "FAILED", message: "Payment failed. Booking not completed." });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while verifying payment." });
    }
});


// logout
app.post("/logout", (req, res) => {
    res.clearCookie("token");
    return res.status(200).json({ message: "User logged out successfully", success: true });
});




