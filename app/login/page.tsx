'use client'

import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

const W = 1536
const H = 818
const u = (px: number) => `${((px / W) * 100).toFixed(4)}cqw`

const at = (left: number, top: number, extra: CSSProperties = {}): CSSProperties => ({
  position: 'absolute',
  left: u(left),
  top: u(top),
  ...extra,
})

const PAGE_BG =
  'radial-gradient(ellipse 38% 48% at 0% 100%, rgba(140,185,255,0.55) 0%, transparent 70%),' +
  'radial-gradient(ellipse 34% 44% at 100% 0%, rgba(170,205,255,0.45) 0%, transparent 70%),' +
  'linear-gradient(135deg, #eaf2ff 0%, #f4f8ff 50%, #e3eeff 100%)'

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

const IconUser = () => (
  <Svg size={26}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </Svg>
)

const IconLock = () => (
  <Svg size={26}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
)

const IconEye = ({ off }: { off: boolean }) => (
  <Svg size={28}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </Svg>
)

const IconArrow = () => (
  <Svg size={28} sw={2.2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)

const IconCap = () => (
  <Svg size={46} sw={1.3}>
    <path d="M12 3L2 8l10 5 10-5-10-5z" />
    <path d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />
    <path d="M22 8v6" />
  </Svg>
)

const IconPeople = () => (
  <Svg size={42} sw={1.3}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M17 14c2.5 0 4.5 2 4.5 5" />
  </Svg>
)

const IconChart = () => (
  <Svg size={45} sw={1.3}>
    <rect x="3" y="14" width="4" height="7" />
    <rect x="10" y="10" width="4" height="11" />
    <rect x="17" y="6" width="4" height="15" />
    <path d="M3 9l6-4 5 3 7-5" />
  </Svg>
)

const fieldStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: u(69),
  boxSizing: 'border-box',
  padding: `0 ${u(25)} 0 ${u(26)}`,
  gap: u(25),
  borderRadius: u(18),
  border: `${u(1.5)} solid #d4ddf0`,
  background: 'rgba(255,255,255,0.78)',
  color: '#6b7a99',
  boxShadow: '0 1px 2px rgba(60,90,160,0.05)',
  transition: 'box-shadow .2s, border-color .2s',
}

const inputStyle: CSSProperties = {
  fontSize: u(18),
  color: '#2d3b5a',
}

const inputClass =
  'w-full min-w-0 bg-transparent outline-none placeholder:text-[#8f9bb5] autofill:shadow-[inset_0_0_0_1000px_#fbfcff]'

const focusClass =
  'focus-within:border-[#4a8cf0] focus-within:shadow-[0_0_0_0.25cqw_rgba(74,140,240,0.2)]'

