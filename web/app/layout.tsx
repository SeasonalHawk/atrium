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
      <body>{children}</body>
    </html>
  )
}
