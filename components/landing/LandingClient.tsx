'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="faq-item overflow-hidden rounded-lg border border-gray-200">
      <button
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
        onClick={onToggle}
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="animate-fade-in px-6 pb-4 text-gray-600">{answer}</div>
      )}
    </div>
  )
}

export function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const faqs = [
    {
      question: 'How does the matching algorithm work?',
      answer:
        'Our AI analyzes your interests, personality traits, and preferences to find compatible matches. We use a sophisticated scoring system that considers common interests (40%), personality compatibility (30%), age proximity (20%), and location/availability (10%).',
    },
    {
      question: 'Is HelloEveryone safe and secure?',
      answer:
        'Yes, safety is our top priority. We implement privacy-first design with progressive disclosure, verified profiles, and secure communication channels. All events are held in public spaces and we have community guidelines to ensure a safe environment.',
    },
    {
      question: 'What types of events do you host?',
      answer:
        'We host a variety of events including coffee meetups, hiking groups, book clubs, cooking classes, art workshops, networking events, and seasonal activities. All events are designed to facilitate natural conversations and connections.',
    },
    {
      question: 'How much does it cost?',
      answer:
        "HelloEveryone is free to join and browse events. Some premium events may have a small fee to cover venue costs, but most of our community events are completely free. We believe meaningful connections shouldn't be expensive.",
    },
    {
      question: 'What age group is this for?',
      answer:
        "HelloEveryone is designed for busy adults aged 25-50 who are looking to expand their social circle. Whether you're new to the city, changing life phases, or simply want to meet more like-minded people, you'll find your community here.",
    },
  ]

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <FAQItem
          key={index}
          question={faq.question}
          answer={faq.answer}
          isOpen={openItems.includes(index)}
          onToggle={() => toggleItem(index)}
        />
      ))}
    </div>
  )
}

export function SmoothScrollLink({
  href,
  children,
  className,
  ...props
}: {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <a href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
