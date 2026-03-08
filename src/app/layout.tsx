import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Quoridor",
  description: "Quoridor board game",
  icons: {
    icon: "/icon.png"
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
