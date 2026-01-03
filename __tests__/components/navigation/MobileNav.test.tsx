import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import MobileNav from '@/components/navigation/MobileNav'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('MobileNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/events')
  })

  it('renders all navigation items', () => {
    render(<MobileNav />)

    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Matches')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('highlights the active route', () => {
    mockUsePathname.mockReturnValue('/matches')
    render(<MobileNav />)

    const matchesLink = screen.getByRole('link', {
      name: /Matches.*current page/,
    })
    expect(matchesLink).toBeInTheDocument()
    expect(matchesLink).toHaveAttribute('aria-current', 'page')
  })

  it('handles nested routes correctly', () => {
    mockUsePathname.mockReturnValue('/profile/edit')
    render(<MobileNav />)

    const profileLink = screen.getByRole('link', {
      name: /Profile.*current page/,
    })
    expect(profileLink).toBeInTheDocument()
    expect(profileLink).toHaveAttribute('aria-current', 'page')
  })

  it('has proper accessibility attributes', () => {
    render(<MobileNav />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('aria-label', 'Mobile navigation')

    // Check that all links have proper aria-labels
    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('aria-label')
    })
  })

  it('applies mobile-only classes', () => {
    render(<MobileNav />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('sm:hidden')
  })

  it('has proper touch target sizes', () => {
    render(<MobileNav />)

    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveClass('min-h-[44px]', 'min-w-[44px]')
    })
  })

  it('applies active styles correctly', () => {
    mockUsePathname.mockReturnValue('/events')
    const { container } = render(<MobileNav />)

    const eventsLink = screen.getByRole('link', {
      name: /Events.*current page/,
    })
    expect(eventsLink).toHaveClass('text-blue-600', 'bg-blue-50')

    const matchesLink = screen.getByRole('link', { name: 'Matches' })
    expect(matchesLink).toHaveClass('text-gray-500')
  })
})
