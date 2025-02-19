
function Footer () {
    return (
        <footer className="bg-dark text-white py-4">
            <div className="container">
                <div className="row">
                    {/* Column 1 */}
                    <div className="col-md-3 col-sm-6">
                        <h4>Contact Us</h4>
                        <ul className="list-unstyled">
                            <li>UiT The Arctic University of Norway</li>
                            <li>Hansine Hansens veg 18</li>
                            <li>9019 Tromsø, Norway</li>
                        </ul>
                    </div>
                    {/* Column 2 */}
                    <div className="col-md-3 col-sm-6">
                        <h4>About Us</h4>
                        <ul className="list-unstyled">
                            <li><a href="/about" className="text-white">Learn more about us</a></li>
                        </ul>
                    </div>
                    {/* Column 3 */}
                    <div className="col-md-3 col-sm-6">
                        <h4>Placeholder</h4>
                        <ul className="list-unstyled">
                            <li>Placeholder content</li>
                        </ul>
                    </div>
                    {/* Column 4 */}
                    <div className="col-md-3 col-sm-6">
                        <h4>Placeholder</h4>
                        <ul className="list-unstyled">
                            <li>Placeholder content</li>
                        </ul>
                    </div>
                </div>
                {/* Footer Bottom */}
                <div className="text-center mt-3">
                    <p className="mb-0">
                        &copy;{new Date().getFullYear()} iGym - All Rights Reserved
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;