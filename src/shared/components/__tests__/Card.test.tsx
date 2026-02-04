import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../Card'

describe('Card', () => {
    it('renders children correctly', () => {
        render(<Card>Card content</Card>)
        expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies base styles', () => {
        render(<Card>Content</Card>)
        const card = screen.getByText('Content').closest('div')
        expect(card?.className).toContain('bg-[var(--color-surface)]')
        expect(card?.className).toContain('rounded-2xl')
        expect(card?.className).toContain('p-6')
    })

    it('merges additional className', () => {
        render(<Card className="custom-class">Content</Card>)
        const card = screen.getByText('Content').closest('div')
        expect(card?.className).toContain('custom-class')
    })

    it('renders nested elements correctly', () => {
        render(
            <Card>
                <h2>Title</h2>
                <p>Description</p>
            </Card>
        )
        expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
        expect(screen.getByText('Description')).toBeInTheDocument()
    })
})
