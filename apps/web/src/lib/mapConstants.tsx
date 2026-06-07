import React from 'react'
import type { LocationCategory } from '@/types'

export const ALL_CATEGORIES: LocationCategory[] = [
  'study_spot', 'food', 'scenic', 'hangout', 'trail', 'activity', 'other',
]

export const CATEGORY_LABEL: Record<LocationCategory, string> = {
  study_spot: 'Study',
  food:       'Food',
  scenic:     'Scenic',
  hangout:    'Hangout',
  trail:      'Trail',
  activity:   'Activity',
  other:      'Other',
}

export const CATEGORY_COLOR: Record<LocationCategory, string> = {
  study_spot: '#7EB8F7',
  food:       '#F5A623',
  scenic:     '#6FCF97',
  hangout:    '#B88EF0',
  trail:      '#C4956A',
  activity:   '#F06B6B',
  other:      '#8899AA',
}

export const CATEGORY_ICON: Record<LocationCategory, React.ReactNode> = {
  scenic: (
    <path d="M16 10L23 21H9L16 10Z" fill="currentColor" fillOpacity="0.92" />
  ),
  food: (
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none">
      <line x1="16" y1="11" x2="16" y2="22" />
      <line x1="13" y1="11" x2="13" y2="15" />
      <line x1="19" y1="11" x2="19" y2="15" />
      <path d="M13 15Q16 16.5 19 15" />
    </g>
  ),
  study_spot: (
    <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M16 11C14 10 11 10.5 10 12L10 22C11 20.5 14 20 16 21" />
      <path d="M16 11C18 10 21 10.5 22 12L22 22C21 20.5 18 20 16 21" />
      <line x1="16" y1="11" x2="16" y2="21" />
    </g>
  ),
  hangout: (
    <g fill="currentColor" fillOpacity="0.92">
      <circle cx="16" cy="12" r="3" />
      <path d="M10 22C10 18.5 12.7 16 16 16S22 18.5 22 22Z" />
    </g>
  ),
  trail: (
    <g fill="currentColor" fillOpacity="0.92">
      <ellipse cx="13" cy="13" rx="2.2" ry="3.2" transform="rotate(-20 13 13)" />
      <ellipse cx="20" cy="20" rx="2.2" ry="3.2" transform="rotate(20 20 20)" />
    </g>
  ),
  activity: (
    <path d="M18 10H13.5L11 17H15L12.5 23L22 14H17.5L18 10Z" fill="currentColor" fillOpacity="0.92" />
  ),
  other: (
    <path d="M16 10L17.5 15L22 16L17.5 17L16 22L14.5 17L10 16L14.5 15Z" fill="currentColor" fillOpacity="0.92" />
  ),
}
