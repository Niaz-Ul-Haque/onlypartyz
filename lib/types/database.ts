export type RsvpStatus = 'going' | 'maybe' | 'not_going'
export type PotluckItemStatus = 'open' | 'fulfilled' | 'locked'

export interface Party {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  location_address: string | null
  location_map_iframe: string | null
  timezone: string
  cover_image_url: string | null
  is_potluck: boolean
  notes: string | null
  rsvp_deadline: string | null
  max_capacity: number | null
  dress_code: string | null
  party_type: string | null
  special_instructions: string | null
  created_by: string
  created_at: string
  updated_at: string
  is_archived: boolean
}

export interface InviteCode {
  id: string
  party_id: string
  code: string
  is_active: boolean
  expires_at: string | null
  max_uses: number | null
  uses: number
  created_at: string
}

export interface Guest {
  id: string
  party_id: string
  display_name: string
  phone: string | null
  party_size: number
  device_fingerprint: string | null
  created_at: string
  last_seen_at: string
}

export interface Rsvp {
  id: string
  party_id: string
  guest_id: string
  status: RsvpStatus
  updated_at: string
}

export interface PotluckCategory {
  id: string
  party_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface PotluckItem {
  id: string
  party_id: string
  category_id: string
  name: string
  dietary_tags: string[] | null
  needed_qty: number | null
  status: PotluckItemStatus
  sort_order: number
  created_at: string
}

export interface PotluckClaim {
  id: string
  party_id: string
  item_id: string
  guest_id: string
  qty: number
  note: string | null
  created_at: string
}

// New simplified potluck structure
export interface PotluckItemType {
  id: string
  party_id: string
  name: string
  capacity: number
  sort_order: number
  created_at: string
}

export interface PotluckSelection {
  id: string
  party_id: string
  guest_id: string
  item_type_id: string
  note: string | null
  created_at: string
  updated_at: string
}

export interface PotluckItemTypeWithStats extends PotluckItemType {
  item_type_id: any
  selections_count: number
  remaining: number
  selections?: (PotluckSelection & { guest: Guest })[]
}

export interface Media {
  id: string
  party_id: string
  uploaded_by_admin: boolean
  url: string
  blurhash: string | null
  created_at: string
}

export interface Comment {
  id: string
  party_id: string
  guest_id: string | null
  author_name: string
  is_admin: boolean
  message: string
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface PartyWithDetails extends Party {
  invite_code?: InviteCode
  guests?: Guest[]
  rsvps?: Rsvp[]
  categories?: PotluckCategory[]
  media?: Media[]
}

export interface PotluckItemWithClaims extends PotluckItem {
  claims?: (PotluckClaim & { guest: Guest })[]
}

export interface PotluckCategoryWithItems extends PotluckCategory {
  items?: PotluckItemWithClaims[]
}

export interface GuestWithRsvp extends Guest {
  rsvp?: Rsvp
}

// API request/response types
export interface ResolveCodeRequest {
  code: string
}

export interface ResolveCodeResponse {
  party: Party
  inviteCode: InviteCode
}

export interface JoinPartyRequest {
  displayName: string
  phone?: string
  partySize?: number
  deviceFingerprint?: string
}

export interface JoinPartyResponse {
  guest: Guest
  token: string
}

export interface RsvpRequest {
  status: RsvpStatus
}

export interface ClaimItemRequest {
  itemId: string
  qty?: number
  note?: string
}

export interface UnclaimItemRequest {
  claimId: string
}

export interface SelectItemTypeRequest {
  itemTypeId: string
  note?: string
}

export interface CreateItemTypeRequest {
  name: string
  capacity: number
  sort_order?: number
}

export interface UpdateItemTypeRequest {
  name?: string
  capacity?: number
  sort_order?: number
}

export interface CreatePartyRequest {
  title: string
  description?: string
  starts_at: string
  ends_at?: string
  location_address?: string
  location_map_iframe?: string
  cover_image_url?: string
  is_potluck: boolean
  rsvp_deadline?: string
  max_capacity?: number
  dress_code?: string
  party_type?: string
  special_instructions?: string
}

export interface UpdatePartyRequest extends Partial<CreatePartyRequest> {
  is_archived?: boolean
}

export interface CreateCategoryRequest {
  name: string
  sort_order?: number
}

export interface CreateItemRequest {
  category_id: string
  name: string
  dietary_tags?: string[]
  needed_qty?: number
  sort_order?: number
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  status?: PotluckItemStatus
}

export interface CreateCommentRequest {
  message: string
  guestId?: string
  authorName: string
  isAdmin?: boolean
}

export interface DeleteCommentRequest {
  commentId: string
}
