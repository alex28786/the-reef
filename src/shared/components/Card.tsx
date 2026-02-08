import { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
    onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
    return (
        <div
            onClick={onClick}
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
