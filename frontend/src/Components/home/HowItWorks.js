import React from "react";

function HowItWorks() {
    return (
        <section class="features">
            <h2>How Rentora Works</h2>
            <div class="feature-container">
                <div class="feature">
                <i className="fas fa-search"></i>
                    <h3>Search for Listings</h3>
                    <p>Browse homes in the most convenient locations and find the best options.</p>
                </div>
                <div class="feature">
                <i className="fas fa-calendar-check"></i>
                    <h3>Book Your Favorite</h3>
                    <p>Once you find the perfect home, book it directly with a secure payment gateway.</p>
                </div>
                <div class="feature">
                <i className="fas fa-home"></i>
                    <h3>Move in and Enjoy</h3>
                    <p>After booking, you can move in and start enjoying your new home.</p>
                </div>
            
                <div class="feature">
                <i className="fas fa-plus-circle"></i>
                <h3>Create Your Listing</h3>
                <p>Want to rent out your home? Create a listing easily with details and photos.</p>
                </div>
                <div class="feature">
                <i className="fas fa-edit"></i>
                    <h3>Edit Your Listings</h3>
                    <p>Need to update your listing? Easily edit details, photos, and availability.</p>
                </div>
                <div class="feature">
                <i className="fas fa-trash-alt"></i>
                    <h3>Delete a Listing</h3>
                    <p>If you no longer wish to rent out your property, delete your listing anytime.</p>
                </div>
            </div>
        </section>
  
    );
}

export default HowItWorks;