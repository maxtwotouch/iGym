import React, { useState, useEffect } from 'react';

interface TerminalProps {
  /** Array of strings representing each line to be typed */
  lines: string[];
  /** Delay in ms between each letter (default: 50) */
  typingSpeed?: number;
  /** Delay in ms after finishing a line before starting the next (default: 500) */
  lineDelay?: number;
}

const TerminalSimulator: React.FC<TerminalProps> = ({
  lines,
  typingSpeed = 50,
  lineDelay = 500,
}) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    if (currentLineIndex < lines.length) {
      const currentLine = lines[currentLineIndex];

      if (currentText.length < currentLine.length) {
        // Type next letter.
        const timeout = setTimeout(() => {
          setCurrentText(currentLine.slice(0, currentText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        // Current line is fully typed.
        if (currentLineIndex < lines.length - 1) {
          // For non-last lines, push the completed line and then start the next after a delay.
          const timeout = setTimeout(() => {
            setDisplayedLines(prev => [...prev, currentText]);
            setCurrentLineIndex(currentLineIndex + 1);
            setCurrentText('');
          }, lineDelay);
          return () => clearTimeout(timeout);
        }
        // For the last line, do nothing to avoid duplication.
      }
    }
  }, [currentText, currentLineIndex, lines, typingSpeed, lineDelay]);

  return (
    <>
      {displayedLines.map((line, index) => (
        <div className="break-words pl-2 text-left" style={{ lineHeight: '1.5' }} key={index}>
          {line === '' ? <>&nbsp;</> : line}
        </div>
      ))}
      {/* Render the current line with a blinking cursor */}
      {currentLineIndex < lines.length && (
        <div className="break-words pl-2 text-left">
          {currentText === '' ? <>&nbsp;</> : currentText}
          <span className="blink">|</span>
        </div>
      )}
      {/* Inline CSS for blinking animation */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
        .blink {
          animation: blink 1s step-start infinite;
        }
      `}</style>
    </>
  );
};

export default TerminalSimulator;