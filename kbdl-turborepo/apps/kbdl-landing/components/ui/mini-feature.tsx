
export const MiniFeature = ({ icon, text }: { icon: React.ReactNode, text: string }) => {
  return (
    <div className="flex flex-col items-center max-w-[80px]">
      <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-primary mb-3">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <p className="text-[11px] font-bold text-navy leading-tight text-center">
        {text.split(' ').map((word, i, arr) => (
          <span key={i}>
            {word} {i === Math.floor(arr.length / 2) - 1 ? <br /> : ''}
          </span>
        ))}
      </p>
    </div>
  );
}
