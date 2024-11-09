const User = require("../models/users");
require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.userVerification = (req, res, next) => {
  // Get the token from cookies or the authorization header
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  // Check if the token is present
  if (!token) {
    console.log("no token found")
    return res.json({ message: "Token is required", status: false });
  }

  // Verify the token
  jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
    if (err) {
      return res.json({ message: "Unauthorized: Invalid token", status: false });
    } else {
      // Attach the decoded user data to the request object
      req.user = data;
      console.log("user verified");
      console.log("Incoming Request URL:", req.url);
      console.log("Decoded User:", req.user); // Debugging

      // Proceed to the next middleware or route handler
      next();
    }
  });
};
