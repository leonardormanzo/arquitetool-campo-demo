import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { SESSION_KEY, STORAGE_KEY } from './storage'

async function loginAs(role: 'Campo' | 'Escritório' | 'Cliente') {
  const user = userEvent.setup()
  const quickAccess = screen.getByText(role, { selector: '.demo-accounts strong' }).closest('button')
  expect(quickAccess).toBeTruthy()
  await user.click(quickAccess!)
  await user.click(screen.getByRole('button', { name: /entrar/i }))
  return user
}

describe('Arquitetool Campo', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  })

  afterEach(() => cleanup())

  it('oferece o Copiloto IA e os três módulos operacionais para o perfil Campo', async () => {
    render(<App />)
    await loginAs('Campo')
    expect(screen.getByText('Copiloto IA', { selector: '.action-card strong' })).toBeInTheDocument()
    expect(screen.getByText('Diário de obra', { selector: '.action-card strong' })).toBeInTheDocument()
    expect(screen.getByText('Compras', { selector: '.action-card strong' })).toBeInTheDocument()
    expect(screen.getByText('Checklist', { selector: '.action-card strong' })).toBeInTheDocument()
  })

  it('oculta Compras e conteúdo interno do perfil Cliente', async () => {
    render(<App />)
    await loginAs('Cliente')
    expect(screen.getByText('Conteúdo publicado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^compras/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copiloto/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Compras, evidências da IA, rascunhos e alinhamentos internos não aparecem/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /resumo público da obra/i })).toBeInTheDocument()
    expect(screen.getByText(/gerado somente a partir de conteúdo publicado/i)).toBeInTheDocument()
    expect(screen.queryByText('Riscos e atrasos')).not.toBeInTheDocument()
    expect(screen.queryByText('Materiais em atenção')).not.toBeInTheDocument()
    expect(screen.queryByText(/detalhamento elétrico/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/30 sacos de argamassa/i)).not.toBeInTheDocument()
  })

  it('mostra ao Escritório um resumo operacional local com fontes rastreáveis', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loginAs('Escritório')
    expect(screen.getByRole('heading', { name: /resumo IA da obra/i })).toBeInTheDocument()
    expect(screen.getByText(/nenhuma IA externa conectada/i)).toBeInTheDocument()
    expect(screen.getByText('Riscos e atrasos')).toBeInTheDocument()
    expect(screen.getByText('Materiais em atenção')).toBeInTheDocument()
    const summary = screen.getByRole('heading', { name: /resumo IA da obra/i }).closest('section')
    expect(summary).toBeTruthy()
    expect(within(summary!).getByRole('button', { name: /^Compras$/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /atualizar resumo/i }))
    expect(screen.getByText(/atualizado às/i)).toBeInTheDocument()
  })

  it('gera um rascunho rastreável a partir das evidências simuladas', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loginAs('Campo')
    await user.click(screen.getByText('Copiloto IA', { selector: '.action-card strong' }).closest('button')!)
    expect(screen.getByText(/nenhuma integração externa está ativa/i)).toBeInTheDocument()
    expect(screen.getByText('WhatsApp', { selector: '.ai-evidence-card header > div > span' })).toBeInTheDocument()
    expect(screen.getByText('Google Meet', { selector: '.ai-evidence-card header > div > span' })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /foto fictícia de alvenaria/i })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /foto fictícia de infraestrutura elétrica/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /gerar rascunho do diário/i }))
    expect(screen.getByText(/rascunho gerado pela IA — revisão obrigatória/i)).toBeInTheDocument()
    expect(screen.getByText(/possível solicitação de material/i)).toBeInTheDocument()
    expect(screen.getByText('Em revisão')).toBeInTheDocument()
    expect(await screen.findAllByRole('img', { name: /foto \d do diário/i })).toHaveLength(2)
  })

  it('permite ao Escritório publicar um diário e disponibilizá-lo ao Cliente', async () => {
    const user = userEvent.setup()
    const view = render(<App />)
    await loginAs('Escritório')
    const diaryAction = screen.getByText('Diários', { selector: '.action-card strong' }).closest('button')
    expect(diaryAction).toBeTruthy()
    await user.click(diaryAction!)
    const pending = screen.getByText(/Início da infraestrutura elétrica/i).closest('button')
    expect(pending).toBeTruthy()
    await user.click(pending!)
    await user.click(screen.getByRole('button', { name: /revisar e publicar/i }))
    expect(screen.getByText('Publicado')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sair/i }))
    await loginAs('Cliente')
    const clientNav = screen.getByRole('navigation', { name: /navegação principal/i })
    await user.click(within(clientNav).getByRole('button', { name: /diários/i }))
    expect(screen.getByText(/Início da infraestrutura elétrica/i)).toBeInTheDocument()
    view.unmount()
  })

  it('deixa a criação da vistoria e dos modelos exclusivamente com o Escritório', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loginAs('Campo')
    await user.click(screen.getByText('Checklist', { selector: '.action-card strong' }).closest('button')!)
    expect(screen.queryByRole('button', { name: /nova vistoria/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /gerenciar modelos/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /sair/i }))
    await loginAs('Escritório')
    await user.click(screen.getByText('Checklist', { selector: '.action-card strong' }).closest('button')!)
    expect(screen.getByRole('button', { name: /nova vistoria/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gerenciar modelos/i })).toBeInTheDocument()
  })

  it('permite ao Escritório preencher e publicar uma vistoria criada sem modelo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loginAs('Escritório')
    await user.click(screen.getByText('Checklist', { selector: '.action-card strong' }).closest('button')!)
    await user.click(screen.getByRole('button', { name: /nova vistoria/i }))
    await user.type(screen.getByLabelText(/nome da vistoria/i), 'Vistoria técnica demonstrativa')
    await user.type(screen.getByLabelText(/^ambiente/i), 'Unidade 202')
    await user.click(screen.getByRole('button', { name: /criar e preencher/i }))
    await user.type(screen.getByPlaceholderText(/o que deve ser verificado/i), 'Conferir acabamento da bancada')
    await user.click(screen.getByRole('button', { name: /^adicionar$/i }))
    await user.selectOptions(screen.getByLabelText(/resultado do item 1/i), 'conform')
    await user.click(screen.getByRole('button', { name: /revisar e publicar/i }))
    expect(screen.getByText(/publicado como versão 1/i)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/resultado do item 1/i), 'not_verified')
    await user.click(screen.getByRole('button', { name: /publicar nova versão/i }))
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    const savedChecklist = saved.checklists.find((item: { title: string }) => item.title === 'Vistoria técnica demonstrativa')
    expect(savedChecklist.publications).toHaveLength(2)
    expect(savedChecklist.publications[0].items[0].answer).toBe('conform')
    expect(savedChecklist.publications[1].items[0].answer).toBe('not_verified')
    await user.click(screen.getByRole('button', { name: /sair/i }))
    await loginAs('Cliente')
    const nav = screen.getByRole('navigation', { name: /navegação principal/i })
    await user.click(within(nav).getByRole('button', { name: /checklist/i }))
    expect(screen.getByText('Vistoria técnica demonstrativa')).toBeInTheDocument()
  })

  it('publica a não conformidade para o Cliente sem expor a nota interna', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loginAs('Cliente')
    const nav = screen.getByRole('navigation', { name: /navegação principal/i })
    await user.click(within(nav).getByRole('button', { name: /checklist/i }))
    await user.click(screen.getByText('Vistoria do apartamento modelo').closest('button')!)
    expect(screen.getAllByText('Não conforme').length).toBeGreaterThan(0)
    expect(screen.getByText('Tomada da bancada requer realinhamento.')).toBeInTheDocument()
    expect(screen.getByText('Equipe elétrica')).toBeInTheDocument()
    expect(screen.queryByText(/compatibilização antes de fechar/i)).not.toBeInTheDocument()
  })

  it('permite ao Campo enviar uma correção e reserva a validação ao Escritório', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loginAs('Campo')
    await user.click(screen.getByText('Checklist', { selector: '.action-card strong' }).closest('button')!)
    await user.click(screen.getByText('Conferência de alvenaria').closest('button')!)
    expect(screen.getByRole('button', { name: /enviar correção para validação/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /validar correção/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /enviar correção para validação/i }))
    await user.click(screen.getByRole('button', { name: /sair/i }))
    await loginAs('Escritório')
    await user.click(screen.getByText('Checklist', { selector: '.action-card strong' }).closest('button')!)
    await user.click(screen.getByText('Conferência de alvenaria').closest('button')!)
    await user.click(screen.getByRole('button', { name: /validar correção/i }))
    expect(screen.getByText('Resolvida')).toBeInTheDocument()
  })

  it('migra checklists da versão anterior sem apagar o registro publicado', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      onlineSimulation: true,
      diaries: [],
      purchases: [],
      aiEvidence: [],
      checklists: [{ id: 'legacy-1', title: 'Checklist legado', environment: 'Unidade 9', status: 'published', createdBy: 'Equipe', createdAt: '2026-08-01T12:00:00.000Z', publishedAt: '2026-08-02T12:00:00.000Z', items: [{ id: 'legacy-item', description: 'Item concluído anteriormente', completed: true }] }],
    }))
    const user = userEvent.setup()
    render(<App />)
    await loginAs('Cliente')
    const nav = screen.getByRole('navigation', { name: /navegação principal/i })
    await user.click(within(nav).getByRole('button', { name: /checklist/i }))
    expect(screen.getByText('Checklist legado')).toBeInTheDocument()
  })
})
