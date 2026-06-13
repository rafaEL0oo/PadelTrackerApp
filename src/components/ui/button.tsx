import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-900',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        ghost: 'hover:bg-slate-100 text-slate-700',
        link: 'text-teal-600 underline-offset-4 hover:underline',
        teamA: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg text-lg',
        teamB: 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg text-lg',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-14 rounded-2xl px-8 text-base',
        xl: 'h-20 rounded-2xl px-8 text-xl',
        icon: 'h-10 w-10',
        score: 'h-32 w-full rounded-3xl text-2xl font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
