import type { AppData, Checklist, ChecklistItem, ChecklistPublication, DemoUser, MaterialDefinition, ScheduleService } from './types'

export const STORAGE_KEY = 'arquitetool-campo-demo-v2'
export const SESSION_KEY = 'arquitetool-campo-session-v1'

export const USERS: DemoUser[] = [
  { role: 'field', name: 'Carlos Mendes', email: 'campo@demo.arquitetool', password: 'campo123' },
  { role: 'office', name: 'Marina Costa', email: 'escritorio@demo.arquitetool', password: 'escritorio123' },
  { role: 'client', name: 'Ana Ribeiro', email: 'cliente@demo.arquitetool', password: 'cliente123' },
]

export const MATERIALS: MaterialDefinition[] = [
  { id: 'cacamba', name: 'Caçamba estacionária', phase: 'Demolição', category: 'Retirada', unit: 'unidade' },
  { id: 'lona', name: 'Lona de proteção', phase: 'Demolição', category: 'Proteção', unit: 'rolo' },
  { id: 'disco', name: 'Disco de corte', phase: 'Demolição', category: 'Ferramentas', unit: 'unidade', brands: ['Bosch', 'Makita'] },
  { id: 'bloco', name: 'Bloco cerâmico', phase: 'Alvenaria', category: 'Blocos', unit: 'unidade' },
  { id: 'cimento', name: 'Cimento', phase: 'Alvenaria', category: 'Argamassas', unit: 'saco', brands: ['Votorantim', 'Cauê'] },
  { id: 'areia', name: 'Areia média', phase: 'Alvenaria', category: 'Argamassas', unit: 'm³' },
  { id: 'cabo', name: 'Cabo elétrico', phase: 'Instalações', category: 'Elétrica', unit: 'metro', brands: ['Sil', 'Prysmian'] },
  { id: 'disjuntor', name: 'Disjuntor', phase: 'Instalações', category: 'Elétrica', unit: 'unidade', brands: ['Siemens', 'WEG'] },
  { id: 'tubo', name: 'Tubo PVC', phase: 'Instalações', category: 'Hidráulica', unit: 'barra', brands: ['Tigre', 'Amanco'] },
  { id: 'porcelanato', name: 'Porcelanato', phase: 'Revestimentos', category: 'Pisos', unit: 'm²', brands: ['Portobello', 'Eliane'] },
  { id: 'argamassa', name: 'Argamassa colante', phase: 'Revestimentos', category: 'Assentamento', unit: 'saco', brands: ['Quartzolit', 'Votorantim'] },
  { id: 'rejunte', name: 'Rejunte', phase: 'Revestimentos', category: 'Assentamento', unit: 'pacote', brands: ['Quartzolit', 'Fortaleza'] },
  { id: 'massa', name: 'Massa corrida', phase: 'Pintura', category: 'Preparação', unit: 'lata', brands: ['Suvinil', 'Coral'] },
  { id: 'tinta', name: 'Tinta acrílica', phase: 'Pintura', category: 'Pintura', unit: 'lata', brands: ['Suvinil', 'Coral'] },
  { id: 'rolo', name: 'Rolo de pintura', phase: 'Pintura', category: 'Ferramentas', unit: 'unidade' },
  { id: 'luminaria', name: 'Luminária', phase: 'Acabamentos', category: 'Iluminação', unit: 'unidade', brands: ['Taschibra', 'Avant'] },
  { id: 'torneira', name: 'Torneira', phase: 'Acabamentos', category: 'Metais', unit: 'unidade', brands: ['Deca', 'Docol'] },
  { id: 'vaso', name: 'Vaso sanitário', phase: 'Acabamentos', category: 'Louças', unit: 'unidade', brands: ['Deca', 'Celite'] },
]

function isoDaysFromNow(offset: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return date.toISOString()
}

function dateOnly(offset: number) {
  return isoDaysFromNow(offset).slice(0, 10)
}

