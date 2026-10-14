/**
 * EventFilters — sticky filter bar (desktop) + accessible bottom-sheet (mobile).
 * Owns: chip toggles for kind/type/mode/price/open/past, search, sort select,
 * grid/list toggle, active-chip strip with remove buttons, result count live region.
 */
import { useId, useRef, useEffect, useCallback } from 'react'
import type { EventFilters as Filters, SortKey } from './useEventFilters'
import './EventFilters.css'

interface Props {
  filters: Filters
  resultCount: number
  totalCount: number
  onFilter: (updates: Partial<Filters>) => void
  onClearAll: () => void
}

/* ─── Small primitives ─────────────────────────────────────────────────── */

interface ToggleChipProps {
  label: string
  active: boolean
  onToggle: () => void
  'aria-label'?: string
}

function ToggleChip({ label, active, onToggle, 'aria-label': ariaLabel }: ToggleChipProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel ?? label}
      className={`events-chip${active ? ' events-chip--active' : ''}`}
      onClick={onToggle}
    >
      {label}
    </button>
  )
}

interface SortSelectProps {
  value: SortKey
  onChange: (v: SortKey) => void
}

function SortSelect({ value, onChange }: SortSelectProps) {
  const id = useId()
  return (
    <div className="events-sort-wrap">
      <label htmlFor={id} className="events-sort-label sr-only">
        Sort by
      </label>
      <select
        id={id}
        className="events-sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
      >
        <option value="soonest">Soonest</option>
        <option value="price-asc">Price: Low → High</option>
        <option value="seats">Most Seats Left</option>
        <option value="deadline">Deadline</option>
      </select>
    </div>
  )
}

/* ─── Active chip strip ─────────────────────────────────────────────────── */

interface ActiveChip {
  key: string
  label: string
}

type FilterKey = keyof Filters

interface ActiveChipStripProps {
  chips: ActiveChip[]
  onRemove: (key: string) => void
  onClearAll: () => void
}

