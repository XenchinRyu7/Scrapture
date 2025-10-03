interface NeuInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

export default function NeuInput({ 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  className = '' 
}: NeuInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`neu-input px-4 py-3 w-full ${className}`}
    />
  );
}
