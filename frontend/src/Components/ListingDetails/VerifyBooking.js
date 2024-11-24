import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VerifyBooking = () => {
    const { orderId, userId, listingId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState(null); // Track status
    console.log(orderId, userId, listingId);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await axios.get(
                    `https://rentora-c5dt.onrender.com/verify/${orderId}/${userId}/${listingId}`
                );
                console.log("Backend Response:", res.data); // Log the response

                const currentStatus = res.data.status; // Check status in response
                console.log("Current Status:", currentStatus);

                setStatus(currentStatus); // Set the status state

                if (currentStatus === "PAID") {
                    toast.success("Booking confirmed!", { autoClose: 2000 });
                    console.log("Booking confirmed!");
                    setTimeout(() => navigate("/seeyourbooking"), 2000); // Navigate after toast
                } else if (currentStatus === "CANCELLED") {
                    toast.error("Booking not confirmed.", { autoClose: 2000 });
                    console.log("Booking not confirmed.");
                    setTimeout(() => navigate(`/listings/${listingId}`), 2000); // Navigate after toast
                } else {
                    console.log("Payment still processing...");
                }
            } catch (err) {
                console.error("Error", err);
                toast.error("Failed to verify booking.", { autoClose: 2000 });
                setTimeout(() => navigate(`/listings/${listingId}`), 2000);
            }
        };

        // Poll every 2 seconds if status is not finalized
        if (status !== "PAID" && status !== "CANCELLED") {
            const interval = setInterval(fetchStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [orderId, userId, listingId, navigate, status]);

    return (
        <>
            <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} />
            <div className='text-center mt-5'>Verifying your booking, please wait...</div>
        </>
    );
};

export default VerifyBooking;
