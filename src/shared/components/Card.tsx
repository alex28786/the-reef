import { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div
            className={`
        bg-[var(--color-surface)]
        rounded-2xl
        p-6
        border border-[var(--color-surface-hover)]
        ${className}
      `}
        >
            {children}
        </div>
    )
}