export default function LoginPage() {
  const router = useRouter()

  const emailRef = useRef<HTMLInputElement>(null)
  const souvenirRef = useRef<HTMLInputElement>(null)

  const [motDePasse, setMotDePasse] = useState('')
  const [afficher, setAfficher] = useState(false)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rememberedEmail')
      if (saved && emailRef.current && souvenirRef.current) {
        emailRef.current.value = saved
        souvenirRef.current.checked = true
      }
    } catch {
      // stockage indisponible
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (chargement) return

    setErreur('')
    setChargement(true)

    const email = emailRef.current?.value.trim() ?? ''
    const souvenir = souvenirRef.current?.checked ?? false

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErreur(data.message || 'Email ou mot de passe incorrect.')
        return
      }

      if (!data.token || !data.utilisateur) {
        setErreur('La réponse du serveur est incomplète.')
        return
      }

      // ── Stockage du token et des infos utilisateur ──
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.utilisateur))
      localStorage.setItem('role', data.utilisateur.role)  // ← AJOUT pour Astou
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`  // ← AJOUT pour le middleware

      if (souvenir) localStorage.setItem('rememberedEmail', email)
      else localStorage.removeItem('rememberedEmail')

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
          setErreur("Le rôle de cet utilisateur n'est pas reconnu.")
      }
    } catch {
      setErreur('Impossible de contacter le serveur. Vérifiez votre connexion.')
    } finally {
      setChargement(false)
    }
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
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          width: 'max(min(94vw, calc((100vh - 3rem) * 1.8778)), 1000px)',
          aspectRatio: `${W} / ${H}`,
          containerType: 'inline-size',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: u(36),
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
              width: u(818),
              height: u(818),
              color: '#fff',
              backgroundColor: '#0b3a8a',
              backgroundImage:
                "linear-gradient(180deg, rgba(14,76,182,0.82) 0%, rgba(14,76,182,0.50) 16%, rgba(14,76,182,0) 38%, rgba(8,40,110,0) 66%, rgba(8,40,110,0.88) 90%, rgba(7,36,100,0.96) 100%), url('/login-hero.png')",
              backgroundSize: 'cover',
              backgroundPosition: '40% 60%',
            }}
          >
            <div
              style={{
                ...at(72, 23),
                width: u(138),
                height: u(138),
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
                sizes="160px"
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>

            <div
              style={{
                ...at(240, 50),
                width: u(1.5),
                height: u(85),
                background: 'rgba(255,255,255,0.7)',
              }}
            />

            <div
              style={{
                ...at(263, 49),
                fontSize: u(25),
                lineHeight: u(30),
                letterSpacing: '0.02em',
              }}
            >
              <div style={{ fontWeight: 800 }}>INSTITUT POLYTECHNIQUE</div>
              <div style={{ fontWeight: 800 }}>DE DAKAR</div>
              <div style={{ fontWeight: 400 }}>Thomas Sankara</div>
            </div>

            <div
              style={{
                ...at(76, 179),
                fontSize: u(30),
                lineHeight: u(32),
                fontStyle: 'italic',
              }}
            >
              <div style={{ fontWeight: 700 }}>Former aujourd&apos;hui</div>
              <div style={{ fontWeight: 300 }}>les talents de demain</div>
            </div>

            <div
              style={{
                ...at(76, 264),
                width: u(107),
                height: u(2),
                background: 'rgba(255,255,255,0.9)',
              }}
            />

            <div
              style={{
                ...at(60, 761),
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: u(13),
              }}
            >
              <IconCap />
              <span style={{ fontSize: u(17), fontWeight: 500 }}>Gestion des stages</span>
            </div>

            <div
              style={{
                ...at(290, 742),
                width: u(1.5),
                height: u(41),
                background: 'rgba(255,255,255,0.45)',
              }}
            />

            <div
              style={{
                ...at(325, 761),
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: u(15),
              }}
            >
              <IconPeople />
              <span style={{ fontSize: u(17), fontWeight: 500 }}>Suivi des étudiants</span>
            </div>

            <div
              style={{
                ...at(551, 742),
                width: u(1.5),
                height: u(41),
                background: 'rgba(255,255,255,0.45)',
              }}
            />

            <div
              style={{
                ...at(586, 761),
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: u(18),
              }}
            >
              <IconChart />
              <span style={{ fontSize: u(17), fontWeight: 500, lineHeight: u(22) }}>
                Un avenir
                <br />
                plus proche
              </span>
            </div>
          </section>

          {/* ═══════════ PANNEAU DROIT ═══════════ */}
          <section
            style={{
              position: 'absolute',
              left: u(818),
              top: 0,
              width: u(718),
              height: u(818),
              background: 'linear-gradient(160deg, #f8faff 0%, #eef3fc 60%, #e6eefb 100%)',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: u(175),
                height: u(160),
                borderTopLeftRadius: '100%',
                background:
                  'linear-gradient(135deg, rgba(160,200,255,0.30) 0%, rgba(70,140,255,0.55) 100%)',
              }}
            />
          </section>

          {/* Toque */}
          <svg
            viewBox="0 0 120 80"
            aria-hidden="true"
            style={{ ...at(1374, 32), width: u(88), height: u(59) }}
          >
            <defs>
              <linearGradient id="toque-top" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#5fb0ff" />
                <stop offset="100%" stopColor="#2f7cf6" />
              </linearGradient>
            </defs>
            <path d="M26 40 V62 C26 70 92 70 92 62 V40 L60 54 Z" fill="#1d5fd0" />
            <path d="M60 6 L116 28 L60 50 L4 28 Z" fill="url(#toque-top)" />
            <path d="M108 32 V60" stroke="#0f3f9a" strokeWidth="3" />
            <circle cx="108" cy="64" r="4" fill="#0f3f9a" />
          </svg>

          {/* Ensemble vers l'excellence */}
          <div
            style={{
              ...at(1399, 90),
              fontFamily: "'Segoe Script', 'Bradley Hand', 'Brush Script MT', cursive",
              fontSize: u(19),
              lineHeight: u(24),
              color: '#1f4fc2',
              transform: 'rotate(-12deg)',
              transformOrigin: 'left top',
              whiteSpace: 'nowrap',
            }}
          >
            <div>Ensemble vers</div>
            <div style={{ paddingLeft: u(16) }}>l&apos;excellence</div>
          </div>
          <svg
            viewBox="0 0 100 22"
            aria-hidden="true"
            style={{ ...at(1416, 138), width: u(92), height: u(20) }}
          >
            <path
              d="M2 17 Q45 22 96 4"
              fill="none"
              stroke="#1f4fc2"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>

          {/* Titre LOGIN */}
          <div
            style={{
              ...at(952, 107),
              width: u(404),
              height: u(60),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: u(35),
              color: '#1946b5',
            }}
          >
            <span style={{ width: u(81), height: u(2.5), background: '#1946b5' }} />
            <h1
              style={{
                margin: 0,
                fontSize: u(50),
                fontWeight: 800,
                letterSpacing: '0.1em',
                lineHeight: 1,
              }}
            >
              LOGIN
            </h1>
            <span style={{ width: u(81), height: u(2.5), background: '#1946b5' }} />
          </div>

          {/* Bienvenue */}
          <div
            style={{
              ...at(905, 198),
              width: u(500),
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: u(23),
                lineHeight: u(32),
                fontWeight: 700,
                color: '#1946b5',
              }}
            >
              Bienvenue ! 👋
            </h2>
            <p
              style={{
                margin: `${u(8)} 0 0`,
                fontSize: u(16),
                lineHeight: u(25),
                color: '#6b7a99',
              }}
            >
              Connectez-vous à votre compte pour accéder
              <br />
              à la plateforme de gestion des stages.
            </p>
          </div>

          {/* ═══════════ FORMULAIRE ═══════════ */}
          <form
            onSubmit={handleSubmit}
            style={{ ...at(886, 329), width: u(588) }}
          >
            {erreur && (
              <div
                role="alert"
                style={{
                  position: 'absolute',
                  bottom: `calc(100% + ${u(8)})`,
                  left: 0,
                  right: 0,
                  padding: `${u(7)} ${u(14)}`,
                  borderRadius: u(10),
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  fontSize: u(14),
                  textAlign: 'center',
                }}
              >
                {erreur}
              </div>
            )}

            {/* Email */}
            <label style={fieldStyle} className={focusClass}>
              <IconUser />
              <input
                ref={emailRef}
                type="email"
                required
                defaultValue=""
                placeholder="Adresse email"
                autoComplete="email"
                aria-label="Adresse email"
                className={inputClass}
                style={inputStyle}
              />
            </label>

            {/* Mot de passe */}
            <label
              style={{ ...fieldStyle, height: u(70), marginTop: u(22) }}
              className={focusClass}
            >
              <IconLock />
              <input
                type={afficher ? 'text' : 'password'}
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="Mot de passe"
                autoComplete="current-password"
                aria-label="Mot de passe"
                className={inputClass}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setAfficher((prev) => !prev)}
                aria-label={afficher ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{
                  flexShrink: 0,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: '#6b7a99',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <IconEye off={!afficher} />
              </button>
            </label>

            {/* Se souvenir de moi */}
            <label
              style={{
                marginTop: u(30),
                height: u(26),
                display: 'flex',
                alignItems: 'center',
                gap: u(16),
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: u(17.5),
                color: '#43526f',
              }}
            >
              <input
                ref={souvenirRef}
                type="checkbox"
                className="relative shrink-0 cursor-pointer appearance-none border-[#b0bad0] bg-white checked:border-[#1d6fe8] checked:bg-[#1d6fe8] after:absolute after:left-[31%] after:top-[8%] after:h-[58%] after:w-[30%] after:rotate-45 after:border-b-[0.2cqw] after:border-r-[0.2cqw] after:border-white after:opacity-0 after:content-[''] checked:after:opacity-100"
                style={{
                  width: u(26),
                  height: u(26),
                  borderRadius: u(7),
                  borderWidth: u(2),
                  borderStyle: 'solid',
                }}
              />
              Se souvenir de moi
            </label>

            {/* Bouton Connexion */}
            <button
              type="submit"
              disabled={chargement}
              className="hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                marginTop: u(30),
                width: '100%',
                height: u(73),
                borderRadius: u(20),
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: u(14),
                color: '#fff',
                fontSize: u(23),
                fontWeight: 600,
                background:
                  'linear-gradient(100deg, #46a0ff 0%, #1a73e8 45%, #0b56c6 100%)',
                boxShadow: '0 14px 26px rgba(20, 100, 220, 0.35)',
                transition: 'filter .2s',
              }}
            >
              {chargement ? (
                <>
                  <span
                    className="animate-spin"
                    aria-hidden="true"
                    style={{
                      width: u(22),
                      height: u(22),
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                    }}
                  />
                  Connexion...
                </>
              ) : (
                <>
                  Connexion
                  <IconArrow />
                </>
              )}
            </button>
          </form>

          {/* Inscription */}
          <p
            style={{
              ...at(886, 683),
              width: u(588),
              margin: 0,
              textAlign: 'center',
              fontSize: u(17.5),
              lineHeight: u(28),
              color: '#41506e',
            }}
          >
            Vous n&apos;avez pas de compte ?{' '}
            <Link
              href="/register"
              style={{
                color: '#1d6fe8',
                fontWeight: 700,
                textDecoration: 'underline',
                textUnderlineOffset: u(4),
              }}
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}