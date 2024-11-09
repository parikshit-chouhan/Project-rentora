import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';
import 'react-toastify/ReactToastify.css'
import NavBar from './Components/Navbar';
import Footer from './Components/Footer';
import HomePage from './Components/home/HomePage';
import About from './Components/about/About';
import Explore from './Components/explore/Explore';
import Signup from './Components/signup/Signup';
import ListingDetails from './Components/ListingDetails/ListingDetails';
import Login from './Components/signup/Login';
import AddNewHome from './Components/addnewhome/AddNewHome';
import EditListing from './Components/editListing/EditListing';
import SeeYourBooking from './Components/SeeYourBooking/SeeYourBooking';
import SeeYourListing from './Components/seeYourListing/SeeYourListing';
import VerifyBooking from './Components/ListingDetails/VerifyBooking';


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <NavBar />
    <Routes>
      <Route path='/*' element={<HomePage />} />
      <Route path='/explore' element={<Explore />} />
      <Route path='/signup' element={<Signup />} />
      <Route path='/login' element={<Login />} />
      <Route path="/listings/:id" element={<ListingDetails />} />
      <Route path="/addNewHome" element={<AddNewHome />} />
      <Route path="/edit/:id" element={<EditListing/>} />
      <Route path='/about' element={<About />} />
      <Route path='/seeyourbooking' element={<SeeYourBooking/>} />
      <Route path='/seeyourlisting' element={<SeeYourListing/>} />
      <Route path="/verify/:orderId/:userId/:listingId" element={<VerifyBooking />} />

    </Routes>

    <Footer />
  </BrowserRouter>
);
