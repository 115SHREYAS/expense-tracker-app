export default function WelcomeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-full h-auto ${className}`}
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        {`
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-15deg); }
            75% { transform: rotate(15deg); }
          }
          @keyframes grow {
            0% { transform: scaleY(0); }
            100% { transform: scaleY(1); }
          }
          @keyframes slide-right {
            0% { transform: translateX(-20px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          .animate-wave { transform-origin: bottom center; animation: wave 3s ease-in-out infinite; }
          .animate-grow-1 { transform-origin: bottom; animation: grow 1s ease-out forwards; }
          .animate-grow-2 { transform-origin: bottom; animation: grow 1s ease-out 0.2s forwards; }
          .animate-grow-3 { transform-origin: bottom; animation: grow 1s ease-out 0.4s forwards; }
          .animate-slide { animation: slide-right 1s ease-out forwards; }
        `}
      </style>

      {/* Background Elements */}
      <circle cx="300" cy="100" r="80" fill="currentColor" className="text-blue-50 dark:text-blue-900/20" />
      <path d="M0 180 Q 100 150 200 180 T 400 180 L 400 200 L 0 200 Z" fill="currentColor" className="text-gray-100 dark:text-gray-800/50" />

      {/* Charts */}
      <g className="text-blue-500 dark:text-blue-400" transform="translate(250, 60)">
        <rect x="0" y="60" width="20" height="40" rx="4" fill="currentColor" className="animate-grow-1" style={{ transform: 'scaleY(0)' }} />
        <rect x="30" y="30" width="20" height="70" rx="4" fill="currentColor" className="animate-grow-2" style={{ transform: 'scaleY(0)' }} />
        <rect x="60" y="0" width="20" height="100" rx="4" fill="currentColor" className="animate-grow-3" style={{ transform: 'scaleY(0)' }} />
        
        {/* Trend Line */}
        <path d="M10 60 L 40 30 L 70 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" className="text-green-500 dark:text-green-400 animate-slide" style={{ opacity: 0 }} />
        <circle cx="70" cy="0" r="6" fill="currentColor" className="text-green-500 dark:text-green-400 animate-slide" style={{ opacity: 0, animationDelay: '1s' }} />
      </g>

      {/* Abstract Person/User */}
      <g transform="translate(80, 80)" className="text-indigo-500 dark:text-indigo-400">
        {/* Body */}
        <path d="M20 100 C 20 60 80 60 80 100 Z" fill="currentColor" />
        {/* Head */}
        <circle cx="50" cy="40" r="25" fill="currentColor" />
        {/* Waving Arm */}
        <g className="animate-wave" transform="translate(80, 70)">
          <path d="M0 0 Q 30 -20 40 -50" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none" />
          <circle cx="40" cy="-50" r="8" fill="currentColor" />
        </g>
        {/* Other Arm */}
        <path d="M20 70 Q -10 80 -20 110" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none" />
      </g>

      {/* Floating Elements */}
      <g className="text-yellow-400 dark:text-yellow-500">
        <path d="M180 40 L 190 60 L 210 65 L 195 80 L 200 100 L 180 90 L 160 100 L 165 80 L 150 65 L 170 60 Z" fill="currentColor" className="animate-wave" style={{ animationDuration: '4s' }} />
      </g>
      <circle cx="120" cy="30" r="8" fill="currentColor" className="text-pink-400 dark:text-pink-500 animate-wave" style={{ animationDuration: '5s' }} />
      <rect x="220" y="140" width="12" height="12" rx="2" fill="currentColor" className="text-green-400 dark:text-green-500 animate-wave" style={{ animationDuration: '3.5s' }} transform="rotate(45 220 140)" />
    </svg>
  );
}
