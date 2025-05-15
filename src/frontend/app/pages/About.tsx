import { motion } from 'framer-motion';
import TerminalSim from '~/components/About/TerminalSim';
  
export const About = () => {
    const terminaLines: string[] = [
        "This website was developed as an exam project for the INF-2900 software engineering course.",
        "",
        "Created by:",
        "",
        "Daniel Lind Schouten",
        "Andreas Nergård",
        "Max Roness Hovding",
        "Karoline W. Benjaminsen",
        "August S. Hindenes"
    ];

    return (
        <motion.div
            className="flex-grow bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
        >
            <motion.div 
            className="flex flex-col items-center justify-center bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg"
            style={{ width: '80vw', maxWidth: '800px', height: 'auto', minHeight: '60vh' }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            >
            <div className="text-center text-4xl font-bold text-green-500 mb-4">About</div>
            
            <div className="flex flex-col items-center w-full">
                {/* Fake Terminal Menu Bar */}
                <div 
                    className="flex justify-start items-center rounded-t p-1 bg-gray-600 bg-opacity-90"
                    style={{ width: '90%', maxWidth: '700px', height: '25px' }}
                >
                    <div className="rounded-full bg-red-500 mr-2" style={{ height: '12px', width: '12px' }}></div>
                    <div className="rounded-full bg-yellow-500 mr-2" style={{ height: '12px', width: '12px' }}></div>
                    <div className="rounded-full bg-success" style={{ height: '12px', width: '12px' }}></div>
                </div>
                
                {/* Fake Terminal Screen */}
                <div 
                    className="bg-gray-900 bg-opacity-90 text-green-500 font-mono p-3 rounded-b"
                    style={{ width: '90%', maxWidth: '700px', height: 'auto', minHeight: '280px' }}
                >
                    <TerminalSim
                        lines={terminaLines}
                        typingSpeed={30}
                        lineDelay={500}
                    />
                </div>
            </div>
            </motion.div>
        </motion.div>
    )
}