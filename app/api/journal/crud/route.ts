import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifierToken } from "@/lib/auth"
import { notifierUtilisateur } from "@/lib/notifications"

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.split(" ")[1]
  if (!token) return null
  return verifierToken(token)
}

// GET : Récupérer toutes les entrées du journal de bord pour l'étudiant connecté
export async function GET(req: NextRequest) {
  try {
    const user = getUser(req)
    if (!user || user.role !== "ETUDIANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer le stage de l'étudiant
    const stage = await prisma.stage.findFirst({
      where: { etudiantId: user.userId },
      orderBy: { dateDebut: "desc" },
    })

    if (!stage) {
      return NextResponse.json([])
    }

    const journaux = await prisma.journalBord.findMany({
      where: { stageId: stage.id },
      orderBy: [{ dateDepot: "desc" }, { semaine: "desc" }],
    })

    const entrees = journaux.map((j) => {
      let details = {
        activites: j.contenu,
        heures: 7,
        date: j.dateDepot.toISOString().split("T")[0],
        observations: "",
      }

      try {
        if (j.contenu.startsWith("{")) {
          const parsed = JSON.parse(j.contenu)
          details = {
            activites: parsed.activites ?? j.contenu,
            heures: parsed.heures ?? 7,
            date: parsed.date ?? j.dateDepot.toISOString().split("T")[0],
            observations: parsed.observations ?? "",
          }
        }
      } catch {
        // En cas de format texte simple
      }

      return {
        id: j.id,
        stageId: j.stageId,
        semaine: j.semaine,
        date: details.date,
        heures: details.heures,
        activites: details.activites,
        observations: details.observations,
        statut: j.statut,
        commentaire: j.commentaire,
        dateDepot: j.dateDepot,
        dateValidation: j.dateValidation,
      }
    })

    return NextResponse.json(entrees)
  } catch (error) {
    console.error("Erreur GET journal/crud:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST : Ajouter une nouvelle entrée dans le journal de bord
export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)
    if (!user || user.role !== "ETUDIANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const { semaine, date, heures, activites, observations } = body

    if (!activites || !semaine) {
      return NextResponse.json(
        { error: "La semaine et les activités sont requises" },
        { status: 400 }
      )
    }

    let stage = await prisma.stage.findFirst({
      where: { etudiantId: user.userId },
      include: {
        candidature: {
          include: {
            offre: true,
          },
        },
      },
      orderBy: { dateDebut: "desc" },
    })

    // Si aucun stage direct n'est trouvé, vérifier s'il existe une candidature acceptée
    if (!stage) {
      const candAcceptee = await prisma.candidature.findFirst({
        where: { etudiantId: user.userId, statut: "ACCEPTEE" },
        include: { offre: true },
      })

      if (candAcceptee) {
        const encadreur = await prisma.user.findFirst({ where: { role: "ENCADREUR" } })
        stage = await prisma.stage.create({
          data: {
            etudiantId: user.userId,
            encadreurId: encadreur ? encadreur.id : user.userId,
            candidatureId: candAcceptee.id,
            dateDebut: new Date(),
            dateFin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            statut: "EN_COURS",
          },
          include: {
            candidature: {
              include: {
                offre: true,
              },
            },
          },
        })
      }
    }

    if (!stage) {
      return NextResponse.json(
        { error: "Aucun stage actif n'est associé à votre compte. Vous devez d'abord avoir un stage validé." },
        { status: 400 }
      )
    }

    const contenuStocke = JSON.stringify({
      activites,
      heures: Number(heures) || 7,
      date: date || new Date().toISOString().split("T")[0],
      observations: observations || "",
    })

    // Vérifier si un rapport existe déjà pour cette semaine (par exemple généré par le cron des alertes)
    const existant = await prisma.journalBord.findFirst({
      where: {
        stageId: stage.id,
        semaine: Number(semaine),
      },
    })

    let entreeEnregistree
    if (existant) {
      entreeEnregistree = await prisma.journalBord.update({
        where: { id: existant.id },
        data: {
          contenu: contenuStocke,
          statut: "SOUMIS",
          dateDepot: date ? new Date(date) : new Date(),
          alerte: false,
        },
      })
    } else {
      entreeEnregistree = await prisma.journalBord.create({
        data: {
          stageId: stage.id,
          semaine: Number(semaine) || 1,
          contenu: contenuStocke,
          statut: "SOUMIS",
          dateDepot: date ? new Date(date) : new Date(),
          alerte: false,
        },
      })
    }

    // Récupérer le nom de l'étudiant pour la notification
    const studentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { nom: true, prenom: true },
    })
    const studentName = studentUser ? `${studentUser.prenom} ${studentUser.nom}` : "Un étudiant"

    // Notifier l'entreprise associée à ce stage
    const entrepriseId = stage.candidature?.offre?.entrepriseId
    if (entrepriseId) {
      await notifierUtilisateur(
        entrepriseId,
        `${studentName} a soumis son rapport de stage pour la semaine ${semaine}. En attente de votre validation.`,
        "RAPPORT_SOUMIS"
      )
    }

    // Notifier également l'encadreur pédagogique s'il est distinct
    if (stage.encadreurId && stage.encadreurId !== user.userId) {
      await notifierUtilisateur(
        stage.encadreurId,
        `${studentName} a déposé son rapport de stage de la semaine ${semaine}.`,
        "RAPPORT_DEPOSE"
      )
    }

    return NextResponse.json({
      id: entreeEnregistree.id,
      stageId: entreeEnregistree.stageId,
      semaine: entreeEnregistree.semaine,
      date: date || new Date().toISOString().split("T")[0],
      heures: Number(heures) || 7,
      activites,
      observations: observations || "",
      statut: entreeEnregistree.statut,
      commentaire: entreeEnregistree.commentaire,
      dateDepot: entreeEnregistree.dateDepot,
    }, { status: 201 })
  } catch (error) {
    console.error("Erreur POST journal/crud:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT : Mettre à jour une entrée existante
export async function PUT(req: NextRequest) {
  try {
    const user = getUser(req)
    if (!user || user.role !== "ETUDIANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const { id, semaine, date, heures, activites, observations } = body

    if (!id || !activites) {
      return NextResponse.json({ error: "Identifiant et activités requis" }, { status: 400 })
    }

    const entree = await prisma.journalBord.findUnique({
      where: { id: Number(id) },
      include: { stage: true },
    })

    if (!entree || entree.stage.etudiantId !== user.userId) {
      return NextResponse.json({ error: "Entrée introuvable ou non autorisée" }, { status: 404 })
    }

    const contenuStocke = JSON.stringify({
      activites,
      heures: Number(heures) || 7,
      date: date || entree.dateDepot.toISOString().split("T")[0],
      observations: observations || "",
    })

    const miseAJour = await prisma.journalBord.update({
      where: { id: Number(id) },
      data: {
        semaine: Number(semaine) || entree.semaine,
        contenu: contenuStocke,
        statut: "EN_ATTENTE",
        dateDepot: date ? new Date(date) : entree.dateDepot,
      },
    })

    return NextResponse.json({
      id: miseAJour.id,
      stageId: miseAJour.stageId,
      semaine: miseAJour.semaine,
      date: date || miseAJour.dateDepot.toISOString().split("T")[0],
      heures: Number(heures) || 7,
      activites,
      observations: observations || "",
      statut: miseAJour.statut,
      commentaire: miseAJour.commentaire,
      dateDepot: miseAJour.dateDepot,
    })
  } catch (error) {
    console.error("Erreur PUT journal/crud:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE : Supprimer une entrée du journal de bord
export async function DELETE(req: NextRequest) {
  try {
    const user = getUser(req)
    if (!user || user.role !== "ETUDIANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 })
    }

    const entree = await prisma.journalBord.findUnique({
      where: { id: Number(id) },
      include: { stage: true },
    })

    if (!entree || entree.stage.etudiantId !== user.userId) {
      return NextResponse.json({ error: "Entrée introuvable ou non autorisée" }, { status: 404 })
    }

    await prisma.journalBord.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ message: "Entrée supprimée avec succès", id: Number(id) })
  } catch (error) {
    console.error("Erreur DELETE journal/crud:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
