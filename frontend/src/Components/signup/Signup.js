import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Signup() {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState({
        email: '',
        password: '',
        username: '',
        number: '',  // Added number field
    });
    const { email, password, username, number } = inputValue;
    const [loading, setLoading] = useState(false);

    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setInputValue((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleError = (err) => 
        toast.error(err, { position: 'top-right' });

    const handleSuccess = (msg) => 
        toast.success(msg, { position: 'top-right' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(
                'https://rentora-server.vercel.app/signup',
                { ...inputValue },
                { withCredentials: true }
            );
            const { success, message, user, token } = data;
            if (success) {
                handleSuccess(message);
                localStorage.setItem('username', user.username);
                localStorage.setItem('token', token);
                localStorage.setItem('user_id', user._id);
                setTimeout(() => {
                    navigate('/');
                }, 1000);
            } else {
                handleError(message);
            }
        } catch (error) {
            handleError('Something went wrong. Please try again.');
            console.log(error);
        } finally {
            setLoading(false);
        }
        setInputValue({
            email: '',
            password: '',
            username: '',
            number: '',
        });
    };

    return (
        <>
            <h1 className="text-center mt-4 mb-4" style={{ color: '#e63946' }}>Sign Up</h1>
            <div className="row mb-5 justify-content-center">
                <div className="col-md-6 col-lg-4 p-4 shadow rounded" style={{ backgroundColor: '#fdfdff' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="username" className="form-label" style={{ fontWeight: 'bold' }}>Name</label>
                            <input 
                                autoFocus 
                                type="text" 
                                name="username" 
                                id="username" 
                                className="form-control" 
                                placeholder="Enter your username"
                                value={username} 
                                onChange={handleOnChange} 
                                
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="form-label" style={{ fontWeight: 'bold' }}>Email</label>
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
                            <label htmlFor="number" className="form-label" style={{ fontWeight: 'bold' }}>Contact Number</label>
                            <input
                                type="tel"
                                name="number"
                                id="number"
                                className="form-control"
                                placeholder="Enter your Contact No."
                                value={number}
                                onChange={handleOnChange}
                                minLength="10"
                                maxLength="10"
                                
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label" style={{ fontWeight: 'bold' }}>Create Password</label>
                            <input 
                                type="password" 
                                name="password" 
                                id="password" 
                                className="form-control" 
                                placeholder="Create your password"
                                value={password} 
                                onChange={handleOnChange} 
                                
                            />
                        </div>
                        <div className="mb-4 signp-bottom">
                            <Link to="/login" style={{ textDecoration: 'none', color: '#e63946' }}>Already have an account?</Link>
                            <button 
                                className="btn" 
                                style={{ backgroundColor: '#e63946', color: 'white', fontWeight: 'bold' }} 
                                disabled={loading} 
                            >
                                {loading ? 'Signing Up...' : 'Sign Up'}
                            </button>
                        </div>
                    </form>
                    <ToastContainer position="top-right" autoClose={3000} />
                </div>
            </div>
        </>
    );
}

export default Signup;
