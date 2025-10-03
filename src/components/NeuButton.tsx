interface NeuButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function NeuButton({ 
  children, 
  className = '', 
  onClick, 
  type = 'button',
  disabled = false 
}: NeuButtonProps) {
  return (
    <button
      type={type}
      className={`neu-btn px-6 py-3 font-medium ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
