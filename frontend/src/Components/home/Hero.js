import React from 'react'
import { Link } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify';
// toast.info("Our website might take a moment to load as it's hosted on a free service. Please bear with us; we’re working to provide you with a great experience!", {
//     position: "bottom-left",
//     autoClose: false, // Keeps the toast open indefinitely
//     hideProgressBar: false,
//     closeOnClick: true,
//     pauseOnHover: true,
//     draggable: true,
//     style: {
//         width: '400px',  // Adjust width as needed
//         whiteSpace: 'pre-wrap', // Ensures text doesn’t shrink or wrap awkwardly
//         textAlign: 'left', // Aligns the message to the left
//     },
// )
function Hero() {
        return (
            <div>
                <ToastContainer />
                <section class="hero">
                    <div class="hero-content">
                        <h1>Find Your Dream Rental Home</h1>
                        <p>Explore the best homes available for rent in the most sought-after locations.</p>
                        <Link to="/explore"><button className='me-4' >Explore Homes</button></Link>
                       
                    </div>

                </section>

            </div>
        )
    }

export default Hero
