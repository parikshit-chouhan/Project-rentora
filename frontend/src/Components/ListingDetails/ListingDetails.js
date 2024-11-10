import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCookies } from "react-cookie";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { cashfree } from '../../util';

// Main ListingDetails component
const ListingDetails = () => {
    const { id } = useParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cookies] = useCookies(['token']);
    const [error, setError] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const authToken = localStorage.getItem('token');

    const userId = localStorage.getItem('user_id');
    const navigate = useNavigate();

    const ConfirmationDialog = ({ onConfirm, onCancel }) => (
        <div style={dialogOverlayStyle}>
            <div style={dialogStyle}>
                <h4 style={{ marginBottom: '20px' }}>Confirm Deletion</h4>
                <p>Are you sure you want to delete this listing?</p>
                <div style={buttonContainerStyle}>
                    <button onClick={onConfirm} style={confirmButtonStyle}>Yes</button>
                    <button onClick={onCancel} style={cancelButtonStyle}>No</button>
                </div>
            </div>
        </div>
    );



    // Styles for the confirmation dialog
    const dialogOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    };

    const dialogStyle = {
        background: '#fff',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
    };

    const buttonContainerStyle = {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'space-around',
    };

    const confirmButtonStyle = {
        backgroundColor: '#28a745',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.3s',
    };

    const cancelButtonStyle = {
        backgroundColor: '#dc3545',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.3s',
    };


    useEffect(() => {
        const fetchListingDetails = async () => {
            try {
                const response = await axios.get(`https://rentora-c5dt.onrender.com/listings/${id}`);
                setListing(response.data.listing);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch listing details");
                setLoading(false);
            }
        };

        fetchListingDetails();
    }, [id]);

    const handleEdit = () => {
        navigate(`/edit/${id}`);
    };

    const handleBookNow = async () => {
        if (!authToken) {
            toast.error("Please log in to book this listing");
            return;
        }
        setIsBooking(true);

        try {
            // Get session data for Cashfree
            const res = await axios.post(
                `https://rentora-c5dt.onrender.com/createBooking/${id}`,
                { userId },
                {
                    headers: {
                        Authorization: `Bearer ${cookies.token}`,
                    },
                }
            );

            if (res.data.success) {
                const { order_id: orderId, payment_session_id: sessionId } = res.data;
                const checkoutOptions = {
                    paymentSessionId: sessionId,
                    returnUrl: `https://rentora.vercel.app/verify/${orderId}/${userId}/${id}`, // Pointing to frontend URL
                    headers: {
                        "user-id": userId,
                        "listing-id": id,
                    }
                };

                // Initiate the payment
                cashfree.checkout(checkoutOptions).then((result) => {
                    if (result.error) {
                        toast.error(result.error.message);
                        setIsBooking(false);
                    }
                });
            } else {
                toast.error(res.data.message || "Failed to initiate booking session.");
            }
        } catch (error) {
            console.error("Error initiating booking:", error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message); // Show backend error message
            } else {
                toast.error("Failed to initiate booking session.");
            }
            setIsBooking(false);
        }
    };



    const confirmDelete = async () => {
        setShowConfirm(false);
        try {
            const response = await axios.delete(`https://rentora-c5dt.onrender.com/listing/${id}`, {
                headers: {
                    Authorization: `Bearer ${cookies.token}`,
                },
            });

            if (response.data.success) {
                toast.success("Listing deleted successfully");
                setTimeout(() => {
                    navigate('/'); // Redirect to homepage after deletion
                }, 1000);
            } else {
                toast.error("Failed to delete the listing");
            }
        } catch (error) {
            toast.error("An error occurred while deleting the listing");
        }
    };


    if (loading) return <p className='text-center'>Loading...</p>;
    if (error) return <p className='text-center'>{error}</p>;
    if (!listing) return <p className='text-center'>No listing found.</p>;

    return (
        <div className=" container mt-3">
            <ToastContainer />
            {showConfirm && (
                <ConfirmationDialog
                    onConfirm={confirmDelete}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
            <div className="row justify-content-center">
                <div className=" col-md-6 ">
                    <h3 className="text-center"><b>{listing.title}</b></h3>
                    <div className="card show-card listing-card">
                        <img src={listing.image.url} className="card-img-top show-img" alt="listing_image" />
                        <div className="card-body">
                            <p className="card-text mt-2"><b>Owner Name: {listing.owner.username.toUpperCase()}</b></p>
                            <p className="card-text"><b>Description:</b> {listing.description}</p>
                            <p className="card-text"><b>Rent:</b> &#8377;{listing.price} / month</p>
                            <p className="card-text"><b>Available Rooms:</b> {listing.availablerooms}</p>
                            <p className="card-text"><b>Other Facilities:</b> {Array.isArray(listing.facilities) ? listing.facilities.join(', ') : listing.facilities}</p>
                            <p className="card-text"><b>Home/Plot Number:</b> {listing.houseno}</p>
                            <p className="card-text"><b>Address:</b> {listing.address}</p>
                            <p className="card-text"><b>State:</b> {listing.state}</p>
                            <p className="card-text"><b>City:</b> {listing.city}</p>
                            <p className="card-text"><b>Country:</b> {listing.country}</p>
                            <p className="card-text">
                                <button type="button" className={`btn ${listing.status === "Vacant" ? 'btn-success' : 'btn-danger'}`}>
                                    <b>{listing.status}</b>
                                </button>
                            </p>

                            {userId && listing.owner._id === userId && authToken ? (
                                <div>
                                    <button className="btn btn-danger mb-2 me-2" onClick={handleEdit}>Edit</button>
                                    <button className="btn btn-dark ms-2" onClick={() => setShowConfirm(true)}>Delete</button>
                                </div>
                            ) : (
                                <div>
                                    <button className='btn btn-danger mb-2 mb-md-0 me-2' onClick={handleBookNow} disabled={isBooking}>
                                        {isBooking ? "Booking..." : "Book Now"}
                                    </button>
                                    {/* <Link href="#" className="btn btn-danger ms-2">Book A Visit</Link> */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetails;