export function weekLabelFor(dateValue = new Date()) {
  const date = new Date(dateValue)
  date.setHours(12, 0, 0, 0)
  const day = date.getDay() || 7
  const start = new Date(date)
  start.setDate(date.getDate() - day + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export function isInCurrentWeek(value: string) {
  const now = new Date()
  const date = new Date(value)
  const current = weekLabelFor(now)
  return weekLabelFor(date) === current
}

function createPublication(checklist: Checklist, publishedAt: string, publishedBy = 'Marina Costa'): ChecklistPublication {
  return {
    id: `publication-${checklist.id}-${checklist.publications.length + 1}`,
    version: checklist.publications.length + 1,
    publishedAt,
    publishedBy,
    isPartial: checklist.items.some((item) => item.answer === 'pending' || item.answer === 'not_verified' || (item.answer === 'nonconform' && item.nonConformityStatus !== 'resolved')),
    title: checklist.title,
    environment: checklist.environment,
    inspector: checklist.inspector,
    generalNotes: checklist.generalNotes,
    items: checklist.items.map((item) => ({
      id: item.id,
      description: item.description,
      answer: item.answer,
      publicNote: item.publicNote,
      assignee: item.assignee,
      dueDate: item.dueDate,
      nonConformityStatus: item.nonConformityStatus,
      beforePhoto: item.beforePhoto,
      afterPhoto: item.nonConformityStatus === 'resolved' ? item.afterPhoto : undefined,
      correctionDescription: item.nonConformityStatus === 'resolved' ? item.correctionDescription : undefined,
    })),
  }
}

export function createSeedData(): AppData {
  const publishedScheduleServices: ScheduleService[] = [
    { id: 'schedule-foundation', name: 'Fundação e estrutura', startDate: dateOnly(-18), endDate: dateOnly(-8), progress: 100 },
    { id: 'schedule-masonry', name: 'Alvenaria do térreo', startDate: dateOnly(-7), endDate: dateOnly(4), progress: 62 },
    { id: 'schedule-electrical', name: 'Infraestrutura elétrica', startDate: dateOnly(1), endDate: dateOnly(12), progress: 15 },
    { id: 'schedule-coating', name: 'Revestimentos internos', startDate: dateOnly(10), endDate: dateOnly(23), progress: 0 },
    { id: 'schedule-painting', name: 'Pintura e acabamentos', startDate: dateOnly(21), endDate: dateOnly(34), progress: 0 },
  ]
  const data: AppData = {
    version: 4,
    onlineSimulation: true,
    schedule: {
      status: 'review',
      source: 'api_demo',
      updatedAt: isoDaysFromNow(0),
      updatedBy: 'Carlos Mendes',
      services: publishedScheduleServices.map((service) => service.id === 'schedule-masonry' ? { ...service, progress: 70 } : service),
      publications: [{
        id: 'schedule-publication-1',
        version: 1,
        publishedAt: isoDaysFromNow(-2),
        publishedBy: 'Marina Costa',
        services: publishedScheduleServices,
      }],
    },
    aiEvidence: [
      {
        id: 'ai-photo-1',
        source: 'photo',
        status: 'new',
        author: 'Carlos Mendes',
        receivedAt: isoDaysFromNow(0),
        title: '2 fotos do pavimento térreo',
        excerpt: 'Imagens mostram elevação de alvenaria e preparação dos vãos.',
        context: 'Análise visual simulada · WhatsApp da obra',
        confidence: 92,
        photos: [
          { id: 'demo-photo-masonry', name: 'registro-alvenaria-ficticio.jpg', type: 'image/jpeg', createdAt: isoDaysFromNow(0), demoAsset: 'masonry' },
          { id: 'demo-photo-electrical', name: 'registro-eletrica-ficticio.jpg', type: 'image/jpeg', createdAt: isoDaysFromNow(0), demoAsset: 'electrical' },
        ],
        suggestion: {
          weeklyServices: 'Execução da alvenaria do pavimento térreo e preparação dos vãos de portas.',
          generalLog: 'As imagens recebidas indicam avanço da alvenaria no setor social, com vãos preparados para a próxima conferência.',
          occurrences: 'A imagem não permite confirmar prumo, nível ou conformidade dimensional.',
          alignments: 'Solicitar conferência presencial antes da liberação da próxima etapa.',
        },
      },
      {
        id: 'ai-whatsapp-1',
        source: 'whatsapp',
        status: 'new',
        author: 'João · Encarregado',
        receivedAt: isoDaysFromNow(0),
        title: 'Conversa no WhatsApp da obra',
        excerpt: '“Terminamos a parede da sala. Precisamos de 30 sacos de argamassa até sexta.”',
        context: 'Mensagem recebida no número oficial · Conteúdo fictício',
        confidence: 97,
        suggestion: {
          weeklyServices: 'Conclusão da parede da sala.',
          generalLog: 'O encarregado informou a conclusão da parede da sala.',
          occurrences: 'Foi identificada uma necessidade de material para continuidade da frente.',
          alignments: 'Confirmar quantidade, marca e local de entrega antes de criar o pedido.',
          materialRequest: '30 sacos de argamassa · necessidade informada para sexta-feira',
        },
      },
      {
        id: 'ai-meet-1',
        source: 'meet',
        status: 'new',
        author: 'Reunião semanal',
        receivedAt: isoDaysFromNow(-1),
        title: 'Resumo da reunião de acompanhamento',
        excerpt: 'Marina validará o detalhamento elétrico. Carlos fará a conferência em campo até sexta-feira.',
        context: 'Transcrição simulada do Google Meet · 18 min',
        confidence: 94,
        suggestion: {
          weeklyServices: 'Compatibilização das próximas frentes de alvenaria e instalações elétricas.',
          generalLog: 'Na reunião semanal, a equipe alinhou a sequência de execução entre alvenaria e elétrica.',
          occurrences: 'O detalhamento elétrico ainda depende de validação do escritório.',
          alignments: 'Marina: validar detalhamento elétrico. Carlos: conferir marcações em campo até sexta-feira.',
        },
      },
    ],
    purchases: [
      {
        id: 'purchase-seed-1',
        number: 'MAT-2026-014',
        items: [
          { id: 'pi-1', materialId: 'bloco', name: 'Bloco cerâmico', phase: 'Alvenaria', category: 'Blocos', unit: 'unidade', quantity: 500 },
          { id: 'pi-2', materialId: 'cimento', name: 'Cimento', phase: 'Alvenaria', category: 'Argamassas', unit: 'saco', quantity: 40, brand: 'Votorantim' },
        ],
        neededDate: dateOnly(4),
        location: 'Almoxarifado',
        urgency: 'normal',
        notes: 'Separar por lote para conferência.',
        status: 'em_aprovacao',
        createdBy: 'Carlos Mendes',
        createdAt: isoDaysFromNow(-1),
      },
      {
        id: 'purchase-seed-2',
        number: 'MAT-2026-013',
        items: [{ id: 'pi-3', materialId: 'cabo', name: 'Cabo elétrico', phase: 'Instalações', category: 'Elétrica', unit: 'metro', quantity: 120, brand: 'Prysmian' }],
        neededDate: dateOnly(2),
        location: 'Pavimento 2',
        urgency: 'urgente',
        notes: 'Equipe elétrica aguardando.',
        status: 'comprado',
        createdBy: 'Carlos Mendes',
        createdAt: isoDaysFromNow(-2),
      },
    ],
    diaries: [
      {
        id: 'diary-seed-1',
        date: dateOnly(-3),
        weekLabel: weekLabelFor(new Date(isoDaysFromNow(-3))),
        weeklyServices: 'Alvenaria do pavimento térreo e preparação dos pontos elétricos.',
        generalLog: 'A equipe concluiu o fechamento das paredes do setor social conforme o projeto.',
        occurrences: 'Nenhuma ocorrência crítica registrada.',
        alignments: 'Conferir chegada dos materiais elétricos antes do início da próxima frente.',
        photos: [],
        purchaseIds: ['purchase-seed-1', 'purchase-seed-2'],
        status: 'published',
        createdBy: 'Carlos Mendes',
        createdAt: isoDaysFromNow(-3),
        publishedAt: isoDaysFromNow(-2),
      },
      {
        id: 'diary-seed-2',
        date: dateOnly(-1),
        weekLabel: weekLabelFor(new Date(isoDaysFromNow(-1))),
        weeklyServices: 'Início da infraestrutura elétrica no pavimento 2.',
        generalLog: 'Foram marcados os pontos e iniciada a passagem de eletrodutos.',
        occurrences: 'Aguardando confirmação de entrega dos cabos.',
        alignments: 'Validar sequência com o escritório técnico.',
        photos: [],
        purchaseIds: ['purchase-seed-2'],
        status: 'review',
        createdBy: 'Carlos Mendes',
        createdAt: isoDaysFromNow(-1),
      },
    ],
    checklistTemplates: [
      {
        id: 'template-entrega-apartamento',
        title: 'Vistoria de acabamento',
        category: 'Qualidade e entrega',
        environment: 'Apartamento',
        updatedAt: isoDaysFromNow(-10),
        items: [
          { id: 'ti-1', description: 'Conferir acabamento de pintura e ausência de manchas' },
          { id: 'ti-2', description: 'Conferir alinhamento de tomadas e espelhos' },
          { id: 'ti-3', description: 'Verificar assentamento e rejunte dos revestimentos' },
          { id: 'ti-4', description: 'Testar abertura e fechamento das esquadrias' },
        ],
      },
    ],
    checklists: [
      {
        id: 'checklist-seed-1',
        title: 'Vistoria do apartamento modelo',
        environment: 'Unidade 101',
        status: 'published',
        inspector: 'Marina Costa',
        generalNotes: 'Vistoria parcial de acabamento para acompanhamento do cliente.',
        templateId: 'template-entrega-apartamento',
        createdBy: 'Marina Costa',
        createdAt: isoDaysFromNow(-8),
        publishedAt: isoDaysFromNow(-5),
        items: [
          { id: 'ci-1', description: 'Conferir acabamento de pintura e ausência de manchas', answer: 'conform', publicNote: 'Acabamento conferido.', internalNote: '', assignee: '', dueDate: '' },
          { id: 'ci-2', description: 'Conferir alinhamento de tomadas e espelhos', answer: 'nonconform', publicNote: 'Tomada da bancada requer realinhamento.', internalNote: 'Conferir compatibilização antes de fechar o espelho.', assignee: 'Equipe elétrica', dueDate: dateOnly(3), nonConformityStatus: 'open', beforePhoto: { id: 'demo-photo-electrical', name: 'registro-eletrica-ficticio.jpg', type: 'image/jpeg', createdAt: isoDaysFromNow(-6), demoAsset: 'electrical' } },
          { id: 'ci-3', description: 'Verificar assentamento e rejunte dos revestimentos', answer: 'not_verified', publicNote: 'Item programado para a próxima vistoria.', internalNote: '', assignee: '', dueDate: '' },
        ],
        publications: [],
      },
      {
        id: 'checklist-seed-2',
        title: 'Conferência de alvenaria',
        environment: 'Pavimento térreo',
        inspector: 'Marina Costa',
        generalNotes: 'Conferência geométrica e liberação das frentes.',
        status: 'in_progress',
        createdBy: 'Marina Costa',
        createdAt: isoDaysFromNow(-1),
        items: [{ id: 'ci-4', description: 'Conferir prumo da parede do lavabo', answer: 'nonconform', publicNote: 'Parede do lavabo requer correção localizada.', internalNote: 'Desvio identificado na conferência com régua.', assignee: 'Equipe de alvenaria', dueDate: dateOnly(2), nonConformityStatus: 'awaiting_validation', beforePhoto: { id: 'demo-photo-masonry', name: 'registro-alvenaria-ficticio.jpg', type: 'image/jpeg', createdAt: isoDaysFromNow(-1), demoAsset: 'masonry' }, afterPhoto: { id: 'demo-photo-masonry-after', name: 'correcao-alvenaria-ficticia.jpg', type: 'image/jpeg', createdAt: isoDaysFromNow(0), demoAsset: 'masonry' }, correctionDescription: 'Regularização executada e conferida pela equipe de campo.' }],
        publications: [],
      },
    ],
  }
  const published = data.checklists.find((item) => item.status === 'published')
  if (published?.publishedAt) published.publications = [createPublication(published, published.publishedAt)]
  return data
}

function migrateV2(parsed: Record<string, unknown>): AppData {
  const seed = createSeedData()
  const legacyChecklists = Array.isArray(parsed.checklists) ? parsed.checklists as Array<Record<string, unknown>> : []
  const checklists: Checklist[] = legacyChecklists.map((legacy, checklistIndex) => {
    const createdAt = String(legacy.createdAt ?? new Date().toISOString())
    const legacyItems = Array.isArray(legacy.items) ? legacy.items as Array<Record<string, unknown>> : []
    const items: ChecklistItem[] = legacyItems.map((item, itemIndex) => ({
      id: String(item.id ?? `migrated-item-${checklistIndex}-${itemIndex}`),
      description: String(item.description ?? 'Item migrado'),
      answer: item.completed ? 'conform' : 'not_verified',
      publicNote: item.completed ? 'Item concluído na versão anterior.' : 'Item ainda não verificado.',
      internalNote: '',
      assignee: '',
      dueDate: '',
      beforePhoto: item.beforePhoto as ChecklistItem['beforePhoto'],
      afterPhoto: item.afterPhoto as ChecklistItem['afterPhoto'],
    }))
    const checklist: Checklist = {
      id: String(legacy.id ?? `migrated-checklist-${checklistIndex}`),
      title: String(legacy.title ?? 'Checklist migrado'),
      environment: String(legacy.environment ?? 'Ambiente não informado'),
      inspector: String(legacy.createdBy ?? 'Equipe'),
      generalNotes: 'Registro migrado da demonstração anterior.',
      items,
      status: legacy.status === 'published' ? 'published' : 'in_progress',
      createdBy: String(legacy.createdBy ?? 'Equipe'),
      createdAt,
      publishedAt: legacy.publishedAt ? String(legacy.publishedAt) : undefined,
      publications: [],
    }
    if (checklist.publishedAt) checklist.publications = [createPublication(checklist, checklist.publishedAt, 'Escritório')]
    return checklist
  })
  return {
    ...seed,
    diaries: Array.isArray(parsed.diaries) ? parsed.diaries as AppData['diaries'] : seed.diaries,
    purchases: Array.isArray(parsed.purchases) ? parsed.purchases as AppData['purchases'] : seed.purchases,
    aiEvidence: Array.isArray(parsed.aiEvidence) ? parsed.aiEvidence as AppData['aiEvidence'] : seed.aiEvidence,
    onlineSimulation: typeof parsed.onlineSimulation === 'boolean' ? parsed.onlineSimulation : true,
    checklists,
  }
}

function migrateV3(parsed: Record<string, unknown>): AppData {
  const seed = createSeedData()
  return { ...seed, ...parsed, version: 4, schedule: seed.schedule } as AppData
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedData()
    const parsed = JSON.parse(raw) as AppData | Record<string, unknown>
    if (parsed.version === 4) return parsed as AppData
    if (parsed.version === 3) return migrateV3(parsed as Record<string, unknown>)
    if (parsed.version === 2) return migrateV2(parsed as Record<string, unknown>)
    return createSeedData()
  } catch {
    return createSeedData()
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
