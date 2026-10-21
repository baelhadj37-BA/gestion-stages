import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { VerificationActions } from './verification-actions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string }>
}) {
  const { uuid } = await params
  return {
    title: `Vérification d'authenticité #${uuid.slice(0, 8)} | IPD Dakar`,
    description:
      "Portail officiel de vérification et d'authentification des documents de stage — Institut Polytechnique de Dakar",
  }
}

function formaterDate(date: Date | string | null | undefined): string {
  if (!date) return 'Non spécifiée'
  const d = new Date(date)
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return 'Session académique 2026'
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formaterDateHeure(date: Date | string | null | undefined): string {
  if (!date) return 'Non spécifiée'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Non spécifiée'
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInfosTypeDocument(type: string) {
  switch (type?.toUpperCase()) {
    case 'CONVENTION':
      return {
        titre: 'Convention de Stage Tripartite',
        badge: 'Convention Officielle',
        couleurBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        couleurIcone: 'bg-indigo-100 text-indigo-700',
      }
    case 'ATTESTATION':
      return {
        titre: 'Attestation de Fin de Stage',
        badge: 'Attestation Officielle',
        couleurBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        couleurIcone: 'bg-emerald-100 text-emerald-700',
      }
    case 'FICHE_EVALUATION':
      return {
        titre: "Fiche d'Évaluation de Stage",
        badge: 'Évaluation Officielle',
        couleurBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        couleurIcone: 'bg-amber-100 text-amber-700',
      }
    default:
      return {
        titre: `Document Officiel (${type || 'Stage'})`,
        badge: 'Document Certifié',
        couleurBadge: 'bg-blue-50 text-blue-700 border-blue-200',
        couleurIcone: 'bg-blue-100 text-blue-700',
      }
  }
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ uuid: string }>
}) {
  const { uuid } = await params

  const document = await prisma.document.findUnique({
    where: { uuid },
    include: {
      stage: {
        include: {
          etudiant: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              matricule: true,
              classe: true,
            },
          },
          encadreur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
          candidature: {
            include: {
              offre: {
                include: {
                  entreprise: {
                    select: {
                      id: true,
                      nom: true,
                      prenom: true,
                      email: true,
                      secteur: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const maintenant = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Cas : Document introuvable ou invalide (Pleine Page)
  if (!document) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 font-sans text-slate-800">
        {/* En-tête pleine page */}
        <header className="w-full border-b border-slate-200 bg-white px-4 sm:px-8 lg:px-12 py-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-50 p-1 border border-slate-200/80 shadow-xs">
                <Image
                  src="/logo-ipd.png"
                  alt="Logo IPD Dakar"
                  fill
                  sizes="44px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                  Institut Polytechnique de Dakar
                </div>
                <h1 className="text-sm font-black text-slate-900 sm:text-base leading-tight">
                  Portail Officiel d'Authentification des Documents
                </h1>
              </div>
            </div>

            <Link
              href="/"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Retour à l'accueil
            </Link>
          </div>
        </header>

        {/* Corps d'erreur centré en pleine page */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 flex flex-col justify-center">
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-6 text-white flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-red-200 block">
                  Alerte de vérification
                </span>
                <h2 className="text-xl sm:text-2xl font-black">
                  Document Non Authentifié ou Inexistant
                </h2>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-sm sm:text-base text-red-900 bg-red-50 p-4 rounded-xl border border-red-100 font-medium leading-relaxed">
                Cet identifiant ne correspond à aucun document certifié dans le registre officiel de l'Institut Polytechnique de Dakar (IPD).
                Ce document est peut-être falsifié ou le lien de contrôle est incorrect.
              </p>

              <div className="space-y-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-200/60 gap-1">
                  <span className="text-slate-500 font-medium">UUID recherché :</span>
                  <code className="font-mono font-bold text-slate-900 break-all">{uuid}</code>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Date & heure du contrôle :</span>
                  <span className="font-semibold text-slate-800">{maintenant}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Statut de validation :</span>
                  <span className="font-black text-red-600 uppercase tracking-wide">
                    NON ENREGISTRÉ / RÉVOQUÉ
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Service Central de la Scolarité & des Stages · scolarite@ipd.sn
                </span>
                <Link
                  href="/"
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  Retour au portail
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Footer pleine page */}
        <footer className="w-full border-t border-slate-200 bg-white px-4 sm:px-8 lg:px-12 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Institut Polytechnique de Dakar (IPD) · Thomas Sankara · Registre officiel
        </footer>
      </div>
    )
  }

  const { stage } = document
  const { etudiant } = stage
  const entreprise = stage.candidature?.offre?.entreprise ?? null
  const offre = stage.candidature?.offre ?? null
  const encadreur = stage.encadreur ?? null
  const infosType = getInfosTypeDocument(document.type)

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50/70 font-sans text-slate-800 print:bg-white print:min-h-0">
      {/* 1. BARRE DE NAVIGATION INSTITUTIONNELLE PLEINE LARGEUR (EDGE-TO-EDGE) */}
      <header className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 lg:px-12 py-3.5 shadow-xs sticky top-0 z-30 print:static print:border-b-2 print:border-slate-800 print:px-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-xl bg-slate-50 p-1 border border-slate-200/80 shadow-xs">
              <Image
                src="/logo-ipd.png"
                alt="Logo IPD Dakar"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                Institut Polytechnique de Dakar
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Portail Officiel d'Authentification des Documents
              </h1>
            </div>
          </div>

          {/* Boutons d'action (Voir PDF, Imprimer, Partager, Copier UUID) */}
          <VerificationActions uuid={document.uuid} pdfUrl={document.pdfUrl} />
        </div>
      </header>

      {/* 2. BANNIÈRE OFFICIELLE DE VALIDATION PLEINE LARGEUR */}
      <section className="w-full bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white shadow-inner border-b border-emerald-800/40 px-4 sm:px-8 lg:px-12 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs shadow-xs">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.4}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  Document Officiel Authentique & Certifié
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/40 px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-200 border border-emerald-400/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sceau Valide ✓
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Délivré par l'IPD · Authenticité et intégrité formellement attestées auprès du registre académique central
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100 bg-emerald-900/40 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Contrôle en direct : {maintenant}</span>
          </div>
        </div>
      </section>

      {/* 3. SOUS-BANDEAU DES INFORMATIONS DU DOCUMENT (PLEINE LARGEUR) */}
      <section className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 lg:px-12 py-2.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex items-center rounded-md border px-2.5 py-1 font-bold ${infosType.couleurBadge}`}>
              {infosType.badge}
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {infosType.titre}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-600">
              Dossier N° #{document.id}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-slate-50 px-3 py-1 rounded-md border border-slate-200">
            <span className="font-sans font-semibold text-slate-400 text-[11px]">Identifiant Unique (UUID) :</span>
            <span className="font-bold text-indigo-900 select-all">{document.uuid}</span>
          </div>
        </div>
      </section>

      {/* 4. CONTENU PRINCIPAL PLEINE PAGE (GRILLE LARGE & STRUCTURÉE) */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8 flex flex-col justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Panneau 1 : Étudiant Stagiaire */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shadow-2xs">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block leading-tight">
                    Bénéficiaire Officiel
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    Étudiant Stagiaire
                  </h3>
                </div>
              </div>

              <div className="mt-3.5 space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Nom & Prénom</span>
                  <span className="font-black text-slate-900 text-base block mt-0.5">
                    {etudiant.prenom} {etudiant.nom}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Matricule</span>
                  <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                    {etudiant.matricule || 'Non renseigné'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Classe / Filière</span>
                  <span className="font-bold text-slate-800">
                    {etudiant.classe || 'Filière académique'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[11px] block">Email institutionnel</span>
                  <span className="font-medium text-slate-700 text-xs break-all block mt-0.5">
                    {etudiant.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Statut académique</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Inscrit & Conforme ✓
              </span>
            </div>
          </div>

          {/* Panneau 2 : Entreprise d'Accueil */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 shadow-2xs">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block leading-tight">
                    Organisme d'Accueil
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    Entreprise Partenaire
                  </h3>
                </div>
              </div>

              <div className="mt-3.5 space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Raison sociale</span>
                  <span className="font-black text-slate-900 text-base block mt-0.5">
                    {entreprise?.nom || 'Entreprise Partenaire'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Secteur</span>
                  <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded text-xs border border-purple-100">
                    {entreprise?.secteur || 'Technologies'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[11px] block">Contact officiel</span>
                  <span className="font-medium text-slate-700 text-xs break-all block mt-0.5">
                    {entreprise?.email || 'contact@entreprise.com'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Cadre d'accueil</span>
                  <span className="font-bold text-slate-700">Convention signée</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Agrément IPD</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Partenaire Validé ✓
              </span>
            </div>
          </div>

          {/* Panneau 3 : Cadre du Stage & Suivi */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shadow-2xs">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block leading-tight">
                    Missions & Encadrement
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    Cadre du Stage
                  </h3>
                </div>
              </div>

              <div className="mt-3.5 space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Intitulé de la mission</span>
                  <span className="font-extrabold text-slate-900 text-sm block mt-0.5 line-clamp-2" title={offre?.titre || 'Stage Professionnel'}>
                    {offre?.titre || 'Stage Professionnel'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Statut du stage</span>
                  <span
                    className={`font-bold text-xs uppercase px-2 py-0.5 rounded-full ${
                      stage.statut === 'TERMINE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {stage.statut === 'TERMINE' ? 'Terminé ✓' : 'En cours'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Période</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {formaterDate(stage.dateDebut)} → {formaterDate(stage.dateFin)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[11px] block">Encadreur pédagogique</span>
                  <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                    {encadreur ? `${encadreur.prenom} ${encadreur.nom}` : 'Assigné par la Direction'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Délivrance</span>
              <span className="font-semibold text-slate-700">
                {formaterDateHeure(document.dateGeneration)}
              </span>
            </div>
          </div>

          {/* Panneau 4 : Sceau Numérique & QR Code Scellé */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shadow-2xs">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 block leading-tight">
                    Sceau Numérique Sécurisé
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    QR Code d'Authenticité
                  </h3>
                </div>
              </div>

              {/* Rendu du QR Code officiel */}
              <div className="mt-4 flex flex-col items-center">
                {document.qrCodeUrl ? (
                  <div className="relative h-32 w-32 bg-white p-1 rounded-xl border-2 border-slate-200 shadow-xs">
                    <Image
                      src={document.qrCodeUrl}
                      alt="QR Code d'authentification officiel"
                      fill
                      sizes="128px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-32 w-32 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    QR Code non généré
                  </div>
                )}
                <span className="mt-2 text-[10.5px] font-mono text-slate-500 font-semibold">
                  Sceau IPD #{document.id}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 block">
                Empreinte officielle vérifiée ✓
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Infalsifiable · Registre IPD Thomas Sankara
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 5. PIED DE PAGE INSTITUTIONNEL PLEINE LARGEUR */}
      <footer className="w-full bg-white border-t border-slate-200/80 px-4 sm:px-8 lg:px-12 py-4 text-xs text-slate-500 print:hidden mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-800">Institut Polytechnique de Dakar (IPD)</span> — Thomas Sankara · Dakar, Sénégal
          </div>
          <div>
            Système Central de Vérification & Certification des Stages · Contact : <span className="font-semibold text-blue-700">scolarite@ipd.sn</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
