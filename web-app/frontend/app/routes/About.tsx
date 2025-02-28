import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import 'tailwindcss/tailwind.css';
import 'bootstrap/dist/css/bootstrap.css';

function useTypewriter(text, speed) {
    const [typedText, setTypedText] = useState('');
  
    useEffect(() => {
      if (text === "BLANK_LINE") {
        setTypedText(" ");
        return;
      }
      let index = 0;
      const intervalId = setInterval(() => {
        if (index < text.length) {
          setTypedText(text.substring(0, index + 1));
          index++;
        } else {
          clearInterval(intervalId);
        }
      }, speed);
  
      return () => clearInterval(intervalId);
    }, [text, speed]);
  
    return typedText;
  }
  
  export default function About() {
    const linesWithSpeed = [
      { text: "This website was developed as an exam project for the", speed: 25 },
      { text: "INF-2900 software engineering course.", speed: 25 },
      { text: "BLANK_LINE", speed: 0 }, 
      { text: "Created by:", speed: 70 },
      { text: "BLANK_LINE", speed: 0 }, 
      { text: "Daniel Lind Schouten", speed: 70 },
      { text: "Andreas Nergård", speed: 70 },
      { text: "Max Roness Hovding", speed: 70 },
      { text: "Karoline W. Benjaminsen", speed: 70 }, // Shortened middle name to ensure fit
      { text: "August S. Hindenes", speed: 70 } // Shortened middle name to ensure fit
    ];
  
    const typedLines = linesWithSpeed.map(({ text, speed }) => useTypewriter(text, speed));
  
    return (
      <motion.div className="d-flex flex-column min-vh-100 bg-dark">
        <NavBar />
        <motion.div
          className="flex-grow bg-gradient-to-br from-gray-900 to-gray-800 d-flex flex-column align-items-center justify-content-center text-white p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-90 p-4 rounded-lg shadow-lg"
            style={{ width: '80vw', maxWidth: '800px', height: 'auto', minHeight: '60vh' }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-center fs-1 fw-bold text-success mb-4">About</div>
            
            <div className="d-flex flex-column align-items-center w-100">
              {/* Fake Terminal Menu Bar */}
              <div 
                className="d-flex justify-content-start align-items-center rounded-top p-1 bg-secondary bg-opacity-90"
                style={{ width: '90%', maxWidth: '700px', height: '25px' }}
              >
                <div className="rounded-circle bg-danger me-2" style={{ height: '12px', width: '12px' }}></div>
                <div className="rounded-circle bg-warning me-2" style={{ height: '12px', width: '12px' }}></div>
                <div className="rounded-circle bg-success" style={{ height: '12px', width: '12px' }}></div>
              </div>
              
              {/* Fake Terminal Screen */}
              <div 
                className="bg-dark bg-opacity-90 text-success font-monospace p-3 rounded-bottom"
                style={{ width: '90%', maxWidth: '700px', height: 'auto', minHeight: '280px' }}
              >
                {typedLines.map((typedLine, index) => (
                  <pre key={index} className="m-1 text-wrap ps-2 text-start" style={{ lineHeight: '1.5' }}>{typedLine}</pre>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
        <Footer />
      </motion.div>
    );
  }