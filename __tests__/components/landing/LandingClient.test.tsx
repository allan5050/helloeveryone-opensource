import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  FAQSection,
  SmoothScrollLink,
} from '@/components/landing/LandingClient'

// Mock scrollIntoView
const mockScrollIntoView = jest.fn()
Object.defineProperty(global.Element.prototype, 'scrollIntoView', {
  writable: true,
  value: mockScrollIntoView,
})

describe('FAQSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all FAQ questions', () => {
    render(<FAQSection />)

    expect(
      screen.getByText('How does the matching algorithm work?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Is HelloEveryone safe and secure?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('What types of events do you host?')
    ).toBeInTheDocument()
    expect(screen.getByText('How much does it cost?')).toBeInTheDocument()
    expect(screen.getByText('What age group is this for?')).toBeInTheDocument()
  })

  it('toggles FAQ items when clicked', () => {
    render(<FAQSection />)

    const firstQuestion = screen.getByText(
      'How does the matching algorithm work?'
    )
    const firstButton = firstQuestion.closest('button')

    // Initially, answer should not be visible
    expect(
      screen.queryByText(/Our AI analyzes your interests/)
    ).not.toBeInTheDocument()

    // Click to expand
    if (firstButton) {
      fireEvent.click(firstButton)
    }

    // Answer should now be visible
    expect(
      screen.getByText(/Our AI analyzes your interests/)
    ).toBeInTheDocument()

    // Click to collapse
    if (firstButton) {
      fireEvent.click(firstButton)
    }

    // Answer should be hidden again
    expect(
      screen.queryByText(/Our AI analyzes your interests/)
    ).not.toBeInTheDocument()
  })

  it('can have multiple FAQ items open at once', () => {
    render(<FAQSection />)

    const firstQuestion = screen.getByText(
      'How does the matching algorithm work?'
    )
    const secondQuestion = screen.getByText('Is HelloEveryone safe and secure?')

    const firstButton = firstQuestion.closest('button')
    const secondButton = secondQuestion.closest('button')

    // Open first FAQ
    if (firstButton) {
      fireEvent.click(firstButton)
    }

    // Open second FAQ
    if (secondButton) {
      fireEvent.click(secondButton)
    }

    // Both answers should be visible
    expect(
      screen.getByText(/Our AI analyzes your interests/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Yes, safety is our top priority/)
    ).toBeInTheDocument()
  })

  it('displays chevron icons that rotate when expanded', () => {
    render(<FAQSection />)

    const firstQuestion = screen.getByText(
      'How does the matching algorithm work?'
    )
    const firstButton = firstQuestion.closest('button')
    const chevron = firstButton?.querySelector('svg')

    expect(chevron).toBeInTheDocument()
    expect(chevron).not.toHaveClass('rotate-180')

    // Click to expand
    if (firstButton) {
      fireEvent.click(firstButton)
    }

    expect(chevron).toHaveClass('rotate-180')
  })
})

describe('SmoothScrollLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock querySelector to return a mock element
    document.querySelector = jest.fn().mockReturnValue({
      scrollIntoView: mockScrollIntoView,
    })
  })

  it('renders children correctly', () => {
    render(<SmoothScrollLink href="#test">Test Link</SmoothScrollLink>)

    expect(screen.getByText('Test Link')).toBeInTheDocument()
  })

  it('calls scrollIntoView when clicked', () => {
    render(<SmoothScrollLink href="#test">Test Link</SmoothScrollLink>)

    const link = screen.getByText('Test Link')
    fireEvent.click(link)

    expect(document.querySelector).toHaveBeenCalledWith('#test')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('prevents default link behavior', () => {
    render(<SmoothScrollLink href="#test">Test Link</SmoothScrollLink>)

    const link = screen.getByText('Test Link')
    const event = { preventDefault: jest.fn() }

    fireEvent.click(link, event)

    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(
      <SmoothScrollLink href="#test" className="custom-class">
        Test Link
      </SmoothScrollLink>
    )

    const link = screen.getByText('Test Link')
    expect(link).toHaveClass('custom-class')
  })

  it('handles case where target element is not found', () => {
    document.querySelector = jest.fn().mockReturnValue(null)

    render(<SmoothScrollLink href="#nonexistent">Test Link</SmoothScrollLink>)

    const link = screen.getByText('Test Link')

    // Should not throw an error
    expect(() => fireEvent.click(link)).not.toThrow()
    expect(mockScrollIntoView).not.toHaveBeenCalled()
  })
})
