// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const tokenData = verifierToken(token || '')
  if (!tokenData) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const fichier = formData.get('fichier') as File
    const type = formData.get('type') as string // 'cv' ou 'photo'

    if (!fichier) {
      return NextResponse.json({ message: 'Aucun fichier reçu' }, { status: 400 })
    }

    const bytes = await fichier.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Dossier de destination
    const dossier = type === 'photo' ? 'photos' : 'cvs'
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', dossier)
    await mkdir(uploadDir, { recursive: true })

    // Nom unique
    const ext = fichier.name.split('.').pop()
    const nomFichier = `${tokenData.userId}_${Date.now()}.${ext}`
    const filePath = path.join(uploadDir, nomFichier)

    await writeFile(filePath, buffer)

    const url = `/uploads/${dossier}/${nomFichier}`
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Erreur upload:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}