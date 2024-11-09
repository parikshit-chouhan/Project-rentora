import React from 'react'
import {Link} from 'react-router-dom'
function Hero() {
    return (
        <div>
            <section class="hero">
                <div class="hero-content">
                    <h1>Find Your Dream Rental Home</h1>
                    <p>Explore the best homes available for rent in the most sought-after locations.</p>
                    <Link to="/explore"><button>Explore....</button></Link>
                   
                </div>
            </section>

        </div>
    )
}

export default Hero