function ActiveChipStrip({ chips, onRemove, onClearAll }: ActiveChipStripProps) {
  if (chips.length === 0) return null
  return (
    <div className="events-active-chips" role="group" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.label}`}
          type="button"
          className="events-active-chip"
          onClick={() => onRemove(chip.key)}
          aria-label={`Remove filter: ${chip.label}`}
        >
          {chip.label}
          <span aria-hidden="true" className="events-active-chip-x">×</span>
        </button>
      ))}
      <button type="button" className="events-clear-all" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  )
}

/* ─── Filter row (shared between bar and sheet) ─────────────────────────── */

interface FilterRowProps {
  filters: Filters
  onFilter: (updates: Partial<Filters>) => void
}

function FilterRow({ filters, onFilter }: FilterRowProps) {
  const searchId = useId()

  const toggle = <K extends FilterKey>(
    key: K,
    onVal: Filters[K],
    offVal: Filters[K]
  ) => {
    onFilter({ [key]: filters[key] === onVal ? offVal : onVal } as Partial<Filters>)
  }

  return (
    <div className="events-filter-row">
      {/* Search */}
      <div className="events-search-wrap">
        <label htmlFor={searchId} className="sr-only">
          Search events
        </label>
        <span className="events-search-icon" aria-hidden="true">⌕</span>
        <input
          id={searchId}
          type="search"
          className="events-search"
          placeholder="Search events…"
          value={filters.q}
          onChange={(e) => onFilter({ q: e.target.value })}
          autoComplete="off"
        />
        {filters.q && (
          <button
            type="button"
            className="events-search-clear"
            onClick={() => onFilter({ q: '' })}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Kind */}
      <fieldset className="events-chip-group">
        <legend className="events-chip-legend">Kind</legend>
        <ToggleChip
          label="Technical"
          active={filters.kind === 'technical'}
          onToggle={() => toggle('kind', 'technical', '')}
        />
        <ToggleChip
          label="Cultural"
          active={filters.kind === 'cultural'}
          onToggle={() => toggle('kind', 'cultural', '')}
        />
      </fieldset>

      {/* Type */}
      <fieldset className="events-chip-group">
        <legend className="events-chip-legend">Type</legend>
        <ToggleChip
          label="Event"
          active={filters.type === 'event'}
          onToggle={() => toggle('type', 'event', '')}
        />
        <ToggleChip
          label="Workshop"
          active={filters.type === 'workshop'}
          onToggle={() => toggle('type', 'workshop', '')}
        />
      </fieldset>

      {/* Mode */}
      <fieldset className="events-chip-group">
        <legend className="events-chip-legend">Mode</legend>
        <ToggleChip
          label="Online"
          active={filters.mode === 'online'}
          onToggle={() => toggle('mode', 'online', '')}
        />
        <ToggleChip
          label="Offline"
          active={filters.mode === 'offline'}
          onToggle={() => toggle('mode', 'offline', '')}
        />
      </fieldset>

      {/* Price */}
      <fieldset className="events-chip-group">
        <legend className="events-chip-legend">Price</legend>
        <ToggleChip
          label="Free"
          active={filters.price === 'free'}
          onToggle={() => toggle('price', 'free', '')}
        />
        <ToggleChip
          label="Paid"
          active={filters.price === 'paid'}
          onToggle={() => toggle('price', 'paid', '')}
        />
      </fieldset>

      {/* Boolean toggles */}
      <div className="events-chip-group events-chip-group--bools">
        <ToggleChip
          label="Open only"
          active={filters.open}
          onToggle={() => onFilter({ open: !filters.open })}
          aria-label={filters.open ? 'Showing open registration only' : 'Show open registration only'}
        />
        <ToggleChip
          label="Show archive"
          active={filters.past}
          onToggle={() => onFilter({ past: !filters.past })}
          aria-label={filters.past ? 'Hiding past events' : 'Show past events'}
        />
      </div>
    </div>
  )
}

/* ─── Mobile bottom-sheet ───────────────────────────────────────────────── */

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  filters: Filters
  onFilter: (updates: Partial<Filters>) => void
}

function BottomSheet({ open, onClose, filters, onFilter }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Move focus into the sheet, close on Escape, and hand focus back to the opener afterwards
  useEffect(() => {
    if (!open) return
    const sheet = sheetRef.current
    if (!sheet) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    sheet.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      opener?.focus()
    }
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`events-sheet-backdrop${open ? ' events-sheet-backdrop--open' : ''}`}
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter events"
        inert={!open}
        tabIndex={-1}
        className={`events-sheet${open ? ' events-sheet--open' : ''}`}
      >
        <div className="events-sheet-handle" aria-hidden="true" />
        <div className="events-sheet-header">
          <span className="events-sheet-title mono">Filters</span>
          <button
            type="button"
            className="events-sheet-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            ×
          </button>
        </div>
        <div className="events-sheet-body">
          <FilterRow filters={filters} onFilter={onFilter} />
        </div>
        <div className="events-sheet-footer">
          <button type="button" className="events-sheet-apply" onClick={onClose}>
            Show results
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Main export ───────────────────────────────────────────────────────── */

interface ViewToggleProps {
  view: 'grid' | 'list'
  onChange: (v: 'grid' | 'list') => void
}

function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="events-view-toggle" role="group" aria-label="View mode">
      <button
        type="button"
        className={`events-view-btn${view === 'grid' ? ' events-view-btn--active' : ''}`}
        aria-pressed={view === 'grid'}
        aria-label="Grid view"
        onClick={() => onChange('grid')}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        className={`events-view-btn${view === 'list' ? ' events-view-btn--active' : ''}`}
        aria-pressed={view === 'list'}
        aria-label="List view"
        onClick={() => onChange('list')}
      >
        <ListIcon />
      </button>
    </div>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <rect x="1" y="2" width="14" height="2.5" rx="1" />
      <rect x="1" y="6.75" width="14" height="2.5" rx="1" />
      <rect x="1" y="11.5" width="14" height="2.5" rx="1" />
    </svg>
  )
}

export interface EventFiltersProps extends Props {
  activeChips: ActiveChip[]
  mobileOpen: boolean
  onMobileOpen: () => void
  onMobileClose: () => void
}

export default function EventFilters({
  filters,
  resultCount,
  totalCount,
  onFilter,
  onClearAll,
  activeChips,
  mobileOpen,
  onMobileOpen,
  onMobileClose,
}: EventFiltersProps) {
  const removeChip = useCallback(
    (key: string) => {
      const map: Record<string, Partial<Filters>> = {
        q: { q: '' },
        kind: { kind: '' },
        cultural: { kind: '' },
        type: { type: '' },
        mode: { mode: '' },
        price: { price: '' },
        open: { open: false },
        past: { past: false },
      }
      onFilter(map[key] ?? {})
    },
    [onFilter]
  )

  return (
    <>
      {/* ── Sticky filter bar (visible md+) ── */}
      <div className="events-filter-bar" role="search" aria-label="Filter events">
        <div className="container">
          <div className="events-filter-bar-inner">
            {/* Desktop: full filter row */}
            <div className="events-filter-bar-desktop">
              <FilterRow filters={filters} onFilter={onFilter} />
            </div>

            {/* Mobile: open-sheet button */}
            <button
              type="button"
              className="events-filter-mobile-btn"
              onClick={onMobileOpen}
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
            >
              <span aria-hidden="true">⚙</span>
              Filters
              {activeChips.length > 0 && (
                <span className="events-filter-badge" aria-label={`${activeChips.length} active`}>
                  {activeChips.length}
                </span>
              )}
            </button>

            {/* Sort + view (always visible) */}
            <div className="events-bar-controls">
              <SortSelect
                value={filters.sort}
                onChange={(v) => onFilter({ sort: v })}
              />
              <ViewToggle
                view={filters.view}
                onChange={(v) => onFilter({ view: v })}
              />
            </div>
          </div>

          {/* Active chip strip */}
          <ActiveChipStrip
            chips={activeChips}
            onRemove={removeChip}
            onClearAll={onClearAll}
          />
        </div>
      </div>

      {/* ── Result count (aria-live) ── */}
      <div className="container">
        <p
          className="events-result-count mono"
          aria-live="polite"
          aria-atomic="true"
        >
          {resultCount === totalCount
            ? `${resultCount} event${resultCount !== 1 ? 's' : ''}`
            : `${resultCount} of ${totalCount} events`}
        </p>
      </div>

      {/* ── Mobile bottom-sheet ── */}
      <BottomSheet
        open={mobileOpen}
        onClose={onMobileClose}
        filters={filters}
        onFilter={onFilter}
      />
    </>
  )
}
