import { motion } from "framer-motion";
import PtList from "~/components/SelectPT/Ptlist";

export const SelectPT: React.FC = () => {
  return (
    <main className="flex-grow bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
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
  );
};