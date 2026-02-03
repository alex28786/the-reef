import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    children: ReactNode
}

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-xl
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-navy)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `

    const variants = {
        primary: `
      bg-[var(--color-coral)] text-white
      hover:bg-orange-600
      focus:ring-[var(--color-coral)]
    `,
        secondary: `
      bg-[var(--color-surface)] text-[var(--color-text)]
      border border-[var(--color-surface-hover)]
      hover:bg-[var(--color-surface-hover)]
      focus:ring-[var(--color-seafoam)]
    `,
        ghost: `
      bg-transparent text-[var(--color-text-muted)]
      hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]
      focus:ring-[var(--color-seafoam)]
    `,
    }

    const sizes = {
        sm: 'px-3 py-2 text-sm min-h-[36px]',
        md: 'px-4 py-3 text-base min-h-[44px]',
        lg: 'px-6 py-4 text-lg min-h-[52px]',
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}
