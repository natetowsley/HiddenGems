import { useState } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch, apiDelete } from '@/api/client'
import type { LocationCategory, LocationResponse, PublicUserResponse, ReportResponse } from '@/types'
import LocationSheet from '@/components/LocationSheet'

const KEYFRAMES = `
@keyframes adm-fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
`

const CATEGORY_COLOR: Record<LocationCategory, string> = {
  study_spot: '#7EB8F7',
  food:       '#F5A623',
  scenic:     '#6FCF97',
  hangout:    '#B88EF0',
  trail:      '#C4956A',
  activity:   '#F06B6B',
  other:      '#8899AA',
}

const CATEGORY_LABEL: Record<LocationCategory, string> = {
  study_spot: 'Study Spot',
  food:       'Food & Drink',
  scenic:     'Scenic',
  hangout:    'Hangout',
  trail:      'Trail',
  activity:   'Activity',
  other:      'Other',
}

type Tab = 'pending' | 'reports'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null)

  const { data: pending = [] } = useQuery({
    queryKey: ['admin', 'pending'],
    queryFn: () => apiGet<LocationResponse[]>('/api/locations/pending'),
  })

  const { data: reports = [] } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => apiGet<ReportResponse[]>('/api/reports'),
  })

  const counts: Record<Tab, number> = { pending: pending.length, reports: reports.length }

  return (
    <>
      <style>{KEYFRAMES}</style>
      <LocationSheet location={selectedLocation} onClose={() => setSelectedLocation(null)} />
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        paddingTop: 56,
        background: '#060f0b',
        backgroundImage: 'radial-gradient(ellipse 70% 30% at 50% 0%, rgba(111,207,151,0.04) 0%, transparent 100%)',
        fontFamily: 'Outfit, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 20px 80px',
      }}>

        {/* Page header */}
        <div style={{
          width: '100%',
          maxWidth: 640,
          marginBottom: 28,
          animation: 'adm-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 26,
              fontWeight: 800,
              color: '#EEEEEE',
              letterSpacing: '-0.03em',
            }}>
              Admin
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#ffb432',
              background: 'rgba(255,180,50,0.08)',
              border: '1px solid rgba(255,180,50,0.22)',
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              Panel
            </span>
          </div>
          <p style={{ margin: 0, color: '#3a5e4a', fontSize: 12.5, letterSpacing: '0.02em' }}>
            Review pending locations and manage reports.
          </p>
        </div>

        {/* Tab bar */}
        <div style={{
          width: '100%',
          maxWidth: 640,
          display: 'flex',
          gap: 4,
          marginBottom: 18,
          background: 'rgba(9,23,17,0.7)',
          border: '1px solid rgba(111,207,151,0.09)',
          borderRadius: 10,
          padding: 4,
          animation: 'adm-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.06s both',
        }}>
          {(['pending', 'reports'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 7,
                background: tab === t ? 'rgba(111,207,151,0.1)' : 'transparent',
                color: tab === t ? '#6FCF97' : '#3a5e4a',
                fontFamily: 'Outfit, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              {t === 'pending' ? 'Pending' : 'Reports'}
              <span style={{
                fontSize: 9,
                color: tab === t ? '#6FCF97' : '#2d5248',
                background: tab === t ? 'rgba(111,207,151,0.15)' : 'rgba(111,207,151,0.06)',
                border: `1px solid ${tab === t ? 'rgba(111,207,151,0.25)' : 'rgba(111,207,151,0.1)'}`,
                padding: '1px 6px',
                borderRadius: 8,
                fontVariantNumeric: 'tabular-nums',
                transition: 'all 0.15s',
              }}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{
          width: '100%',
          maxWidth: 640,
          animation: 'adm-fadeUp 0.38s cubic-bezier(0.22,1,0.36,1) 0.1s both',
        }}>
          {tab === 'pending'
            ? <PendingTab locations={pending} onSelect={setSelectedLocation} />
            : <ReportsTab reports={reports} onSelect={setSelectedLocation} />
          }
        </div>

      </div>
    </>
  )
}

// ── Pending tab ────────────────────────────────────────────────────

