

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

const allowedOrigins = ['https://rentora.vercel.app', "http://localhost:3000"]; // Allow the specific frontend URL

const corsOptions = {
    origin: function (origin, callback) {
        // Check if origin is in the allowed list
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow credentials (cookies, authorization headers)
};

// Apply the CORS middleware
app.use(cors(corsOptions));



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
        const { email, password, username, createdAt } = req.body;

        // Check if all fields are filled
        if (!email || !password || !username) {
            return res.json({ message: 'All fields are required', success: false });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User already exists");
            return res.json({ message: "User already exists", success: false });
        }

        // Create a new user
        const user = await User.create({ email, password, username, createdAt });

        // Create token for the new user
        const token = createSecretToken(user._id);

        // Set token in cookie with secure and httpOnly options
        res.cookie("token", token, {
            withCredentials: true,  //to send cookies through response
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "None",
            maxAge: 24 * 60 * 60 * 1000,
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
        console.log("Token from frontend", token)
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "None",
            maxAge: 24 * 60 * 60 * 1000,
        });
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



// app.get("/setListings", (req, res) => {
//     let templisting = [
//         {
//             title: "Cozy Beachfront Cottage",
//             description:
//                 "Escape to this charming beachfront cottage for a relaxing getaway. Enjoy stunning ocean views and easy access to the beach.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1500,
//             location: "Malibu",
//             country: "United States",
//         },
//         {
//             title: "Modern Loft in Downtown",
//             description:
//                 "Stay in the heart of the city in this stylish loft apartment. Perfect for urban explorers!",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1200,
//             location: "New York City",
//             country: "United States",
//         },
//         {
//             title: "Mountain Retreat",
//             description:
//                 "Unplug and unwind in this peaceful mountain cabin. Surrounded by nature, it's a perfect place to recharge.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8aG90ZWxzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1000,
//             location: "Aspen",
//             country: "United States",
//         },
//         {
//             title: "Historic Villa in Tuscany",
//             description:
//                 "Experience the charm of Tuscany in this beautifully restored villa. Explore the rolling hills and vineyards.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aG90ZWxzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 2500,
//             location: "Florence",
//             country: "Italy",
//         },
//         {
//             title: "Secluded Treehouse Getaway",
//             description:
//                 "Live among the treetops in this unique treehouse retreat. A true nature lover's paradise.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhvdGVsc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 800,
//             location: "Portland",
//             country: "United States",
//         },
//         {
//             title: "Beachfront Paradise",
//             description:
//                 "Step out of your door onto the sandy beach. This beachfront condo offers the ultimate relaxation.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGhvdGVsc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 2000,
//             location: "Cancun",
//             country: "Mexico",
//         },
//         {
//             title: "Rustic Cabin by the Lake",
//             description:
//                 "Spend your days fishing and kayaking on the serene lake. This cozy cabin is perfect for outdoor enthusiasts.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1vdW50YWlufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 900,
//             location: "Lake Tahoe",
//             country: "United States",
//         },
//         {
//             title: "Luxury Penthouse with City Views",
//             description:
//                 "Indulge in luxury living with panoramic city views from this stunning penthouse apartment.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2t5JTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 3500,
//             location: "Los Angeles",
//             country: "United States",
//         },
//         {
//             title: "Ski-In/Ski-Out Chalet",
//             description:
//                 "Hit the slopes right from your doorstep in this ski-in/ski-out chalet in the Swiss Alps.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHNreSUyMHZhY2F0aW9ufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 3000,
//             location: "Verbier",
//             country: "Switzerland",
//         },
//         {
//             title: "Safari Lodge in the Serengeti",
//             description:
//                 "Experience the thrill of the wild in a comfortable safari lodge. Witness the Great Migration up close.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fG1vdW50YWlufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 4000,
//             location: "Serengeti National Park",
//             country: "Tanzania",
//         },
//         {
//             title: "Historic Canal House",
//             description:
//                 "Stay in a piece of history in this beautifully preserved canal house in Amsterdam's iconic district.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FtcGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1800,
//             location: "Amsterdam",
//             country: "Netherlands",
//         },
//         {
//             title: "Private Island Retreat",
//             description:
//                 "Have an entire island to yourself for a truly exclusive and unforgettable vacation experience.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1618140052121-39fc6db33972?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bG9kZ2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 10000,
//             location: "Fiji",
//             country: "Fiji",
//         },
//         {
//             title: "Charming Cottage in the Cotswolds",
//             description:
//                 "Escape to the picturesque Cotswolds in this quaint and charming cottage with a thatched roof.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1602088113235-229c19758e9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YmVhY2glMjB2YWNhdGlvbnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1200,
//             location: "Cotswolds",
//             country: "United Kingdom",
//         },
//         {
//             title: "Historic Brownstone in Boston",
//             description:
//                 "Step back in time in this elegant historic brownstone located in the heart of Boston.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1533619239233-6280475a633a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHNreSUyMHZhY2F0aW9ufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 2200,
//             location: "Boston",
//             country: "United States",
//         },
//         {
//             title: "Beachfront Bungalow in Bali",
//             description:
//                 "Relax on the sandy shores of Bali in this beautiful beachfront bungalow with a private pool.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1602391833977-358a52198938?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fGNhbXBpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1800,
//             location: "Bali",
//             country: "Indonesia",
//         },
//         {
//             title: "Mountain View Cabin in Banff",
//             description:
//                 "Enjoy breathtaking mountain views from this cozy cabin in the Canadian Rockies.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1500,
//             location: "Banff",
//             country: "Canada",
//         },
//         {
//             title: "Art Deco Apartment in Miami",
//             description:
//                 "Step into the glamour of the 1920s in this stylish Art Deco apartment in South Beach.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://plus.unsplash.com/premium_photo-1670963964797-942df1804579?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1600,
//             location: "Miami",
//             country: "United States",
//         },
//         {
//             title: "Tropical Villa in Phuket",
//             description:
//                 "Escape to a tropical paradise in this luxurious villa with a private infinity pool in Phuket.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1470165301023-58dab8118cc9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 3000,
//             location: "Phuket",
//             country: "Thailand",
//         },
//         {
//             title: "Historic Castle in Scotland",
//             description:
//                 "Live like royalty in this historic castle in the Scottish Highlands. Explore the rugged beauty of the area.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1585543805890-6051f7829f98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGJlYWNoJTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 4000,
//             location: "Scottish Highlands",
//             country: "United Kingdom",
//         },
//         {
//             title: "Desert Oasis in Dubai",
//             description:
//                 "Experience luxury in the middle of the desert in this opulent oasis in Dubai with a private pool.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZHViYWl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 5000,
//             location: "Dubai",
//             country: "United Arab Emirates",
//         },
//         {
//             title: "Rustic Log Cabin in Montana",
//             description:
//                 "Unplug and unwind in this cozy log cabin surrounded by the natural beauty of Montana.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1100,
//             location: "Montana",
//             country: "United States",
//         },
//         {
//             title: "Beachfront Villa in Greece",
//             description:
//                 "Enjoy the crystal-clear waters of the Mediterranean in this beautiful beachfront villa on a Greek island.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8dmlsbGF8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 2500,
//             location: "Mykonos",
//             country: "Greece",
//         },
//         {
//             title: "Eco-Friendly Treehouse Retreat",
//             description:
//                 "Stay in an eco-friendly treehouse nestled in the forest. It's the perfect escape for nature lovers.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1488462237308-ecaa28b729d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8c2t5JTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 750,
//             location: "Costa Rica",
//             country: "Costa Rica",
//         },
//         {
//             title: "Historic Cottage in Charleston",
//             description:
//                 "Experience the charm of historic Charleston in this beautifully restored cottage with a private garden.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1600,
//             location: "Charleston",
//             country: "United States",
//         },
//         {
//             title: "Modern Apartment in Tokyo",
//             description:
//                 "Explore the vibrant city of Tokyo from this modern and centrally located apartment.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHRva3lvfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 2000,
//             location: "Tokyo",
//             country: "Japan",
//         },
//         {
//             title: "Lakefront Cabin in New Hampshire",
//             description:
//                 "Spend your days by the lake in this cozy cabin in the scenic White Mountains of New Hampshire.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDF8fGNhbXBpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1200,
//             location: "New Hampshire",
//             country: "United States",
//         },
//         {
//             title: "Luxury Villa in the Maldives",
//             description:
//                 "Indulge in luxury in this overwater villa in the Maldives with stunning views of the Indian Ocean.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bGFrZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 6000,
//             location: "Maldives",
//             country: "Maldives",
//         },
//         {
//             title: "Ski Chalet in Aspen",
//             description:
//                 "Hit the slopes in style with this luxurious ski chalet in the world-famous Aspen ski resort.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGxha2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 4000,
//             location: "Aspen",
//             country: "United States",
//         },
//         {
//             title: "Secluded Beach House in Costa Rica",
//             description:
//                 "Escape to a secluded beach house on the Pacific coast of Costa Rica. Surf, relax, and unwind.",
//             image: {
//                 filename: "listingimage",
//                 url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmVhY2glMjBob3VzZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//             },
//             price: 1800,
//             location: "Costa Rica",
//             country: "Costa Rica",
//         },
//     ];

//     templisting.forEach((item) => {
//         let newListing = new listing({
//             title: item.title,
//             description: item.description,
//             image: {
//                 filename: item.image.filename,
//                 url: item.image.url,
//             },
//             price: item.price,
//             location: item.location,
//             country: item.country,
//         })
//         newListing.save();
//     })
//     res.send("done")

// })