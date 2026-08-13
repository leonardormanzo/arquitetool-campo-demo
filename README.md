# Arquitetool Campo — demonstração standalone

Demonstração funcional e responsiva que reúne **Copiloto IA**, **Diário de
Obra**, **Compras** e **Checklist** em uma única experiência. A identidade usa o
logo fornecido e o laranja oficial extraído dele (`#B95B41`).

O arquivo `index.html` é autocontido: CSS, JavaScript, fontes e logo estão
incorporados e ele pode ser aberto diretamente por duplo clique, sem servidor e
sem conexão com a internet.

## Acessos de demonstração

| Perfil | E-mail | Senha | Permissões |
| --- | --- | --- | --- |
| Campo | `campo@demo.arquitetool` | `campo123` | Revisa evidências da demonstração e cria Diários, pedidos e Checklists |
| Escritório | `escritorio@demo.arquitetool` | `escritorio123` | Revisa evidências, publica conteúdo e atualiza Compras |
| Cliente | `cliente@demo.arquitetool` | `cliente123` | Vê somente Diários e Checklists publicados |

Os acessos são fictícios e servem apenas para demonstrar visibilidade por
perfil. Eles **não representam autenticação ou segurança real**.

## Fluxos disponíveis

### Copiloto IA — demonstração simulada

O módulo **Copiloto IA** demonstra como evidências recebidas de diferentes
canais poderiam ser organizadas antes de entrar no Diário. Ele está disponível
para Campo e Escritório e não aparece para o Cliente.

- Caixa de entrada com três evidências totalmente fictícias:
  - análise visual de duas fotos sintéticas recebidas pelo WhatsApp da obra;
  - trecho de conversa com uma possível solicitação de material;
  - resumo de uma transcrição de reunião do Google Meet.
- Exibição da origem, autor, horário, contexto e confiança simulada.
- Sugestões estruturadas para Serviços, Diário geral, Ocorrências, Alinhamentos
  e possível Compra.
- Seleção ou descarte individual das evidências.
- Ação **Gerar rascunho do Diário**, que combina as sugestões e preserva os IDs
  das evidências utilizadas.
- O resultado sempre nasce como **Em revisão** e mostra o aviso “Rascunho
  gerado pela IA — revisão obrigatória”.
- Nenhuma sugestão é publicada automaticamente, e as fontes internas não são
  exibidas ao Cliente.

As duas fotos demonstrativas — alvenaria e infraestrutura elétrica — foram
geradas especificamente para esta obra fictícia, não mostram pessoas nem
pertencem a uma obra real. Elas ficam em `source/src/assets/`, são incorporadas
ao `index.html` durante o build e também acompanham o Diário criado pelo
Copiloto.

Todo processamento desta tela é determinístico e local. Não há leitura real de
WhatsApp, envio de fotos a terceiros, acesso ao Google Meet ou chamada a um
modelo de IA.

### Diário de Obra

- Data e semana preenchidas automaticamente.
- Até seis fotos do dia, usando câmera ou galeria do celular.
- Campos para Serviços da semana, Diário geral, Ocorrências e Alinhamentos.
- Identificação automática das solicitações de material feitas na mesma semana.
- Estados: Rascunho → Em revisão → Publicado.
- O Cliente não vê Compras nem Alinhamentos internos.

### Compras

- Seleção da fase da obra.
- Catálogo pesquisável com categoria, unidade e marcas de referência.
- Quantidade, data necessária, local de entrega, urgência e observações.
- Revisão antes da confirmação e histórico dos pedidos.
- Atualização de status pelo Escritório: Solicitado, Em aprovação, Comprado,
  Entregue e Cancelado.
- Modo offline apenas demonstrativo, claramente identificado na interface.

### Checklist

- Checklist por ambiente e cadastro de pendências.
- Foto de “antes”, marcação de conclusão e foto de “depois”.
- Comparativo visual, progresso e envio para revisão.
- Publicação controlada para o Cliente.
- Compartilhamento nativo quando disponível; download de resumo e impressão
  como alternativas.

