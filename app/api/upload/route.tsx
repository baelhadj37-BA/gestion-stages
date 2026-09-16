import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier n\'a été fourni.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Seuls les fichiers PDF sont autorisés.' }, { status: 400 });
    }

    // Limite de 5 Mo (5 * 1024 * 1024 octets)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Le fichier dépasse la limite de 5 Mo.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Génération d'un nom unique pour éviter d'écraser des fichiers existants
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(process.cwd(), 'public/uploads', filename);

    await writeFile(filePath, buffer);

    return NextResponse.json({ fileUrl: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de l\'upload du fichier :', error);
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement du fichier.' }, { status: 500 });
  }
}