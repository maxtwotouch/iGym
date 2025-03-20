import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function Footer() {
    return (
        <motion.footer 
            className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <motion.div 
                className="max-w-6xl mx-auto px-6"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
                    {/* Column 1 */}
                    <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h4 className="text-lg font-semibold mb-3">Contact Us</h4>
                        <ul className="text-gray-400 space-y-1">
                            <li>UiT The Arctic University of Norway</li>
                            <li>Hansine Hansens veg 18</li>
                            <li>9019 Tromsø, Norway</li>
                        </ul>
                    </motion.div>
                    {/* Column 2 */}
                    <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h4 className="text-lg font-semibold mb-3">About Us</h4>
                        <ul className="text-gray-400">
                            <li>
                                <Link 
                                    to="/about" 
                                    className="text-blue-400 hover:underline"
                                    >
                                        Learn more about us
                                </Link>
                            </li>
                        </ul>
                    </motion.div>
                    {/* Column 3 */}
                    <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <h4 className="text-lg font-semibold mb-3">Placeholder</h4>
                        <ul className="text-gray-400">
                            <li>Placeholder content</li>
                        </ul>
                    </motion.div>
                    {/* Column 4 */}
                    <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h4 className="text-lg font-semibold mb-3">Placeholder</h4>
                        <ul className="text-gray-400">
                            <li>Placeholder content</li>
                        </ul>
                    </motion.div>
                </motion.div>
                {/* Footer Bottom */}
                <motion.div
                    className="text-center mt-6 text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <p className="text-sm">
                        &copy;{new Date().getFullYear()} iGym - All Rights Reserved
                    </p>
                </motion.div>
            </motion.div>
        </motion.footer>
    );
}

export default Footer;