export const ActionButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div
      onClick={onClick}
      className="text-sm font-poppins text-muted-foreground hover:text-foreground cursor-pointer ml-2 sm:mr-2 transition-colors duration-200 select-none leading-none"
    >
      {children}
    </div>
  );
};
