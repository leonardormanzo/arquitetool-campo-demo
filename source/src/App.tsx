import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  Bot,
  BookOpenText,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  Home,
  ImagePlus,
  Image as ImageIcon,
  ListChecks,
  LogOut,
  MapPin,
  MessageCircle,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShoppingCart,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Video,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import logoUrl from './assets/arquitetool-logo.png'
import demoMasonryUrl from './assets/demo-alvenaria.jpg'
import demoElectricalUrl from './assets/demo-eletrica.jpg'
import { clearPhotos, deletePhoto, getPhoto, savePhoto } from './photoStore'
import {
  MATERIALS,
  SESSION_KEY,
  USERS,
  isInCurrentWeek,
  loadData,
  resetData,
  saveData,
  weekLabelFor,
} from './storage'
import type {
  AIEvidence,
  AIEvidenceSource,
  AppData,
  Checklist,
  ChecklistItem,
  ChecklistStatus,
  DemoPhotoAsset,
  DemoUser,
  DiaryEntry,
  DiaryStatus,
  MaterialDefinition,
  PhotoReference,
  PurchaseItem,
  PurchaseOrder,
  PurchaseStatus,
  Role,
} from './types'

type Screen =
  | 'home'
  | 'diaries'
  | 'diary-form'
  | 'diary-detail'
  | 'purchases'
  | 'purchase-new'
  | 'purchase-detail'
  | 'checklists'
  | 'checklist-new'
  | 'checklist-detail'
  | 'ai-inbox'

const PROJECT = { name: 'Residencial Aurora', code: 'DEMO-2026-001', location: 'São Paulo — SP' }

const roleLabel: Record<Role, string> = { field: 'Campo', office: 'Escritório', client: 'Cliente' }
const diaryLabel: Record<DiaryStatus, string> = { draft: 'Rascunho', review: 'Em revisão', published: 'Publicado' }
const checklistLabel: Record<ChecklistStatus, string> = { in_progress: 'Em andamento', review: 'Em revisão', published: 'Publicado' }
const purchaseLabel: Record<PurchaseStatus, string> = {
  solicitado: 'Solicitado',
  em_aprovacao: 'Em aprovação',
  comprado: 'Comprado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const purchaseStatuses: PurchaseStatus[] = ['solicitado', 'em_aprovacao', 'comprado', 'entregue', 'cancelado']
const aiSourceLabel: Record<AIEvidenceSource, string> = { whatsapp: 'WhatsApp', photo: 'Foto', meet: 'Google Meet' }
const demoPhotoUrls: Record<DemoPhotoAsset, string> = { masonry: demoMasonryUrl, electrical: demoElectricalUrl }
const phaseIcons: Record<string, string> = {
  Demolição: '01',
  Alvenaria: '02',
  Instalações: '03',
  Revestimentos: '04',
  Pintura: '05',
  Acabamentos: '06',
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function today() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function formatDate(value: string) {
  const date = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function getSessionUser(): DemoUser | null {
  const email = sessionStorage.getItem(SESSION_KEY)
  return USERS.find((user) => user.email === email) ?? null
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <img className={compact ? 'brand-logo compact' : 'brand-logo'} src={logoUrl} alt="Arquitetool" />
}

function StatusBadge({ status, children }: { status: string; children: ReactNode }) {
  return <span className={`status-badge status-${status}`}>{children}</span>
}

function PageTitle({ icon, title, subtitle, back }: { icon: ReactNode; title: string; subtitle?: string; back?: () => void }) {
  return (
    <div className="page-title-row">
      {back && (
        <button type="button" className="icon-button" onClick={back} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
      )}
      <span className="page-title-icon">{icon}</span>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  )
}

function usePhotoUrl(reference?: PhotoReference) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let objectUrl: string | undefined
    if (!reference) {
      setUrl(undefined)
      return
    }
    if (reference.demoAsset) {
      setUrl(demoPhotoUrls[reference.demoAsset])
      return
    }
    getPhoto(reference.id).then((blob) => {
      if (blob) {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      }
    })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [reference])
  return url
}

function PhotoPreview({ photo, label, onRemove }: { photo?: PhotoReference; label: string; onRemove?: () => void }) {
  const url = usePhotoUrl(photo)
  if (!photo || !url) {
    return (
      <div className="photo-placeholder">
        <Camera size={24} />
        <span>{label}</span>
      </div>
    )
  }
  return (
    <figure className="photo-preview">
      <img src={url} alt={label} />
      <figcaption>{label}</figcaption>
      {onRemove && (
        <button type="button" className="photo-remove" onClick={onRemove} aria-label={`Remover ${label}`}>
          <X size={16} />
        </button>
      )}
    </figure>
  )
}

function DiaryPhotos({
  photos,
  onChange,
  notify,
}: {
  photos: PhotoReference[]
  onChange: (photos: PhotoReference[]) => void
  notify: (text: string) => void
}) {
  const addFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (photos.length + files.length > 6) {
      notify('Você pode anexar até seis fotos por diário.')
      event.target.value = ''
      return
    }
    try {
      const saved: PhotoReference[] = []
      for (const file of files) saved.push(await savePhoto(file))
      onChange([...photos, ...saved])
      notify(saved.length === 1 ? 'Foto adicionada.' : `${saved.length} fotos adicionadas.`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível salvar a foto.')
    }
    event.target.value = ''
  }

  const remove = async (photo: PhotoReference) => {
    await deletePhoto(photo.id)
    onChange(photos.filter((item) => item.id !== photo.id))
    notify('Foto removida.')
  }

  return (
    <div className="photo-uploader">
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <PhotoPreview key={photo.id} photo={photo} label={`Foto do dia ${index + 1}`} onRemove={() => remove(photo)} />
        ))}
        {photos.length < 6 && (
          <label className="photo-add">
            <ImagePlus size={28} />
            <strong>Adicionar foto</strong>
            <span>Câmera ou galeria</span>
            <input type="file" accept="image/*" capture="environment" multiple onChange={addFiles} />
          </label>
        )}
      </div>
      <small>{photos.length}/6 fotos · imagens comprimidas e salvas neste aparelho</small>
    </div>
  )
}

