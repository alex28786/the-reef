import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input, Textarea } from '../Input'

describe('Input', () => {
    it('renders without label', () => {
        render(<Input placeholder="Enter text" />)
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders with label', () => {
        render(<Input label="Email" placeholder="Enter email" />)
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
    })

    it('displays error message', () => {
        render(<Input error="This field is required" />)
        expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('applies error styling when error is present', () => {
        render(<Input error="Error" data-testid="input" />)
        const input = screen.getByTestId('input')
        expect(input.className).toContain('border-red-500')
    })

    it('calls onChange handler', () => {
        const handleChange = vi.fn()
        render(<Input onChange={handleChange} data-testid="input" />)

        fireEvent.change(screen.getByTestId('input'), { target: { value: 'test' } })
        expect(handleChange).toHaveBeenCalled()
    })

    it('passes through additional props', () => {
        render(<Input type="password" name="password" data-testid="pwd" />)
        const input = screen.getByTestId('pwd')
        expect(input).toHaveAttribute('type', 'password')
        expect(input).toHaveAttribute('name', 'password')
    })
})

describe('Textarea', () => {
    it('renders without label', () => {
        render(<Textarea placeholder="Enter text" />)
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders with label', () => {
        render(<Textarea label="Description" placeholder="Enter description" />)
        expect(screen.getByText('Description')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
    })

    it('displays error message', () => {
        render(<Textarea error="This field is required" />)
        expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('calls onChange handler', () => {
        const handleChange = vi.fn()
        render(<Textarea onChange={handleChange} data-testid="textarea" />)

        fireEvent.change(screen.getByTestId('textarea'), { target: { value: 'test' } })
        expect(handleChange).toHaveBeenCalled()
    })

    it('passes through rows prop', () => {
        render(<Textarea rows={5} data-testid="textarea" />)
        expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5')
    })
})
