import "./globals.css";

export const metadata = {
  title: "CMS Dashboard",
  description: "A frontend for managing CMS posts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
