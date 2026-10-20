import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nom } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email et mot de passe requis.' },
        { status: 400 }
      );
    }

    // Logique d'inscription (ou simulation validée)
    return NextResponse.json(
      { message: 'Inscription réussie', user: { email, nom } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de l’inscription :', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de l’inscription.' },
      { status: 500 }
    );
  }
}