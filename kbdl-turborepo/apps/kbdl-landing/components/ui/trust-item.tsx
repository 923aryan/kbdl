export const TrustItem = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => {
  return (
    <div className="flex items-center gap-4 w-full pt-4 md:pt-0 md:px-4 first:pt-0 first:pl-0 last:pr-0">
      <div className="shrink-0 text-primary">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <div>
        <h4 className="text-navy font-bold text-[15px]">{title}</h4>
        <p className="text-gray-400 text-xs">{desc}</p>
      </div>
    </div>
  );
};
