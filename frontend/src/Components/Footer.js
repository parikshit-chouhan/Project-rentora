import React from 'react'

function Footer() {
    return (
        <div>

            <footer style={{ backgroundColor: "#2c3e50", color: "white", padding: "15px 0", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
                <div class="container " style={{maxWidth: "1200px", margin: "0 auto"}}>


                    <p style={{ margin: "0", fontSize: "18px", fontWeight: "bold" }}>© 2024 Rentora - Your Home Away from Home</p>


                    <div style={{ margin: "20px 0" }}>
                        <a href="https://facebook.com" target="_blank" style={{ margin: "0 15px", color: "white", textDecoration: "none", fontSize: "20px" }}>
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="https://twitter.com" target="_blank" style={{ margin: "0 15px", color: "white", textDecoration: "none", fontSize: "20px" }}>
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="https://instagram.com" target="_blank" style={{ margin: "0 15px", color: "white", textDecoration: "none", fontSize: "20px" }}>
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="https://linkedin.com" target="_blank" style={{ margin: "0 15px", color: "white", textDecoration: "none", fontSize: "20px" }}>
                            <i class="fab fa-linkedin-in"></i>
                        </a>
                    </div>


                    <div style={{ marginTop: "20px" }}>
                        <a href="/about-us" style={{ margin: " 0 10px", color: "white", textDecoration: "none", fontSize: "14px" }}>About Us</a>
                        |
                        <a href="/contact" style={{ margin: " 0 10px", color: "white", textDecoration: "none", fontSize: "14px" }}>Contact</a>
                        |
                        <a href="/privacy-policy" style={{ margin: " 0 10px", color: "white", textDecoration: "none", fontSize: "14px" }}>Privacy Policy</a>
                    </div>

                </div>
            </footer>

        </div >
    )
}

export default Footer