function PendingTab({ locations, onSelect }: { locations: LocationResponse[]; onSelect: (loc: LocationResponse) => void }) {
  const qc = useQueryClient()

  const creatorIds = [...new Set(locations.map(l => l.createdBy))]
  const creatorQueries = useQueries({
    queries: creatorIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => apiGet<PublicUserResponse>(`/api/users/${id}`),
    })),
  })
  const creatorMap = Object.fromEntries(creatorIds.map((id, i) => [id, creatorQueries[i]?.data]))

  const verifyMutation = useMutation({
    mutationFn: (id: string) => apiPatch<LocationResponse>(`/api/locations/${id}/verify`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pending'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiPatch<LocationResponse>(`/api/locations/${id}/archive`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pending'] }),
  })

  if (locations.length === 0) return <EmptyState message="No pending locations." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {locations.map((loc, i) => (
        <PendingCard
          key={loc.id}
          location={loc}
          creator={creatorMap[loc.createdBy]}
          index={i}
          onSelect={() => onSelect(loc)}
          onVerify={() => verifyMutation.mutate(loc.id)}
          onArchive={() => archiveMutation.mutate(loc.id)}
          verifying={verifyMutation.isPending && verifyMutation.variables === loc.id}
          archiving={archiveMutation.isPending && archiveMutation.variables === loc.id}
        />
      ))}
    </div>
  )
}

function PendingCard({
  location,
  creator,
  index,
  onSelect,
  onVerify,
  onArchive,
  verifying,
  archiving,
}: {
  location: LocationResponse
  creator?: PublicUserResponse
  index: number
  onSelect: () => void
  onVerify: () => void
  onArchive: () => void
  verifying: boolean
  archiving: boolean
}) {
  const color = CATEGORY_COLOR[location.category]
  const date = new Date(location.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const busy = verifying || archiving

  return (
    <div
      onClick={onSelect}
      style={{
        background: 'rgba(9,23,17,0.65)',
        border: '1px solid rgba(111,207,151,0.09)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        animation: `adm-fadeUp 0.38s cubic-bezier(0.22,1,0.36,1) ${0.12 + index * 0.04}s both`,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(111,207,151,0.22)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(111,207,151,0.09)')}
    >
      <div style={{ height: 2, background: color }} />
      <div style={{ padding: '14px 16px' }}>

        {/* Category + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color,
            border: `1px solid ${color}40`,
            padding: '2px 8px',
            borderRadius: 3,
          }}>
            {CATEGORY_LABEL[location.category]}
          </span>
          <span style={{ color: '#253f36', fontSize: 10, letterSpacing: '0.06em', marginLeft: 'auto' }}>
            {date}
          </span>
        </div>

        {/* Name */}
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 18,
          fontWeight: 700,
          color: '#EEEEEE',
          letterSpacing: '-0.02em',
          marginBottom: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {location.name}
        </div>

        {/* Creator + coords */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: '#6FCF97', fontSize: 11, fontWeight: 500 }}>
            @{creator?.username ?? '…'}
          </span>
          <span style={{ color: '#1e3b30', fontSize: 9 }}>·</span>
          <span style={{ color: '#253f36', fontSize: 10, letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}>
            {Math.abs(location.lat).toFixed(4)}° {location.lat >= 0 ? 'N' : 'S'},&nbsp;
            {Math.abs(location.lng).toFixed(4)}° {location.lng >= 0 ? 'E' : 'W'}
          </span>
        </div>

        {/* Description */}
        {location.description && (
          <p style={{
            color: '#556a62',
            fontSize: 12,
            lineHeight: 1.65,
            margin: '0 0 14px',
            maxHeight: '3.3em',
            overflow: 'hidden',
          }}>
            {location.description}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); onVerify() }}
            disabled={busy}
            style={{
              padding: '7px 20px',
              border: '1px solid rgba(111,207,151,0.3)',
              borderRadius: 7,
              background: verifying ? 'rgba(111,207,151,0.14)' : 'rgba(111,207,151,0.07)',
              color: busy && !verifying ? '#3a5e4a' : '#6FCF97',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'background 0.15s, color 0.15s',
              opacity: busy && !verifying ? 0.4 : 1,
            }}
          >
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onArchive() }}
            disabled={busy}
            style={{
              padding: '7px 20px',
              border: '1px solid rgba(240,107,107,0.22)',
              borderRadius: 7,
              background: archiving ? 'rgba(240,107,107,0.1)' : 'transparent',
              color: busy && !archiving ? '#3a5e4a' : '#F06B6B',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'background 0.15s, color 0.15s',
              opacity: busy && !archiving ? 0.4 : 1,
            }}
          >
            {archiving ? 'Archiving…' : 'Archive'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Reports tab ────────────────────────────────────────────────────

function ReportsTab({ reports, onSelect }: { reports: ReportResponse[]; onSelect: (loc: LocationResponse) => void }) {
  const qc = useQueryClient()

  const locationIds = [...new Set(reports.map(r => r.locationId))]
  const locationQueries = useQueries({
    queries: locationIds.map(id => ({
      queryKey: ['location-admin', id],
      queryFn: () => apiGet<LocationResponse>(`/api/locations/${id}`),
    })),
  })
  const locationMap = Object.fromEntries(locationIds.map((id, i) => [id, locationQueries[i]?.data]))

  const reporterIds = [...new Set(reports.map(r => r.reporterId))]
  const reporterQueries = useQueries({
    queries: reporterIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => apiGet<PublicUserResponse>(`/api/users/${id}`),
    })),
  })
  const reporterMap = Object.fromEntries(reporterIds.map((id, i) => [id, reporterQueries[i]?.data]))

  const dismissMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/reports/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  })

  if (reports.length === 0) return <EmptyState message="No reports." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {reports.map((report, i) => {
        const loc = locationMap[report.locationId]
        return (
          <ReportCard
            key={report.id}
            report={report}
            location={loc}
            reporter={reporterMap[report.reporterId]}
            index={i}
            onSelect={loc ? () => onSelect(loc) : undefined}
            onDismiss={() => dismissMutation.mutate(report.id)}
            dismissing={dismissMutation.isPending && dismissMutation.variables === report.id}
          />
        )
      })}
    </div>
  )
}

