import { motion } from 'framer-motion';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import PtList from '../components/PtList';

const SelectPT: React.FC = () => {
    return (
        <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col text-white">
            <NavBar />
            <motion.div
                className="flex flex-grow p-6 flex-col md:flex-row gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >

                <PtList />

            </motion.div>
            <Footer />
        </motion.div>
    );
};

export default SelectPT;