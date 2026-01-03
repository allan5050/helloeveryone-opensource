import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Heart className="h-7 w-7 text-indigo-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">
                HelloEveryone
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Direct to signup */}
      <section className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="relative w-full h-48 mb-6 rounded-lg overflow-hidden">
              <Image
                src="/images/homepage_helloeveryone.jpg"
                alt="Group of people"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority
              />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
              Meet your people.
              <br />
              For real.
            </h1>
            <p className="text-lg text-gray-600">
              Real friends at real events in your city.
              <br />
              You deserve to find who you're looking for.
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/signup" className="block">
              <Button
                size="lg"
                className="w-full bg-indigo-600 py-6 text-lg font-medium hover:bg-indigo-700"
              >
                Join HelloEveryone
              </Button>
            </Link>
            
            <p className="text-xs text-gray-500">
              Free to join. Meet people tomorrow.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              23 people joined today in your area
            </p>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="fixed bottom-0 w-full border-t border-gray-100 bg-white py-4">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-700">
              Terms
            </Link>
            <span>&copy; 2024 HelloEveryone</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
