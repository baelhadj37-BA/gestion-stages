// app/api/etudiant/profil/route.ts
// GET  — Récupérer le profil de l'étudiant connecté
// PUT  — Mettre à jour les infos personnelles
// PATCH — Changer le mot de passe

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const tokenData = verifierToken(token || '')
  if (!tokenData || tokenData.role !== 'ETUDIANT') {
    return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true, nom: true, prenom: true, email: true,
        telephone: true, classe: true, filiere: true,
        matricule: true, competences: true, createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Extraire les champs étendus stockés en JSON dans competences
    let extra: Record<string, string> = {}
    let competencesTexte = ''
    try {
      const raw = user.competences || ''
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && parsed.__type === 'profil_etudiant') {
        extra = parsed
        competencesTexte = parsed.competences || ''
      } else {
        competencesTexte = raw
      }
    } catch {
      // competences est une chaîne simple (liste de compétences)
      competencesTexte = user.competences || ''
    }

    const profil = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone || '',
      classe: user.classe || '',
      filiere: user.filiere || '',
      matricule: user.matricule || '',
      createdAt: user.createdAt,
      competences: competencesTexte,
      cvUrl: extra.cvUrl || '',
      photoUrl: extra.photoUrl || '',
      dateNaissance: extra.dateNaissance || '',
      disponibilite: extra.disponibilite || '',
      dureeSouhaitee: extra.dureeSouhaitee || '',
      domaineSouhaite: extra.domaineSouhaite || '',
      villeSouhaitee: extra.villeSouhaitee || '',
      niveauEtudes: extra.niveauEtudes || '',
    }

    return NextResponse.json({ profil })
  } catch (error) {
    console.error('Erreur GET profil étudiant:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const tokenData = verifierToken(token || '')
  if (!tokenData || tokenData.role !== 'ETUDIANT') {
    return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      nom, prenom, email, telephone, classe, filiere,
      competences, cvUrl, photoUrl,
      dateNaissance, disponibilite, dureeSouhaitee,
      domaineSouhaite, villeSouhaitee, niveauEtudes,
    } = body

    // Stocker les champs étendus en JSON dans competences
    const extra = JSON.stringify({
      __type: 'profil_etudiant',
      competences: competences || '',
      cvUrl: cvUrl || '',
      photoUrl: photoUrl || '',
      dateNaissance: dateNaissance || '',
      disponibilite: disponibilite || '',
      dureeSouhaitee: dureeSouhaitee || '',
      domaineSouhaite: domaineSouhaite || '',
      villeSouhaitee: villeSouhaitee || '',
      niveauEtudes: niveauEtudes || '',
    })

    const user = await prisma.user.update({
      where: { id: tokenData.userId },
      data: {
        nom: nom || undefined,
        prenom: prenom || undefined,
        email: email || undefined,
        telephone: telephone || undefined,
        classe: classe || undefined,
        filiere: filiere || undefined,
        competences: extra,
      },
      select: {
        id: true, nom: true, prenom: true, email: true,
        telephone: true, classe: true, filiere: true,
        matricule: true, competences: true, createdAt: true,
      },
    })

    // Re-parser pour retourner le profil complet
    let parsedExtra: Record<string, string> = {}
    try { parsedExtra = JSON.parse(user.competences || '{}') } catch { /* */ }

    const profil = {
      id: user.id, nom: user.nom, prenom: user.prenom, email: user.email,
      telephone: user.telephone, classe: user.classe, filiere: user.filiere,
      matricule: user.matricule, createdAt: user.createdAt,
      competences: parsedExtra.competences || '',
      cvUrl: parsedExtra.cvUrl || '',
      photoUrl: parsedExtra.photoUrl || '',
      dateNaissance: parsedExtra.dateNaissance || '',
      disponibilite: parsedExtra.disponibilite || '',
      dureeSouhaitee: parsedExtra.dureeSouhaitee || '',
      domaineSouhaite: parsedExtra.domaineSouhaite || '',
      villeSouhaitee: parsedExtra.villeSouhaitee || '',
      niveauEtudes: parsedExtra.niveauEtudes || '',
    }

    return NextResponse.json({ message: 'Profil mis à jour', profil })
  } catch (error) {
    console.error('Erreur PUT profil étudiant:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const tokenData = verifierToken(token || '')
  if (!tokenData || tokenData.role !== 'ETUDIANT') {
    return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
  }

  try {
    const { ancienMotDePasse, nouveauMotDePasse } = await request.json()

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return NextResponse.json({ message: 'Champs requis manquants' }, { status: 400 })
    }
    if (nouveauMotDePasse.length < 8) {
      return NextResponse.json({ message: 'Le mot de passe doit faire au moins 8 caractères' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: tokenData.userId } })
    if (!user) return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })

    const ok = await bcrypt.compare(ancienMotDePasse, user.motDePasse)
    if (!ok) return NextResponse.json({ message: 'Mot de passe actuel incorrect' }, { status: 400 })

    const hash = await bcrypt.hash(nouveauMotDePasse, 10)
    await prisma.user.update({ where: { id: tokenData.userId }, data: { motDePasse: hash } })

    return NextResponse.json({ message: 'Mot de passe mis à jour' })
  } catch (error) {
    console.error('Erreur PATCH profil étudiant:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}