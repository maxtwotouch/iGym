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
        </motion.div>
        <PtList />
      </div>
    </main>
  );
};