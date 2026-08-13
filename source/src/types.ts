export type Role = 'field' | 'office' | 'client'
export type DiaryStatus = 'draft' | 'review' | 'published'
export type PurchaseStatus = 'solicitado' | 'em_aprovacao' | 'comprado' | 'entregue' | 'cancelado'
export type ChecklistStatus = 'in_progress' | 'review' | 'published'
export type AIEvidenceSource = 'whatsapp' | 'photo' | 'meet'
export type AIEvidenceStatus = 'new' | 'applied' | 'dismissed'
export type DemoPhotoAsset = 'masonry' | 'electrical'

export interface DemoUser {
  role: Role
  name: string
  email: string
  password: string
}

export interface PhotoReference {
  id: string
  name: string
  type: string
  createdAt: string
  demoAsset?: DemoPhotoAsset
}

export interface DiaryEntry {
  id: string
  date: string
  weekLabel: string
  weeklyServices: string
  generalLog: string
  occurrences: string
  alignments: string
  photos: PhotoReference[]
  purchaseIds: string[]
  status: DiaryStatus
  createdBy: string
  createdAt: string
  publishedAt?: string
  generatedByAi?: boolean
  aiEvidenceIds?: string[]
}

export interface AIDiarySuggestion {
  weeklyServices: string
  generalLog: string
  occurrences: string
  alignments: string
  materialRequest?: string
}

export interface AIEvidence {
  id: string
  source: AIEvidenceSource
  status: AIEvidenceStatus
  author: string
  receivedAt: string
  title: string
  excerpt: string
  context: string
  confidence: number
  photos?: PhotoReference[]
  suggestion: AIDiarySuggestion
}

export interface PurchaseItem {
  id: string
  materialId: string
  name: string
  phase: string
  category: string
  unit: string
  quantity: number
  brand?: string
}

export interface PurchaseOrder {
  id: string
  number: string
  items: PurchaseItem[]
  neededDate: string
  location: string
  urgency: 'normal' | 'urgente'
  notes: string
  status: PurchaseStatus
  createdBy: string
  createdAt: string
  pendingSync?: boolean
}

export interface ChecklistItem {
  id: string
  description: string
  completed: boolean
  beforePhoto?: PhotoReference
  afterPhoto?: PhotoReference
}

export interface Checklist {
  id: string
  title: string
  environment: string
  items: ChecklistItem[]
  status: ChecklistStatus
  createdBy: string
  createdAt: string
  publishedAt?: string
}

export interface AppData {
  version: 2
  diaries: DiaryEntry[]
  purchases: PurchaseOrder[]
  checklists: Checklist[]
  aiEvidence: AIEvidence[]
  onlineSimulation: boolean
}

export interface MaterialDefinition {
  id: string
  name: string
  phase: string
  category: string
  unit: string
  brands?: string[]
}
