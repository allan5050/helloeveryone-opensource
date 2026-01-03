import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '@/app/page'

// Mock the landing client components
jest.mock('@/components/landing/LandingClient', () => ({
  FAQSection: () => <div data-testid="faq-section">FAQ Section</div>,
  SmoothScrollLink: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: any) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
  Heart: () => <svg data-testid="heart-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  MapPin: () => <svg data-testid="mappin-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Star: () => <svg data-testid="star-icon" />,
}))

describe('HomePage', () => {
  it('renders the main hero section with correct tagline', () => {
    render(<HomePage />)

    expect(screen.getByText('Find Your')).toBeInTheDocument()
    expect(screen.getByText('People')).toBeInTheDocument()
    expect(
      screen.getByText(/Smart social matching for busy adults/)
    ).toBeInTheDocument()
  })

  it('displays navigation with brand and menu items', () => {
    render(<HomePage />)

    expect(screen.getByText('HelloEveryone')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Stories')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('shows key statistics', () => {
    render(<HomePage />)

    expect(screen.getByText('10K+')).toBeInTheDocument()
    expect(screen.getByText('Active Members')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.getByText('Events Monthly')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('Match Satisfaction')).toBeInTheDocument()
  })

  it('displays all four feature cards', () => {
    render(<HomePage />)

    expect(screen.getByText('Smart Matching')).toBeInTheDocument()
    expect(screen.getByText('Local Events')).toBeInTheDocument()
    expect(screen.getByText('Easy Planning')).toBeInTheDocument()
    expect(screen.getByText('Meaningful Connections')).toBeInTheDocument()

    expect(
      screen.getByText(/AI-powered compatibility scoring/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Discover and attend curated events/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Seamlessly sync events to your calendar/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Build lasting friendships/)).toBeInTheDocument()
  })

  it('shows testimonials section', () => {
    render(<HomePage />)

    expect(screen.getByText('Success Stories')).toBeInTheDocument()
    expect(
      screen.getByText(/found my best friend through a hiking event/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/helped me build an entire social network/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/met so many interesting people/)
    ).toBeInTheDocument()

    expect(screen.getByText('Sarah M.')).toBeInTheDocument()
    expect(screen.getByText('Mike L.')).toBeInTheDocument()
    expect(screen.getByText('Alex K.')).toBeInTheDocument()
  })

  it('includes FAQ section', () => {
    render(<HomePage />)

    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    expect(screen.getByTestId('faq-section')).toBeInTheDocument()
  })

  it('displays call-to-action section', () => {
    render(<HomePage />)

    expect(screen.getByText('Ready to Find Your People?')).toBeInTheDocument()
    expect(screen.getByText(/Join thousands of others/)).toBeInTheDocument()
    expect(screen.getByText('Get Started Free')).toBeInTheDocument()
  })

  it('shows comprehensive footer', () => {
    render(<HomePage />)

    // Footer sections
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('Legal')).toBeInTheDocument()

    // Footer links
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()

    // Copyright
    expect(screen.getByText(/© 2024 HelloEveryone/)).toBeInTheDocument()
  })

  it('contains multiple CTA buttons', () => {
    render(<HomePage />)

    const startConnectingButtons = screen.getAllByText('Start Connecting')
    const getStartedButtons = screen.getAllByText(/Get Started/)
    const learnMoreButtons = screen.getAllByText('Learn More')

    expect(startConnectingButtons.length).toBeGreaterThan(0)
    expect(getStartedButtons.length).toBeGreaterThan(0)
    expect(learnMoreButtons.length).toBeGreaterThan(0)
  })

  it('includes proper navigation links', () => {
    render(<HomePage />)

    const signupLinks = screen
      .getAllByRole('link')
      .filter(link => link.getAttribute('href') === '/signup')
    const loginLinks = screen
      .getAllByRole('link')
      .filter(link => link.getAttribute('href') === '/login')

    expect(signupLinks.length).toBeGreaterThan(0)
    expect(loginLinks.length).toBeGreaterThan(0)
  })

  it('has proper semantic structure', () => {
    render(<HomePage />)

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer

    // Check for multiple sections
    const sections = screen.getAllByRole('region', { hidden: true })
    expect(sections.length).toBeGreaterThan(0)
  })
})
