import "./globals.css";

export const metadata = {
  title: 'Atrium — AltoLumo',
  description: 'Book a consultation about your AI implementation challenge.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Brand Book v8: Inter only, no serif faces. Falls back to the
          system-ui stack (tailwind.config.ts) until a self-hosted Inter
          font file is added -- an honest fallback, not a silent one. */}
      <body className="font-sans">{children}</body>
    </html>
  )
}
