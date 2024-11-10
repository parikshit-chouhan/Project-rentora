import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function SeeYourBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cookies] = useCookies(['token']);
    const userId = localStorage.getItem('user_id'); // Get user ID from localStorage
    const authToken = localStorage.getItem('token');

    const navigate = useNavigate();

    useEffect(() => {
        const fetchBookings = async () => {
            if (!authToken) {
                toast.error("Please log in to see your bookings.");
                return;
            }

            try {
                const response = await axios.get(`https://rentora-c5dt.onrender.com/getBooking/${userId}`, {
                    headers: { 'Authorization': `Bearer ${cookies.token}` }
                });

                if (response.data.success) {
                    setBookings(response.data.bookings);
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error("Error fetching bookings.");
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [authToken, userId]);

    const handleCancel = async (bookingId) => { // Accept bookingId as a parameter
        try {
            const response = await axios.delete(`https://rentora-c5dt.onrender.com/cancelBooking/${bookingId}`, {
                headers: { 'Authorization': `Bearer ${cookies.token}` }
            });

            if (response.data.success) {
                toast.success("Booking canceled successfully!");
                setBookings(bookings.filter(booking => booking._id !== bookingId)); // Remove canceled booking from the list
                setTimeout(() => {
                    navigate('/explore');
                }, 1000);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Error canceling booking:", error);
            toast.error("An error occurred while canceling the booking.");
        }
    };

    if (loading) {
        return <p className='text-center'>Loading... Please wait.</p>;
    }

    return (
        <div className="container mt-3">
            <ToastContainer />
            {bookings.length === 0 ? (
                <p className="text-center">No bookings found.</p>
            ) : (
                <div className="row justify-content-center">
                    {bookings.map((booking) => (
                        <div className="col-md-4 mb-4" key={booking._id}>
                            <h4 className="text-center"><b>{booking.listingId.title}</b></h4>
                            <div className="card show-card listing-card">
                                <img src={booking.listingId.image.url} className="card-img-top show-img" alt="listing_image" />
                                <div className="card-body">
                                    <p className="card-text mt-2"><b>Owner Name: {booking.listingId.owner.username.toUpperCase()}</b></p>
                                    <p className="card-text" style={{ color: "green" }} ><b>Order Id:</b> {booking.orderId} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Payment Status:</b>{booking.status} </p>
                                    <p className="card-text"><b>Description:</b> {booking.listingId.description}</p>
                                    <p className="card-text"><b>Rent:</b> &#8377;{booking.listingId.price} / month</p>
                                    <p className="card-text"><b>Available Rooms:</b> {booking.listingId.availablerooms}</p>
                                    <p className="card-text"><b>Other Facilities:</b> {Array.isArray(booking.listingId.facilities) ? booking.listingId.facilities.join(', ') : booking.listingId.facilities}</p>
                                    <p className="card-text"><b>Home/Plot Number:</b> {booking.listingId.houseno}</p>
                                    <p className="card-text"><b>Address:</b> {booking.listingId.address}</p>
                                    <p className="card-text"><b>State:</b> {booking.listingId.state}</p>
                                    <p className="card-text"><b>City:</b> {booking.listingId.city}</p>
                                    <p className="card-text"><b>Country:</b> {booking.listingId.country}</p>
                                    <p className="card-text"><b>Booked At:</b> {new Date(booking.bookingDate).toLocaleDateString()}</p>
                                    <p className="card-text">
                                        <button type="button" className={`btn ${booking.listingId.status === "Vacant" ? 'btn-success' : 'btn-danger'}`}>
                                            <b>{booking.listingId.status}</b>
                                        </button>
                                    </p>
                                    <p>
                                        <button className='btn btn-dark mb-2 mb-md-0 me-md-2' onClick={() => handleCancel(booking._id)}>Cancel</button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SeeYourBooking;
