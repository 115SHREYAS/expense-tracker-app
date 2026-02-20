export default function LoginIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-full h-auto ${className}`}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes pulse-glow {
            0% { filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5)); }
            50% { filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.8)); }
            100% { filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5)); }
          }
          @keyframes coin-drop {
            0% { transform: translateY(-50px) scale(0); opacity: 0; }
            50% { transform: translateY(-20px) scale(1); opacity: 1; }
            100% { transform: translateY(0px) scale(1); opacity: 0; }
          }
          .animate-float { animation: float 4s ease-in-out infinite; }
          .animate-float-delayed { animation: float 4s ease-in-out 2s infinite; }
          .animate-glow { animation: pulse-glow 3s ease-in-out infinite; }
          .animate-coin-1 { animation: coin-drop 3s ease-in infinite; }
          .animate-coin-2 { animation: coin-drop 3s ease-in 1s infinite; }
          .animate-coin-3 { animation: coin-drop 3s ease-in 2s infinite; }
        `}
      </style>

      {/* Background Elements */}
      <circle cx="200" cy="150" r="120" fill="currentColor" className="text-blue-50 dark:text-blue-900/20" />
      <circle cx="200" cy="150" r="90" fill="currentColor" className="text-blue-100 dark:text-blue-800/20" />

      {/* Main Wallet/Vault */}
      <g className="animate-float">
        <rect x="120" y="120" width="160" height="100" rx="16" fill="currentColor" className="text-blue-600 dark:text-blue-500" />
        <rect x="120" y="100" width="160" height="40" rx="16" fill="currentColor" className="text-blue-700 dark:text-blue-600" />
        <path d="M180 140h40v20h-40z" fill="currentColor" className="text-blue-400 dark:text-blue-300 animate-glow" rx="4" />
        <circle cx="200" cy="150" r="4" fill="white" />
      </g>

      {/* Coins */}
      <g className="text-yellow-400 dark:text-yellow-500">
        <circle cx="160" cy="80" r="12" fill="currentColor" className="animate-coin-1" />
        <circle cx="200" cy="60" r="16" fill="currentColor" className="animate-coin-2" />
        <circle cx="240" cy="90" r="10" fill="currentColor" className="animate-coin-3" />
        
        {/* Coin details */}
        <path d="M160 74v12M154 80h12" stroke="white" strokeWidth="2" strokeLinecap="round" className="animate-coin-1" />
        <path d="M200 52v16M192 60h16" stroke="white" strokeWidth="2" strokeLinecap="round" className="animate-coin-2" />
        <path d="M240 85v10M235 90h10" stroke="white" strokeWidth="2" strokeLinecap="round" className="animate-coin-3" />
      </g>

      {/* Decorative charts/graphs */}
      <g className="animate-float-delayed text-green-500 dark:text-green-400">
        <rect x="60" y="160" width="30" height="60" rx="4" fill="currentColor" opacity="0.8" />
        <rect x="60" y="180" width="30" height="40" rx="4" fill="currentColor" />
        <path d="M50 150l25-20 25 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      <g className="animate-float text-purple-500 dark:text-purple-400">
        <circle cx="320" cy="140" r="25" fill="currentColor" opacity="0.2" />
        <path d="M320 115a25 25 0 0125 25h-25v-25z" fill="currentColor" />
      </g>
    </svg>
  );
}
