import type { AppData, DemoUser, MaterialDefinition } from './types'

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

export function createSeedData(): AppData {
  return {
    version: 2,
    onlineSimulation: true,
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
    checklists: [
      {
        id: 'checklist-seed-1',
        title: 'Vistoria do apartamento modelo',
        environment: 'Unidade 101',
        status: 'published',
        createdBy: 'Carlos Mendes',
        createdAt: isoDaysFromNow(-8),
        publishedAt: isoDaysFromNow(-5),
        items: [
          { id: 'ci-1', description: 'Regularizar acabamento junto ao rodapé da sala', completed: true },
          { id: 'ci-2', description: 'Ajustar alinhamento da tomada da bancada', completed: true },
        ],
      },
      {
        id: 'checklist-seed-2',
        title: 'Conferência de alvenaria',
        environment: 'Pavimento térreo',
        status: 'review',
        createdBy: 'Carlos Mendes',
        createdAt: isoDaysFromNow(-1),
        items: [{ id: 'ci-3', description: 'Conferir prumo da parede do lavabo', completed: true }],
      },
    ],
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedData()
    const parsed = JSON.parse(raw) as AppData
    return parsed.version === 2 ? parsed : createSeedData()
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
