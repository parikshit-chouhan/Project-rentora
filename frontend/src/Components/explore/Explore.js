import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Explore() {
    const [allListings, setAllListings] = useState([]);

    useEffect(() => {
        axios.get("https://rentora-c5dt.onrender.com/allListings")
            .then((res) => {
                if (res.data.status) {
                    setAllListings(res.data.allListings);
                } else {
                    console.log("No listings found");
                }
            })
            .catch((err) => console.error("Error fetching listings:", err));
    }, []);

    return (
        <div className="explore-container">
            <h2 className="mt- mb-2" style={{textAlign:"center"}} >All Listings</h2>
            <div className="explore-listing">
                {allListings.length > 0 ? (
                    allListings.map((data, idx) => (
                        < Link to={`/listings/${data._id}`} className="listing-link" key={idx}>
                            <div className="card listing-card">
                                <img src={data.image.url || ""} className="card-img-top" alt="listing_image" style={{ height: "20rem" }} />
                                <div className="card-img-overlay"></div>
                                <div className="card-body">
                                    <p className="card-text">
                                        <b>{data.title}</b> <br />
                                         &#8377; {data.price} / month
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p>Loading listings...</p>
                )}
            </div>
        </div>
    );
}

export default Explore;
