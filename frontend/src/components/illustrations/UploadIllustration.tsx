export default function UploadIllustration({ className = "", isDragging = false }: { className?: string, isDragging?: boolean }) {
  return (
    <svg
      className={`w-full h-auto ${className}`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        {`
          @keyframes bounce-up {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          @keyframes dash {
            to { stroke-dashoffset: -20; }
          }
          @keyframes pulse-cloud {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .animate-bounce-up { animation: bounce-up 2s ease-in-out infinite; }
          .animate-dash { animation: dash 1s linear infinite; }
          .animate-pulse-cloud { animation: pulse-cloud 2s ease-in-out infinite; }
        `}
      </style>

      {/* Dashed Border Background */}
      <rect 
        x="10" y="10" width="180" height="180" rx="20" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeDasharray="10 10" 
        fill="none"
        className={`transition-colors duration-300 ${isDragging ? 'text-blue-500 animate-dash' : 'text-gray-300 dark:text-gray-600'}`} 
      />

      {/* Cloud */}
      <g className={`${isDragging ? 'animate-pulse-cloud text-blue-500' : 'text-blue-400 dark:text-blue-500'} transition-colors duration-300`}>
        <path 
          d="M140 110C140 93.4315 126.569 80 110 80C106.51 80 103.159 80.5954 100.031 81.6909C95.5113 69.1538 83.6136 60 69.5 60C52.103 60 38 74.103 38 91.5C38 92.588 38.0552 93.6631 38.1622 94.7226C27.8887 98.311 20.5 108.286 20.5 120C20.5 133.807 31.6929 145 45.5 145H135C148.807 145 160 133.807 160 120C160 108.66 152.44 99.085 142.01 95.821C141.33 95.602 140.67 95.35 140 95.06V110Z" 
          fill="currentColor" 
          opacity="0.2"
        />
        <path 
          d="M135 145H45.5C31.6929 145 20.5 133.807 20.5 120C20.5 108.286 27.8887 98.311 38.1622 94.7226C38.0552 93.6631 38 92.588 38 91.5C38 74.103 52.103 60 69.5 60C83.6136 60 95.5113 69.1538 100.031 81.6909C103.159 80.5954 106.51 80 110 80C126.569 80 140 93.4315 140 110C140 110.34 139.99 110.68 139.97 111.01C151.28 112.18 160 121.74 160 133.5C160 145.926 149.926 156 137.5 156H135V145Z" 
          fill="currentColor" 
        />
      </g>

      {/* Arrow */}
      <g className={`animate-bounce-up ${isDragging ? 'text-white' : 'text-white dark:text-gray-900'}`}>
        <path 
          d="M100 125V85M100 85L85 100M100 85L115 100" 
          stroke="currentColor" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </g>

      {/* Floating Files */}
      <g className="text-blue-300 dark:text-blue-700" opacity="0.6">
        <rect x="40" y="40" width="20" height="25" rx="2" fill="currentColor" transform="rotate(-15 40 40)" />
        <rect x="140" y="50" width="15" height="20" rx="2" fill="currentColor" transform="rotate(20 140 50)" />
      </g>
    </svg>
  );
}
