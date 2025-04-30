import { motion } from "framer-motion";

const Footer = () => {
    return (
        <motion.footer 
            className="bg-gray-900 text-gray-400 py-4 mt-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto px-4 text-center">
                <p className="mb-2">© 2024 iGym - Academic Project</p>
                <p className="text-sm mb-2">Exercise descriptions and images courtesy of SimplyFitness</p>
                <p className="text-sm">Built with React, TypeScript, and Django</p>
            </div>
        </motion.footer>
    );
};

export default Footer; 