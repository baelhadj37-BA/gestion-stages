import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifierToken } from "@/lib/auth"

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.split(" ")[1]
  if (!token) return null
  return verifierToken(token)
}

// GET : Récupérer les offres
export async function GET(req: NextRequest) {
  try {
    const user = getUser(req)
    const { searchParams } = new URL(req.url)
    const onlyMine = searchParams.get("mine") === "true"

    const whereClause: any = {}
    if (onlyMine && user) {
      whereClause.entrepriseId = user.userId
    }

    const offres = await prisma.offre.findMany({
      where: whereClause,
      include: {
        entreprise: { select: { nom: true, prenom: true } },
        candidatures: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(offres)
  } catch (error) {
    console.error("Erreur GET offres:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST : Publier une nouvelle offre de stage (Entreprise)
export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)
    if (!user || (user.role !== "ENTREPRISE" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const { titre, description, duree, localisation, tags } = body

    if (!titre || !description) {
      return NextResponse.json(
        { error: "Titre et description requis" },
        { status: 400 }
      )
    }

    const nouvelleOffre = await prisma.offre.create({
      data: {
        titre,
        description,
        duree: duree || "3 mois",
        localisation: localisation || "Dakar",
        tags: tags || "Informatique",
        statut: "PUBLIEE",
        entrepriseId: user.userId,
      },
    })

    return NextResponse.json(nouvelleOffre, { status: 201 })
  } catch (error) {
    console.error("Erreur POST offres:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
