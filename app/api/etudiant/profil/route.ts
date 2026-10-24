import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ETUDIANT') return NextResponse.json({ message: 'Acces non autorise' }, { status: 403 })
    const user = await prisma.user.findUnique({ where: { id: utilisateur.userId }, select: { id: true, nom: true, prenom: true, email: true, telephone: true, classe: true, filiere: true, matricule: true, competences: true, cvUrl: true, createdAt: true } })
    if (!user) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    return NextResponse.json({ profil: user })
  } catch (e) { return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 }) }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ETUDIANT') return NextResponse.json({ message: 'Acces non autorise' }, { status: 403 })
    const body = await request.json()
    const { nom, prenom, email, telephone, classe, filiere, competences, cvUrl } = body
    if (!nom || !prenom || !email) return NextResponse.json({ message: 'Champs requis' }, { status: 400 })
    const emailExistant = await prisma.user.findFirst({ where: { email, id: { not: utilisateur.userId } } })
    if (emailExistant) return NextResponse.json({ message: 'Email deja utilise' }, { status: 409 })
    const userMaj = await prisma.user.update({ where: { id: utilisateur.userId }, data: { nom: nom.trim(), prenom: prenom.trim(), email: email.trim(), telephone: telephone?.trim()||null, classe: classe?.trim()||null, filiere: filiere?.trim()||null, competences: competences?.trim()||null, cvUrl: cvUrl?.trim()||null }, select: { id: true, nom: true, prenom: true, email: true, telephone: true, classe: true, filiere: true, competences: true, cvUrl: true } })
    return NextResponse.json({ message: 'Profil mis a jour', profil: userMaj })
  } catch (e) { return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 }) }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ETUDIANT') return NextResponse.json({ message: 'Acces non autorise' }, { status: 403 })
    const body = await request.json()
    const { ancienMotDePasse, nouveauMotDePasse } = body
    if (!ancienMotDePasse || !nouveauMotDePasse) return NextResponse.json({ message: 'Mots de passe requis' }, { status: 400 })
    if (nouveauMotDePasse.length < 8) return NextResponse.json({ message: 'Minimum 8 caracteres' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: utilisateur.userId }, select: { id: true, motDePasse: true } })
    if (!user) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    const valide = await bcrypt.compare(ancienMotDePasse, user.motDePasse)
    if (!valide) return NextResponse.json({ message: 'Ancien mot de passe incorrect' }, { status: 401 })
    const hash = await bcrypt.hash(nouveauMotDePasse, 12)
    await prisma.user.update({ where: { id: user.id }, data: { motDePasse: hash } })
    return NextResponse.json({ message: 'Mot de passe mis a jour' })
  } catch (e) { return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 }) }
}
