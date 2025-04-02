import { motion } from 'framer-motion';
import NavBar from '~/components/NavBar';
import Footer from '~/components/Footer';
import PtList from '~/components/PtList';

const SelectPT: React.FC = () => {
    return (
        <motion.div className="d-flex flex-column min-vh-100">
            <NavBar />
            <motion.div
                className="flex flex-row flex-grow-1 bg-gradient-to-br from-gray-900 to-gray-800 text-white justify-center p-4"
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