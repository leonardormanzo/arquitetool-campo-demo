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
})
