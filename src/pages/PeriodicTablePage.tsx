import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ELEMENTS, CATEGORY_COLORS, CATEGORY_NAMES_RU,
  getGridPosition, type ChemElement, type ElementCategory,
} from '@/data/periodicTable'
import { ArrowLeft, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PeriodicTablePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedEl, setSelectedEl] = useState<ChemElement | null>(null)
  const [activeCategory, setActiveCategory] = useState<ElementCategory | null>(null)

  const filteredSet = useMemo(() => {
    if (!search && !activeCategory) return null
    const q = search.toLowerCase()
    return new Set(
      ELEMENTS
        .filter((el) => {
          if (activeCategory && el.category !== activeCategory) return false
          if (q && !el.symbol.toLowerCase().includes(q) && !el.nameRu.toLowerCase().includes(q) && !String(el.z).includes(q)) return false
          return true
        })
        .map((el) => el.z)
    )
  }, [search, activeCategory])

  // Build grid — 18 cols x 10 rows (7 periods + gap + 2 for lanthanides/actinides)
  const grid = useMemo(() => {
    const cells: (ChemElement | null)[][] = Array.from({ length: 10 }, () => Array(19).fill(null))
    for (const el of ELEMENTS) {
      const pos = getGridPosition(el)
      if (pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 19) {
        cells[pos.row][pos.col] = el
      }
    }
    return cells
  }, [])

  const categories = Object.entries(CATEGORY_NAMES_RU) as [ElementCategory, string][]

  return (
    <div className="min-h-dvh flex flex-col bg-ink-950 page-enter">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-ink-950/95 backdrop-blur-xl border-b border-ink-800/50 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="text-ink-400">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-base font-semibold text-ink-100 flex-1">
            Таблица Менделеева
          </h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по элементу..."
            className="w-full bg-ink-800/60 border border-ink-700/50 rounded-xl pl-9 pr-8 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-400/30"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category legend */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map(([key, name]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(activeCategory === key ? null : key)}
              className={cn(
                'shrink-0 text-[10px] font-medium px-2 py-1 rounded-md border transition-all',
                activeCategory === key
                  ? 'border-current'
                  : 'border-transparent opacity-70'
              )}
              style={{
                color: CATEGORY_COLORS[key],
                background: activeCategory === key ? `${CATEGORY_COLORS[key]}20` : `${CATEGORY_COLORS[key]}10`,
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-auto p-2">
        <div className="min-w-[520px]" style={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)', gap: '1px' }}>
          {grid.map((row, ri) =>
            row.slice(1).map((el, ci) => {
              if (!el) {
                // Lanthanide/actinide placeholder in period 6/7 col 3
                if ((ri === 5 && ci + 1 === 3) || (ri === 6 && ci + 1 === 3)) {
                  return <div key={`${ri}-${ci}`} className="w-full aspect-square flex items-center justify-center text-[8px] text-ink-600">*</div>
                }
                return <div key={`${ri}-${ci}`} />
              }

              const dimmed = filteredSet && !filteredSet.has(el.z)
              const color = CATEGORY_COLORS[el.category]

              return (
                <button
                  key={el.z}
                  onClick={() => setSelectedEl(el)}
                  className={cn(
                    'w-full aspect-square rounded-[3px] flex flex-col items-center justify-center transition-all relative',
                    dimmed ? 'opacity-15' : 'active:scale-110',
                  )}
                  style={{
                    background: dimmed ? '#1a1f30' : `${color}18`,
                    border: `1px solid ${dimmed ? '#1a1f30' : `${color}40`}`,
                  }}
                >
                  <span className="text-[6px] text-ink-500 leading-none absolute top-0.5 left-0.5">{el.z}</span>
                  <span className="text-[11px] font-bold leading-none" style={{ color: dimmed ? '#2a3050' : color }}>
                    {el.symbol}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Lanthanide / Actinide rows label */}
        <div className="mt-2 text-[8px] text-ink-600 text-center">
          * Лантаноиды и актиноиды (ряды 8-9)
        </div>
      </div>

      {/* Element detail bottom sheet */}
      {selectedEl && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSelectedEl(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full bg-ink-900 border-t border-ink-700/50 rounded-t-3xl p-5 pb-8 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-ink-700 rounded-full mx-auto mb-4" />

            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: `${CATEGORY_COLORS[selectedEl.category]}15`,
                  border: `2px solid ${CATEGORY_COLORS[selectedEl.category]}40`,
                }}
              >
                <span className="text-2xl font-bold" style={{ color: CATEGORY_COLORS[selectedEl.category] }}>
                  {selectedEl.symbol}
                </span>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-ink-50">{selectedEl.nameRu}</h2>
                <p className="text-ink-400 text-sm">
                  {selectedEl.symbol} &middot; #{selectedEl.z} &middot; {selectedEl.mass.toFixed(selectedEl.mass % 1 === 0 ? 0 : 3)}
                </p>
                <span
                  className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-md"
                  style={{
                    color: CATEGORY_COLORS[selectedEl.category],
                    background: `${CATEGORY_COLORS[selectedEl.category]}15`,
                  }}
                >
                  {CATEGORY_NAMES_RU[selectedEl.category]}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {selectedEl.electronConfig && (
                <InfoRow label="Электронная конф." value={selectedEl.electronConfig} />
              )}
              {selectedEl.oxidationStates && (
                <InfoRow label="Степени окисления" value={selectedEl.oxidationStates} />
              )}
              {selectedEl.electronegativity && (
                <InfoRow label="Электроотрицательность" value={String(selectedEl.electronegativity)} />
              )}
              <InfoRow label="Период / Группа" value={`${selectedEl.period} / ${selectedEl.group || '—'}`} />
              <InfoRow label="Блок" value={selectedEl.block.toUpperCase()} />

              {selectedEl.entRelevance && (
                <div className="mt-3 bg-amber-400/5 border border-amber-400/15 rounded-xl p-3">
                  <p className="text-amber-400 text-[10px] font-medium uppercase tracking-wider mb-1">ЕНТ</p>
                  <p className="text-ink-200 text-sm leading-relaxed">{selectedEl.entRelevance}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500 text-xs">{label}</span>
      <span className="text-ink-200 text-sm font-mono">{value}</span>
    </div>
  )
}
