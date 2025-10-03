interface NeuCardProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
  onClick?: () => void;
}

export default function NeuCard({ children, className = '', inset = false, onClick }: NeuCardProps) {
  return (
    <div 
      className={`${inset ? 'neu-card-inset' : 'neu-card'} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
