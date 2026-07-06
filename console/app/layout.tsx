export const metadata = {
  title: 'Atrium Console',
  description: 'Operator console for the Atrium sales pipeline.',
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
