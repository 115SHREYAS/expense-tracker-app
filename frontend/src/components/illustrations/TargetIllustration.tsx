export default function TargetIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-full h-auto ${className}`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        {`
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes arrow-hit {
            0% { transform: translate(-50px, 50px); opacity: 0; }
            50% { transform: translate(10px, -10px); opacity: 1; }
            100% { transform: translate(0, 0); opacity: 1; }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.95); opacity: 0.5; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.5; }
          }
          .animate-spin-slow { transform-origin: center; animation: spin-slow 20s linear infinite; }
          .animate-arrow { animation: arrow-hit 1s ease-out forwards; }
          .animate-pulse-ring { transform-origin: center; animation: pulse-ring 3s ease-in-out infinite; }
        `}
      </style>

      {/* Target Rings */}
      <g className="animate-pulse-ring">
        <circle cx="100" cy="100" r="80" fill="currentColor" className="text-red-100 dark:text-red-900/30" />
        <circle cx="100" cy="100" r="60" fill="currentColor" className="text-red-300 dark:text-red-800/50" />
        <circle cx="100" cy="100" r="40" fill="currentColor" className="text-red-500 dark:text-red-600" />
        <circle cx="100" cy="100" r="20" fill="currentColor" className="text-white dark:text-gray-900" />
        <circle cx="100" cy="100" r="10" fill="currentColor" className="text-red-600 dark:text-red-500" />
      </g>

      {/* Dashed decorative ring */}
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10" fill="none" className="text-gray-300 dark:text-gray-600 animate-spin-slow" />

      {/* Arrow */}
      <g className="animate-arrow" style={{ opacity: 0 }}>
        <path d="M40 160 L 95 105" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-gray-800 dark:text-gray-200" />
        <path d="M90 100 L 105 95 L 100 110 Z" fill="currentColor" className="text-gray-800 dark:text-gray-200" />
        {/* Feathers */}
        <path d="M40 160 L 30 140 M 40 160 L 60 170 M 50 150 L 40 130 M 50 150 L 70 160" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-blue-500 dark:text-blue-400" />
      </g>

      {/* Sparkles */}
      <g className="text-yellow-400 dark:text-yellow-500">
        <path d="M120 60 L 125 70 L 135 75 L 125 80 L 120 90 L 115 80 L 105 75 L 115 70 Z" fill="currentColor" className="animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
        <path d="M150 110 L 153 116 L 160 119 L 153 122 L 150 128 L 147 122 L 140 119 L 147 116 Z" fill="currentColor" className="animate-pulse-ring" style={{ animationDelay: '1s' }} />
      </g>
    </svg>
  );
}
