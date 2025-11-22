import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  label?: string;
  center?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-white', 
  className = '',
  label,
  center = false
}) => {
  const sizeClasses = {
    xs: 'h-4 w-4 border',
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  const spinner = (
    <div 
      className={`animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]} ${color} ${className}`} 
      role="status"
      aria-label={label || "Carregando"}
    >
      <span className="sr-only">
        {label || "Carregando..."}
      </span>
    </div>
  );

  if (center) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        {spinner}
        {label && <span className="text-sm text-slate-600">{label}</span>}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;