function ReportCard({
  report,
  location,
  reporter,
  index,
  onSelect,
  onDismiss,
  dismissing,
}: {
  report: ReportResponse
  location?: LocationResponse
  reporter?: PublicUserResponse
  index: number
  onSelect?: () => void
  onDismiss: () => void
  dismissing: boolean
}) {
  const date = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div
      onClick={onSelect}
      style={{
        background: 'rgba(9,23,17,0.65)',
        border: '1px solid rgba(240,107,107,0.1)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        animation: `adm-fadeUp 0.38s cubic-bezier(0.22,1,0.36,1) ${0.12 + index * 0.04}s both`,
      }}
      onMouseEnter={e => { if (onSelect) e.currentTarget.style.borderColor = 'rgba(240,107,107,0.24)' }}
      onMouseLeave={e => { if (onSelect) e.currentTarget.style.borderColor = 'rgba(240,107,107,0.1)' }}
    >
      <div style={{ height: 2, background: 'rgba(240,107,107,0.55)' }} />
      <div style={{ padding: '14px 16px' }}>

        {/* Location name + date */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 17,
            fontWeight: 700,
            color: '#EEEEEE',
            letterSpacing: '-0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}>
            {location?.name ?? '…'}
          </div>
          <span style={{ color: '#253f36', fontSize: 10, letterSpacing: '0.06em', flexShrink: 0, paddingTop: 3 }}>
            {date}
          </span>
        </div>

        {/* Reason */}
        <p style={{
          color: '#9aada5',
          fontSize: 12.5,
          lineHeight: 1.65,
          margin: '0 0 12px',
          padding: '9px 12px',
          background: 'rgba(240,107,107,0.04)',
          border: '1px solid rgba(240,107,107,0.1)',
          borderRadius: 7,
        }}>
          {report.reason}
        </p>

        {/* Reporter + action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#556a62', fontSize: 11 }}>
            Reported by{' '}
            <span style={{ color: '#6FCF97' }}>@{reporter?.username ?? '…'}</span>
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDismiss() }}
            disabled={dismissing}
            style={{
              padding: '6px 16px',
              border: '1px solid rgba(111,207,151,0.14)',
              borderRadius: 6,
              background: 'transparent',
              color: dismissing ? '#3a5e4a' : '#556a62',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              cursor: dismissing ? 'default' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { if (!dismissing) (e.currentTarget as HTMLButtonElement).style.color = '#9aada5' }}
            onMouseLeave={e => { if (!dismissing) (e.currentTarget as HTMLButtonElement).style.color = '#556a62' }}
          >
            {dismissing ? 'Dismissing…' : 'Dismiss'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '52px 32px',
      color: '#3a5e4a',
      fontSize: 13,
      letterSpacing: '0.04em',
      background: 'rgba(9,23,17,0.4)',
      border: '1px solid rgba(111,207,151,0.06)',
      borderRadius: 12,
    }}>
      {message}
    </div>
  )
}
