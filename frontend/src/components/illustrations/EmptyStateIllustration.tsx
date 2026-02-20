export default function EmptyStateIllustration({ className = "", message = "No data found" }: { className?: string, message?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        className="w-48 h-48 mb-4"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            @keyframes hover {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
              100% { transform: translateY(0px); }
            }
            @keyframes search {
              0% { transform: translate(0, 0) rotate(0deg); }
              25% { transform: translate(10px, -10px) rotate(10deg); }
              50% { transform: translate(20px, 0) rotate(0deg); }
              75% { transform: translate(10px, 10px) rotate(-10deg); }
              100% { transform: translate(0, 0) rotate(0deg); }
            }
            .animate-hover { animation: hover 3s ease-in-out infinite; }
            .animate-search { animation: search 4s ease-in-out infinite; }
          `}
        </style>

        {/* Background Blob */}
        <path
          d="M150.5 100C150.5 127.89 127.89 150.5 100 150.5C72.1096 150.5 49.5 127.89 49.5 100C49.5 72.1096 72.1096 49.5 100 49.5C127.89 49.5 150.5 72.1096 150.5 100Z"
          fill="currentColor"
          className="text-gray-100 dark:text-gray-800"
        />

        {/* Empty Box */}
        <g className="animate-hover text-gray-300 dark:text-gray-600">
          <path d="M60 110L100 130L140 110V70L100 50L60 70V110Z" fill="currentColor" opacity="0.5" />
          <path d="M100 130V90M60 70L100 90L140 70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M80 80L100 90L120 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Magnifying Glass */}
        <g className="animate-search text-blue-500 dark:text-blue-400">
          <circle cx="110" cy="110" r="20" stroke="currentColor" strokeWidth="6" fill="none" />
          <path d="M125 125L145 145" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <circle cx="105" cy="105" r="4" fill="currentColor" opacity="0.5" />
        </g>

        {/* Question Marks */}
        <g className="text-gray-400 dark:text-gray-500 font-bold text-2xl" style={{ fontFamily: 'sans-serif' }}>
          <text x="40" y="60" className="animate-hover" style={{ animationDelay: '0.5s' }}>?</text>
          <text x="140" y="70" className="animate-hover" style={{ animationDelay: '1s' }}>?</text>
          <text x="50" y="140" className="animate-hover" style={{ animationDelay: '1.5s' }}>?</text>
        </g>
      </svg>
      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{message}</p>
    </div>
  );
}
