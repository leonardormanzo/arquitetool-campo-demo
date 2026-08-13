export type Role = 'field' | 'office' | 'client'
export type DiaryStatus = 'draft' | 'review' | 'published'
export type PurchaseStatus = 'solicitado' | 'em_aprovacao' | 'comprado' | 'entregue' | 'cancelado'
export type ChecklistStatus = 'in_progress' | 'published'
export type ChecklistAnswer = 'pending' | 'conform' | 'nonconform' | 'not_applicable' | 'not_verified'
export type NonConformityStatus = 'open' | 'in_correction' | 'awaiting_validation' | 'resolved' | 'reopened'
export type AIEvidenceSource = 'whatsapp' | 'photo' | 'meet'
export type AIEvidenceStatus = 'new' | 'applied' | 'dismissed'
export type DemoPhotoAsset = 'masonry' | 'electrical'
export type ScheduleStatus = 'draft' | 'review' | 'published'
export type ScheduleSource = 'manual' | 'api_demo'

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

export interface ChecklistTemplateItem {
  id: string
  description: string
}

export interface ChecklistTemplate {
  id: string
  title: string
  category: string
  environment: string
  items: ChecklistTemplateItem[]
  updatedAt: string
}

export interface ChecklistItem {
  id: string
  description: string
  answer: ChecklistAnswer
  publicNote: string
  internalNote: string
  assignee: string
  dueDate: string
  nonConformityStatus?: NonConformityStatus
  beforePhoto?: PhotoReference
  afterPhoto?: PhotoReference
  correctionDescription?: string
  validatedAt?: string
  validatedBy?: string
}

export interface PublishedChecklistItem {
  id: string
  description: string
  answer: ChecklistAnswer
  publicNote: string
  assignee: string
  dueDate: string
  nonConformityStatus?: NonConformityStatus
  beforePhoto?: PhotoReference
  afterPhoto?: PhotoReference
  correctionDescription?: string
}

export interface ChecklistPublication {
  id: string
  version: number
  publishedAt: string
  publishedBy: string
  isPartial: boolean
  title: string
  environment: string
  inspector: string
  generalNotes: string
  items: PublishedChecklistItem[]
}

export interface Checklist {
  id: string
  title: string
  environment: string
  inspector: string
  generalNotes: string
  templateId?: string
  items: ChecklistItem[]
  status: ChecklistStatus
  createdBy: string
  createdAt: string
  publishedAt?: string
  publications: ChecklistPublication[]
}

export interface ScheduleService {
  id: string
  name: string
  startDate: string
  endDate: string
  progress: number
}

export interface SchedulePublication {
  id: string
  version: number
  publishedAt: string
  publishedBy: string
  services: ScheduleService[]
}

export interface Schedule {
  status: ScheduleStatus
  source: ScheduleSource
  updatedAt: string
  updatedBy: string
  services: ScheduleService[]
  publications: SchedulePublication[]
}

export interface AppData {
  version: 4
  diaries: DiaryEntry[]
  purchases: PurchaseOrder[]
  checklists: Checklist[]
  checklistTemplates: ChecklistTemplate[]
  aiEvidence: AIEvidence[]
  schedule: Schedule
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
