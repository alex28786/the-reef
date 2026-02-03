import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            w-full px-4 py-3
            bg-[var(--color-navy)]
            border border-[var(--color-surface-hover)]
            rounded-xl
            text-[var(--color-text)]
            placeholder:text-[var(--color-text-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-seafoam)] focus:border-transparent
            transition-all duration-200
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>
        )
    }
)

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`
            w-full px-4 py-3
            bg-[var(--color-navy)]
            border border-[var(--color-surface-hover)]
            rounded-xl
            text-[var(--color-text)]
            placeholder:text-[var(--color-text-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-seafoam)] focus:border-transparent
            transition-all duration-200
            resize-none
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>
        )
    }
)
