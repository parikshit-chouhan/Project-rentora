import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";

function Navbar() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // Loading state added
    const username = localStorage.getItem('username');

    const handleSuccess = (msg) => toast.success(msg, { position: "top-right" });

    const handleLogout = async () => {
        setLoading(true); // Set loading to true when logout is initiated
        try {
            const response = await axios.get("https://rentora-c5dt.onrender.com/logout",
                { withCredentials: true });
            setLoading(false); // Set loading to false once response is received
            const { success, message } = response.data;
            console.log(response.data)
            if (success) {
                localStorage.removeItem('username');
                localStorage.removeItem('user_id');
                localStorage.removeItem('token');
                handleSuccess(message);
                setTimeout(() => {
                    navigate("/");
                }, 1000);
            }
        } catch (error) {
            setLoading(false); // Set loading to false if error occurs
            console.error("Logout failed:", error);
        }
    };

    return (
        <div>
            <nav className="navbar navbar-expand-md bg-body-light border-bottom sticky-top ">
                <div className="container-fluid">
                    <Link to="/" className="navbar-brand ms-3">
                        <h3 className="logo"> RENTORA</h3>
                    </Link>

                    {/* Toggle button for medium and smaller screens */}
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNavAltMarkup"
                        aria-controls="navbarNavAltMarkup"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                        <div className="navbar-nav ms-auto">
                            <Link className="nav-link" to="/explore">Explore</Link>
                            <Link className="nav-link" to="/addNewHome">Add New Home</Link>
                            <Link className="nav-link me-4 " to="/about">About Us</Link>

                            {username && username !== 'undefined' ? (
                                <div className="nav-item dropdown">
                                    <button
                                        className="btn dropdown-toggle join-btn"
                                        type="button"
                                        id="userDropdown"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        {username.toUpperCase()}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                        <li>
                                            <Link className="dropdown-item" to={"/seeyourlisting"}>
                                                <i className="fa-solid fa-bed me-2"></i> See Your Listings
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item" to="/seeyourbooking">
                                                <i className="fas fa-key me-2"></i> See Your Bookings
                                            </Link>
                                        </li>
                                        <li>
                                            <button className="dropdown-item" onClick={handleLogout}>
                                                <i className="fas fa-sign-out-alt me-2"></i> Logout
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                <Link className="nav-link join-btn" to="/login">Join Us</Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            {loading && (<p className='text-center' >Please Wait...</p>)}
            <ToastContainer />
        </div>
    );
}

export default Navbar;
