import './globals.css';

export const metadata = {
  title: 'IPD Thomas Sankara - Gestion des Stages',
  description: 'Plateforme de gestion et suivi des stages - Institut Polytechnique de Dakar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
