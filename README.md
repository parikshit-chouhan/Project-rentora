# Rentora

Rentora is a web-based platform that connects individuals seeking accommodations with homeowners or property managers who want to rent out their properties. The platform provides a seamless experience for both tenants and property owners, offering features like easy booking, payment integration, and listing management.

## Features

- **Booking & Payments**: Integrated the **Cashfree payment gateway** to allow users to make secure payments during booking on the Rentora platform.
- **Owner Dashboard**: Property owners can manage their listings, bookings, and payments.
- **User Authentication**: Secure login and user authentication using JWT and cookies.
- **Safe & Secure**: Rent or book properties with a trusted and secure process.
- **Beautiful Homes**: Discover and book beautiful, fully-equipped homes for rent.
- **Great Locations**: Search for properties in various cities and countries.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT)
- **Cloud Storage**: Cloudinary (for image storage)
- **Payment Gateway**: Cashfree (for secure payments)
- **Version Control**: Git, GitHub

## Setup and Installation

### Prerequisites

- Node.js
- MongoDB (or a cloud-based MongoDB service)
- Cloudinary account (for storing images)

### Clone the repository

To get started with the project, clone the repository:

```bash
git clone https://github.com/parikshit-chouhan/Rentora.git

### Install Dependencies

Go to the project directory and install dependencies for both the backend and frontend:

### Backend:

cd backend
npm install

### Frontend:

cd frontend
npm install

## Setup Environment Variables

### Create a `.env` file in the root of the project and set the following environment variables:

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key

## Running the Project
### After setting up the environment variables, run the project in development mode:

**Start the backend:**

cd backend
npm start

**Start the frontend:**

cd frontend
npm start

## Contributing

1. Fork the repository
2. Create a new branch:
   
    git checkout -b feature/your-feature
   
3. Make your changes
4. Commit your changes:

    git commit -m 'Add your feature'

5. Push to the branch:
    
    git push origin feature/your-feature
  
6. Open a pull request


## Acknowledgements

- [Cloudinary](https://cloudinary.com/) for image storage
- [Cashfree](https://www.cashfree.com/) for the payment gateway
- [MongoDB](https://www.mongodb.com/) for the database
- [React.js](https://reactjs.org/) and [Node.js](https://nodejs.org/) for making full-stack development easy





