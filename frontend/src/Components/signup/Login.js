import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Login() {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState({
        email: '',
        password: '',
        number: '',  // Add the number field to state
    });
    const [loading, setLoading] = useState(false);
    const { email, password, number } = inputValue;

    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setInputValue((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleError = (err) => toast.error(err, { position: 'top-right' });
    const handleSuccess = (msg) => toast.success(msg, { position: 'top-right' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(
                'https://rentora-c5dt.onrender.com/login',
                { email, password, number },
                { withCredentials: true }
            );
            const { success, message, user, token } = data;
            if (success) {
                
                console.log("data after login request", data);
                console.log("cookie after login request", token);
                localStorage.setItem('username', user.username);
                localStorage.setItem('token', token);
                localStorage.setItem('user_id', user._id);
                console.log("username", user.username)
                console.log("userid", user._id)
                handleSuccess(message);
                setTimeout(() => {
                    navigate('/');
                }, 1000);
            } else {
                handleError(message);
            }
        } catch (error) {
            console.log(error)
            const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
            handleError(errorMessage);
        } finally {
            setLoading(false);
        }
        setInputValue({
            email: '',
            password: '',
            number: '',
        });
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <h1 className="text-center mt-4 mb-4" style={{ color: '#e63946' }}>Login</h1>
            <div className="row mb-5 justify-content-center">
                <div className="col-md-6 col-lg-4 p-4 shadow rounded" style={{ backgroundColor: '#fdfdff' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="form-label" style={{ fontWeight: 'bold' }}>Enter your Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className="form-control"
                                placeholder="Enter your Email"
                                value={email}
                                onChange={handleOnChange}                                
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label" style={{ fontWeight: 'bold' }}>Enter your Password</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                className="form-control"
                                placeholder="Enter your Password"
                                value={password}
                                onChange={handleOnChange}                                
                            />
                        </div>
                        <div className="mb-4 d-flex justify-content-between align-items-center">
                            <Link to="/signup" style={{ textDecoration: 'none', color: '#e63946' }}>Don't have an account?</Link>
                            <button
                                className="btn"
                                style={{ backgroundColor: '#e63946', color: 'white', fontWeight: 'bold' }}
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default Login;
