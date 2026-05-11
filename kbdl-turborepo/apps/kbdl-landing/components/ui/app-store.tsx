export const AppStoreButton = ({ type }: { type: 'apple' | 'google' }) => {
  return (
    <button className="flex items-center gap-2 bg-black hover:bg-gray-800 transition-colors text-white px-3 py-2.5 rounded-xl shadow-md w-full max-w-[160px]">
      {type === 'apple' ? (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78.78-.04 1.94-.8 3.42-.69 1.14.04 2.37.52 3.1 1.5-2.61 1.54-2.18 5.25.5 6.27-.64 1.77-1.48 3.55-2.1 4.11zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M3.1 2.924C2.69 3.292 2.45 3.864 2.45 4.614V19.38C2.45 20.13 2.69 20.702 3.1 21.07L3.17 21.13L13.43 10.87V10.63L3.17 0.37L3.1 2.924Z" fill="#3FCC28" />
          <path d="M16.84 14.28L13.43 10.87V10.63L16.84 7.22L16.92 7.27L20.89 9.53C22.02 10.17 22.02 11.23 20.89 11.88L16.92 14.13L16.84 14.28Z" fill="#F9A826" />
          <path d="M16.92 14.13L13.43 10.63L3.1 20.96C3.52 21.41 4.22 21.47 5.06 20.99L16.92 14.13Z" fill="#EA4335" />
          <path d="M16.92 7.27L5.06 0.41C4.22-.07 3.52 0 3.1 0.44L13.43 10.77L16.92 7.27Z" fill="#4285F4" />
        </svg>
      )}
      <div className="text-left flex flex-col justify-center">
        <span className="text-xs font-bold leading-none">
          {type === 'apple' ? 'App Store' : 'Google Play'}
        </span>
      </div>
    </button>
  );
}