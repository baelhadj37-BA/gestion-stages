'use client'

import {
  useState,
  type FormEvent,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

/* ─────────────────────────────────────────────────────────────
   Dimensions du cadre de la maquette : 1597 × 867 px.
   u(px) convertit une mesure de la maquette en "cqw"
   (1 % de la largeur du cadre) : la page se redimensionne
   comme une image, avec les mêmes proportions.
   ───────────────────────────────────────────────────────────── */
const W = 1597
const H = 867
const u = (px: number) => `${((px / W) * 100).toFixed(4)}cqw`

const at = (left: number, top: number, extra: CSSProperties = {}): CSSProperties => ({
  position: 'absolute',
  left: u(left),
  top: u(top),
  ...extra,
})

/* À adapter : listes proposées dans les menus déroulants */
const FILIERES = ['Génie Logiciel', 'Transport Logistique']
const CLASSES = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2']

const PAGE_BG =
  'radial-gradient(ellipse 36% 46% at 0% 0%, rgba(130,180,255,0.55) 0%, transparent 70%),' +
  'radial-gradient(ellipse 34% 44% at 100% 100%, rgba(150,195,255,0.45) 0%, transparent 70%),' +
  'linear-gradient(135deg, #eaf2ff 0%, #f4f8ff 50%, #e3eeff 100%)'

type Role = 'ETUDIANT' | 'ENTREPRISE'

type Form = {
  nom: string
  prenom: string
  email: string
  motDePasse: string
  confirmation: string
  telephone: string
  filiere: string
  matricule: string
  classe: string
  secteur: string
}

const FORM_VIDE: Form = {
  nom: '',
  prenom: '',
  email: '',
  motDePasse: '',
  confirmation: '',
  telephone: '',
  filiere: '',
  matricule: '',
  classe: '',
  secteur: '',
}

/* ───────── Icônes ───────── */

function Svg({ size, sw = 1.6, children }: { size: number; sw?: number; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: u(size), height: u(size), flexShrink: 0 }}
    >
      {children}
    </svg>
  )
}

const IconUser = ({ size = 22 }: { size?: number }) => (
  <Svg size={size}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </Svg>
)
const IconUserPlus = ({ size = 22 }: { size?: number }) => (
  <Svg size={size} sw={1.7}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21c0-4 3-7 7-7s7 3 7 7" />
    <path d="M19 8v6M16 11h6" />
  </Svg>
)
const IconMail = () => (
  <Svg size={22}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 7l10 6 10-6" />
  </Svg>
)
const IconLock = () => (
  <Svg size={22}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
)
const IconEye = ({ off }: { off: boolean }) => (
  <Svg size={23}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </Svg>
)
const IconPhone = () => (
  <Svg size={22}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </Svg>
)
const IconBank = ({ size = 22 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10" />
    <path d="M12 3L2 9h20L12 3z" />
  </Svg>
)
const IconCalendar = () => (
  <Svg size={22}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
)
const IconPin = () => (
  <Svg size={22}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
)
const IconChevron = () => (
  <Svg size={20} sw={2}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
)
const IconCap = ({ size = 28 }: { size?: number }) => (
  <Svg size={size} sw={1.5}>
    <path d="M12 3L2 8l10 5 10-5-10-5z" />
    <path d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />
    <path d="M22 8v6" />
  </Svg>
)
const IconGear = () => (
  <Svg size={28} sw={1.5}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
  </Svg>
)
const IconBriefcase = () => (
  <Svg size={30} sw={1.5}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20" />
  </Svg>
)
const IconDoc = () => (
  <Svg size={30} sw={1.5}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </Svg>
)
const IconChart = () => (
  <Svg size={32} sw={1.5}>
    <rect x="3" y="14" width="4" height="7" />
    <rect x="10" y="10" width="4" height="11" />
    <rect x="17" y="6" width="4" height="15" />
    <path d="M3 9l6-4 5 3 7-5" />
  </Svg>
)

/* ───────── Styles communs ───────── */

const boxStyle: CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  height: u(48),
  boxSizing: 'border-box',
  padding: `0 ${u(18)}`,
  gap: u(18),
  borderRadius: u(10),
  border: `${u(1.5)} solid #dde4f1`,
  background: '#fbfcff',
  color: '#6b7a99',
  boxShadow: '0 1px 2px rgba(60,90,160,0.05)',
  transition: 'box-shadow .2s, border-color .2s',
}

const inputStyle: CSSProperties = { fontSize: u(16), color: '#2d3b5a' }

