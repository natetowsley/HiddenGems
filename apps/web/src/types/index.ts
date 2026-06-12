export type UserRole = 'user' | 'admin'

export interface UserResponse {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface PublicUserResponse {
  id: string
  name: string
  username: string
  avatarUrl: string | null
  role: UserRole
  createdAt: string
}

export type LocationCategory =
  | 'study_spot'
  | 'food'
  | 'scenic'
  | 'hangout'
  | 'trail'
  | 'activity'
  | 'other'

export type LocationStatus = 'pending' | 'verified' | 'archived'

export interface LocationResponse {
  id: string
  name: string
  description: string | null
  category: LocationCategory
  tags: string[]
  lat: number
  lng: number
  createdBy: string
  status: LocationStatus
  isPrivate: boolean
  avgRating: number
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface ReviewResponse {
  id: string
  userId: string
  locationId: string
  rating: number
  text: string | null
  upvotes: number
  downvotes: number
  createdAt: string
  imageUrls: string[]
}

export interface CollectionResponse {
  id: string
  userId: string
  title: string
  isPrivate: boolean
  locationIds: string[]
  createdAt: string
}

export interface ReportResponse {
  id: string
  reporterId: string
  locationId: string
  reason: string
  createdAt: string
}
