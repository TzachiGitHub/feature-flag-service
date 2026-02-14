import { forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500 shadow-sm',
  secondary:
    'bg-slate-700 hover:bg-slate-600 text-slate-200 focus:ring-slate-500',
  danger:
    'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-sm',
  ghost:
    'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 focus:ring-slate-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
  md: 'text-sm px-4 py-2 rounded-button gap-2',
  lg: 'text-base px-5 py-2.5 rounded-button gap-2.5',
};

const iconOnlySizes: Record<ButtonSize, string> = {
  sm: 'p-1.5 rounded-md',
  md: 'p-2 rounded-button',
  lg: 'p-2.5 rounded-button',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      iconOnly = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-fast',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
          'active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          iconOnly ? iconOnlySizes[size] : sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2
            className={clsx(
              'animate-spin',
              size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
            )}
          />
        )}
        {!loading && icon && iconPosition === 'left' && icon}
        {!iconOnly && children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

/* ButtonGroup */
export function ButtonGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'inline-flex rounded-button overflow-hidden divide-x divide-slate-600',
        '[&>button]:rounded-none [&>button:first-child]:rounded-l-button [&>button:last-child]:rounded-r-button',
        className
      )}
    >
      {children}
    </div>
  );
}