function PurchaseSummary({ orders, compact = false }: { orders: PurchaseOrder[]; compact?: boolean }) {
  const [open, setOpen] = useState(!compact)
  return (
    <section className="linked-purchases">
      <button type="button" className="linked-purchases-header" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className={orders.length ? 'summary-dot active' : 'summary-dot'}>
          {orders.length ? <Check size={16} /> : <X size={16} />}
        </span>
        <span>
          <strong>{orders.length ? 'Houve solicitação de material' : 'Não houve solicitação de material'}</strong>
          <small>{orders.length ? `${orders.length} pedido(s) vinculado(s) à semana` : 'Nenhum pedido encontrado nesta semana'}</small>
        </span>
        <ChevronDown className={open ? 'rotate' : ''} size={20} />
      </button>
      {open && orders.length > 0 && (
        <div className="linked-purchases-list">
          {orders.map((order) => (
            <div key={order.id} className="linked-order">
              <div>
                <strong>{order.number}</strong>
                <small>{order.items.map((item) => `${item.quantity} ${item.unit} de ${item.name}`).join(' · ')}</small>
              </div>
              <StatusBadge status={order.status}>{purchaseLabel[order.status]}</StatusBadge>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function LoginScreen({ onLogin }: { onLogin: (user: DemoUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    const user = USERS.find((candidate) => candidate.email === email.trim() && candidate.password === password)
    if (!user) {
      setError('Acesso não encontrado. Use uma das credenciais de demonstração abaixo.')
      return
    }
    sessionStorage.setItem(SESSION_KEY, user.email)
    onLogin(user)
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <Logo />
        <span className="eyebrow">Arquitetool Campo</span>
        <h1>O canteiro conectado, sem complicação.</h1>
        <p>Diário de obra, solicitações de material e checklist em uma única experiência.</p>
        <div className="login-feature-list">
          <span><BookOpenText size={20} /> Registre o dia</span>
          <span><ShoppingCart size={20} /> Solicite materiais</span>
          <span><ClipboardCheck size={20} /> Comprove entregas</span>
        </div>
      </section>
      <section className="login-card">
        <div className="demo-pill"><CircleAlert size={16} /> Acesso fictício de demonstração</div>
        <h2>Entrar no sistema</h2>
        <p>Escolha um perfil para testar as permissões.</p>
        <label className="field">
          <span>E-mail</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="nome@empresa.com.br" />
        </label>
        <label className="field">
          <span>Senha</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" onKeyDown={(event) => event.key === 'Enter' && submit()} />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button type="button" className="button primary wide" onClick={submit}>Entrar <ChevronRight size={19} /></button>
        <div className="demo-accounts">
          <span>Acessos rápidos</span>
          {USERS.map((user) => (
            <button key={user.role} type="button" onClick={() => { setEmail(user.email); setPassword(user.password); setError('') }}>
              <span className={`avatar role-${user.role}`}><UserRound size={17} /></span>
              <span><strong>{roleLabel[user.role]}</strong><small>{user.email} · {user.password}</small></span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function Dashboard({ user, data, navigate }: { user: DemoUser; data: AppData; navigate: (screen: Screen) => void }) {
  const todayDiary = data.diaries.some((diary) => diary.date === today())
  const weekOrder = data.purchases.some((order) => isInCurrentWeek(order.createdAt))
  const activeChecklist = data.checklists.some((checklist) => checklist.status !== 'published')
  const fieldProgress = [todayDiary, weekOrder, activeChecklist].filter(Boolean).length
  const reviewDiaries = data.diaries.filter((diary) => diary.status === 'review').length
  const reviewChecklists = data.checklists.filter((checklist) => checklist.status === 'review').length
  const approvalOrders = data.purchases.filter((order) => ['solicitado', 'em_aprovacao'].includes(order.status)).length
  const newAiEvidence = data.aiEvidence.filter((item) => item.status === 'new').length
  const publishedDiaries = data.diaries.filter((diary) => diary.status === 'published')
  const publishedChecklists = data.checklists.filter((checklist) => checklist.status === 'published')

  if (user.role === 'client') {
    return (
      <div className="page dashboard-page">
        <section className="welcome-card client-welcome">
          <span className="eyebrow">Portal do cliente</span>
          <h1>Olá, {user.name.split(' ')[0]}</h1>
          <p>Acompanhe somente as atualizações revisadas e publicadas pela equipe.</p>
        </section>
        <div className="section-heading"><div><span className="eyebrow">Atualizações</span><h2>Conteúdo publicado</h2></div></div>
        <div className="client-grid">
          <button className="client-summary-card" onClick={() => navigate('diaries')}>
            <span><BookOpenText size={24} /></span><strong>{publishedDiaries.length}</strong><small>Diários disponíveis</small><ChevronRight size={20} />
          </button>
          <button className="client-summary-card" onClick={() => navigate('checklists')}>
            <span><ClipboardCheck size={24} /></span><strong>{publishedChecklists.length}</strong><small>Checklists concluídos</small><ChevronRight size={20} />
          </button>
        </div>
        <div className="privacy-note"><CheckCircle2 size={20} /><span><strong>Visualização controlada</strong>Compras, evidências da IA, rascunhos e alinhamentos internos não aparecem neste perfil.</span></div>
      </div>
    )
  }

  if (user.role === 'office') {
    return (
      <div className="page dashboard-page">
        <section className="welcome-card office-welcome">
          <div><span className="eyebrow">Central do escritório</span><h1>Bom trabalho, {user.name.split(' ')[0]}</h1><p>Revise o que chegou do campo e publique atualizações com segurança.</p></div>
          <span className="large-counter">{reviewDiaries + reviewChecklists + approvalOrders + newAiEvidence}<small>ações pendentes</small></span>
        </section>
        <div className="action-grid four">
          <button className="action-card ai-action-card" onClick={() => navigate('ai-inbox')}><span className="action-icon"><Sparkles /></span><span><strong>Caixa de entrada IA</strong><small>{newAiEvidence} evidências para revisar</small></span><em>{newAiEvidence}</em><ChevronRight /></button>
          <button className="action-card" onClick={() => navigate('diaries')}><span className="action-icon"><BookOpenText /></span><span><strong>Diários</strong><small>{reviewDiaries} aguardando revisão</small></span><em>{reviewDiaries}</em><ChevronRight /></button>
          <button className="action-card" onClick={() => navigate('purchases')}><span className="action-icon"><ShoppingCart /></span><span><strong>Compras</strong><small>{approvalOrders} para acompanhar</small></span><em>{approvalOrders}</em><ChevronRight /></button>
          <button className="action-card" onClick={() => navigate('checklists')}><span className="action-icon"><ClipboardCheck /></span><span><strong>Checklist</strong><small>{reviewChecklists} aguardando revisão</small></span><em>{reviewChecklists}</em><ChevronRight /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="page dashboard-page">
      <section className="welcome-card field-welcome">
        <div><span className="eyebrow">Equipe de campo</span><h1>Olá, {user.name.split(' ')[0]}!</h1><p>O que você precisa registrar hoje?</p></div>
        <div className="day-progress"><span>{fieldProgress}/3</span><small>rotinas em andamento</small><div><i style={{ width: `${(fieldProgress / 3) * 100}%` }} /></div></div>
      </section>
      <div className="action-grid four">
        <button className="action-card large ai-action-card" onClick={() => navigate('ai-inbox')}><span className="action-icon"><Sparkles /></span><span><strong>Copiloto IA</strong><small>WhatsApp, fotos e reuniões</small></span>{newAiEvidence > 0 && <em>{newAiEvidence}</em>}<ChevronRight /></button>
        <button className="action-card large" onClick={() => navigate('diaries')}><span className="action-icon"><BookOpenText /></span><span><strong>Diário de obra</strong><small>Fotos e registro do dia</small></span>{todayDiary && <em className="done"><Check size={16} /></em>}<ChevronRight /></button>
        <button className="action-card large" onClick={() => navigate('purchases')}><span className="action-icon"><ShoppingCart /></span><span><strong>Compras</strong><small>Solicite o que a obra precisa</small></span>{weekOrder && <em className="done"><Check size={16} /></em>}<ChevronRight /></button>
        <button className="action-card large" onClick={() => navigate('checklists')}><span className="action-icon"><ClipboardCheck /></span><span><strong>Checklist</strong><small>Registre antes e depois</small></span>{activeChecklist && <em className="done"><Check size={16} /></em>}<ChevronRight /></button>
      </div>
      <section className="tip-card"><span><Camera size={22} /></span><div><strong>Dica de campo</strong><p>Fotografe de frente e com boa luz. Isso facilita a conferência do escritório.</p></div></section>
    </div>
  )
}

function AiSourceIcon({ source }: { source: AIEvidenceSource }) {
  if (source === 'whatsapp') return <MessageCircle size={22} />
  if (source === 'meet') return <Video size={22} />
  return <ImageIcon size={22} />
}

function AiInbox({ data, onGenerate, onDismiss, notify }: {
  data: AppData
  onGenerate: (items: AIEvidence[]) => void
  onDismiss: (id: string) => void
  notify: (text: string) => void
}) {
  const selectable = data.aiEvidence.filter((item) => item.status === 'new')
  const [selected, setSelected] = useState<string[]>(() => selectable.map((item) => item.id))
  const selectedItems = selectable.filter((item) => selected.includes(item.id))

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  return (
    <div className="page ai-page">
      <PageTitle icon={<Sparkles size={24} />} title="Copiloto de obra" subtitle="Evidências organizadas para revisão humana" />
      <section className="ai-demo-banner">
        <span><Bot size={25} /></span>
        <div><strong>Demonstração local — nenhuma integração externa está ativa</strong><p>As conversas, imagens e transcrições abaixo são fictícias. A análise imita o fluxo futuro com WhatsApp Business, um modelo de IA a definir e Google Meet.</p></div>
        <StatusBadge status="warning">Simulação</StatusBadge>
      </section>

      <section className="ai-pipeline" aria-label="Fluxo do Copiloto de obra">
        <div><span><MessageCircle size={20} /></span><strong>1. Receber</strong><small>WhatsApp, fotos e Meet</small></div>
        <ChevronRight aria-hidden="true" />
        <div><span><Sparkles size={20} /></span><strong>2. Sugerir</strong><small>Resumo com fontes</small></div>
        <ChevronRight aria-hidden="true" />
        <div><span><ShieldCheck size={20} /></span><strong>3. Revisar</strong><small>Nunca publica sozinho</small></div>
        <ChevronRight aria-hidden="true" />
        <div><span><BookOpenText size={20} /></span><strong>4. Registrar</strong><small>Rascunho do Diário</small></div>
      </section>

      <div className="ai-section-heading">
        <div><span className="eyebrow">Caixa de entrada IA</span><h2>{selectable.length} nova(s) evidência(s)</h2></div>
        <span>{selectedItems.length} selecionada(s)</span>
      </div>

      <div className="ai-evidence-grid">
        {data.aiEvidence.map((item) => {
          const isSelected = selected.includes(item.id)
          return (
            <article className={`ai-evidence-card ${item.status !== 'new' ? `is-${item.status}` : ''}`} key={item.id}>
              <header>
                <span className={`ai-source-icon source-${item.source}`}><AiSourceIcon source={item.source} /></span>
                <div><span>{aiSourceLabel[item.source]}</span><strong>{item.title}</strong><small>{item.author} · {formatDate(item.receivedAt)}</small></div>
                <StatusBadge status={item.status === 'new' ? 'automatic' : item.status === 'applied' ? 'published' : 'cancelado'}>{item.status === 'new' ? 'Nova' : item.status === 'applied' ? 'No diário' : 'Descartada'}</StatusBadge>
              </header>
              <blockquote>{item.excerpt}</blockquote>
              {item.photos && item.photos.length > 0 && <div className="ai-evidence-photos">{item.photos.map((photo, index) => <PhotoPreview key={photo.id} photo={photo} label={index === 0 ? 'Foto fictícia de alvenaria em execução' : 'Foto fictícia de infraestrutura elétrica em execução'} />)}</div>}
              <div className="ai-origin"><FileText size={15} /><span>{item.context}</span><strong>{item.confidence}% confiança</strong></div>
              <details>
                <summary>Ver sugestão estruturada <ChevronDown size={17} /></summary>
                <dl>
                  <div><dt>Serviços</dt><dd>{item.suggestion.weeklyServices}</dd></div>
                  <div><dt>Ocorrências</dt><dd>{item.suggestion.occurrences}</dd></div>
                  <div><dt>Alinhamentos</dt><dd>{item.suggestion.alignments}</dd></div>
                  {item.suggestion.materialRequest && <div className="material-suggestion"><dt>Possível compra</dt><dd>{item.suggestion.materialRequest}</dd></div>}
                </dl>
              </details>
              {item.status === 'new' && <footer><button className={`ai-select-button ${isSelected ? 'selected' : ''}`} type="button" aria-pressed={isSelected} onClick={() => toggle(item.id)}>{isSelected ? <CheckCircle2 size={18} /> : <Plus size={18} />}{isSelected ? 'Selecionada' : 'Selecionar'}</button><button className="button ghost small" type="button" onClick={() => { onDismiss(item.id); setSelected((current) => current.filter((id) => id !== item.id)); notify('Evidência descartada somente nesta demonstração.') }}>Descartar</button></footer>}
            </article>
          )
        })}
      </div>

      {selectable.length > 0 ? <section className="ai-generate-bar"><div><Sparkles size={22} /><span><strong>{selectedItems.length} evidência(s) pronta(s)</strong><small>Você poderá conferir o resultado antes de publicar.</small></span></div><button className="button primary" disabled={!selectedItems.length} onClick={() => onGenerate(selectedItems)}><BookOpenText size={18} /> Gerar rascunho do Diário</button></section> : <EmptyState icon={<CheckCircle2 size={30} />} title="Caixa de entrada revisada" text="Restaure os dados da demonstração no perfil Escritório para repetir este fluxo." />}
    </div>
  )
}

function DiaryList({ user, data, navigate, openDiary }: { user: DemoUser; data: AppData; navigate: (screen: Screen) => void; openDiary: (id: string) => void }) {
  const diaries = user.role === 'client' ? data.diaries.filter((diary) => diary.status === 'published') : data.diaries
  return (
    <div className="page">
      <PageTitle icon={<BookOpenText size={24} />} title="Diário de obra" subtitle={user.role === 'client' ? 'Registros publicados da obra' : 'Histórico de registros e fotos'} />
      {user.role === 'field' && <button className="button primary wide main-cta" onClick={() => navigate('diary-form')}><Plus size={20} /> Registrar o dia</button>}
      <div className="record-list">
        {diaries.map((diary) => (
          <button type="button" className="record-card" key={diary.id} onClick={() => openDiary(diary.id)}>
            <span className="record-date"><strong>{new Date(`${diary.date}T12:00:00`).getDate()}</strong><small>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${diary.date}T12:00:00`))}</small></span>
            <span className="record-main"><strong>{diary.weeklyServices}</strong><small>{diary.createdBy} · {diary.photos.length} foto(s)</small></span>
            <StatusBadge status={diary.status}>{diaryLabel[diary.status]}</StatusBadge>
            <ChevronRight size={20} />
          </button>
        ))}
        {diaries.length === 0 && <EmptyState icon={<BookOpenText size={30} />} title="Nenhum diário disponível" text="Quando o escritório publicar um registro, ele aparecerá aqui." />}
      </div>
    </div>
  )
}

function DiaryForm({ data, user, onSave, back, notify }: { data: AppData; user: DemoUser; onSave: (entry: DiaryEntry) => void; back: () => void; notify: (text: string) => void }) {
  const [weeklyServices, setWeeklyServices] = useState('')
  const [generalLog, setGeneralLog] = useState('')
  const [occurrences, setOccurrences] = useState('')
  const [alignments, setAlignments] = useState('')
  const [photos, setPhotos] = useState<PhotoReference[]>([])
  const orders = data.purchases.filter((order) => isInCurrentWeek(order.createdAt))

  const save = (status: DiaryStatus) => {
    if (status === 'review' && (!weeklyServices.trim() || !generalLog.trim())) {
      notify('Preencha Serviços da semana e Diário geral antes de enviar.')
      return
    }
    onSave({
      id: uid('diary'),
      date: today(),
      weekLabel: weekLabelFor(new Date()),
      weeklyServices: weeklyServices.trim() || 'Serviços ainda não descritos.',
      generalLog: generalLog.trim() || 'Registro geral ainda não preenchido.',
      occurrences: occurrences.trim() || 'Nenhuma ocorrência registrada.',
      alignments: alignments.trim() || 'Nenhum alinhamento registrado.',
      photos,
      purchaseIds: orders.map((order) => order.id),
      status,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="page narrow-page">
      <PageTitle icon={<BookOpenText size={24} />} title="Registrar o dia" subtitle="Um registro claro para toda a equipe" back={back} />
      <div className="date-banner"><CalendarDays size={22} /><span><strong>{formatDate(today())}</strong><small>Semana de {weekLabelFor(new Date())}</small></span><StatusBadge status="automatic">Data automática</StatusBadge></div>
      <section className="form-section"><div className="section-number">1</div><div className="section-copy"><h2>Fotos do dia</h2><p>Registre o andamento diretamente pela câmera do celular.</p></div><DiaryPhotos photos={photos} onChange={setPhotos} notify={notify} /></section>
      <section className="form-section"><div className="section-number">2</div><div className="section-copy"><h2>Registro da semana</h2><p>Use os campos como roteiro para não esquecer informações importantes.</p></div>
        <label className="field"><span>Serviços executados na semana *</span><textarea value={weeklyServices} onChange={(event) => setWeeklyServices(event.target.value)} placeholder="Ex.: alvenaria, instalações, revestimentos e frentes concluídas..." rows={4} /></label>
        <label className="field"><span>Diário geral *</span><textarea value={generalLog} onChange={(event) => setGeneralLog(event.target.value)} placeholder="Descreva o andamento do dia, equipe e decisões tomadas..." rows={4} /></label>
        <label className="field"><span>Ocorrências</span><textarea value={occurrences} onChange={(event) => setOccurrences(event.target.value)} placeholder="Atrasos, problemas, condições diferentes do previsto..." rows={3} /></label>
        <label className="field"><span>Alinhamentos internos</span><textarea value={alignments} onChange={(event) => setAlignments(event.target.value)} placeholder="Pendências e combinações com escritório, fornecedores ou equipes..." rows={3} /></label>
      </section>
      <section className="form-section"><div className="section-number">3</div><div className="section-copy"><h2>Compras da semana</h2><p>O sistema vinculou automaticamente as solicitações encontradas.</p></div><PurchaseSummary orders={orders} /></section>
      <div className="form-actions"><button className="button secondary" onClick={() => save('draft')}>Salvar rascunho</button><button className="button primary" onClick={() => save('review')}><Send size={18} /> Enviar para revisão</button></div>
    </div>
  )
}

function DiaryDetail({ diary, data, user, back, publish }: { diary: DiaryEntry; data: AppData; user: DemoUser; back: () => void; publish: () => void }) {
  const linkedOrders = data.purchases.filter((order) => diary.purchaseIds.includes(order.id))
  const linkedEvidence = data.aiEvidence.filter((item) => diary.aiEvidenceIds?.includes(item.id))
  return (
    <div className="page narrow-page printable">
      <PageTitle icon={<BookOpenText size={24} />} title={`Diário de ${formatDate(diary.date)}`} subtitle={`Semana de ${diary.weekLabel}`} back={back} />
      <div className="detail-meta"><span><UserRound size={17} /> {diary.createdBy}</span><StatusBadge status={diary.status}>{diaryLabel[diary.status]}</StatusBadge></div>
      {user.role !== 'client' && diary.generatedByAi && <section className="ai-diary-note"><span><Sparkles size={21} /></span><div><strong>Rascunho gerado pela IA — revisão obrigatória</strong><p>Conteúdo reunido de {linkedEvidence.length} evidência(s) fictícia(s). Confira cada informação antes de publicar.</p><div>{linkedEvidence.map((item) => <span key={item.id}><AiSourceIcon source={item.source} />{aiSourceLabel[item.source]}</span>)}</div></div></section>}
      {diary.photos.length > 0 && <section className="detail-section"><h2>Fotos do dia</h2><div className="photo-grid detail-photos">{diary.photos.map((photo, index) => <PhotoPreview key={photo.id} photo={photo} label={`Foto ${index + 1} do diário`} />)}</div></section>}
      <section className="detail-section"><h2>Serviços da semana</h2><p>{diary.weeklyServices}</p></section>
      <section className="detail-section"><h2>Diário geral</h2><p>{diary.generalLog}</p></section>
      <section className="detail-section"><h2>Ocorrências</h2><p>{diary.occurrences}</p></section>
      {user.role !== 'client' && <section className="detail-section internal-section"><span className="internal-tag">Interno</span><h2>Alinhamentos</h2><p>{diary.alignments}</p></section>}
      {user.role !== 'client' && <PurchaseSummary orders={linkedOrders} />}
      {user.role === 'office' && diary.status === 'review' && <button className="button primary wide main-cta" onClick={publish}><FileCheck2 size={19} /> Revisar e publicar para o cliente</button>}
      {user.role === 'client' && <div className="published-note"><CheckCircle2 size={19} /> Conteúdo revisado e publicado pelo escritório.</div>}
    </div>
  )
}

function MaterialCard({ material, onAdd }: { material: MaterialDefinition; onAdd: (quantity: number, brand?: string) => void }) {
  const [quantity, setQuantity] = useState('1')
  const [brand, setBrand] = useState(material.brands?.[0] ?? '')
  return (
    <article className="material-card">
      <div><span className="material-category">{material.category}</span><h3>{material.name}</h3><small>Unidade: {material.unit}</small></div>
      {material.brands && <label className="mini-field"><span>Marca</span><select value={brand} onChange={(event) => setBrand(event.target.value)}>{material.brands.map((item) => <option key={item}>{item}</option>)}</select></label>}
      <div className="material-footer"><label className="quantity-field"><span>Qtd.</span><input type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><button className="button small primary" onClick={() => onAdd(Math.max(0.1, Number(quantity)), brand || undefined)}><Plus size={17} /> Adicionar</button></div>
    </article>
  )
}

interface PurchaseDraft {
  phase: string
  items: PurchaseItem[]
  neededDate: string
  location: string
  urgency: 'normal' | 'urgente'
  notes: string
}

function PurchaseWizard({ user, data, onConfirm, back, notify }: { user: DemoUser; data: AppData; onConfirm: (order: PurchaseOrder) => void; back: () => void; notify: (text: string) => void }) {
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<PurchaseDraft>({ phase: '', items: [], neededDate: '', location: '', urgency: 'normal', notes: '' })
  const phases = Array.from(new Set(MATERIALS.map((material) => material.phase)))
  const visibleMaterials = MATERIALS.filter((material) => material.phase === draft.phase && `${material.name} ${material.category}`.toLowerCase().includes(search.toLowerCase()))

  const addItem = (material: MaterialDefinition, quantity: number, brand?: string) => {
    setDraft((current) => {
      const existing = current.items.find((item) => item.materialId === material.id && item.brand === brand)
      if (existing) return { ...current, items: current.items.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + quantity } : item) }
      return { ...current, items: [...current.items, { id: uid('item'), materialId: material.id, name: material.name, phase: material.phase, category: material.category, unit: material.unit, quantity, brand }] }
    })
    notify(`${material.name} adicionado ao pedido.`)
  }

  const nextDetails = () => {
    if (!draft.items.length) return notify('Adicione pelo menos um material ao pedido.')
    setStep(3)
  }

  const nextReview = () => {
    if (!draft.neededDate || !draft.location.trim()) return notify('Informe a data necessária e o local de entrega.')
    if (draft.neededDate < today()) return notify('A data necessária não pode ser anterior a hoje.')
    setStep(4)
  }

  const confirm = () => {
    const sequence = String(data.purchases.length + 15).padStart(3, '0')
    onConfirm({ id: uid('purchase'), number: `MAT-2026-${sequence}`, items: draft.items, neededDate: draft.neededDate, location: draft.location.trim(), urgency: draft.urgency, notes: draft.notes.trim(), status: 'solicitado', createdBy: user.name, createdAt: new Date().toISOString(), pendingSync: !data.onlineSimulation })
  }

  return (
    <div className="page narrow-page purchase-wizard">
      <PageTitle icon={<ShoppingCart size={24} />} title="Pedir material" subtitle={`Etapa ${step} de 4`} back={step === 1 ? back : () => setStep((value) => value - 1)} />
      <div className="steps" aria-label={`Etapa ${step} de 4`}>{[1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? 'active' : ''}><i>{item < step ? <Check size={14} /> : item}</i><small>{['Fase', 'Materiais', 'Entrega', 'Revisão'][item - 1]}</small></span>)}</div>
      {step === 1 && <><div className="section-heading"><div><span className="eyebrow">Etapa da obra</span><h2>Qual fase está em andamento?</h2></div></div><div className="phase-grid">{phases.map((phase) => <button key={phase} className="phase-card" onClick={() => { setDraft((current) => ({ ...current, phase })); setStep(2) }}><span>{phaseIcons[phase]}</span><strong>{phase}</strong><small>{MATERIALS.filter((material) => material.phase === phase).length} materiais</small><ChevronRight size={19} /></button>)}</div></>}
      {step === 2 && <><div className="phase-heading"><span>{phaseIcons[draft.phase]}</span><div><small>Fase selecionada</small><h2>{draft.phase}</h2></div></div><label className="search-box"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar material" /></label><div className="material-list">{visibleMaterials.map((material) => <MaterialCard key={material.id} material={material} onAdd={(quantity, brand) => addItem(material, quantity, brand)} />)}</div>{draft.items.length > 0 && <button className="cart-fab" onClick={nextDetails}><ShoppingCart size={20} /><span>{draft.items.length} item(ns)</span><strong>Continuar</strong><ChevronRight size={20} /></button>}</>}
      {step === 3 && <section className="form-section plain"><div className="section-copy"><h2>Dados do pedido</h2><p>Quando e onde o material deve chegar?</p></div><label className="field"><span>Data necessária *</span><input type="date" min={today()} value={draft.neededDate} onChange={(event) => setDraft({ ...draft, neededDate: event.target.value })} /></label><label className="field"><span>Local de entrega *</span><input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Ex.: Almoxarifado, pavimento 2" /></label><fieldset className="choice-field"><legend>Urgência</legend><div><button className={draft.urgency === 'normal' ? 'choice active' : 'choice'} onClick={() => setDraft({ ...draft, urgency: 'normal' })}><CheckCircle2 /> Normal</button><button className={draft.urgency === 'urgente' ? 'choice danger active' : 'choice danger'} onClick={() => setDraft({ ...draft, urgency: 'urgente' })}><CircleAlert /> Urgente</button></div></fieldset><label className="field"><span>Observações</span><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Informações adicionais para o escritório..." rows={3} /></label><button className="button primary wide" onClick={nextReview}>Revisar pedido <ChevronRight size={19} /></button></section>}
      {step === 4 && <div className="review-layout"><section className="review-card"><span className="eyebrow">Resumo</span><h2>Revise seu pedido</h2><div className="review-items">{draft.items.map((item) => <div key={item.id}><span><strong>{item.name}</strong><small>{item.brand || item.category}</small></span><b>{item.quantity} {item.unit}</b><button onClick={() => setDraft({ ...draft, items: draft.items.filter((candidate) => candidate.id !== item.id) })} aria-label={`Remover ${item.name}`}><Trash2 size={17} /></button></div>)}</div></section><section className="review-card details"><div><CalendarDays /><span><small>Necessário em</small><strong>{formatDate(draft.neededDate)}</strong></span></div><div><MapPin /><span><small>Entrega</small><strong>{draft.location}</strong></span></div><div><CircleAlert /><span><small>Urgência</small><strong>{draft.urgency === 'urgente' ? 'Urgente' : 'Normal'}</strong></span></div>{draft.notes && <p>{draft.notes}</p>}</section>{!data.onlineSimulation && <div className="offline-note"><WifiOff size={19} /><span>Modo offline simulado: o pedido ficará marcado como aguardando sincronização.</span></div>}<button className="button primary wide" onClick={confirm}><Send size={18} /> Confirmar pedido</button></div>}
    </div>
  )
}

function PurchasesList({ user, data, navigate, openOrder, updateStatus, toggleOnline }: { user: DemoUser; data: AppData; navigate: (screen: Screen) => void; openOrder: (id: string) => void; updateStatus: (id: string, status: PurchaseStatus) => void; toggleOnline: () => void }) {
  return (
    <div className="page">
      <PageTitle icon={<ShoppingCart size={24} />} title="Compras" subtitle={user.role === 'office' ? 'Acompanhe e atualize solicitações' : 'Solicite materiais para a obra'} />
      {user.role === 'field' && <button className="button primary wide main-cta" onClick={() => navigate('purchase-new')}><Plus size={20} /> Pedir material</button>}
      <button className={data.onlineSimulation ? 'connectivity-button online' : 'connectivity-button offline'} onClick={toggleOnline}>{data.onlineSimulation ? <Wifi size={18} /> : <WifiOff size={18} />}<span><strong>{data.onlineSimulation ? 'Online' : 'Sem internet'}</strong><small>Simulação demonstrativa — toque para alterar</small></span>{!data.onlineSimulation && <StatusBadge status="warning">Offline</StatusBadge>}</button>
      <div className="record-list">
        {data.purchases.map((order) => (
          <article className="order-card" key={order.id}>
            <button className="order-main" onClick={() => openOrder(order.id)}><span><strong>{order.number}</strong><small>{formatDate(order.createdAt)} · {order.createdBy}</small></span><span className="order-count">{order.items.length}<small>itens</small></span><ChevronRight size={20} /></button>
            <div className="order-footer"><span>{order.urgency === 'urgente' && <StatusBadge status="urgent">Urgente</StatusBadge>}{order.pendingSync && <StatusBadge status="warning">Aguardando sincronização</StatusBadge>}</span>{user.role === 'office' ? <label className="status-select"><span className="sr-only">Status</span><select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value as PurchaseStatus)}>{purchaseStatuses.map((status) => <option value={status} key={status}>{purchaseLabel[status]}</option>)}</select></label> : <StatusBadge status={order.status}>{purchaseLabel[order.status]}</StatusBadge>}</div>
          </article>
        ))}
      </div>
    </div>
  )
}

function PurchaseDetail({ order, back }: { order: PurchaseOrder; back: () => void }) {
  return (
    <div className="page narrow-page">
      <PageTitle icon={<ShoppingCart size={24} />} title={order.number} subtitle={`Criado por ${order.createdBy}`} back={back} />
      <div className="detail-meta"><span><CalendarDays size={17} /> {formatDate(order.createdAt)}</span><StatusBadge status={order.status}>{purchaseLabel[order.status]}</StatusBadge></div>
      <section className="detail-section"><h2>Materiais</h2><div className="review-items">{order.items.map((item) => <div key={item.id}><span><strong>{item.name}</strong><small>{item.brand || item.category}</small></span><b>{item.quantity} {item.unit}</b></div>)}</div></section>
      <section className="detail-section details-list"><div><CalendarDays /><span><small>Data necessária</small><strong>{formatDate(order.neededDate)}</strong></span></div><div><MapPin /><span><small>Local de entrega</small><strong>{order.location}</strong></span></div><div><CircleAlert /><span><small>Urgência</small><strong>{order.urgency === 'urgente' ? 'Urgente' : 'Normal'}</strong></span></div></section>
      {order.notes && <section className="detail-section"><h2>Observações</h2><p>{order.notes}</p></section>}
      {order.pendingSync && <div className="offline-note"><WifiOff size={19} /> Aguardando sincronização — simulação local.</div>}
    </div>
  )
}

function ChecklistList({ user, data, navigate, openChecklist }: { user: DemoUser; data: AppData; navigate: (screen: Screen) => void; openChecklist: (id: string) => void }) {
  const checklists = user.role === 'client' ? data.checklists.filter((item) => item.status === 'published') : data.checklists
  return (
    <div className="page">
      <PageTitle icon={<ClipboardCheck size={24} />} title="Checklist" subtitle={user.role === 'client' ? 'Vistorias publicadas da obra' : 'Pendências, fotos e comprovações'} />
      {user.role === 'field' && <button className="button primary wide main-cta" onClick={() => navigate('checklist-new')}><Plus size={20} /> Criar checklist</button>}
      <div className="record-list">
        {checklists.map((checklist) => {
          const complete = checklist.items.filter((item) => item.completed).length
          const progress = checklist.items.length ? Math.round((complete / checklist.items.length) * 100) : 0
          return <button className="checklist-card" key={checklist.id} onClick={() => openChecklist(checklist.id)}><span className="checklist-progress" style={{ '--progress': `${progress}%` } as React.CSSProperties}><strong>{progress}%</strong></span><span className="record-main"><strong>{checklist.title}</strong><small>{checklist.environment} · {complete}/{checklist.items.length} concluídos</small><i><b style={{ width: `${progress}%` }} /></i></span><StatusBadge status={checklist.status}>{checklistLabel[checklist.status]}</StatusBadge><ChevronRight size={20} /></button>
        })}
        {checklists.length === 0 && <EmptyState icon={<ClipboardCheck size={30} />} title="Nenhum checklist disponível" text="Os checklists publicados aparecerão aqui." />}
      </div>
    </div>
  )
}

function ChecklistNew({ user, onCreate, back, notify }: { user: DemoUser; onCreate: (checklist: Checklist) => void; back: () => void; notify: (text: string) => void }) {
  const [title, setTitle] = useState('')
  const [environment, setEnvironment] = useState('')
  const create = () => {
    if (!title.trim() || !environment.trim()) return notify('Informe o nome e o ambiente do checklist.')
    onCreate({ id: uid('checklist'), title: title.trim(), environment: environment.trim(), items: [], status: 'in_progress', createdBy: user.name, createdAt: new Date().toISOString() })
  }
  return <div className="page narrow-page"><PageTitle icon={<ClipboardCheck size={24} />} title="Novo checklist" subtitle="Comece pela área que será vistoriada" back={back} /><section className="form-section plain"><label className="field"><span>Nome do checklist *</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Vistoria de entrega" autoFocus /></label><label className="field"><span>Obra ou ambiente *</span><input value={environment} onChange={(event) => setEnvironment(event.target.value)} placeholder="Ex.: Unidade 203, pavimento térreo" /></label><div className="creation-preview"><ListChecks size={28} /><div><strong>Fluxo antes e depois</strong><p>Adicione as pendências, fotografe como foram encontradas e registre a solução.</p></div></div><button className="button primary wide" onClick={create}>Criar e adicionar itens <ChevronRight size={19} /></button></section></div>
}

function SinglePhotoInput({ label, photo, disabled, onPhoto, onRemove, notify }: { label: string; photo?: PhotoReference; disabled?: boolean; onPhoto: (photo: PhotoReference) => void; onRemove: () => void; notify: (text: string) => void }) {
  const change = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try { onPhoto(await savePhoto(file)); notify(`${label} adicionada.`) } catch (error) { notify(error instanceof Error ? error.message : 'Não foi possível salvar a foto.') }
    event.target.value = ''
  }
  if (photo) return <PhotoPreview photo={photo} label={label} onRemove={onRemove} />
  return <label className={disabled ? 'photo-add compact disabled' : 'photo-add compact'}><Camera size={24} /><strong>{label}</strong><span>{disabled ? 'Conclua o item primeiro' : 'Abrir câmera'}</span><input disabled={disabled} type="file" accept="image/*" capture="environment" onChange={change} /></label>
}

function ChecklistDetail({ checklist, user, back, update, publish, notify }: { checklist: Checklist; user: DemoUser; back: () => void; update: (checklist: Checklist) => void; publish: () => void; notify: (text: string) => void }) {
  const [description, setDescription] = useState('')
  const editable = user.role === 'field' && checklist.status === 'in_progress'
  const complete = checklist.items.filter((item) => item.completed).length
  const progress = checklist.items.length ? Math.round((complete / checklist.items.length) * 100) : 0
  const ready = checklist.items.length > 0 && checklist.items.every((item) => item.completed && item.beforePhoto && item.afterPhoto)

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => update({ ...checklist, items: checklist.items.map((item) => item.id === id ? { ...item, ...patch } : item) })
  const removeItem = async (item: ChecklistItem) => {
    if (item.beforePhoto) await deletePhoto(item.beforePhoto.id)
    if (item.afterPhoto) await deletePhoto(item.afterPhoto.id)
    update({ ...checklist, items: checklist.items.filter((candidate) => candidate.id !== item.id) })
  }
  const addItem = () => {
    if (!description.trim()) return notify('Descreva a pendência antes de adicionar.')
    update({ ...checklist, items: [...checklist.items, { id: uid('check-item'), description: description.trim(), completed: false }] })
    setDescription('')
  }
  const sendReview = () => {
    if (!ready) return notify('Cada item precisa estar concluído e ter fotos de antes e depois.')
    update({ ...checklist, status: 'review' })
    notify('Checklist enviado para revisão.')
  }
  const summaryText = `${checklist.title}\n${PROJECT.name} — ${checklist.environment}\n${complete}/${checklist.items.length} itens concluídos\n\n${checklist.items.map((item, index) => `${index + 1}. ${item.description} — ${item.completed ? 'Concluído' : 'Pendente'}`).join('\n')}`
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Checklist — ${checklist.title}`, text: summaryText }); notify('Resumo compartilhado.') } catch { notify('Compartilhamento cancelado.') }
    } else {
      const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = `checklist-${checklist.id}.txt`; anchor.click(); URL.revokeObjectURL(url)
      notify('Resumo baixado como arquivo de texto.')
    }
  }

  return (
    <div className="page narrow-page printable">
      <PageTitle icon={<ClipboardCheck size={24} />} title={checklist.title} subtitle={checklist.environment} back={back} />
      <div className="checklist-hero"><div className="progress-ring"><strong>{progress}%</strong><small>concluído</small></div><div><StatusBadge status={checklist.status}>{checklistLabel[checklist.status]}</StatusBadge><p>{complete} de {checklist.items.length} itens finalizados</p><div className="progress-line"><i style={{ width: `${progress}%` }} /></div></div></div>
      {editable && <section className="add-item-box"><label className="field"><span>Nova pendência</span><input value={description} onChange={(event) => setDescription(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addItem()} placeholder="O que precisa ser verificado ou corrigido?" /></label><button className="button primary" onClick={addItem}><Plus size={18} /> Adicionar</button></section>}
      <div className="check-items">
        {checklist.items.map((item, index) => (
          <article className={item.completed ? 'check-item completed' : 'check-item'} key={item.id}>
            <div className="check-item-header"><span className="check-index">{item.completed ? <Check size={17} /> : index + 1}</span><div><strong>{item.description}</strong><small>{item.completed ? 'Serviço concluído' : 'Pendência aberta'}</small></div>{editable && <button className="icon-button small" onClick={() => removeItem(item)} aria-label="Excluir item"><Trash2 size={17} /></button>}</div>
            <div className="before-after"><div><span>Antes</span><SinglePhotoInput label="Foto antes" photo={item.beforePhoto} onPhoto={(photo) => updateItem(item.id, { beforePhoto: photo })} onRemove={async () => { if (item.beforePhoto) await deletePhoto(item.beforePhoto.id); updateItem(item.id, { beforePhoto: undefined }) }} disabled={!editable} notify={notify} /></div><div><span>Depois</span><SinglePhotoInput label="Foto depois" photo={item.afterPhoto} onPhoto={(photo) => updateItem(item.id, { afterPhoto: photo })} onRemove={async () => { if (item.afterPhoto) await deletePhoto(item.afterPhoto.id); updateItem(item.id, { afterPhoto: undefined }) }} disabled={!editable || !item.completed} notify={notify} /></div></div>
            {editable && <button className={item.completed ? 'complete-toggle active' : 'complete-toggle'} disabled={!item.beforePhoto} onClick={() => updateItem(item.id, { completed: !item.completed, afterPhoto: item.completed ? undefined : item.afterPhoto })}>{item.completed ? <><CheckCircle2 size={18} /> Marcado como concluído</> : <><Check size={18} /> Marcar serviço concluído</>}</button>}
          </article>
        ))}
        {!checklist.items.length && <EmptyState icon={<ListChecks size={30} />} title="Checklist vazio" text="Adicione a primeira pendência para começar a vistoria." />}
      </div>
      {editable && <button className="button primary wide main-cta" disabled={!ready} onClick={sendReview}><Send size={18} /> Enviar checklist para revisão</button>}
      {user.role === 'office' && checklist.status === 'review' && <button className="button primary wide main-cta" onClick={publish}><FileCheck2 size={18} /> Publicar para o cliente</button>}
      {checklist.status === 'published' && <div className="share-actions"><button className="button primary" onClick={share}><Share2 size={18} /> Compartilhar resumo</button><button className="button secondary" onClick={() => window.print()}><Printer size={18} /> Imprimir</button><button className="button ghost" onClick={share}><Download size={18} /> Baixar</button></div>}
    </div>
  )
}

function AppShell({ user, screen, navigate, logout, children }: { user: DemoUser; screen: Screen; navigate: (screen: Screen) => void; logout: () => void; children: ReactNode }) {
  const nav = user.role === 'client'
    ? [{ screen: 'home' as Screen, label: 'Início', icon: Home }, { screen: 'diaries' as Screen, label: 'Diários', icon: BookOpenText }, { screen: 'checklists' as Screen, label: 'Checklist', icon: ClipboardCheck }]
    : [{ screen: 'home' as Screen, label: 'Início', icon: Home }, { screen: 'ai-inbox' as Screen, label: 'Copiloto', icon: Sparkles }, { screen: 'diaries' as Screen, label: 'Diários', icon: BookOpenText }, { screen: 'purchases' as Screen, label: 'Compras', icon: ShoppingCart }, { screen: 'checklists' as Screen, label: 'Checklist', icon: ClipboardCheck }]
  return (
    <div className="app-shell">
      <header className="topbar"><div className="topbar-inner"><button className="brand-button" onClick={() => navigate('home')} aria-label="Ir para o início"><Logo compact /></button><div className="project-info"><strong>{PROJECT.name}</strong><small><MapPin size={13} /> {PROJECT.location} · {PROJECT.code}</small></div><span className={`role-chip role-${user.role}`}>{roleLabel[user.role]}</span><button className="logout-button" onClick={logout}><LogOut size={18} /><span>Sair</span></button></div></header>
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="Navegação principal">{nav.map((item) => { const Icon = item.icon; const active = screen === item.screen || (item.screen === 'diaries' && screen.startsWith('diary')) || (item.screen === 'purchases' && screen.startsWith('purchase')) || (item.screen === 'checklists' && screen.startsWith('checklist')); return <button key={item.screen} className={active ? 'active' : ''} onClick={() => navigate(item.screen)}><Icon size={21} /><span>{item.label}</span></button> })}</nav>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [user, setUser] = useState<DemoUser | null>(() => getSessionUser())
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedDiary, setSelectedDiary] = useState<string>()
  const [selectedOrder, setSelectedOrder] = useState<string>()
  const [selectedChecklist, setSelectedChecklist] = useState<string>()
  const [message, setMessage] = useState('')

  useEffect(() => saveData(data), [data])
  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(() => setMessage(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [message])

  const updateData = (updater: (current: AppData) => AppData) => setData((current) => updater(current))
  const navigate = (next: Screen) => { setScreen(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setUser(null); setScreen('home') }

  const resetDemo = async () => {
    resetData()
    await clearPhotos()
    window.location.reload()
  }

  if (!user) return <LoginScreen onLogin={(loggedUser) => { setUser(loggedUser); setScreen('home') }} />

  const diary = data.diaries.find((item) => item.id === selectedDiary)
  const order = data.purchases.find((item) => item.id === selectedOrder)
  const checklist = data.checklists.find((item) => item.id === selectedChecklist)
  let content: ReactNode

  if (screen === 'home') content = <><Dashboard user={user} data={data} navigate={navigate} />{user.role === 'office' && <div className="reset-wrap"><button className="button ghost" onClick={resetDemo}><RefreshCw size={17} /> Restaurar dados da demonstração</button></div>}</>
  else if (screen === 'ai-inbox' && user.role !== 'client') content = <AiInbox data={data} notify={setMessage} onDismiss={(id) => updateData((current) => ({ ...current, aiEvidence: current.aiEvidence.map((item) => item.id === id ? { ...item, status: 'dismissed' } : item) }))} onGenerate={(items) => {
    const bulletJoin = (values: string[]) => values.map((value) => `• ${value}`).join('\n')
    const materialRequests = items.flatMap((item) => item.suggestion.materialRequest ? [item.suggestion.materialRequest] : [])
    const entry: DiaryEntry = {
      id: uid('diary-ai'),
      date: today(),
      weekLabel: weekLabelFor(new Date()),
      weeklyServices: bulletJoin(items.map((item) => item.suggestion.weeklyServices)),
      generalLog: bulletJoin(items.map((item) => item.suggestion.generalLog)),
      occurrences: bulletJoin([...items.map((item) => item.suggestion.occurrences), ...(materialRequests.length ? [`Possível solicitação de material: ${materialRequests.join('; ')}.`] : [])]),
      alignments: bulletJoin(items.map((item) => item.suggestion.alignments)),
      photos: items.flatMap((item) => item.photos ?? []),
      purchaseIds: data.purchases.filter((order) => isInCurrentWeek(order.createdAt)).map((order) => order.id),
      status: 'review',
      createdBy: `${user.name} com Copiloto IA`,
      createdAt: new Date().toISOString(),
      generatedByAi: true,
      aiEvidenceIds: items.map((item) => item.id),
    }
    updateData((current) => ({ ...current, diaries: [entry, ...current.diaries], aiEvidence: current.aiEvidence.map((item) => entry.aiEvidenceIds?.includes(item.id) ? { ...item, status: 'applied' } : item) }))
    setSelectedDiary(entry.id)
    setMessage('Rascunho gerado. Revise as informações antes de publicar.')
    navigate('diary-detail')
  }} />
  else if (screen === 'diaries') content = <DiaryList user={user} data={data} navigate={navigate} openDiary={(id) => { setSelectedDiary(id); navigate('diary-detail') }} />
  else if (screen === 'diary-form' && user.role === 'field') content = <DiaryForm data={data} user={user} back={() => navigate('diaries')} notify={setMessage} onSave={(entry) => { updateData((current) => ({ ...current, diaries: [entry, ...current.diaries] })); setMessage(entry.status === 'review' ? 'Diário enviado para revisão.' : 'Rascunho salvo neste aparelho.'); navigate('diaries') }} />
  else if (screen === 'diary-detail' && diary) content = <DiaryDetail diary={diary} data={data} user={user} back={() => navigate('diaries')} publish={() => { updateData((current) => ({ ...current, diaries: current.diaries.map((item) => item.id === diary.id ? { ...item, status: 'published', publishedAt: new Date().toISOString() } : item) })); setMessage('Diário publicado para o cliente.') }} />
  else if (screen === 'purchases' && user.role !== 'client') content = <PurchasesList user={user} data={data} navigate={navigate} openOrder={(id) => { setSelectedOrder(id); navigate('purchase-detail') }} toggleOnline={() => { updateData((current) => ({ ...current, onlineSimulation: !current.onlineSimulation, purchases: !current.onlineSimulation ? current.purchases.map((item) => ({ ...item, pendingSync: false })) : current.purchases })); setMessage(data.onlineSimulation ? 'Modo offline ativado (simulação).' : 'Conectado novamente; fila simulada sincronizada.') }} updateStatus={(id, status) => { updateData((current) => ({ ...current, purchases: current.purchases.map((item) => item.id === id ? { ...item, status } : item) })); setMessage(`Status atualizado para ${purchaseLabel[status]}.`) }} />
  else if (screen === 'purchase-new' && user.role === 'field') content = <PurchaseWizard user={user} data={data} back={() => navigate('purchases')} notify={setMessage} onConfirm={(newOrder) => { updateData((current) => ({ ...current, purchases: [newOrder, ...current.purchases] })); setMessage(`Pedido ${newOrder.number} registrado${newOrder.pendingSync ? ' e aguardando sincronização simulada' : ''}.`); navigate('purchases') }} />
  else if (screen === 'purchase-detail' && order && user.role !== 'client') content = <PurchaseDetail order={order} back={() => navigate('purchases')} />
  else if (screen === 'checklists') content = <ChecklistList user={user} data={data} navigate={navigate} openChecklist={(id) => { setSelectedChecklist(id); navigate('checklist-detail') }} />
  else if (screen === 'checklist-new' && user.role === 'field') content = <ChecklistNew user={user} back={() => navigate('checklists')} notify={setMessage} onCreate={(created) => { updateData((current) => ({ ...current, checklists: [created, ...current.checklists] })); setSelectedChecklist(created.id); setMessage('Checklist criado. Adicione a primeira pendência.'); navigate('checklist-detail') }} />
  else if (screen === 'checklist-detail' && checklist) content = <ChecklistDetail checklist={checklist} user={user} back={() => navigate('checklists')} notify={setMessage} update={(updated) => updateData((current) => ({ ...current, checklists: current.checklists.map((item) => item.id === updated.id ? updated : item) }))} publish={() => { updateData((current) => ({ ...current, checklists: current.checklists.map((item) => item.id === checklist.id ? { ...item, status: 'published', publishedAt: new Date().toISOString() } : item) })); setMessage('Checklist publicado para o cliente.') }} />
  else content = <Dashboard user={user} data={data} navigate={navigate} />

  return <AppShell user={user} screen={screen} navigate={navigate} logout={logout}>{content}{message && <button className="toast" onClick={() => setMessage('')}><CheckCircle2 size={19} /> {message}</button>}</AppShell>
}
