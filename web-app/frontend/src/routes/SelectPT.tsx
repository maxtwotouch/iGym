import { motion } from 'framer-motion';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import PtList from '../components/PtList';

const SelectPT: React.FC = () => {
  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col text-white">
      <NavBar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <h1 className="text-5xl font-extrabold mb-4">
              Select Your Personal Trainer
            </h1>
            <p className="text-lg text-gray-300">
              Discover a trainer who perfectly matches your style and goals. Browse our curated list and choose the best fit for you.
            </p>
          </motion.div>
          <PtList />
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default SelectPT;