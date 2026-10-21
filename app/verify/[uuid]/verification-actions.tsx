'use client'

import { useState } from 'react'

interface VerificationActionsProps {
  uuid: string
  pdfUrl?: string | null
}

export function VerificationActions({ uuid, pdfUrl }: VerificationActionsProps) {
  const [copie, setCopie] = useState(false)
  const [copieLien, setCopieLien] = useState(false)

  const copierUUID = async () => {
    try {
      await navigator.clipboard.writeText(uuid)
      setCopie(true)
      setTimeout(() => setCopie(false), 2500)
    } catch {
      // Fallback
    }
  }

  const copierLienComplet = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopieLien(true)
      setTimeout(() => setCopieLien(false), 2500)
    } catch {
      // Fallback
    }
  }

  const imprimer = () => {
    window.print()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-emerald-500 hover:shadow-sm active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Voir le PDF
        </a>
      )}

      <button
        onClick={imprimer}
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
      >
        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Imprimer
      </button>

      <button
        onClick={copierLienComplet}
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
      >
        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {copieLien ? 'Lien copié !' : 'Partager'}
      </button>

      <button
        onClick={copierUUID}
        type="button"
        title="Copier le code UUID"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 shadow-xs transition-all hover:bg-slate-50 active:scale-95"
      >
        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {copie ? 'UUID copié !' : 'Copier UUID'}
      </button>
    </div>
  )
}
