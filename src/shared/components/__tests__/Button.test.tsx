import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('applies primary variant by default', () => {
        render(<Button>Primary</Button>)
        const button = screen.getByRole('button')
        expect(button.className).toContain('bg-[var(--color-coral)]')
    })

    it('applies secondary variant when specified', () => {
        render(<Button variant="secondary">Secondary</Button>)
        const button = screen.getByRole('button')
        expect(button.className).toContain('bg-[var(--color-surface)]')
    })

    it('applies ghost variant when specified', () => {
        render(<Button variant="ghost">Ghost</Button>)
        const button = screen.getByRole('button')
        expect(button.className).toContain('bg-transparent')
    })

    it('applies size classes correctly', () => {
        const { rerender } = render(<Button size="sm">Small</Button>)
        expect(screen.getByRole('button').className).toContain('px-3')

        rerender(<Button size="lg">Large</Button>)
        expect(screen.getByRole('button').className).toContain('px-6')
    })

    it('calls onClick handler when clicked', () => {
        const handleClick = vi.fn()
        render(<Button onClick={handleClick}>Click me</Button>)

        fireEvent.click(screen.getByRole('button'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', () => {
        const handleClick = vi.fn()
        render(<Button onClick={handleClick} disabled>Disabled</Button>)

        const button = screen.getByRole('button')
        expect(button).toBeDisabled()
        fireEvent.click(button)
        expect(handleClick).not.toHaveBeenCalled()
    })

    it('merges additional className', () => {
        render(<Button className="custom-class">Custom</Button>)
        expect(screen.getByRole('button').className).toContain('custom-class')
    })

    it('passes through additional props', () => {
        render(<Button type="submit" data-testid="submit-btn">Submit</Button>)
        const button = screen.getByTestId('submit-btn')
        expect(button).toHaveAttribute('type', 'submit')
    })
})
