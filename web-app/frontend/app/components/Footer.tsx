import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function Footer() {
    return (
        <motion.footer className="bg-dark text-white py-4">
            <motion.div className="container">
                <motion.div className="row">
                    {/* Column 1 */}
                    <motion.div className="col-md-3 col-sm-6">
                        <h4>Contact Us</h4>
                        <ul className="list-unstyled">
                            <li>UiT The Arctic University of Norway</li>
                            <li>Hansine Hansens veg 18</li>
                            <li>9019 Tromsø, Norway</li>
                        </ul>
                    </motion.div>
                    {/* Column 2 */}
                    <motion.div className="col-md-3 col-sm-6">
                        <h4>About Us</h4>
                        <ul className="list-unstyled">
                            <li><Link to="/about" className="text-white">Learn more about us</Link></li>
                        </ul>
                    </motion.div>
                    {/* Column 3 */}
                    <motion.div className="col-md-3 col-sm-6">
                        <h4>Placeholder</h4>
                        <ul className="list-unstyled">
                            <li>Placeholder content</li>
                        </ul>
                    </motion.div>
                    {/* Column 4 */}
                    <motion.div className="col-md-3 col-sm-6">
                        <h4>Placeholder</h4>
                        <ul className="list-unstyled">
                            <li>Placeholder content</li>
                        </ul>
                    </motion.div>
                </motion.div>
                {/* Footer Bottom */}
                <motion.div className="text-center mt-3">
                    <p className="mb-0">
                        &copy;{new Date().getFullYear()} iGym - All Rights Reserved
                    </p>
                </motion.div>
            </motion.div>
        </motion.footer>
    );
}

export default Footer;