'use client'

import {
  useState,
  type FormEvent,
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
   comme une image, avec les mêmes proportions que /register.
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

const PAGE_BG =
  'radial-gradient(ellipse 36% 46% at 0% 0%, rgba(130,180,255,0.55) 0%, transparent 70%),' +
  'radial-gradient(ellipse 34% 44% at 100% 100%, rgba(150,195,255,0.45) 0%, transparent 70%),' +
  'linear-gradient(135deg, #eaf2ff 0%, #f4f8ff 50%, #e3eeff 100%)'

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

const IconLogIn = () => (
  <Svg size={28} sw={1.8}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
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
  height: u(52),
  boxSizing: 'border-box',
  padding: `0 ${u(18)}`,
  gap: u(18),
  borderRadius: u(12),
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

/* ───────── Page de Connexion ───────── */

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [voirMotDePasse, setVoirMotDePasse] = useState(false)
  const [seSouvenir, setSeSouvenir] = useState(false)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (chargement) return

    if (!email.trim() || !motDePasse) {
      setErreur('Veuillez renseigner votre email et mot de passe.')
      return
    }

    setErreur('')
    setChargement(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          motDePasse,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErreur(data.message || 'Identifiants invalides.')
        return
      }

      if (!data.token || !data.utilisateur) {
        setErreur('Réponse du serveur invalide.')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.utilisateur))

      switch (data.utilisateur.role) {
        case 'ADMIN':
          router.push('/dashboard/admin')
          break
        case 'ETUDIANT':
          router.push('/dashboard/etudiant')
          break
        case 'ENTREPRISE':
          router.push('/dashboard/entreprise')
          break
        case 'ENCADREUR':
          router.push('/dashboard/encadreur')
          break
        default:
          router.push('/')
      }
    } catch {
      setErreur('Impossible de contacter le serveur. Vérifiez votre connexion.')
    } finally {
      setChargement(false)
    }
  }

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
                "url('/login-hero.png')",
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

          {/* Pas encore de compte ? */}
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
            Pas encore de compte ?{' '}
            <Link href="/register" style={{ color: '#1d6fe8', fontWeight: 700 }}>
              S’inscrire
            </Link>
          </p>

          {/* Pastille cadenas / connexion */}
          <div
            style={{
              ...at(904, 110),
              width: u(72),
              height: u(72),
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #e4eeff 100%)',
              boxShadow: '0 8px 20px rgba(60,120,230,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1d5fd0',
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: u(42), height: u(42) }} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          {/* Titre */}
          <h1
            style={{
              ...at(999, 118),
              margin: 0,
              fontSize: u(29),
              lineHeight: u(38),
              fontWeight: 800,
              color: '#143a8c',
            }}
          >
            Espace Connexion
          </h1>
          <p
            style={{
              ...at(999, 163),
              margin: 0,
              fontSize: u(15),
              lineHeight: u(22),
              color: '#5f6d8a',
            }}
          >
            Saisissez vos identifiants institutionnels pour accéder
            <br />
            à votre tableau de bord de gestion des stages.
          </p>

          {/* Message d'erreur */}
          {erreur && (
            <div
              role="alert"
              style={{
                ...at(905, 225),
                width: u(642),
                height: u(42),
                boxSizing: 'border-box',
                padding: `0 ${u(16)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: u(8),
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: u(14),
                fontWeight: 500,
              }}
            >
              {erreur}
            </div>
          )}

          {/* ═══════════ FORMULAIRE ═══════════ */}
          <form
            noValidate
            onSubmit={handleSubmit}
            style={{ ...at(905, erreur ? 285 : 255), width: u(642), height: u(450) }}
          >
            {/* Email */}
            <Box top={0}>
              <IconMail />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse email *"
                autoComplete="email"
                aria-label="Adresse email"
                className={inputClass}
                style={inputStyle}
              />
            </Box>

            {/* Mot de passe */}
            <Box top={72}>
              <IconLock />
              <input
                type={voirMotDePasse ? 'text' : 'password'}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="Mot de passe *"
                autoComplete="current-password"
                aria-label="Mot de passe"
                className={inputClass}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setVoirMotDePasse((v) => !v)}
                aria-label={voirMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{ flexShrink: 0, padding: 0, border: 'none', background: 'transparent', color: '#8a96ae', cursor: 'pointer', display: 'flex' }}
              >
                <IconEye off={!voirMotDePasse} />
              </button>
            </Box>

            {/* Options : Se souvenir de moi */}
            <div
              style={{
                ...at(0, 146),
                width: u(642),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <label
                style={{
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
                  checked={seSouvenir}
                  onChange={(e) => setSeSouvenir(e.target.checked)}
                  className="relative shrink-0 cursor-pointer appearance-none border-[#b0bad0] bg-white checked:border-[#1d6fe8] checked:bg-[#1d6fe8] after:absolute after:left-[31%] after:top-[8%] after:h-[58%] after:w-[30%] after:rotate-45 after:border-b-[0.16cqw] after:border-r-[0.16cqw] after:border-white after:opacity-0 after:content-[''] checked:after:opacity-100"
                  style={{
                    width: u(19),
                    height: u(19),
                    borderRadius: u(4),
                    borderWidth: u(1.5),
                    borderStyle: 'solid',
                  }}
                />
                <span>Se souvenir de moi</span>
              </label>

              <span style={{ fontSize: u(13.5), color: '#6b7a99' }}>
                Plateforme officielle IPD
              </span>
            </div>

            {/* Bouton Se Connecter */}
            <button
              type="submit"
              disabled={chargement}
              className="hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                ...at(0, 195),
                width: u(642),
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
                  Connexion...
                </>
              ) : (
                <>
                  <IconLogIn />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