## Persistência local

- Os registros estruturados ficam em `localStorage`, na chave
  `arquitetool-campo-demo-v2`.
- As imagens são reduzidas para no máximo 1280 px, convertidas para JPEG e
  guardadas em IndexedDB (`arquitetool-campo-photos-v1`).
- Os dados permanecem apenas no navegador e aparelho em que foram criados.
- O perfil Escritório possui a ação “Restaurar dados da demonstração”, que
  apaga registros e fotos locais e recria o cenário inicial fictício.

## Código-fonte e build

O projeto-fonte está em `source/` e usa React 18, TypeScript, Vite, CSS puro e
ícones Lucide. O build standalone é gerado por `vite-plugin-singlefile`.

```powershell
npm install
npm run dev
npm run lint
npm test
npm run build
```

`npm run build` valida o TypeScript, cria `dist/index.html` e copia o resultado
final para `index.html` na raiz desta pasta.

## Modelos e integração futura

Os tipos principais estão em `source/src/types.ts`:

- `Role`: Campo, Escritório ou Cliente.
- `DiaryEntry`: registro, fotos, Compras vinculadas e publicação.
- `AIEvidence` / `AIDiarySuggestion`: evidência simulada, origem, confiança,
  campos sugeridos e vínculo com o Diário.
- `PurchaseOrder`: materiais, entrega, urgência e status.
- `Checklist` / `ChecklistItem`: pendências, antes/depois e publicação.
- `PhotoReference`: referência para a imagem mantida no banco local.

Para integrar ao sistema real, substitua `storage.ts` por chamadas autenticadas
à API e `photoStore.ts` por upload seguro de arquivos. A filtragem atual de
conteúdo por perfil é uma regra de interface; em produção ela também precisa ser
obrigatoriamente aplicada no servidor.

### Arquitetura futura do Copiloto

A escolha do modelo de IA foi deliberadamente deixada em aberto. A implementação
de produção deve usar uma interface como `AIProvider`, para permitir a troca do
provedor sem alterar o Diário, a Caixa de entrada ou as regras de publicação.
Anthropic, Google e outros fornecedores são opções a avaliar posteriormente —
nenhum deles foi escolhido por esta demonstração.

Critérios recomendados para essa decisão:

- qualidade em português e na interpretação de imagens de obra;
- saída estruturada e validação por esquema;
- política de retenção e uso dos dados enviados;
- suporte contratual, região de processamento e requisitos de LGPD;
- custo, latência, limites de arquivos e observabilidade;
- facilidade para trocar o modelo e executar testes comparativos.

O fluxo de produção exigirá, no mínimo:

1. WhatsApp Business oficial enviando mensagens e IDs de mídia a um webhook
   HTTPS; o sistema não deve tentar ler conversas pessoais.
2. OAuth e permissões do Google Workspace para buscar transcrições autorizadas
   do Meet quando elas existirem.
3. Backend para autenticação, armazenamento, antivírus, filas e chamadas ao
   modelo escolhido. Tokens e chaves nunca devem ficar no HTML standalone.
4. Registro de proveniência ligando cada afirmação à mensagem, foto ou trecho
   da reunião que a originou.
5. Revisão humana obrigatória, trilha de auditoria, controle de acesso, política
   de retenção e tratamento adequado dos dados pessoais.

## Limites desta versão

Esta entrega é uma **demonstração comercial funcional**, não um SaaS pronto para
produção. Não há backend, banco compartilhado, autenticação real, recuperação
de senha, WhatsApp conectado, Google Meet conectado, modelo de IA, sincronização
entre aparelhos, antivírus para arquivos, trilha de auditoria, assinatura
digital ou notificações. O modo offline não transmite dados quando a conexão
retorna; ele simula a experiência e o estado visual.

Obra, pessoas, pedidos e registros incluídos são fictícios e apropriados para
demonstração: **Residencial Aurora — DEMO-2026-001 — São Paulo/SP**.
