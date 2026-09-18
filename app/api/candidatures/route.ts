import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// 1. Récupérer les candidatures (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const whereCondition = userId ? { userId } : {};

    const candidatures = await prisma.candidature.findMany({
      where: whereCondition,
      include: {
        offre: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(candidatures);
  } catch (error) {
    console.error('Erreur GET /api/candidatures:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des candidatures' },
      { status: 500 }
    );
  }
}

// 2. Créer une candidature avec dépôt de fichier CV (POST)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const offreId = formData.get('offreId') as string;
    const userId = formData.get('userId') as string | null;
    const file = formData.get('file') as File | null;

    if (!offreId) {
      return NextResponse.json(
        { error: "L'identifiant de l'offre est requis" },
        { status: 400 }
      );
    }

    let cvUrl = '/uploads/cv-default.pdf';

    // Traitement du fichier téléversé
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Nom de fichier unique pour éviter les collisions
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');

      // Création automatique du dossier public/uploads s'il n'existe pas
      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      cvUrl = `/uploads/${filename}`;
    }

    // Enregistrement dans la base de données
    const candidature = await prisma.candidature.create({
      data: {
        offreId,
        cvUrl,
        userId: userId || null,
      },
    });

    return NextResponse.json(candidature, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/candidatures:', error);
    return NextResponse.json(
      { error: 'Impossible de créer la candidature' },
      { status: 500 }
    );
  }
}