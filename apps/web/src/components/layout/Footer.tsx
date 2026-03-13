'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Smartphone, Bell } from 'lucide-react'
import { toast } from 'sonner'

const LINKS = {
  Shop: [
    { label: 'Browse products', href: '/' },
    { label: 'Search', href: '/search' },
    { label: 'My orders', href: '/orders' },
    { label: 'Cart', href: '/cart' },
  ],
  Help: [
    { label: 'FAQ', href: '#' },
    { label: 'Contact us', href: '#' },
    { label: 'Track order', href: '/orders' },
    { label: 'Returns & refunds', href: '#' },
  ],
  Company: [
    { label: 'About OwnTown', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Blog', href: '#' },
  ],
  Legal: [
    { label: 'Privacy policy', href: '#' },
    { label: 'Terms of service', href: '#' },
    { label: 'Cookie policy', href: '#' },
  ],
}

const SOCIALS = [
  {
    label: 'Instagram',
    href: '#',
    svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  },
  {
    label: 'X (Twitter)',
    href: '#',
    svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    label: 'Facebook',
    href: '#',
    svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  {
    label: 'YouTube',
    href: '#',
    svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  },
]

function AppComingSoonModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    toast.success("You're on the list! We'll notify you at launch.")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative bg-white rounded-3xl shadow-elevated w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <X size={15} className="text-gray-500" />
        </button>

        {/* Top teal band */}
        <div className="bg-[#007a78] px-8 pt-10 pb-14 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight">App launching soon</h2>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            The OwnTown app is on its way to iOS & Android.
          </p>
        </div>

        {/* Wave divider */}
        <div className="relative -mt-6">
          <svg viewBox="0 0 400 24" className="w-full fill-white">
            <path d="M0,24 C100,0 300,0 400,24 L400,24 L0,24 Z" />
          </svg>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 -mt-2">
          {!submitted ? (
            <>
              <p className="text-sm text-gray-500 text-center mb-6">
                Be the first to know when we launch. Enter your email and we&apos;ll notify you.
              </p>

              {/* Perks */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { emoji: '⚡', label: 'Early access' },
                  { emoji: '🎁', label: 'Launch offer' },
                  { emoji: '🔔', label: 'Day-1 alert' },
                ].map(({ emoji, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 bg-[#e6f5f5] rounded-2xl py-3">
                    <span className="text-xl">{emoji}</span>
                    <span className="text-[11px] font-semibold text-[#007a78] text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleNotify} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="tgtg-input flex-1"
                />
                <button type="submit" className="tgtg-btn flex-shrink-0 px-4">
                  <Bell size={15} />
                  Notify me
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="text-5xl">🎉</div>
              <p className="font-black text-lg text-[#2C2C2C] font-display tracking-tight">You&apos;re on the list!</p>
              <p className="text-sm text-gray-500">
                We&apos;ll send a notification to <span className="font-semibold text-[#2C2C2C]">{email}</span> when the app goes live.
              </p>
              <button onClick={onClose} className="tgtg-btn-sm mt-2">
                Got it
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Footer() {
  const [showAppModal, setShowAppModal] = useState(false)

  return (
    <>
      {showAppModal && <AppComingSoonModal onClose={() => setShowAppModal(false)} />}

      <footer className="bg-[#2C2C2C] text-white mt-20">
        {/* Top CTA band */}
        <div className="bg-[#007a78]">
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xl font-black font-display tracking-tight">Fresh groceries, delivered same day.</p>
              <p className="text-white/70 text-sm mt-1">Shop local essentials from your neighbourhood.</p>
            </div>
            <Link
              href="/search"
              className="flex-shrink-0 bg-white text-[#007a78] font-bold px-7 py-3 rounded-2xl hover:bg-[#e6f5f5] transition-colors text-sm"
            >
              Start shopping
            </Link>
          </div>
        </div>

        {/* Main footer */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1 space-y-5">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-[#007a78] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-sm">OT</span>
                </div>
                <span className="font-black text-xl font-display tracking-tight">OwnTown</span>
              </Link>
              <p className="text-white/50 text-sm leading-relaxed">
                Your neighbourhood grocery store, now online. Order fresh, eat fresh.
              </p>
              <div className="flex items-center gap-3">
                {SOCIALS.map(({ svg, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#007a78] flex items-center justify-center transition-colors text-white"
                  >
                    {svg}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(LINKS).map(([section, items]) => (
              <div key={section} className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">{section}</p>
                <ul className="space-y-2.5">
                  {items.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-white/70 hover:text-white transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* App download badges → coming soon */}
          <div className="mt-12 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Get the app</p>
              <div className="flex flex-wrap gap-3">
                {/* App Store */}
                <button
                  onClick={() => setShowAppModal(true)}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-5 py-3 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current flex-shrink-0">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 leading-none">Download on the</p>
                    <p className="text-sm font-bold text-white leading-tight mt-0.5">App Store</p>
                  </div>
                  <span className="ml-1 text-[10px] font-bold bg-[#007a78] text-white px-2 py-0.5 rounded-full">Soon</span>
                </button>

                {/* Google Play */}
                <button
                  onClick={() => setShowAppModal(true)}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-5 py-3 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current flex-shrink-0">
                    <path d="M3.18 23.76c.3.17.64.22.98.14l12.76-7.37-2.72-2.72-11.02 9.95zm-1.7-20.33C1.18 3.79 1 4.18 1 4.68v14.64c0 .5.18.89.49 1.25l.07.06 8.2-8.2v-.19L1.55 3.36l-.07.07zm19.16 8.32l-2.82-1.62-3.07 3.07 3.07 3.06 2.84-1.64c.81-.46.81-1.22-.02-1.87zM4.16.27L16.92 7.6 14.2 10.33 3.18.38C3.52.25 3.89.27 4.16.27z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 leading-none">Get it on</p>
                    <p className="text-sm font-bold text-white leading-tight mt-0.5">Google Play</p>
                  </div>
                  <span className="ml-1 text-[10px] font-bold bg-[#007a78] text-white px-2 py-0.5 rounded-full">Soon</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} OwnTown. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
