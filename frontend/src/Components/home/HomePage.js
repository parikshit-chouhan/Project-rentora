import React from 'react'
import Hero from './Hero';
import Awards from './Awards';
import Browse from './Browse';
import HowItWorks from './HowItWorks'
function HomePage() {
    return (
        <>
            <Hero />
            <HowItWorks />
            <Awards />
            <Browse />
        </>
    )
}

export default HomePage;