const inputClass =
  'w-full min-w-0 bg-transparent outline-none placeholder:text-[#7b88a3] autofill:shadow-[inset_0_0_0_1000px_#fbfcff]'

const focusClass =
  'focus-within:border-[#4a8cf0] focus-within:shadow-[0_0_0_0.25cqw_rgba(74,140,240,0.2)]'

/* Un champ du formulaire : position (left/top/width) dans le bloc formulaire */
function Box({
  top,
  left = 0,
  width = 642,
  children,
}: {
  top: number
  left?: number
  width?: number
  children: ReactNode
}) {
  return (
    <label
      className={focusClass}
      style={{ ...boxStyle, left: u(left), top: u(top), width: u(width) }}
    >
      {children}
    </label>
  )
}

/* ───────── Page d'inscription ───────── */

export default function RegisterPage() {
  const router = useRouter()

  const [role, setRole] = useState<Role>('ETUDIANT')
  const [form, setForm] = useState<Form>(FORM_VIDE)
  const [voir1, setVoir1] = useState(false)
  const [voir2, setVoir2] = useState(false)
  const [accepte, setAccepte] = useState(false)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const set =
    (cle: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [cle]: e.target.value }))

  const valider = (): string => {
    const requis: (keyof Form)[] =
      role === 'ETUDIANT'
        ? ['nom', 'prenom', 'email', 'motDePasse', 'confirmation', 'telephone', 'filiere', 'matricule', 'classe']
        : ['nom', 'prenom', 'email', 'motDePasse', 'confirmation', 'telephone', 'secteur']

    if (requis.some((c) => !form[c].trim())) return 'Veuillez remplir tous les champs obligatoires (*).'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Adresse email invalide.'
    if (form.telephone.replace(/\D/g, '').length < 8) return 'Numéro de téléphone invalide.'
    if (form.motDePasse.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
    if (form.motDePasse !== form.confirmation) return 'Les mots de passe ne correspondent pas.'
    if (!accepte) return 'Vous devez accepter les conditions d’utilisation.'
    return ''
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (chargement) return

    const probleme = valider()
    if (probleme) {
      setErreur(probleme)
      return
    }

    setErreur('')
    setChargement(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          email: form.email.trim(),
          motDePasse: form.motDePasse,
          role,
          telephone: form.telephone.trim(),
          ...(role === 'ETUDIANT'
            ? {
                filiere: form.filiere,
                matricule: form.matricule.trim(),
                classe: form.classe,
              }
            : { secteur: form.secteur.trim() }),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErreur(data.message || 'Inscription impossible.')
        return
      }

      if (!data.token || !data.utilisateur) {
        setErreur('La réponse du serveur est incomplète.')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.utilisateur))

      switch (data.utilisateur.role) {
        case 'ETUDIANT':
          router.push('/dashboard/etudiant')
          break
        case 'ENTREPRISE':
          router.push('/dashboard/entreprise')
          break
        default:
          router.push('/login')
      }
    } catch {
      setErreur('Impossible de contacter le serveur. Vérifiez votre connexion.')
    } finally {
      setChargement(false)
    }
  }

  /* Onglets de rôle : seuls Étudiant et Entreprise sont ouverts à l'inscription */
  const onglets: { id: string; label: string; icon: ReactNode; actif: boolean }[] = [
    { id: 'ETUDIANT', label: 'Étudiant', icon: <IconCap />, actif: true },
    { id: 'ENTREPRISE', label: 'Entreprise', icon: <IconBank size={28} />, actif: true },
    { id: 'ENCADREUR', label: 'Encadreur', icon: <IconUser size={28} />, actif: false },
    { id: 'ADMIN', label: 'Administrateur', icon: <IconGear />, actif: false },
  ]

  const cercleIcone: CSSProperties = {
    width: u(54),
    height: u(54),
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowX: 'auto',
        background: PAGE_BG,
      }}
    >
      {/* Conteneur : mêmes proportions que la maquette */}
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          width: 'max(min(94vw, calc((100vh - 3rem) * 1.8419)), 1000px)',
          aspectRatio: `${W} / ${H}`,
          containerType: 'inline-size',
        }}
      >
        {/* Carte arrondie */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: u(30),
            boxShadow: '0 30px 80px rgba(30, 80, 170, 0.25)',
            background: '#f5f8ff',
          }}
        >
          {/* ═══════════ PANNEAU GAUCHE ═══════════ */}
          <section
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: u(849),
              height: u(867),
              color: '#fff',
              backgroundColor: '#0b3a8a',
              backgroundImage:
                "linear-gradient(90deg, rgba(10,58,150,0.94) 0%, rgba(12,70,170,0.80) 38%, rgba(14,80,190,0.25) 66%, rgba(14,80,190,0) 100%)," +
                "linear-gradient(180deg, rgba(14,76,182,0.35) 0%, rgba(14,76,182,0) 30%, rgba(8,40,110,0) 68%, rgba(8,40,110,0.85) 100%)," +
                "url('/login-hero.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: '40% 60%',
            }}
          >
            {/* Logo */}
            <div
              style={{
                ...at(46, 33),
                width: u(112),
                height: u(112),
                borderRadius: '50%',
                background: '#fff',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              }}
            >
              <Image
                src="/logo-ipd.png"
                alt="Logo IPD Thomas Sankara"
                fill
                sizes="140px"
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Trait vertical */}
            <div
              style={{
                ...at(175, 55),
                width: u(1.5),
                height: u(70),
                background: 'rgba(255,255,255,0.7)',
              }}
            />

            {/* Nom de l'établissement */}
            <div
              style={{
                ...at(192, 54),
                fontSize: u(21),
                lineHeight: u(24),
                letterSpacing: '0.01em',
              }}
            >
              <div style={{ fontWeight: 800 }}>INSTITUT POLYTECHNIQUE</div>
              <div style={{ fontWeight: 800 }}>DE DAKAR</div>
              <div style={{ fontWeight: 400 }}>Thomas Sankara</div>
            </div>

            {/* Titre */}
            <h2
              style={{
                ...at(39, 187),
                margin: 0,
                fontSize: u(40),
                lineHeight: u(39),
                fontWeight: 700,
              }}
            >
              Votre avenir
              <br />
              commence ici
            </h2>

            <div
              style={{
                ...at(39, 277),
                width: u(78),
                height: u(2),
                background: 'rgba(255,255,255,0.85)',
              }}
            />

            <p
              style={{
                ...at(39, 294),
                margin: 0,
                width: u(330),
                fontSize: u(18),
                lineHeight: u(23.5),
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              Une plateforme pour gérer vos stages, suivre votre parcours et construire votre
              avenir professionnel.
            </p>

            {/* Les 3 points forts */}
            {[
              { top: 423, icone: <IconBriefcase />, titre: 'Offres de stage', texte: 'Trouvez des opportunités adaptées\nà votre profil' },
              { top: 522, icone: <IconDoc />, titre: 'Suivi personnalisé', texte: 'Restez informé à chaque étape\nde votre parcours' },
              { top: 620, icone: <IconChart />, titre: 'Accompagnement', texte: 'Avec l’IPD, vous n’êtes jamais seul' },
            ].map((p) => (
              <div key={p.titre}>
                <div style={{ ...at(39, p.top), ...cercleIcone }}>{p.icone}</div>
                <div style={at(108, p.top + 3.5)}>
                  <div style={{ fontSize: u(16), lineHeight: u(22), fontWeight: 700 }}>{p.titre}</div>
                  <div
                    style={{
                      fontSize: u(13.5),
                      lineHeight: u(17),
                      color: 'rgba(255,255,255,0.85)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {p.texte}
                  </div>
                </div>
              </div>
            ))}

            {/* Signature */}
            <div
              style={{
                ...at(39, 771),
                fontFamily: "'Segoe Script', 'Brush Script MT', cursive",
                fontStyle: 'italic',
                fontSize: u(19),
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              IPD Thomas Sankara
            </div>
            <div style={{ ...at(39, 798), fontSize: u(15), color: 'rgba(255,255,255,0.9)' }}>
              Le savoir, levier de votre réussite
            </div>
            <svg
              viewBox="0 0 100 10"
              aria-hidden="true"
              style={{ ...at(39, 820), width: u(212), height: u(12) }}
            >
              <path
                d="M1 7 Q50 3 99 5"
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </section>

          {/* ═══════════ PANNEAU DROIT ═══════════ */}
          <section
            style={{
              position: 'absolute',
              left: u(849),
              top: 0,
              width: u(748),
              height: u(867),
              background: 'linear-gradient(160deg, #fbfcff 0%, #f1f5fd 100%)',
            }}
          />

          {/* Déjà un compte ? */}
          <p
            style={{
              position: 'absolute',
              right: u(40),
              top: u(26),
              margin: 0,
              fontSize: u(13),
              color: '#5a6988',
            }}
          >
            Vous avez déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#1d6fe8', fontWeight: 700 }}>
              Se connecter
            </Link>
          </p>

          {/* Pastille utilisateur + */}
          <div
            style={{
              ...at(904, 54),
              width: u(72),
              height: u(72),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #e4eeff 100%)',
              boxShadow: '0 8px 20px rgba(60,120,230,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2f7cf6',
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: u(46), height: u(46) }} aria-hidden="true">
              <circle cx="10" cy="8" r="4.2" fill="currentColor" />
              <path d="M2 21c0-4.6 3.6-7.6 8-7.6s8 3 8 7.6z" fill="currentColor" />
              <path d="M19.5 6.5v6M16.5 9.5h6" stroke="#1d5fd0" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Titre */}
          <h1
            style={{
              ...at(999, 62),
              margin: 0,
              fontSize: u(29),
              lineHeight: u(38),
              fontWeight: 800,
              color: '#143a8c',
            }}
          >
            Créer un compte
          </h1>
          <p
            style={{
              ...at(999, 107),
              margin: 0,
              fontSize: u(15),
              lineHeight: u(22),
              color: '#5f6d8a',
            }}
          >
            Rejoignez la plateforme de gestion des stages de l’IPD
            <br />
            et accédez à toutes les fonctionnalités.
          </p>

          {/* Message d'erreur */}
          {erreur && (
            <div
              role="alert"
              style={{
                ...at(905, 154),
                width: u(652),
                height: u(24),
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: u(8),
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: u(13.5),
              }}
            >
              {erreur}
            </div>
          )}

          {/* ═══════════ ONGLETS DE RÔLE ═══════════ */}
          <div
            style={{
              ...at(905, 182),
              width: u(652),
              height: u(76),
              display: 'flex',
              gap: u(14),
            }}
          >
            {onglets.map((o) => {
              const selectionne = o.actif && role === o.id
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={!o.actif}
                  onClick={() => o.actif && setRole(o.id as Role)}
                  title={o.actif ? undefined : 'Ce compte est créé par l’administrateur'}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: u(5),
                    borderRadius: u(10),
                    border: selectionne ? 'none' : `${u(1.5)} solid #dfe6f3`,
                    background: selectionne
                      ? 'linear-gradient(180deg, #2f86f5 0%, #0f5fd7 100%)'
                      : '#fbfcff',
                    color: selectionne ? '#fff' : '#52607d',
                    boxShadow: selectionne ? '0 8px 18px rgba(20,100,220,0.35)' : 'none',
                    fontSize: u(15.5),
                    fontWeight: 600,
                    opacity: o.actif ? 1 : 0.55,
                    cursor: o.actif ? 'pointer' : 'not-allowed',
                    transition: 'filter .2s',
                  }}
                >
                  {o.icon}
                  {o.label}
                </button>
              )
            })}
          </div>

          {/* ═══════════ FORMULAIRE ═══════════ */}
          <form
            noValidate
            onSubmit={handleSubmit}
            style={{ ...at(905, 286), width: u(652), height: u(560) }}
          >
            {/* Nom / Prénom */}
            <Box top={0} width={313}>
              <IconUser />
              <input
                type="text"
                value={form.nom}
                onChange={set('nom')}
                placeholder="Nom *"
                autoComplete="family-name"
                aria-label="Nom"
                className={inputClass}
                style={inputStyle}
              />
            </Box>
            <Box top={0} left={328} width={314}>
              <IconUser />
              <input
                type="text"
                value={form.prenom}
                onChange={set('prenom')}
                placeholder="Prénom *"
                autoComplete="given-name"
                aria-label="Prénom"
                className={inputClass}
                style={inputStyle}
              />
            </Box>

            {/* Email */}
            <Box top={63}>
              <IconMail />
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="Adresse email *"
                autoComplete="email"
                aria-label="Adresse email"
                className={inputClass}
                style={inputStyle}
              />
            </Box>

            {/* Mot de passe */}
            <Box top={125}>
              <IconLock />
              <input
                type={voir1 ? 'text' : 'password'}
                value={form.motDePasse}
                onChange={set('motDePasse')}
                placeholder="Mot de passe *"
                autoComplete="new-password"
                aria-label="Mot de passe"
                className={inputClass}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setVoir1((v) => !v)}
                aria-label={voir1 ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{ flexShrink: 0, padding: 0, border: 'none', background: 'transparent', color: '#8a96ae', cursor: 'pointer', display: 'flex' }}
              >
                <IconEye off={!voir1} />
              </button>
            </Box>

            {/* Confirmation */}
            <Box top={187}>
              <IconLock />
              <input
                type={voir2 ? 'text' : 'password'}
                value={form.confirmation}
                onChange={set('confirmation')}
                placeholder="Confirmer le mot de passe *"
                autoComplete="new-password"
                aria-label="Confirmer le mot de passe"
                className={inputClass}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setVoir2((v) => !v)}
                aria-label={voir2 ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{ flexShrink: 0, padding: 0, border: 'none', background: 'transparent', color: '#8a96ae', cursor: 'pointer', display: 'flex' }}
              >
                <IconEye off={!voir2} />
              </button>
            </Box>

            {/* Téléphone */}
            <Box top={249}>
              <IconPhone />
              <input
                type="tel"
                value={form.telephone}
                onChange={set('telephone')}
                placeholder="Numéro de téléphone *"
                autoComplete="tel"
                aria-label="Numéro de téléphone"
                className={inputClass}
                style={inputStyle}
              />
            </Box>

            {role === 'ETUDIANT' ? (
              <>
                {/* Filière */}
                <Box top={311}>
                  <IconBank />
                  <select
                    value={form.filiere}
                    onChange={set('filiere')}
                    aria-label="Filière"
                    className={`${inputClass} cursor-pointer appearance-none`}
                    style={{ ...inputStyle, color: form.filiere ? '#2d3b5a' : '#7b88a3' }}
                  >
                    <option value="">Filière *</option>
                    {FILIERES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <IconChevron />
                </Box>

                {/* Matricule / Classe */}
                <Box top={373} width={313}>
                  <IconCalendar />
                  <input
                    type="text"
                    value={form.matricule}
                    onChange={set('matricule')}
                    placeholder="Matricule *"
                    aria-label="Matricule"
                    className={inputClass}
                    style={inputStyle}
                  />
                </Box>
                <Box top={373} left={328} width={314}>
                  <IconPin />
                  <select
                    value={form.classe}
                    onChange={set('classe')}
                    aria-label="Classe"
                    className={`${inputClass} cursor-pointer appearance-none`}
                    style={{ ...inputStyle, color: form.classe ? '#2d3b5a' : '#7b88a3' }}
                  >
                    <option value="">Classe *</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <IconChevron />
                </Box>
              </>
            ) : (
              /* Entreprise : secteur d'activité */
              <Box top={311}>
                <IconBank />
                <input
                  type="text"
                  value={form.secteur}
                  onChange={set('secteur')}
                  placeholder="Secteur d’activité *"
                  aria-label="Secteur d’activité"
                  className={inputClass}
                  style={inputStyle}
                />
              </Box>
            )}

            {/* Conditions d'utilisation */}
            <label
              style={{
                ...at(0, 441),
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                gap: u(11),
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: u(14.5),
                color: '#4a5878',
              }}
            >
              <input
                type="checkbox"
                checked={accepte}
                onChange={(e) => setAccepte(e.target.checked)}
                className="relative shrink-0 cursor-pointer appearance-none border-[#b0bad0] bg-white checked:border-[#1d6fe8] checked:bg-[#1d6fe8] after:absolute after:left-[31%] after:top-[8%] after:h-[58%] after:w-[30%] after:rotate-45 after:border-b-[0.16cqw] after:border-r-[0.16cqw] after:border-white after:opacity-0 after:content-[''] checked:after:opacity-100"
                style={{
                  width: u(19),
                  height: u(19),
                  borderRadius: u(4),
                  borderWidth: u(1.5),
                  borderStyle: 'solid',
                }}
              />
              <span>
                J’accepte les{' '}
                <span style={{ color: '#1d6fe8' }}>conditions d’utilisation</span> et la{' '}
                <span style={{ color: '#1d6fe8' }}>politique de confidentialité</span>.
              </span>
            </label>

            {/* Bouton S'inscrire */}
            <button
              type="submit"
              disabled={chargement}
              className="hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                ...at(0, 485),
                width: u(643),
                height: u(59),
                borderRadius: u(15),
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: u(12),
                color: '#fff',
                fontSize: u(22),
                fontWeight: 600,
                background: 'linear-gradient(100deg, #1a6ae6 0%, #0b56cf 100%)',
                boxShadow: '0 12px 24px rgba(20, 90, 210, 0.30)',
                transition: 'filter .2s',
              }}
            >
              {chargement ? (
                <>
                  <span
                    className="animate-spin"
                    aria-hidden="true"
                    style={{
                      width: u(20),
                      height: u(20),
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                    }}
                  />
                  Inscription...
                </>
              ) : (
                <>
                  <IconUserPlus size={30} />
                  S’inscrire
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}