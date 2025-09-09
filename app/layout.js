import './globals.css'

export const metadata = {
  title: 'Scanner Pro AI - AI-Powered Trading Scanner',
  description: 'Advanced stock and options scanner with ML analysis',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}