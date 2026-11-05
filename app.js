// ====================================================
// 1. DIMENSÕES CONFIGURÁVEIS DO ARMÁRIO
// ====================================================
const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let totalLinhasAtuais = 4;
let totalColunasAtuais = 4;

function carregarDimensoes() {
  const salvos = localStorage.getItem('davisory_estoque_dimensoes');
  if (salvos) {
    try {
      const parsed = JSON.parse(salvos);
      if (parsed.linhas) totalLinhasAtuais = parsed.linhas;
      if (parsed.colunas) totalColunasAtuais = parsed.colunas;
    } catch(e) {}
  }
  atualizarLabelsDimensoes();
}

function salvarDimensoes() {
  localStorage.setItem('davisory_estoque_dimensoes', JSON.stringify({
    linhas: totalLinhasAtuais,
    colunas: totalColunasAtuais
  }));
  atualizarLabelsDimensoes();
}

function atualizarLabelsDimensoes() {
  const lLinhas = document.getElementById('labelTotalLinhas');
  const lColunas = document.getElementById('labelTotalColunas');
  if (lLinhas) lLinhas.innerText = totalLinhasAtuais;
  if (lColunas) lColunas.innerText = totalColunasAtuais;
}

function obterLinhasArray() {
  return alfabeto.slice(0, totalLinhasAtuais);
}

function obterColunasArray() {
  const cols = [];
  for (let i = 1; i <= totalColunasAtuais; i++) cols.push(i);
  return cols;
}

function alterarTamanhoGrade(deltaLinhas, deltaColunas) {
  const novaLinha = totalLinhasAtuais + deltaLinhas;
  const novaColuna = totalColunasAtuais + deltaColunas;

  if (novaLinha < 2 || novaLinha > 26) {
    alert("O armário deve ter entre 2 e 26 linhas.");
    return;
  }
  if (novaColuna < 2 || novaColuna > 12) {
    alert("O armário deve ter entre 2 e 12 colunas.");
    return;
  }

  totalLinhasAtuais = novaLinha;
  totalColunasAtuais = novaColuna;
  salvarDimensoes();

  gerarCoordenadasPadrao();
  popularSelectsEstoque();
  renderizarTabuleiroNaval();
}

function gerarCoordenadasPadrao() {
  const coords = [];
  const linhas = obterLinhasArray();
  const colunas = obterColunasArray();
  linhas.forEach(l => {
    colunas.forEach(c => {
      coords.push(`${l}${c}`);
    });
  });
  const attrs = obterAtributos();
  attrs.locais = coords;
  salvarAtributosNoStorage(attrs);
}

// ====================================================
// 2. ATRIBUTOS (CATEGORIAS E GAVETAS)
// ====================================================
const atributosIniciais = {
  categorias: ["Inox", "Dourada", "Preto Fosco", "Cromada", "Bronze", "Aço Escovado"],
  locais: [
    "A1", "A2", "A3", "A4",
    "B1", "B2", "B3", "B4",
    "C1", "C2", "C3", "C4",
    "D1", "D2", "D3", "D4"
  ]
};

function obterAtributos() {
  const salvos = localStorage.getItem('davisory_estoque_atributos_v3');
  if (!salvos) {
    localStorage.setItem('davisory_estoque_atributos_v3', JSON.stringify(atributosIniciais));
    return atributosIniciais;
  }
  return JSON.parse(salvos);
}

function salvarAtributosNoStorage(attr) {
  localStorage.setItem('davisory_estoque_atributos_v3', JSON.stringify(attr));
}

let atributoAtualSendoEditado = null;

function abrirModalGerenciarAtributo(tipo) {
  atributoAtualSendoEditado = tipo;
  const titulos = {
    categorias: 'Gerenciar Categorias de Produtos',
    locais: 'Gerenciar Coordenadas de Gavetas'
  };
  document.getElementById('modalAttrTitulo').innerText = titulos[tipo] || 'Gerenciar Atributo';
  document.getElementById('novoAttrValor').value = '';
  renderizarListaAtributosModal();
  document.getElementById('modalGerenciarAtributo').style.display = 'flex';
}

function fecharModalAtributo() {
  document.getElementById('modalGerenciarAtributo').style.display = 'none';
  atributoAtualSendoEditado = null;
}

function renderizarListaAtributosModal() {
  const container = document.getElementById('listaAtributosContainer');
  container.innerHTML = '';
  const attrs = obterAtributos();
  const lista = attrs[atributoAtualSendoEditado] || [];

  if (lista.length === 0) {
    container.innerHTML = '<div style="color:#94a3b8; font-size:13px; padding:10px;">Nenhuma opção cadastrada.</div>';
    return;
  }

  lista.forEach((item, index) => {
    const row = document.createElement('div');
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.padding = "8px 12px";
    row.style.background = "#f8fafc";
    row.style.borderRadius = "6px";
    row.style.marginBottom = "6px";
    row.innerHTML = `
      <span><strong>${item}</strong></span>
      <button class="btn-remove-attr" title="Remover" onclick="removerValorAtributo(${index})">&times;</button>
    `;
    container.appendChild(row);
  });
}

function adicionarValorAtributo() {
  const input = document.getElementById('novoAttrValor');
  const valor = input.value.trim();
  if (!valor) return;

  const attrs = obterAtributos();
  if (!attrs[atributoAtualSendoEditado]) attrs[atributoAtualSendoEditado] = [];

  if (attrs[atributoAtualSendoEditado].includes(valor)) {
    alert("Essa opção já existe!");
    return;
  }

  attrs[atributoAtualSendoEditado].push(valor);
  salvarAtributosNoStorage(attrs);
  input.value = '';
  renderizarListaAtributosModal();
  popularSelectsEstoque();
  renderizarTabuleiroNaval();
}

function removerValorAtributo(index) {
  const attrs = obterAtributos();
  const itemRemovido = attrs[atributoAtualSendoEditado][index];
  if (!confirm(`Deseja remover "${itemRemovido}"?`)) return;

  attrs[atributoAtualSendoEditado].splice(index, 1);
  salvarAtributosNoStorage(attrs);
  renderizarListaAtributosModal();
  popularSelectsEstoque();
  renderizarTabuleiroNaval();
}

function popularSelectsEstoque() {
  const attrs = obterAtributos();
  
  const preencher = (elId, lista, prefixo = '') => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = '';
    (lista || []).forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.innerText = prefixo ? `${prefixo} ${val}` : val;
      el.appendChild(opt);
    });
  };

  preencher('prodCategoria', attrs.categorias);
  preencher('prodLocal', attrs.locais, 'Gaveta');
  preencher('varCategoria', attrs.categorias);
}

// ====================================================
// 3. DEPARTAMENTOS
// ====================================================
const departamentosIniciais = [
  {
    id: "DEP-TI",
    nome: "TI & Sistemas",
    permissoes: {
      pedidos_criar: true,
      pedidos_atender: true,
      estoque_gerenciar: true,
      vendas_operar: true,
      chat_acessar: true,
      admin_ti: true
    }
  },
  {
    id: "DEP-OPERACAO",
    nome: "Operações & Vendas",
    permissoes: {
      pedidos_criar: true,
      pedidos_atender: false,
      estoque_gerenciar: false,
      vendas_operar: true,
      chat_acessar: true,
      admin_ti: false
    }
  }
];

function obterDepartamentos() {
  const salvos = localStorage.getItem('davisory_departamentos');
  if (!salvos) {
    localStorage.setItem('davisory_departamentos', JSON.stringify(departamentosIniciais));
    return departamentosIniciais;
  }
  let lista = JSON.parse(salvos);
  lista.forEach(d => {
    if (!d.permissoes) {
      d.permissoes = d.id === 'DEP-TI'
        ? { pedidos_criar: true, pedidos_atender: true, estoque_gerenciar: true, vendas_operar: true, chat_acessar: true, admin_ti: true }
        : { pedidos_criar: true, pedidos_atender: false, estoque_gerenciar: false, vendas_operar: true, chat_acessar: true, admin_ti: false };
    }
  });
  return lista;
}

function salvarDepartamentosNoStorage(lista) {
  localStorage.setItem('davisory_departamentos', JSON.stringify(lista));
}

// ====================================================
// 4. BASE DE PRODUTOS
// ====================================================
const estoqueInicialComVariantes = [
  {
    id: "EST-01",
    sku: "MOD-101",
    nome: "Mod. 101",
    local: "A1",
    qtdMin: 6,
    categorias: [
      { id: "C1", nome: "Inox", qtd: 10 },
      { id: "C2", nome: "Dourada", qtd: 5 }
    ]
  },
  {
    id: "EST-02",
    sku: "MOD-202",
    nome: "Mod. 202",
    local: "A2",
    qtdMin: 4,
    categorias: [
      { id: "C3", nome: "Preto Fosco", qtd: 6 },
      { id: "C4", nome: "Cromada", qtd: 2 }
    ]
  }
];

function calcularTotalProduto(prod) {
  if (!prod.categorias || prod.categorias.length === 0) return 0;
  return prod.categorias.reduce((soma, c) => soma + (parseInt(c.qtd) || 0), 0);
}

function obterEstoque() {
  const salvos = localStorage.getItem('davisory_estoque_cat_v3');
  if (!salvos) {
    localStorage.setItem('davisory_estoque_cat_v3', JSON.stringify(estoqueInicialComVariantes));
    return estoqueInicialComVariantes;
  }
  return JSON.parse(salvos);
}

function salvarEstoqueNoStorage(lista) {
  localStorage.setItem('davisory_estoque_cat_v3', JSON.stringify(lista));
}

// ====================================================
// 5. BASE DE VENDAS
// ====================================================
const vendasIniciais = [
  {
    id: "VEN-1001",
    data: "27/10/2026",
    hora: "11:20",
    empresa: "Ótica Bella Vista",
    dono: "Marcos Vinicius",
    representante: "Lucas Silveira",
    status: "Concluída",
    totalPecas: 5,
    valorTotal: 1450.00,
    itens: [
      {
        id: "ITEM-1",
        modelo: "Mod. 101",
        local: "A1",
        categoria: "Inox",
        qtd: 3,
        precoUnit: 290.00,
        subtotal: 870.00,
        conferido: true,
        distribuicao: [
          { modelo: "Mod. 101", local: "A1", qtd: 3, conferido: true }
        ]
      },
      {
        id: "ITEM-2",
        modelo: "Mod. 101",
        local: "A1",
        categoria: "Dourada",
        qtd: 2,
        precoUnit: 290.00,
        subtotal: 580.00,
        conferido: true,
        distribuicao: [
          { modelo: "Mod. 101", local: "A1", qtd: 2, conferido: true }
        ]
      }
    ]
  }
];

function obterVendas() {
  const salvos = localStorage.getItem('davisory_vendas_v1');
  if (!salvos) {
    localStorage.setItem('davisory_vendas_v1', JSON.stringify(vendasIniciais));
    return vendasIniciais;
  }
  return JSON.parse(salvos);
}

function salvarVendasNoStorage(lista) {
  localStorage.setItem('davisory_vendas_v1', JSON.stringify(lista));
}

// ====================================================
// 6. BASE DE SOLICITAÇÕES INTERNAS
// ====================================================
const pedidosIniciais = [
  { id: "SOL-101", titulo: "Troca Mod. 101 Inox", desc: "Reposição emergencial gaveta A1", solicitante: "Lucas Silveira", canal: "#operacoes", prioridade: "Média", status: "Pendente", data: "26/10/2026", resposta: null, respondidoPor: null, respondidoEm: null },
  { id: "SOL-102", titulo: "Aquisição Mod. 202 Dourada", desc: "Pedido especial setor de vendas", solicitante: "Lucas Silveira", canal: "#operacoes", prioridade: "Alta", status: "Em Andamento", data: "26/10/2026", resposta: null, respondidoPor: null, respondidoEm: null }
];

function obterPedidos() {
  const salvos = localStorage.getItem('davisory_pedidos_v1');
  if (!salvos) {
    localStorage.setItem('davisory_pedidos_v1', JSON.stringify(pedidosIniciais));
    return pedidosIniciais;
  }
  return JSON.parse(salvos);
}

function salvarPedidosNoStorage(lista) {
  localStorage.setItem('davisory_pedidos_v1', JSON.stringify(lista));
}

// ====================================================
// 7. BASE DE MOVIMENTAÇÕES DE ESTOQUE
// ====================================================
const movimentacoesIniciais = [
  {
    id: "MOV-1001",
    data: "26/10/2026",
    hora: "09:30",
    responsavel: "Camila Rocha",
    departamento: "TI & Sistemas",
    tipoGeral: "Entrada",
    motivo: "Recebimento Fornecedor Lote Inicial",
    docRef: "NF-9412",
    itens: [
      { modelo: "Mod. 101", local: "A1", categoria: "Inox", tipo: "Entrada", qtd: 10 },
      { modelo: "Mod. 101", local: "A1", categoria: "Dourada", tipo: "Entrada", qtd: 5 }
    ]
  }
];

function obterMovimentacoes() {
  const salvos = localStorage.getItem('davisory_movimentacoes_v1');
  if (!salvos) {
    localStorage.setItem('davisory_movimentacoes_v1', JSON.stringify(movimentacoesIniciais));
    return movimentacoesIniciais;
  }
  return JSON.parse(salvos);
}

function salvarMovimentacoesNoStorage(lista) {
  localStorage.setItem('davisory_movimentacoes_v1', JSON.stringify(lista));
}

// ====================================================
// 8. BASE DE USUÁRIOS
// ====================================================
const usuariosIniciais = [
  { nome: "Camila Rocha", email: "admin@davisory.com", senha: "admin", deptoId: "DEP-TI", cargo: "Coordenadora TI" },
  { nome: "Lucas Silveira", email: "colaborador@davisory.com", senha: "123", deptoId: "DEP-OPERACAO", cargo: "Assistente Operacional" }
];

function obterUsuarios() {
  const salvos = localStorage.getItem('davisory_usuarios');
  if (!salvos) {
    localStorage.setItem('davisory_usuarios', JSON.stringify(usuariosIniciais));
    return usuariosIniciais;
  }
  return JSON.parse(salvos);
}

// ====================================================
// 9. ESTADOS GLOBAIS & CHAT
// ====================================================
let usuarioLogado = null;
let filtroStatusVendaAtual = 'todos';
let filtroEstoqueAtual = 'todos';
let filtroPedidosAtual = 'ativos';
let filtroMovAtual = 'todas';
let modoVisaoEstoque = 'naval';
let vendaSendoPreparada = null;
let movAtualDocumento = null;

let currentChannel = '#geral';
const chatDB = {
  '#geral': [
    { sender: 'Camila Rocha', text: 'Bem-vindo ao canal geral da Davisory!', time: '08:00' }
  ],
  '#operacoes': [
    { sender: 'Lucas Silveira', text: 'Equipe de separação pronta.', time: '08:15' }
  ],
  '#ti-suporte': [
    { sender: 'TI Suporte', text: 'Chamados e acessos abertos.', time: '08:30' }
  ]
};

// ====================================================
// 10. AUTENTICAÇÃO E LOGIN RÁPIDO
// ====================================================
function alternarTelaAuth(tela) {
  document.getElementById('tabBtnLogin')?.classList.toggle('active', tela === 'login');
  document.getElementById('tabBtnCadastro')?.classList.toggle('active', tela === 'cadastro');
  const fLogin = document.getElementById('formLogin');
  const fCad = document.getElementById('formCadastro');
  if (fLogin) fLogin.style.display = (tela === 'login') ? 'block' : 'none';
  if (fCad) fCad.style.display = (tela === 'cadastro') ? 'block' : 'none';
  if (tela === 'cadastro') atualizarSelectDepartamentosCadastro();
}

function atualizarSelectDepartamentosCadastro() {
  const select = document.getElementById('cadDepto');
  if (!select) return;
  select.innerHTML = '';
  obterDepartamentos().forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.innerText = d.nome;
    select.appendChild(opt);
  });
}

function fillLogin(email, pass) {
  alternarTelaAuth('login');
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPass');
  if (emailInput && passInput) {
    emailInput.value = email;
    passInput.value = pass;
    emailInput.focus();
  }
}

function handleLogin(e) {
  if (e) e.preventDefault();

  const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
  const senha = (document.getElementById('loginPass')?.value || '').trim();

  if (!email || !senha) {
    alert("Por favor, preencha o e-mail e a senha.");
    return;
  }

  let lista = obterUsuarios();
  if (!lista || lista.length === 0) {
    lista = usuariosIniciais;
    localStorage.setItem('davisory_usuarios', JSON.stringify(lista));
  }

  const user = lista.find(u => String(u.email).toLowerCase().trim() === email && String(u.senha).trim() === senha);

  if (!user) {
    alert("E-mail ou senha inválidos. Utilize os botões de contas de teste abaixo.");
    return;
  }

  logarUsuario(user);
}

function handleCadastro(e) {
  if (e) e.preventDefault();
  const nome = document.getElementById('cadNome')?.value.trim();
  const email = document.getElementById('cadEmail')?.value.trim().toLowerCase();
  const deptoId = document.getElementById('cadDepto')?.value;
  const cargo = document.getElementById('cadCargo')?.value.trim();
  const senha = document.getElementById('cadSenha')?.value;

  if (!nome || !email || !senha) {
    alert("Preencha todos os campos.");
    return;
  }

  const lista = obterUsuarios();
  if (lista.some(u => u.email === email)) {
    alert("Este e-mail já existe.");
    return;
  }

  const novo = { nome, email, senha, deptoId, cargo };
  lista.push(novo);
  localStorage.setItem('davisory_usuarios', JSON.stringify(lista));
  alert(`Conta criada com sucesso!`);
  logarUsuario(novo);
}

function logarUsuario(user) {
  usuarioLogado = user;
  const iniciais = (user.nome.slice(0, 2)).toUpperCase();

  const headerAvatar = document.getElementById('headerAvatar');
  const headerName = document.getElementById('headerName');
  const headerRole = document.getElementById('headerRole');

  if (headerAvatar) headerAvatar.innerText = iniciais;
  if (headerName) headerName.innerText = user.nome;
  if (headerRole) headerRole.innerText = user.cargo;

  const repInput = document.getElementById('vendaRepresentante');
  if (repInput) repInput.value = user.nome;

  carregarDimensoes();
  popularSelectsEstoque();

  // Oculta autenticação e revela o portal
  const authScreen = document.getElementById('auth-screen');
  const appContainer = document.getElementById('app-container');

  if (authScreen) authScreen.style.setProperty('display', 'none', 'important');
  if (appContainer) appContainer.style.setProperty('display', 'flex', 'important');

  renderizarEstoque();
  renderizarTabuleiroNaval();
  renderizarTabelaVendas();
  renderChatMessages();
  
  // Atualiza status do usuário logado para Online
  const mapaStatus = obterStatusUsuarios();
  mapaStatus[user.email] = mapaStatus[user.email] === 'descanso' ? 'descanso' : 'online';
  salvarStatusUsuarios(mapaStatus);
  renderizarListaUsuariosChat();
  renderizarPedidos();
  renderizarTabelaMovimentacoes();

  const containerItensVenda = document.getElementById('containerItensVenda');
  if (containerItensVenda && containerItensVenda.children.length === 0) {
    adicionarLinhaItemVenda();
  }
}

function handleLogout() {
  if (usuarioLogado) {
    const mapaStatus = obterStatusUsuarios();
    mapaStatus[usuarioLogado.email] = 'offline';
    salvarStatusUsuarios(mapaStatus);
  }
  usuarioLogado = null;
  const authScreen = document.getElementById('auth-screen');
  const appContainer = document.getElementById('app-container');

  if (appContainer) appContainer.style.setProperty('display', 'none', 'important');
  if (authScreen) authScreen.style.setProperty('display', 'flex', 'important');
  alternarTelaAuth('login');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.nav-top-btn').forEach(b => b.classList.remove('active'));

  const alvo = document.getElementById(`tab-${tabId}`);
  if (alvo) alvo.classList.add('active');

  const navItem = document.getElementById(`navItem${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (navItem) navItem.classList.add('active');

  if (tabId === 'chat') { renderChatMessages(); renderizarListaUsuariosChat(); }
  if (tabId === 'pedidos') renderizarPedidos();
  if (tabId === 'departamentos') renderizarTabelaDepartamentos();
  if (tabId === 'vendas') renderizarTabelaVendas();
  if (tabId === 'estoque') {
    alternarModoVisaoEstoque(modoVisaoEstoque || 'naval');
  }
}
// ====================================================
// 11. CHAT INTERNO COM COMANDO '!' E CONVERSÃO
// ====================================================
function selectChannel(channelName, el) {
  currentChannel = channelName;
  document.querySelectorAll('.chat-room-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  const chNameEl = document.getElementById('currentChannelName');
  if (chNameEl) chNameEl.innerText = channelName;
  renderChatMessages();
}

function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  container.innerHTML = '';
  const list = chatDB[currentChannel] || [];

  list.forEach(msg => {
    const div = document.createElement('div');
    const isPedido = !!msg.pedidoId;
    const souEu = usuarioLogado && msg.sender === usuarioLogado.nome;

    div.className = `message ${souEu ? 'sent' : 'received'}`;
    if (isPedido) {
      div.style.border = "2px solid var(--warning)";
      div.style.background = souEu ? "#ca8a04" : "#fefce8";
      div.style.color = souEu ? "#ffffff" : "#713f12";
    }

    let pedidoTagHtml = isPedido ? `
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: inline-flex; align-items: center; gap: 4px; color: ${souEu ? '#fef08a' : '#b45309'};">
        📋 CHAMADO OFICIAL #${msg.pedidoId}
      </div>
    ` : '';

    let convertBtnHtml = (!isPedido && souEu) ? `
      <div style="margin-top: 6px;">
        <button type="button" class="action-btn" style="font-size: 11px; padding: 3px 8px; border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.15); color: inherit; cursor: pointer;" onclick="converterMensagemEmPedido('${msg.text.replace(/'/g, "\\'")}')">
          📋 Converter em Solicitação
        </button>
      </div>
    ` : '';

    div.innerHTML = `
      ${pedidoTagHtml}
      ${!souEu ? `<span class="message-author">${msg.sender}</span>` : ''}
      <div style="word-break: break-word;">${msg.text}</div>
      ${convertBtnHtml}
      <span class="message-meta">${msg.time}</span>
    `;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const rawText = input ? input.value.trim() : '';
  if (!rawText || !usuarioLogado) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dataHoraStr = `${now.toLocaleDateString('pt-BR')} às ${timeStr}`;
  if (!chatDB[currentChannel]) chatDB[currentChannel] = [];

  // 1. COMANDO DE FINALIZAÇÃO DE SOLICITAÇÃO VIA CHAT (!SOL-xxx <resposta>)
  const matchFinalizar = rawText.match(/^!(SOL-\d+)(?::|\s)\s*(.*)$/i);
  const matchApenasCodigo = rawText.match(/^!(SOL-\d+)$/i);

  if (matchFinalizar || matchApenasCodigo) {
    const solId = (matchFinalizar ? matchFinalizar[1] : matchApenasCodigo[1]).toUpperCase();
    const respostaObs = matchFinalizar ? matchFinalizar[2].trim() : '';

    const pedidos = obterPedidos();
    const pedido = pedidos.find(p => p.id.toUpperCase() === solId);

    if (!pedido) {
      alert(`Solicitação ${solId} não foi encontrada.`);
      return;
    }

    if (pedido.status === 'Concluído') {
      alert(`A solicitação ${solId} já se encontra concluída.`);
      return;
    }

    if (!respostaObs) {
      alert(`Para finalizar ${solId}, inclua a resposta após o código.\nExemplo: !${solId} Reposição de peças realizada com sucesso.`);
      return;
    }

    // Atualiza a solicitação para concluída
    pedido.status = "Concluído";
    pedido.resposta = respostaObs;
    pedido.respondidoPor = usuarioLogado.nome;
    pedido.respondidoEm = dataHoraStr;
    salvarPedidosNoStorage(pedidos);

    // Publica no chat como card de chamado concluído
    chatDB[currentChannel].push({
      sender: usuarioLogado.nome,
      text: `✅ [CHAMADO FINALIZADO #${pedido.id}] ${pedido.titulo}\n📝 Parecer: ${respostaObs}`,
      time: timeStr,
      pedidoId: pedido.id
    });

    input.value = '';
    renderizarPedidos();
    renderChatMessages();
    return;
  }

  // 2. COMANDO DE ABERTURA RÁPIDA DE SOLICITAÇÃO (!<texto>)
  if (rawText.startsWith('!')) {
    const conteudoPedido = rawText.slice(1).trim();

    if (!conteudoPedido) {
      alert("Para abrir uma solicitação rápida, digite '!' seguido do pedido. Ex: !Reposição Mod. 101 na gaveta A1\nPara concluir um chamado existente, use: !SOL-101 Observação da conclusão");
      return;
    }

    // Se tiver ':', divide em Título : Descrição
    let titulo = conteudoPedido;
    let desc = conteudoPedido;

    if (conteudoPedido.includes(':')) {
      const partes = conteudoPedido.split(':');
      titulo = partes[0].trim();
      desc = partes.slice(1).join(':').trim() || titulo;
    } else if (conteudoPedido.length > 40) {
      titulo = conteudoPedido.slice(0, 40) + '...';
    }

    // Registra na base de Solicitações
    const pedidos = obterPedidos();
    const novoId = "SOL-" + (pedidos.length + 101);

    pedidos.unshift({
      id: novoId,
      titulo: titulo,
      desc: desc,
      solicitante: usuarioLogado.nome,
      canal: currentChannel,
      prioridade: "Média",
      status: "Pendente",
      data: now.toLocaleDateString('pt-BR'),
      resposta: null,
      respondidoPor: null,
      respondidoEm: null
    });

    salvarPedidosNoStorage(pedidos);

    // Publica no chat como cartão de chamado oficial
    chatDB[currentChannel].push({
      sender: usuarioLogado.nome,
      text: `📦 [SOLICITAÇÃO RÁPIDA ${novoId}] ${desc}`,
      time: timeStr,
      pedidoId: novoId
    });

    renderizarPedidos();
  } else {
    // MENSAGEM CONVENCIONAL DE CHAT
    chatDB[currentChannel].push({
      sender: usuarioLogado.nome,
      text: rawText,
      time: timeStr
    });
  }

  input.value = '';
  renderChatMessages();
}

function handleKeyPress(e) {
  if (e.key === 'Enter') sendMessage();
}

function abrirModalPedidoChat() {
  abrirModalNovoPedido();
  const selectCanal = document.getElementById('pedCanal');
  if (selectCanal && (currentChannel === '#geral' || currentChannel === '#operacoes' || currentChannel === '#ti-suporte')) {
    selectCanal.value = currentChannel;
  }
}

function converterMensagemEmPedido(texto) {
  document.getElementById('pedTitulo').value = texto.slice(0, 45);
  document.getElementById('pedDescricao').value = texto;
  abrirModalPedidoChat();
}

// ====================================================
// GESTÃO DE SITUAÇÃO / STATUS DOS COLABORADORES
// ====================================================
function obterStatusUsuarios() {
  const salvos = localStorage.getItem('davisory_usuarios_status_v1');
  if (!salvos) {
    const statusIniciais = {
      "admin@davisory.com": "online",
      "colaborador@davisory.com": "descanso"
    };
    localStorage.setItem('davisory_usuarios_status_v1', JSON.stringify(statusIniciais));
    return statusIniciais;
  }
  return JSON.parse(salvos);
}

function salvarStatusUsuarios(mapa) {
  localStorage.setItem('davisory_usuarios_status_v1', JSON.stringify(mapa));
}

function alterarMeuStatus(novoStatus) {
  if (!usuarioLogado) return;
  const mapa = obterStatusUsuarios();
  mapa[usuarioLogado.email] = novoStatus;
  salvarStatusUsuarios(mapa);
  renderizarListaUsuariosChat();
}

function renderizarListaUsuariosChat() {
  const container = document.getElementById('listaUsuariosChat');
  if (!container) return;
  container.innerHTML = '';

  const usuarios = obterUsuarios();
  const statusMapa = obterStatusUsuarios();

  let totalOnline = 0;

  usuarios.forEach(u => {
    let situacao = statusMapa[u.email] || 'offline';

    // Se for o próprio usuário logado, garante que o select reflita a situação atual
    const souEu = usuarioLogado && u.email === usuarioLogado.email;
    if (souEu) {
      const select = document.getElementById('selectMeuStatus');
      if (select && select.value !== situacao) {
        select.value = situacao;
      }
    }

    if (situacao === 'online') totalOnline++;

    let badgeClass = 'status-offline';
    let dotClass = 'offline';
    let labelTexto = 'Offline';

    if (situacao === 'online') {
      badgeClass = 'status-online';
      dotClass = 'online';
      labelTexto = 'Online';
    } else if (situacao === 'descanso') {
      badgeClass = 'status-descanso';
      dotClass = 'descanso';
      labelTexto = 'Descanso';
    }

    const iniciais = (u.nome || 'CO').slice(0, 2).toUpperCase();

    const row = document.createElement('div');
    row.className = 'chat-user-item';
    row.innerHTML = `
      <div class="chat-user-info">
        <div class="chat-user-avatar">${iniciais}</div>
        <div style="min-width: 0;">
          <div class="chat-user-name">${u.nome} ${souEu ? '<span style="font-size:10px; color:var(--accent); font-weight:700;">(Você)</span>' : ''}</div>
          <div class="chat-user-role">${u.cargo || 'Colaborador'}</div>
        </div>
      </div>
      <div class="status-indicator ${badgeClass}">
        <span class="status-dot ${dotClass}"></span>
        <span>${labelTexto}</span>
      </div>
    `;
    container.appendChild(row);
  });

  const badgeCount = document.getElementById('badgeTotalOnline');
  if (badgeCount) {
    badgeCount.innerText = `${totalOnline} online`;
  }
}

// ====================================================
// 12. GESTÃO DE SOLICITAÇÕES (COM RESPOSTA OBRIGATÓRIA)
// ====================================================
function abrirModalNovoPedido() {
  document.getElementById('pedTitulo').value = '';
  document.getElementById('pedDescricao').value = '';
  document.getElementById('modalPedido').style.display = 'flex';
}

function fecharModalPedido() {
  document.getElementById('modalPedido').style.display = 'none';
}

function salvarPedido(e) {
  e.preventDefault();
  const titulo = document.getElementById('pedTitulo').value.trim();
  const desc = document.getElementById('pedDescricao').value.trim();
  const canal = document.getElementById('pedCanal').value;
  const prioridade = document.getElementById('pedPrioridade').value;
  const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const pedidos = obterPedidos();
  const novoId = "SOL-" + (pedidos.length + 101);

  pedidos.unshift({
    id: novoId,
    titulo: titulo,
    desc: desc,
    solicitante: usuarioLogado?.nome || "Colaborador",
    canal: canal,
    prioridade: prioridade,
    status: "Pendente",
    data: new Date().toLocaleDateString('pt-BR'),
    resposta: null,
    respondidoPor: null,
    respondidoEm: null
  });

  salvarPedidosNoStorage(pedidos);

  // Notificação cruzada: envia card oficial de chamado diretamente para o canal selecionado do chat
  if (!chatDB[canal]) chatDB[canal] = [];
  chatDB[canal].push({
    sender: usuarioLogado?.nome || "Colaborador",
    text: `📦 [SOLICITAÇÃO ${novoId}] ${titulo} — Detalhes: ${desc}`,
    time: timeStr,
    pedidoId: novoId
  });

  fecharModalPedido();
  renderizarPedidos();
  renderChatMessages();
  alert(`Solicitação ${novoId} registrada com sucesso e encaminhada ao canal ${canal}!`);
}

function alterarStatus(id, novoStatus) {
  const pedidos = obterPedidos();
  const pedido = pedidos.find(p => p.id === id);
  if (pedido) {
    pedido.status = novoStatus;
    if (novoStatus === 'Pendente') {
      pedido.resposta = null;
      pedido.respondidoPor = null;
      pedido.respondidoEm = null;
    }
    salvarPedidosNoStorage(pedidos);
    renderizarPedidos();
  }
}

// FLUXO DE CONCLUSÃO COM OBSERVAÇÃO/RESPOSTA OBRIGATÓRIA
function abrirModalConcluirPedido(id) {
  const pedidos = obterPedidos();
  const pedido = pedidos.find(p => p.id === id);
  if (!pedido) return;

  document.getElementById('concluirPedidoId').value = pedido.id;
  document.getElementById('modalConcluirPedidoTitulo').innerText = `${pedido.id} — ${pedido.titulo}`;
  document.getElementById('modalConcluirPedidoDetalhes').innerText = `Solicitante: ${pedido.solicitante} (${pedido.canal}) | Aberto em: ${pedido.data}`;
  document.getElementById('pedObservacaoResposta').value = '';
  document.getElementById('modalConcluirPedido').style.display = 'flex';
}

function fecharModalConcluirPedido() {
  document.getElementById('modalConcluirPedido').style.display = 'none';
}

function confirmarConclusaoPedido(e) {
  e.preventDefault();
  const id = document.getElementById('concluirPedidoId').value;
  const observacao = document.getElementById('pedObservacaoResposta').value.trim();

  if (!observacao) {
    alert("Por favor, preencha a observação com o parecer ou resposta da solicitação.");
    return;
  }

  const pedidos = obterPedidos();
  const pedido = pedidos.find(p => p.id === id);
  if (!pedido) return;

  const now = new Date();
  const dataHoraStr = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  pedido.status = "Concluído";
  pedido.resposta = observacao;
  pedido.respondidoPor = usuarioLogado?.nome || "Atendente";
  pedido.respondidoEm = dataHoraStr;

  salvarPedidosNoStorage(pedidos);

  // Notificação no chat com a resposta oficial
  const canal = pedido.canal || '#geral';
  if (!chatDB[canal]) chatDB[canal] = [];
  chatDB[canal].push({
    sender: usuarioLogado?.nome || "Atendente",
    text: `✅ [CHAMADO RESOLVIDO #${pedido.id}] ${pedido.titulo}\n📝 Resposta: ${observacao}`,
    time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    pedidoId: pedido.id
  });

  fecharModalConcluirPedido();
  renderizarPedidos();
  renderChatMessages();
  alert(`Solicitação ${pedido.id} concluída com sucesso! A resposta foi registrada.`);
}

function excluirPedido(id) {
  const pedidos = obterPedidos();
  const pedido = pedidos.find(p => p.id === id);
  if (!pedido) return;

  if (!confirm(`Deseja realmente excluir a solicitação ${pedido.id} (${pedido.titulo})?\nEsta ação não poderá ser desfeita.`)) {
    return;
  }

  const novosPedidos = pedidos.filter(p => p.id !== id);
  salvarPedidosNoStorage(novosPedidos);
  renderizarPedidos();
}

function filtrarStatus(status, el) {
  filtroPedidosAtual = status;
  el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderizarPedidos();
}

function renderizarPedidos() {
  const pedidos = obterPedidos();
  const total = pedidos.length;
  const ativos = pedidos.filter(p => p.status !== 'Concluído').length;
  const andamento = pedidos.filter(p => p.status === 'Em Andamento').length;
  const concluidos = pedidos.filter(p => p.status === 'Concluído').length;

  const elTotal = document.getElementById('metricTotal');
  const elAtivos = document.getElementById('metricAtivos');
  const elAndamento = document.getElementById('metricAndamento');
  const elConcluidos = document.getElementById('metricConcluidos');
  const elBadge = document.getElementById('menuPedidosBadge');

  if (elTotal) elTotal.innerText = total;
  if (elAtivos) elAtivos.innerText = ativos;
  if (elAndamento) elAndamento.innerText = andamento;
  if (elConcluidos) elConcluidos.innerText = concluidos;
  if (elBadge) elBadge.innerText = ativos;

  const tabela = document.getElementById('tabelaPedidosCorpo');
  if (!tabela) return;
  tabela.innerHTML = '';

  const busca = (document.getElementById('buscaPedido')?.value || '').toLowerCase();

  const filtrados = pedidos.filter(p => {
    const atendeFiltro =
      (filtroPedidosAtual === 'todos') ? true :
      (filtroPedidosAtual === 'ativos') ? (p.status !== 'Concluído') :
      (p.status === filtroPedidosAtual);

    const atendeBusca = p.titulo.toLowerCase().includes(busca) ||
                        p.solicitante.toLowerCase().includes(busca) ||
                        p.id.toLowerCase().includes(busca) ||
                        p.canal.toLowerCase().includes(busca) ||
                        (p.resposta && p.resposta.toLowerCase().includes(busca));

    return atendeFiltro && atendeBusca;
  });

  if (filtrados.length === 0) {
    tabela.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">Nenhuma solicitação encontrada.</td></tr>`;
    return;
  }

  filtrados.forEach(p => {
    let badgeClass = 'status-baixo';
    if (p.status === 'Em Andamento') badgeClass = 'badge-preparo';
    if (p.status === 'Concluído') badgeClass = 'status-ok';

    let botoesAcao = `
      ${p.status === 'Pendente' ? `<button type="button" class="action-btn" onclick="alterarStatus('${p.id}', 'Em Andamento')">Iniciar Atendimento</button>` : ''}
      ${p.status === 'Em Andamento' ? `<button type="button" class="action-btn" style="background:#10b981; color:white; font-weight:700;" onclick="abrirModalConcluirPedido('${p.id}')">Concluir c/ Resposta</button>` : ''}
      ${p.status === 'Concluído' ? `<button type="button" class="action-btn" onclick="alterarStatus('${p.id}', 'Pendente')">Reabrir</button>` : ''}
      <button type="button" class="action-btn" style="color:var(--danger); border-color:#fca5a5; margin-left:4px;" title="Excluir Solicitação" onclick="excluirPedido('${p.id}')">🗑️ Excluir</button>
    `;

    let respostaHtml = '';
    if (p.status === 'Concluído' && p.resposta) {
      respostaHtml = `
        <div style="margin-top: 6px; font-size: 11.5px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 5px 8px; border-radius: 6px; line-height: 1.35;">
          <strong>Parecer / Resposta:</strong> ${p.resposta}
          <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">Resolvido por <strong>${p.respondidoPor || 'Atendente'}</strong> em ${p.respondidoEm || p.data}</div>
        </div>
      `;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.id}</strong></td>
      <td style="max-width: 320px;">
        <strong>${p.titulo}</strong>
        <div style="font-size: 12px; color: #64748b;">${p.desc}</div>
        ${respostaHtml}
      </td>
      <td>
        ${p.solicitante}
        <div style="font-size: 11px; color: #2563eb; font-weight: 600;">${p.canal}</div>
      </td>
      <td><strong>${p.prioridade}</strong></td>
      <td style="color: #64748b; font-size: 13px;">${p.data}</td>
      <td><span class="status-badge ${badgeClass}">${p.status}</span></td>
      <td style="text-align: right; white-space: nowrap;">${botoesAcao}</td>
    `;
    tabela.appendChild(tr);
  });
}

// ====================================================
// 13. HISTÓRICO DE MOVIMENTAÇÕES & GUIAS
// ====================================================
function filtrarMovs(tipo, el) {
  filtroMovAtual = tipo;
  el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderizarTabelaMovimentacoes();
}

function renderizarTabelaMovimentacoes() {
  const movs = obterMovimentacoes();
  const tabela = document.getElementById('tabelaMovimentacoesCorpo');
  if (!tabela) return;
  tabela.innerHTML = '';

  let entradas = 0;
  let saidas = 0;

  movs.forEach(m => {
    if (m.tipoGeral === 'Entrada') entradas++;
    else if (m.tipoGeral === 'Saída') saidas++;
  });

  const elTotal = document.getElementById('metricTotalMovs');
  const elEntradas = document.getElementById('metricTotalEntradas');
  const elSaidas = document.getElementById('metricTotalSaidas');
  const elBadge = document.getElementById('menuMovBadge');

  if (elTotal) elTotal.innerText = movs.length;
  if (elEntradas) elEntradas.innerText = entradas;
  if (elSaidas) elSaidas.innerText = saidas;
  if (elBadge) elBadge.innerText = movs.length;

  const busca = (document.getElementById('buscaMovimentacao')?.value || '').toLowerCase();

  const filtradas = movs.filter(m => {
    const atendeFiltro = (filtroMovAtual === 'todas') ? true : (m.tipoGeral === filtroMovAtual);
    const atendeBusca = m.id.toLowerCase().includes(busca) ||
                        m.responsavel.toLowerCase().includes(busca) ||
                        (m.motivo || '').toLowerCase().includes(busca) ||
                        (m.docRef || '').toLowerCase().includes(busca);
    return atendeFiltro && atendeBusca;
  });

  if (filtradas.length === 0) {
    tabela.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">Nenhuma movimentação encontrada.</td></tr>`;
    return;
  }

  filtradas.forEach(m => {
    let badgeTipo = 'badge-mov-mista';
    if (m.tipoGeral === 'Entrada') badgeTipo = 'badge-mov-entrada';
    if (m.tipoGeral === 'Saída') badgeTipo = 'badge-mov-saida';

    const qtdTotalItens = (m.itens || []).reduce((s, i) => s + (parseInt(i.qtd) || 0), 0);
    const qtdModelos = m.itens ? m.itens.length : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m.id}</strong></td>
      <td>${m.data}</td>
      <td style="color: #64748b;">${m.hora}</td>
      <td>
        <strong>${m.responsavel}</strong>
        <div style="font-size: 11px; color: #64748b;">${m.departamento}</div>
      </td>
      <td><span class="status-badge ${badgeTipo}">${m.tipoGeral}</span></td>
      <td>
        <strong>${qtdTotalItens} unidades</strong>
        <div style="font-size: 11px; color: #64748b;">${qtdModelos} item(ns)</div>
      </td>
      <td style="text-align: right; white-space: nowrap;">
        <button type="button" class="action-btn" style="background:var(--accent); color:white; border-color:var(--accent);" onclick="abrirDocumentoMovimentacao('${m.id}')">
          📄 Ver Guia
        </button>
        <button type="button" class="action-btn" style="color:var(--danger); border-color:#fca5a5; margin-left:6px;" title="Excluir movimentação" onclick="excluirMovimentacao('${m.id}')">
          🗑️ Excluir
        </button>
      </td>
    `;
    tabela.appendChild(tr);
  });
}

function abrirDocumentoMovimentacao(id) {
  const mov = obterMovimentacoes().find(m => m.id === id);
  if (!mov) return;

  movAtualDocumento = mov;
  const box = document.getElementById('conteudoDocumentoOficial');

  let linhasTabela = '';
  (mov.itens || []).forEach((item, idx) => {
    const isEntrada = item.tipo === 'Entrada';
    linhasTabela += `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 10px 12px; font-weight: 600;">${idx + 1}</td>
        <td style="padding: 10px 12px;"><strong>${item.modelo}</strong></td>
        <td style="padding: 10px 12px; font-weight:700; color:var(--accent);">${item.local}</td>
        <td style="padding: 10px 12px;"><span class="tag-categoria" style="font-size:11px;">${item.categoria}</span></td>
        <td style="padding: 10px 12px;">
          <span class="status-badge ${isEntrada ? 'badge-mov-entrada' : 'badge-mov-saida'}" style="font-size:11px;">
            ${item.tipo}
          </span>
        </td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 800; font-size:15px; color:${isEntrada ? '#15803d' : '#b91c1c'};">
          ${isEntrada ? '+' : '−'}${item.qtd} un
        </td>
      </tr>
    `;
  });

  box.innerHTML = `
    <div class="doc-header">
      <div>
        <div style="font-size: 20px; font-weight: 800; color: var(--primary);">DAVISORY SUPRIMENTOS</div>
        <div style="font-size: 12px; color: var(--text-muted);">Comprovante Oficial de Movimentação Interna</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 16px; font-weight: 800; color: var(--accent);">${mov.id}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${mov.data} às ${mov.hora}</div>
      </div>
    </div>

    <div class="doc-grid-info">
      <div>
        <span style="font-size: 11px; color: var(--text-muted); display: block;">RESPONSÁVEL:</span>
        <strong>${mov.responsavel}</strong> (${mov.departamento})
      </div>
      <div>
        <span style="font-size: 11px; color: var(--text-muted); display: block;">DOC. / REF:</span>
        <strong>${mov.docRef || 'Sem ref.'}</strong>
      </div>
      <div style="grid-column: span 2;">
        <span style="font-size: 11px; color: var(--text-muted); display: block;">MOTIVO / DESTINO:</span>
        <strong>${mov.motivo || 'Operação de rotina'}</strong>
      </div>
    </div>

    <table style="width: 100%; font-size: 12.5px; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid var(--border); color: #64748b;">
          <th style="padding: 8px 12px;">#</th>
          <th style="padding: 8px 12px;">Modelo / Produto</th>
          <th style="padding: 8px 12px;">Gaveta</th>
          <th style="padding: 8px 12px;">Categoria</th>
          <th style="padding: 8px 12px;">Operação</th>
          <th style="padding: 8px 12px; text-align: right;">Qtd.</th>
        </tr>
      </thead>
      <tbody>${linhasTabela}</tbody>
    </table>

    <div class="doc-footer-sign">
      <div>🔒 <em>Autenticado pelo portal Davisory.</em></div>
      <div style="text-align: right; border-top: 1px solid #94a3b8; padding-top: 4px; min-width: 160px;">
        Visto: <strong>${mov.responsavel}</strong>
      </div>
    </div>
  `;

  document.getElementById('modalDocumentoMov').style.display = 'flex';
}

function fecharModalDocumento() {
  document.getElementById('modalDocumentoMov').style.display = 'none';
  movAtualDocumento = null;
}

function imprimirDocumentoMov() {
  window.print();
}

function excluirMovimentacao(id) {
  const movs = obterMovimentacoes();
  const mov = movs.find(m => m.id === id);
  if (!mov) return;

  const confirmar = confirm(`Deseja excluir a movimentação ${mov.id} (${mov.motivo || 'Sem motivo'})?\n\n⚠️ IMPORTANTE: Os saldos físicos no gaveteiro serão revertidos automaticamente:\n- As Entradas serão subtraídas do estoque.\n- As Saídas serão devolvidas ao estoque.`);
  if (!confirmar) return;

  const estoque = obterEstoque();

  // Reverte cada item no estoque
  (mov.itens || []).forEach(item => {
    const prod = estoque.find(p => p.nome === item.modelo && p.local === item.local);
    if (prod && prod.categorias) {
      let cat = prod.categorias.find(c => c.nome === item.categoria);
      if (!cat) {
        cat = { id: "C" + Math.floor(Math.random() * 10000), nome: item.categoria, qtd: 0 };
        prod.categorias.push(cat);
      }

      if (item.tipo === 'Entrada') {
        cat.qtd = Math.max(0, (parseInt(cat.qtd) || 0) - (parseInt(item.qtd) || 0));
      } else if (item.tipo === 'Saída') {
        cat.qtd = (parseInt(cat.qtd) || 0) + (parseInt(item.qtd) || 0);
      }
    }
  });

  // Salva o estoque revertido
  salvarEstoqueNoStorage(estoque);

  // Remove a movimentação da lista
  const novosMovs = movs.filter(m => m.id !== id);
  salvarMovimentacoesNoStorage(novosMovs);

  // Se o documento estiver aberto no modal, fecha
  if (movAtualDocumento && movAtualDocumento.id === id) {
    fecharModalDocumento();
  }

  // Atualiza as telas
  renderizarEstoque();
  renderizarTabuleiroNaval();
  renderizarTabelaMovimentacoes();

  alert(`Movimentação ${id} excluída e saldos no gaveteiro revertidos com sucesso!`);
}

function abrirModalMovimentacaoLote() {
  document.getElementById('movMotivo').value = '';
  document.getElementById('movDocRef').value = '';
  document.getElementById('containerLinhasLote').innerHTML = '';
  
  adicionarLinhaItemLote();
  adicionarLinhaItemLote();
  
  document.getElementById('modalMovLote').style.display = 'flex';
}

function fecharModalMovLote() {
  document.getElementById('modalMovLote').style.display = 'none';
}

function adicionarLinhaItemLote() {
  const container = document.getElementById('containerLinhasLote');
  const itensEstoque = obterEstoque();

  if (itensEstoque.length === 0) {
    alert("Nenhum produto cadastrado no estoque.");
    return;
  }

  const row = document.createElement('div');
  row.className = 'linha-lote-box';

  let optionsProdutos = '';
  itensEstoque.forEach(p => {
    optionsProdutos += `<option value="${p.id}">${p.nome} (Gaveta ${p.local})</option>`;
  });

  row.innerHTML = `
    <div>
      <label style="font-size:11px; font-weight:700; color:#475569; display:block;">Modelo</label>
      <select class="form-select select-lote-prod" style="padding:6px; font-size:12.5px;" onchange="atualizarCategoriasLinhaLote(this)">
        ${optionsProdutos}
      </select>
    </div>
    <div>
      <label style="font-size:11px; font-weight:700; color:#475569; display:block;">Categoria</label>
      <select class="form-select select-lote-cat" style="padding:6px; font-size:12.5px;"></select>
    </div>
    <div>
      <label style="font-size:11px; font-weight:700; color:#475569; display:block;">Tipo</label>
      <select class="form-select select-lote-tipo" style="padding:6px; font-size:12.5px;">
        <option value="Entrada">Entrada (+)</option>
        <option value="Saída">Saída (−)</option>
      </select>
    </div>
    <div>
      <label style="font-size:11px; font-weight:700; color:#475569; display:block;">Qtd.</label>
      <input type="number" class="form-input input-lote-qtd" min="1" value="5" style="padding:6px; font-size:12.5px;" required>
    </div>
    <div style="padding-top:14px;">
      <button type="button" class="btn-remove-attr" onclick="this.closest('.linha-lote-box').remove()" title="Remover">&times;</button>
    </div>
  `;

  container.appendChild(row);
  const selectProd = row.querySelector('.select-lote-prod');
  atualizarCategoriasLinhaLote(selectProd);
}

function atualizarCategoriasLinhaLote(selectProdEl) {
  const prodId = selectProdEl.value;
  const row = selectProdEl.closest('.linha-lote-box');
  const selectCat = row.querySelector('.select-lote-cat');

  const itens = obterEstoque();
  const prod = itens.find(p => p.id === prodId);
  selectCat.innerHTML = '';

  if (prod && prod.categorias) {
    prod.categorias.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.nome;
      opt.innerText = `${c.nome} (Saldo: ${c.qtd})`;
      selectCat.appendChild(opt);
    });
  }
}

function salvarMovimentacaoLote(e) {
  e.preventDefault();
  const linhas = document.querySelectorAll('.linha-lote-box');
  if (linhas.length === 0) {
    alert("Adicione pelo menos um item.");
    return;
  }

  const motivo = document.getElementById('movMotivo').value.trim();
  const docRef = document.getElementById('movDocRef').value.trim();

  const itensEstoque = obterEstoque();
  const itensMovimentados = [];
  let temEntrada = false;
  let temSaida = false;

  for (const row of linhas) {
    const prodId = row.querySelector('.select-lote-prod').value;
    const catNome = row.querySelector('.select-lote-cat').value;
    const tipo = row.querySelector('.select-lote-tipo').value;
    const qtd = parseInt(row.querySelector('.input-lote-qtd').value);

    const produto = itensEstoque.find(p => p.id === prodId);
    if (!produto) continue;

    let categoria = produto.categorias.find(c => c.nome === catNome);
    if (!categoria) {
      if (tipo === 'Entrada') {
        categoria = { id: "C" + Math.floor(Math.random() * 10000), nome: catNome, qtd: 0 };
        produto.categorias.push(categoria);
      } else {
        alert(`A categoria ${catNome} não existe no produto ${produto.nome}.`);
        return;
      }
    }

    if (tipo === 'Saída') {
      temSaida = true;
      if (categoria.qtd < qtd) {
        alert(`Saldo insuficiente! O modelo ${produto.nome} (${catNome}) possui apenas ${categoria.qtd} unidades disponíveis.`);
        return;
      }
      categoria.qtd -= qtd;
    } else {
      temEntrada = true;
      categoria.qtd += qtd;
    }

    itensMovimentados.push({
      modelo: produto.nome,
      local: produto.local,
      categoria: catNome,
      tipo: tipo,
      qtd: qtd
    });
  }

  let tipoGeral = "Mista";
  if (temEntrada && !temSaida) tipoGeral = "Entrada";
  if (!temEntrada && temSaida) tipoGeral = "Saída";

  salvarEstoqueNoStorage(itensEstoque);

  const now = new Date();
  const movs = obterMovimentacoes();
  const novoId = "MOV-" + (movs.length + 1001);

  const novaGuia = {
    id: novoId,
    data: now.toLocaleDateString('pt-BR'),
    hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    responsavel: usuarioLogado?.nome || "Sistema",
    departamento: "Almoxarifado / Estoque",
    tipoGeral: tipoGeral,
    motivo: motivo,
    docRef: docRef,
    itens: itensMovimentados
  };

  movs.unshift(novaGuia);
  salvarMovimentacoesNoStorage(movs);

  fecharModalMovLote();
  renderizarEstoque();
  renderizarTabuleiroNaval();
  
  // Exibe a tela de estoque no modo de visão de movimentações
  switchTab('estoque');
  alternarModoVisaoEstoque('movs');
  abrirDocumentoMovimentacao(novoId);
}

// ====================================================
// 14. VENDAS & ETAPA EM PREPARO (FRACIONAMENTO)
// ====================================================
function adicionarLinhaItemVenda() {
  const container = document.getElementById('containerItensVenda');
  const itensEstoque = obterEstoque();
  const attrs = obterAtributos();

  const row = document.createElement('div');
  row.className = 'linha-venda-item';

  let optionsProdutos = `<option value="">[Não especificado / A definir no preparo]</option>`;
  itensEstoque.forEach(p => {
    optionsProdutos += `<option value="${p.id}">${p.nome} (Gaveta ${p.local})</option>`;
  });

  let optionsCategorias = '';
  (attrs.categorias || []).forEach(cat => {
    optionsCategorias += `<option value="${cat}">${cat}</option>`;
  });

  row.innerHTML = `
    <div>
      <label style="font-size:11px; font-weight:700; color:#475569; display:block; margin-bottom:3px;">Modelo (Opcional)</label>
      <select class="form-select select-venda-prod" style="padding:7px; font-size:13px;" onchange="atualizarCategoriasLinhaVenda(this)">
        ${optionsProdutos}
      </select>
    </div>
    <div>
      <label style="font-size:11px; font-weight:700; color:#475569; display:block; margin-bottom:3px;">Categoria (Obrigatória)</label>
      <select class="form-select select-venda-cat" style="padding:7px; font-size:13px;" onchange="recalcularTotaisVenda()">
        ${optionsCategorias}
      </select>
    </div>
    <div>
      <label style="font-size:11px; font-weight:700; color:#475569; display:block; margin-bottom:3px;">Qtd.</label>
      <input type="number" class="form-input input-venda-qtd" min="1" value="50" style="padding:7px; font-size:13px;" oninput="recalcularTotaisVenda()" required>
    </div>
    <div>
      <label style="font-size:11px; font-weight:700; color:#475569; display:block; margin-bottom:3px;">Valor Unit. (R$)</label>
      <input type="number" step="0.01" class="form-input input-venda-preco" min="0" value="15.00" style="padding:7px; font-size:13px;" oninput="recalcularTotaisVenda()" required>
    </div>
    <div>
      <label style="font-size:11px; font-weight:700; color:#475569; display:block; margin-bottom:3px;">Subtotal (R$)</label>
      <input type="text" class="form-input input-venda-subtotal" readonly style="background:#e2e8f0; font-weight:700; color:var(--primary); padding:7px; font-size:13px;" value="R$ 750,00">
    </div>
    <div style="padding-top:16px;">
      <button type="button" class="btn-remove-attr" title="Remover item" onclick="removerLinhaVenda(this)">&times;</button>
    </div>
  `;

  container.appendChild(row);
  recalcularTotaisVenda();
}

function removerLinhaVenda(btn) {
  const container = document.getElementById('containerItensVenda');
  if (container.children.length <= 1) {
    alert("O pedido precisa de pelo menos um item.");
    return;
  }
  btn.closest('.linha-venda-item').remove();
  recalcularTotaisVenda();
}

function atualizarCategoriasLinhaVenda(selectProdEl) {
  const prodId = selectProdEl.value;
  const row = selectProdEl.closest('.linha-venda-item');
  const selectCat = row.querySelector('.select-venda-cat');

  const itens = obterEstoque();
  const attrs = obterAtributos();
  selectCat.innerHTML = '';

  if (prodId) {
    const prod = itens.find(p => p.id === prodId);
    if (prod && prod.categorias && prod.categorias.length > 0) {
      prod.categorias.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nome;
        opt.innerText = `${c.nome} (Estoque: ${c.qtd})`;
        selectCat.appendChild(opt);
      });
    }
  } else {
    (attrs.categorias || []).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.innerText = cat;
      selectCat.appendChild(opt);
    });
  }
  recalcularTotaisVenda();
}

function recalcularTotaisVenda() {
  const linhas = document.querySelectorAll('.linha-venda-item');
  let somaPecas = 0;
  let somaTotal = 0;

  linhas.forEach(row => {
    const qtdInput = row.querySelector('.input-venda-qtd');
    const precoInput = row.querySelector('.input-venda-preco');
    const subtotalInput = row.querySelector('.input-venda-subtotal');

    const qtd = parseInt(qtdInput?.value) || 0;
    const preco = parseFloat(precoInput?.value) || 0;
    const subtotal = qtd * preco;

    if (subtotalInput) {
      subtotalInput.value = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    somaPecas += qtd;
    somaTotal += subtotal;
  });

  document.getElementById('vendaTotalPecas').innerText = `${somaPecas} un`;
  document.getElementById('vendaTotalValor').innerText = somaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function limparFormularioVenda() {
  document.getElementById('vendaEmpresa').value = '';
  document.getElementById('vendaDono').value = '';
  document.getElementById('containerItensVenda').innerHTML = '';
  adicionarLinhaItemVenda();
  recalcularTotaisVenda();
}

function finalizarPedidoVenda(e) {
  e.preventDefault();
  const empresa = document.getElementById('vendaEmpresa').value.trim();
  const dono = document.getElementById('vendaDono').value.trim();
  const representante = document.getElementById('vendaRepresentante').value.trim();
  const linhas = document.querySelectorAll('.linha-venda-item');

  if (linhas.length === 0) return;

  const itensEstoque = obterEstoque();
  const itensVendidos = [];
  let totalPecas = 0;
  let valorTotal = 0;

  for (const row of linhas) {
    const prodId = row.querySelector('.select-venda-prod').value;
    const catNome = row.querySelector('.select-venda-cat').value;
    const qtd = parseInt(row.querySelector('.input-venda-qtd').value) || 0;
    const precoUnit = parseFloat(row.querySelector('.input-venda-preco').value) || 0;
    const subtotal = qtd * precoUnit;

    let nomeModelo = "";
    let localGaveta = "";

    if (prodId) {
      const prod = itensEstoque.find(p => p.id === prodId);
      if (prod) {
        nomeModelo = prod.nome;
        localGaveta = prod.local;
      }
    }

    totalPecas += qtd;
    valorTotal += subtotal;

    itensVendidos.push({
      id: "ITEM-" + Math.floor(Math.random() * 100000),
      modelo: nomeModelo,
      local: localGaveta,
      categoria: catNome,
      qtd: qtd,
      precoUnit: precoUnit,
      subtotal: subtotal,
      conferido: false
    });
  }

  const now = new Date();
  const vendas = obterVendas();
  const novoIdVenda = "VEN-" + (vendas.length + 1001);

  const novaVenda = {
    id: novoIdVenda,
    data: now.toLocaleDateString('pt-BR'),
    hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    empresa: empresa,
    dono: dono,
    representante: representante,
    status: "Em Preparo",
    totalPecas: totalPecas,
    valorTotal: valorTotal,
    itens: itensVendidos
  };

  vendas.unshift(novaVenda);
  salvarVendasNoStorage(vendas);

  limparFormularioVenda();
  renderizarTabelaVendas();
  abrirModalPreparo(novoIdVenda);
}

function filtrarStatusVenda(status, el) {
  filtroStatusVendaAtual = status;
  el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderizarTabelaVendas();
}

function renderizarTabelaVendas() {
  const vendas = obterVendas();
  const tabela = document.getElementById('tabelaVendasCorpo');
  if (!tabela) return;
  tabela.innerHTML = '';

  const badge = document.getElementById('menuVendasBadge');
  if (badge) badge.innerText = vendas.length;

  const busca = (document.getElementById('buscaVenda')?.value || '').toLowerCase();

  const filtradas = vendas.filter(v => {
    const atendeFiltro = (filtroStatusVendaAtual === 'todos') ? true : (v.status === filtroStatusVendaAtual);
    const atendeBusca = v.id.toLowerCase().includes(busca) ||
                        v.empresa.toLowerCase().includes(busca) ||
                        v.dono.toLowerCase().includes(busca);
    return atendeFiltro && atendeBusca;
  });

  if (filtradas.length === 0) {
    tabela.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #94a3b8; padding: 28px;">Nenhum pedido encontrado.</td></tr>`;
    return;
  }

  filtradas.forEach(v => {
    const isCancelada = v.status === 'Cancelada';
    const isPreparo = v.status === 'Em Preparo';

    let statusBadge = `<span class="status-badge status-ok">Concluída</span>`;
    if (isCancelada) statusBadge = `<span class="status-badge badge-mov-saida">Cancelada</span>`;
    if (isPreparo) statusBadge = `<span class="status-badge badge-preparo">⏳ Em Preparo</span>`;

    let botoesAcao = isPreparo 
      ? `<button class="action-btn" style="background:#f59e0b; color:white; font-weight:700;" onclick="abrirModalPreparo('${v.id}')">📦 Preparar</button>`
      : `<button class="action-btn" style="background:var(--accent); color:white;" onclick="abrirDocumentoVenda('${v.id}')">📄 Recibo</button>`;

    if (!isCancelada) {
      botoesAcao += ` <button class="action-btn" style="color:var(--warning);" onclick="cancelarVenda('${v.id}')">↩️ Cancelar</button>`;
    }
    botoesAcao += ` <button class="action-btn" style="color:var(--danger);" onclick="apagarRegistroVenda('${v.id}')">🗑️ Apagar</button>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${v.id}</strong></td>
      <td>${v.data} <span style="font-size:11px; color:#64748b;">${v.hora}</span></td>
      <td><strong>${v.empresa}</strong></td>
      <td>${v.dono}</td>
      <td>${v.representante}</td>
      <td>${statusBadge}</td>
      <td><strong>${v.totalPecas} un</strong></td>
      <td style="color: #15803d; font-weight: 800;">${v.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      <td style="text-align: right;">${botoesAcao}</td>
    `;
    tabela.appendChild(tr);
  });
}

function abrirModalPreparo(idVenda) {
  const vendas = obterVendas();
  const venda = vendas.find(v => v.id === idVenda);
  if (!venda) return;

  vendaSendoPreparada = venda;
  document.getElementById('modalPreparoIdBadge').innerText = venda.id;
  document.getElementById('modalPreparoCliente').innerText = venda.empresa;
  document.getElementById('modalPreparoDono').innerText = venda.dono;

  vendaSendoPreparada.itens.forEach(item => {
    if (!item.distribuicao || item.distribuicao.length === 0) {
      item.distribuicao = [
        { modelo: item.modelo || "", local: item.local || "", qtd: item.qtd, conferido: false }
      ];
    }
  });

  renderizarItensModalPreparo();
  document.getElementById('modalPreparoVenda').style.display = 'flex';
}

function fecharModalPreparo() {
  document.getElementById('modalPreparoVenda').style.display = 'none';
  vendaSendoPreparada = null;
}

function renderizarItensModalPreparo() {
  const container = document.getElementById('containerItensPreparo');
  container.innerHTML = '';
  const estoque = obterEstoque();

  vendaSendoPreparada.itens.forEach((item, itemIdx) => {
    const card = document.createElement('div');
    card.style.background = "#ffffff";
    card.style.border = "1px solid var(--border)";
    card.style.borderRadius = "10px";
    card.style.padding = "14px";
    card.style.marginBottom = "12px";

    const totalDistribuido = (item.distribuicao || []).reduce((s, d) => s + (parseInt(d.qtd) || 0), 0);
    const diferenca = item.qtd - totalDistribuido;

    let badgeCota = diferenca === 0 
      ? `<span style="color:#15803d; font-weight:700;">Distribuição Completa (${totalDistribuido}/${item.qtd} un)</span>`
      : `<span style="color:#b45309; font-weight:700;">Faltam ${diferenca} un</span>`;

    let linhasHtml = '';
    item.distribuicao.forEach((dist, distIdx) => {
      let optionsModelos = `<option value="">-- Selecione o modelo --</option>`;
      estoque.forEach(prod => {
        const catNoProd = (prod.categorias || []).find(c => c.nome === item.categoria);
        const qtdDisp = catNoProd ? catNoProd.qtd : 0;
        const isSelected = dist.modelo === prod.nome && dist.local === prod.local;
        optionsModelos += `<option value="${prod.nome}|${prod.local}" ${isSelected ? 'selected' : ''}>
          ${prod.nome} (Gaveta ${prod.local} - Saldo: ${qtdDisp} un)
        </option>`;
      });

      linhasHtml += `
        <div style="display:grid; grid-template-columns: 2fr 100px auto auto; gap:8px; align-items:center; background:#f8fafc; padding:8px 12px; border-radius:8px; margin-bottom:6px;">
          <select class="form-select" style="padding:6px; font-size:12px;" onchange="vincularModeloFracionado(${itemIdx}, ${distIdx}, this.value)">
            ${optionsModelos}
          </select>
          <input type="number" class="form-input" min="1" max="${item.qtd}" value="${dist.qtd}" style="padding:6px; font-size:12px; text-align:center; font-weight:700;" oninput="inputDiretoQtdFracionada(${itemIdx}, ${distIdx}, this.value)">
          <label style="display:flex; align-items:center; gap:5px; font-size:12px; font-weight:700; cursor:pointer;">
            <input type="checkbox" class="chk-preparo" ${dist.conferido ? 'checked' : ''} onchange="toggleCheckFracionado(${itemIdx}, ${distIdx}, this.checked)">
            <span>${dist.conferido ? 'Conferido ✓' : 'Checar'}</span>
          </label>
          ${item.distribuicao.length > 1 ? `<button type="button" class="btn-remove-attr" onclick="removerLinhaFracionada(${itemIdx}, ${distIdx})">&times;</button>` : '<span></span>'}
        </div>
      `;
    });

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <span class="tag-categoria">🏷️ ${item.categoria} (${item.qtd} un)</span>
        <div id="badge-cota-${itemIdx}">${badgeCota}</div>
      </div>
      ${linhasHtml}
      <button type="button" class="action-btn" style="color:var(--accent); margin-top:6px;" onclick="adicionarFracaoAoItem(${itemIdx})">+ Distribuir em outro modelo</button>
    `;

    container.appendChild(card);
  });
}

function inputDiretoQtdFracionada(itemIdx, distIdx, novaQtd) {
  vendaSendoPreparada.itens[itemIdx].distribuicao[distIdx].qtd = parseInt(novaQtd) || 0;
  salvarEstadoPreparo();
  
  const item = vendaSendoPreparada.itens[itemIdx];
  const total = item.distribuicao.reduce((s, d) => s + (parseInt(d.qtd) || 0), 0);
  const dif = item.qtd - total;
  const badge = document.getElementById(`badge-cota-${itemIdx}`);
  if (badge) {
    badge.innerHTML = dif === 0 
      ? `<span style="color:#15803d; font-weight:700;">Distribuição Completa (${total}/${item.qtd} un)</span>`
      : `<span style="color:#b45309; font-weight:700;">Faltam ${dif} un</span>`;
  }
}

function vincularModeloFracionado(itemIdx, distIdx, valorSelect) {
  if (valorSelect) {
    const [nome, local] = valorSelect.split('|');
    vendaSendoPreparada.itens[itemIdx].distribuicao[distIdx].modelo = nome;
    vendaSendoPreparada.itens[itemIdx].distribuicao[distIdx].local = local;
  } else {
    vendaSendoPreparada.itens[itemIdx].distribuicao[distIdx].modelo = "";
    vendaSendoPreparada.itens[itemIdx].distribuicao[distIdx].local = "";
  }
  salvarEstadoPreparo();
}

function toggleCheckFracionado(itemIdx, distIdx, isChecked) {
  vendaSendoPreparada.itens[itemIdx].distribuicao[distIdx].conferido = isChecked;
  salvarEstadoPreparo();
  renderizarItensModalPreparo();
}

function adicionarFracaoAoItem(itemIdx) {
  vendaSendoPreparada.itens[itemIdx].distribuicao.push({ modelo: "", local: "", qtd: 1, conferido: false });
  salvarEstadoPreparo();
  renderizarItensModalPreparo();
}

function removerLinhaFracionada(itemIdx, distIdx) {
  vendaSendoPreparada.itens[itemIdx].distribuicao.splice(distIdx, 1);
  salvarEstadoPreparo();
  renderizarItensModalPreparo();
}

function salvarEstadoPreparo() {
  const vendas = obterVendas();
  const idx = vendas.findIndex(v => v.id === vendaSendoPreparada.id);
  if (idx !== -1) {
    vendas[idx] = vendaSendoPreparada;
    salvarVendasNoStorage(vendas);
  }
}

function confirmarConclusaoPreparo() {
  if (!vendaSendoPreparada) return;

  for (const item of vendaSendoPreparada.itens) {
    const total = item.distribuicao.reduce((s, d) => s + (parseInt(d.qtd) || 0), 0);
    if (total !== item.qtd) {
      alert(`A quantidade distribuída para ${item.categoria} não coincide com o pedido.`);
      return;
    }
    if (item.distribuicao.some(d => !d.modelo || !d.conferido)) {
      alert(`Selecione o modelo e marque a conferência para todos os itens.`);
      return;
    }
  }

  const estoque = obterEstoque();
  for (const item of vendaSendoPreparada.itens) {
    for (const dist of item.distribuicao) {
      const prod = estoque.find(p => p.nome === dist.modelo && p.local === dist.local);
      if (prod) {
        const cat = prod.categorias.find(c => c.nome === item.categoria);
        if (cat) cat.qtd -= dist.qtd;
      }
    }
  }

  salvarEstoqueNoStorage(estoque);
  vendaSendoPreparada.status = "Concluída";
  salvarEstadoPreparo();

  fecharModalPreparo();
  renderizarEstoque();
  renderizarTabuleiroNaval();
  renderizarTabelaVendas();
  alert("Pedido concluído e faturado!");
}

function cancelarVenda(idVenda) {
  const vendas = obterVendas();
  const venda = vendas.find(v => v.id === idVenda);
  if (!venda || !confirm(`Deseja cancelar o pedido ${venda.id}?`)) return;

  if (venda.status === 'Concluída') {
    const estoque = obterEstoque();
    venda.itens.forEach(item => {
      item.distribuicao.forEach(dist => {
        const prod = estoque.find(p => p.nome === dist.modelo && p.local === dist.local);
        if (prod) {
          const cat = prod.categorias.find(c => c.nome === item.categoria);
          if (cat) cat.qtd += dist.qtd;
        }
      });
    });
    salvarEstoqueNoStorage(estoque);
  }

  venda.status = "Cancelada";
  salvarVendasNoStorage(vendas);
  renderizarEstoque();
  renderizarTabuleiroNaval();
  renderizarTabelaVendas();
}

function apagarRegistroVenda(idVenda) {
  if (!confirm("Deseja apagar este registro de venda definitivamente?")) return;
  const vendas = obterVendas().filter(v => v.id !== idVenda);
  salvarVendasNoStorage(vendas);
  renderizarTabelaVendas();
}

function abrirDocumentoVenda(id) {
  const v = obterVendas().find(item => item.id === id);
  if (!v) return;

  let linhas = '';
  v.itens.forEach((item, idx) => {
    linhas += `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding:8px;">${idx + 1}</td>
        <td style="padding:8px;"><strong>${item.categoria}</strong></td>
        <td style="padding:8px; text-align:center;">${item.qtd} un</td>
        <td style="padding:8px; text-align:right;">${item.precoUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td style="padding:8px; text-align:right;"><strong>${item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></td>
      </tr>
    `;
  });

  document.getElementById('conteudoDocumentoVenda').innerHTML = `
    <div class="doc-header">
      <div>
        <div style="font-size: 20px; font-weight: 800; color: var(--primary);">DAVISORY COMERCIAL</div>
        <div style="font-size: 12px; color: var(--text-muted);">Comprovante de Pedido</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 18px; font-weight: 800; color: var(--accent);">${v.id}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${v.data} ${v.hora}</div>
      </div>
    </div>
    <div style="margin: 14px 0;">
      <div>Empresa: <strong>${v.empresa}</strong></div>
      <div>Responsável: <strong>${v.dono}</strong></div>
    </div>
    <table style="width:100%; border:1px solid var(--border); margin-bottom:14px;">
      <thead><tr style="background:#f8fafc;"><th>#</th><th>Categoria</th><th>Qtd</th><th>Preço</th><th>Total</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <div style="text-align:right; font-size:16px;">Total do Pedido: <strong style="color:#15803d;">${v.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
  `;

  document.getElementById('modalDocumentoVenda').style.display = 'flex';
}

fecharModalVendaDoc = function() {
  document.getElementById('modalDocumentoVenda').style.display = 'none';
};

function imprimirDocumentoVenda() {
  window.print();
}

// ====================================================
// 15. ESTOQUE & GAVETEIRO (BATALHA NAVAL)
// ====================================================
function alternarModoVisaoEstoque(modo) {
  modoVisaoEstoque = modo;
  const btnNaval = document.getElementById('btnVisaoNaval');
  const btnTabela = document.getElementById('btnVisaoTabela');
  const btnMovs = document.getElementById('btnVisaoMovs');

  const boxNaval = document.getElementById('containerVisaoNaval');
  const boxTabela = document.getElementById('containerVisaoTabela');
  const boxMovs = document.getElementById('containerVisaoMovs');
  const painelGeral = document.getElementById('painelMetricasEstoqueGeral');

  // Reseta visual dos 3 botões seletores
  [btnNaval, btnTabela, btnMovs].forEach(btn => {
    if (btn) {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--text)';
    }
  });

  // Oculta os 3 containers de visão
  if (boxNaval) boxNaval.style.display = 'none';
  if (boxTabela) boxTabela.style.display = 'none';
  if (boxMovs) boxMovs.style.display = 'none';

  if (modo === 'naval') {
    if (btnNaval) { btnNaval.style.background = 'var(--accent)'; btnNaval.style.color = '#fff'; }
    if (boxNaval) boxNaval.style.display = 'block';
    if (painelGeral) painelGeral.style.display = 'grid';
    renderizarTabuleiroNaval();
  } else if (modo === 'tabela') {
    if (btnTabela) { btnTabela.style.background = 'var(--accent)'; btnTabela.style.color = '#fff'; }
    if (boxTabela) boxTabela.style.display = 'block';
    if (painelGeral) painelGeral.style.display = 'grid';
    renderizarEstoque();
  } else if (modo === 'movs') {
    if (btnMovs) { btnMovs.style.background = 'var(--accent)'; btnMovs.style.color = '#fff'; }
    if (boxMovs) boxMovs.style.display = 'block';
    if (painelGeral) painelGeral.style.display = 'none';
    renderizarTabelaMovimentacoes();
  }
}
function renderizarTabuleiroNaval() {
  const board = document.getElementById('tabuleiroNaval');
  if (!board) return;
  board.innerHTML = '';

  board.style.gridTemplateColumns = `50px repeat(${totalColunasAtuais}, minmax(140px, 1fr))`;

  const itens = obterEstoque();
  const linhas = obterLinhasArray();
  const colunas = obterColunasArray();

  const topCorner = document.createElement('div');
  topCorner.className = 'navio-header-cell';
  topCorner.innerText = 'ARM';
  board.appendChild(topCorner);

  colunas.forEach(c => {
    const colHeader = document.createElement('div');
    colHeader.className = 'navio-header-cell';
    colHeader.innerText = `Coluna ${c}`;
    board.appendChild(colHeader);
  });

  linhas.forEach(linha => {
    const rowHeader = document.createElement('div');
    rowHeader.className = 'navio-header-cell';
    rowHeader.innerText = linha;
    board.appendChild(rowHeader);

    colunas.forEach(col => {
      const coord = `${linha}${col}`;
      const item = itens.find(i => i.local === coord);

      const slotBtn = document.createElement('button');
      slotBtn.type = 'button';
      slotBtn.className = 'navio-slot-btn';

      if (!item) {
        slotBtn.classList.add('slot-vazia');
        slotBtn.innerHTML = `
          <div class="slot-coord"><span>${coord}</span> <span style="font-size:10px; color:#94a3b8;">Vazia</span></div>
          <div class="slot-title" style="color:#94a3b8; font-weight:500;">Gaveta Livre</div>
          <div style="font-size:11px; color:#cbd5e1;">0 itens</div>
        `;
        slotBtn.onclick = () => abrirModalGaveta(coord, null);
      } else {
        const totalQtd = calcularTotalProduto(item);
        slotBtn.classList.add(totalQtd === 0 ? 'slot-esgotada' : (totalQtd <= item.qtdMin ? 'slot-baixa' : 'slot-ocupada'));

        slotBtn.innerHTML = `
          <div class="slot-coord"><span>${coord}</span></div>
          <div class="slot-title">${item.nome}</div>
          <div style="font-size:18px; font-weight:800; color:var(--primary);">${totalQtd} un</div>
        `;
        slotBtn.onclick = () => abrirModalGaveta(coord, item);
      }

      board.appendChild(slotBtn);
    });
  });
}

function abrirModalGaveta(coord, item) {
  document.getElementById('modalGavetaCoord').innerText = `Gaveta ${coord}`;
  const conteudo = document.getElementById('modalGavetaConteudo');

  if (!item) {
    conteudo.innerHTML = `
      <div style="text-align: center; padding: 28px 16px;">
        <div style="font-size: 32px; margin-bottom: 8px;">📭</div>
        <h4 style="color: var(--primary); font-size: 16px; margin-bottom: 4px;">Gaveta Vazia (${coord})</h4>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Nenhum produto alocado nesta gaveta no momento.</p>
        <button class="btn-primary" onclick="fecharModalGaveta(); abrirModalItemEstoqueParaGaveta('${coord}')">
          + Alocar Produto Nesta Gaveta
        </button>
      </div>
    `;
  } else {
    let catHtml = '';
    const categorias = item.categorias || [];

    if (categorias.length === 0) {
      catHtml = `
        <div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 13px; background: #f8fafc; border-radius: 8px;">
          Nenhuma categoria cadastrada nesta gaveta.
        </div>
      `;
    } else {
      categorias.forEach(c => {
        catHtml += `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid var(--border); background:#ffffff;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="tag-categoria" style="font-size:12px;">🏷️ ${c.nome}</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <strong style="font-size:14px; color:var(--primary); min-width:44px; text-align:right;">${c.qtd} un</strong>
              <button class="btn-qty" title="Diminuir 1 un" onclick="ajustarQtdCategoria('${item.id}', '${c.id}', -1)">−</button>
              <button class="btn-qty" title="Adicionar 1 un" onclick="ajustarQtdCategoria('${item.id}', '${c.id}', 1)">+</button>
              <button class="btn-qty" style="color:var(--danger); border-color:#fca5a5; margin-left:4px;" title="Apagar esta categoria" onclick="removerCategoriaDaGaveta('${item.id}', '${c.id}', '${c.nome}')">🗑️</button>
            </div>
          </div>
        `;
      });
    }

    const totalQtd = calcularTotalProduto(item);

    conteudo.innerHTML = `
      <div style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h3 style="color: var(--primary); margin:0 0 2px;">${item.nome}</h3>
          <span style="font-size:12px; color:#64748b;">SKU: ${item.sku} • Estoque Mínimo: ${item.qtdMin} un</span>
        </div>
        <div style="text-align:right;">
          <span style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700; display:block;">Total na Gaveta</span>
          <strong style="font-size:18px; color:var(--primary);">${totalQtd} un</strong>
        </div>
      </div>

      <div style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
        <div style="background:#f8fafc; padding:8px 12px; border-bottom:1px solid var(--border); font-size:11.5px; font-weight:700; color:#64748b; text-transform:uppercase;">
          Categorias & Saldos
        </div>
        ${catHtml}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; gap:8px;">
          <button type="button" class="action-btn" style="color:var(--accent); border-color:#bfdbfe; font-weight:700;" onclick="abrirModalNovaVarianteParaItem('${item.id}')">
            + Adicionar Categoria
          </button>
          <button type="button" class="action-btn" style="color:var(--danger); border-color:#fca5a5; font-weight:700; background:#fef2f2;" onclick="esvaziarGavetaCompleta('${item.id}', '${coord}', '${item.nome}')">
            🗑️ Esvaziar Gaveta
          </button>
        </div>
        <button type="button" class="btn-secondary" onclick="fecharModalGaveta()">Fechar</button>
      </div>
    `;
  }

  document.getElementById('modalGavetaNaval').style.display = 'flex';
}

function removerCategoriaDaGaveta(prodId, catId, catNome) {
  if (!confirm(`Tem certeza que deseja apagar a categoria "${catNome}" desta gaveta?\nO saldo e o registro dessa variação serão excluídos.`)) {
    return;
  }

  const itens = obterEstoque();
  const prod = itens.find(i => i.id === prodId);
  if (!prod) return;

  prod.categorias = (prod.categorias || []).filter(c => c.id !== catId);

  // Se ficou sem categorias, pergunta se deseja esvaziar a gaveta inteira
  if (prod.categorias.length === 0) {
    if (confirm(`A gaveta ${prod.local} ficou sem categorias. Deseja desocupar e esvaziar a gaveta completamente agora?`)) {
      const idx = itens.findIndex(i => i.id === prodId);
      if (idx !== -1) itens.splice(idx, 1);
      salvarEstoqueNoStorage(itens);
      renderizarEstoque();
      renderizarTabuleiroNaval();
      fecharModalGaveta();
      alert(`Gaveta ${prod.local} agora está livre e desocupada!`);
      return;
    }
  }

  salvarEstoqueNoStorage(itens);
  renderizarEstoque();
  renderizarTabuleiroNaval();
  abrirModalGaveta(prod.local, prod);
}

function esvaziarGavetaCompleta(prodId, coord, prodNome) {
  if (!confirm(`⚠️ ATENÇÃO: Deseja esvaziar e desocupar completamente a Gaveta ${coord} (${prodNome})?\n\nTodas as categorias e saldos alocados nela serão removidos do estoque físico.`)) {
    return;
  }

  const itens = obterEstoque().filter(i => i.id !== prodId);
  salvarEstoqueNoStorage(itens);

  renderizarEstoque();
  renderizarTabuleiroNaval();
  fecharModalGaveta();
  alert(`Gaveta ${coord} foi esvaziada e desocupada com sucesso!`);
}

function fecharModalGaveta() {
  document.getElementById('modalGavetaNaval').style.display = 'none';
}

function ajustarQtdCategoria(prodId, catId, variacao) {
  const itens = obterEstoque();
  const prod = itens.find(i => i.id === prodId);
  if (!prod) return;
  const cat = prod.categorias.find(c => c.id === catId);
  if (!cat || cat.qtd + variacao < 0) return;

  cat.qtd += variacao;
  salvarEstoqueNoStorage(itens);
  renderizarEstoque();
  renderizarTabuleiroNaval();
  abrirModalGaveta(prod.local, prod);
}

function abrirModalNovaVarianteParaItem(prodId) {
  document.getElementById('varProdutoId').value = prodId;
  popularSelectsEstoque();
  document.getElementById('modalAdicionarVariante').style.display = 'flex';
}

function fecharModalAdicionarVariante() {
  document.getElementById('modalAdicionarVariante').style.display = 'none';
}

function salvarNovaVariante(e) {
  e.preventDefault();
  const prodId = document.getElementById('varProdutoId').value;
  const catNome = document.getElementById('varCategoria').value;
  const qtd = parseInt(document.getElementById('varQtd').value);

  const itens = obterEstoque();
  const prod = itens.find(i => i.id === prodId);
  if (!prod) return;

  const existente = prod.categorias.find(c => c.nome === catNome);
  if (existente) existente.qtd += qtd;
  else prod.categorias.push({ id: "C" + Math.floor(Math.random() * 10000), nome: catNome, qtd });

  salvarEstoqueNoStorage(itens);
  fecharModalAdicionarVariante();
  renderizarEstoque();
  renderizarTabuleiroNaval();
  abrirModalGaveta(prod.local, prod);
}

function abrirModalItemEstoqueParaGaveta(coord) {
  abrirModalItemEstoque();
  document.getElementById('prodLocal').value = coord;
}

function filtrarEstoque(tipo, el) {
  filtroEstoqueAtual = tipo;
  el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderizarEstoque();
}

function renderizarEstoque() {
  const itens = obterEstoque();
  const tabela = document.getElementById('tabelaEstoqueCorpo');
  if (!tabela) return;
  tabela.innerHTML = '';

  let somaTotal = 0;
  itens.forEach(i => { somaTotal += calcularTotalProduto(i); });
  document.getElementById('metricEstoqueTotal').innerText = somaTotal;
  document.getElementById('menuEstoqueBadge').innerText = somaTotal;

  itens.forEach(i => {
    const totalQtd = calcularTotalProduto(i);
    const catNomes = i.categorias.map(c => `${c.nome}: ${c.qtd} un`).join(', ');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${i.sku}</strong></td>
      <td><strong>${i.nome}</strong> (Gaveta ${i.local})</td>
      <td>${catNomes}</td>
      <td><strong>${totalQtd} un</strong></td>
      <td>${i.qtdMin} un</td>
      <td><span class="status-badge ${totalQtd > 0 ? 'status-ok' : 'status-esgotado'}">${totalQtd > 0 ? 'Disponível' : 'Esgotado'}</span></td>
      <td style="text-align: right;"><button class="action-btn" onclick="abrirModalGaveta('${i.local}', obterEstoque().find(item => item.id === '${i.id}'))">Ver Detalhes</button></td>
    `;
    tabela.appendChild(tr);
  });
}

function abrirModalItemEstoque() {
  popularSelectsEstoque();
  document.getElementById('prodIdEdit').value = '';
  document.getElementById('prodNome').value = '';
  document.getElementById('prodQtd').value = '10';
  document.getElementById('modalEstoque').style.display = 'flex';
}

function fecharModalEstoque() {
  document.getElementById('modalEstoque').style.display = 'none';
}

function salvarItemEstoque(e) {
  e.preventDefault();
  const itens = obterEstoque();
  const nome = document.getElementById('prodNome').value.trim();
  const cat = document.getElementById('prodCategoria').value;
  const local = document.getElementById('prodLocal').value;
  const qtd = parseInt(document.getElementById('prodQtd').value);
  const qtdMin = parseInt(document.getElementById('prodQtdMin').value);

  itens.push({
    id: "EST-" + (itens.length + 101),
    sku: "MOD-" + Math.floor(100 + Math.random() * 900),
    nome,
    local,
    qtdMin,
    categorias: [{ id: "C" + Math.floor(Math.random() * 10000), nome: cat, qtd }]
  });

  salvarEstoqueNoStorage(itens);
  fecharModalEstoque();
  renderizarEstoque();
  renderizarTabuleiroNaval();
}


// ====================================================
// GESTÃO DE DEPARTAMENTOS & MATRIZ RBAC
// ====================================================
function renderizarTabelaDepartamentos() {
  const deptos = obterDepartamentos();
  const usuarios = obterUsuarios();
  const tabela = document.getElementById('tabelaDepartamentosCorpo');
  const badge = document.getElementById('menuDeptosBadge');
  if (badge) badge.innerText = deptos.length;
  if (!tabela) return;
  tabela.innerHTML = '';

  deptos.forEach(d => {
    const qtdMembros = usuarios.filter(u => u.deptoId === d.id).length;
    const p = d.permissoes || {};

    const badgesHtml = `
      <span class="perm-badge ${p.pedidos_criar ? 'on' : 'off'}">Criar Chamados</span>
      <span class="perm-badge ${p.pedidos_atender ? 'on' : 'off'}">Atender Chamados</span>
      <span class="perm-badge ${p.estoque_gerenciar ? 'on' : 'off'}">Gerir Estoque</span>
      <span class="perm-badge ${p.vendas_operar ? 'on' : 'off'}">Vendas</span>
      <span class="perm-badge ${p.chat_acessar ? 'on' : 'off'}">Chat</span>
      <span class="perm-badge ${p.admin_ti ? 'admin' : 'off'}">Admin TI</span>
    `;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${d.id}</strong></td>
      <td><strong>${d.nome}</strong></td>
      <td>${badgesHtml}</td>
      <td><span class="badge-count" style="background:#e2e8f0; color:#334155;">${qtdMembros} colaboradores</span></td>
      <td style="text-align: right; white-space: nowrap;">
        <button type="button" class="action-btn" onclick="editarDepartamento('${d.id}')">✏️ Permissões</button>
        ${d.id !== 'DEP-TI' ? `<button type="button" class="action-btn" style="color:var(--danger); border-color:#fca5a5; margin-left:4px;" onclick="excluirDepartamento('${d.id}')">🗑️</button>` : ''}
      </td>
    `;
    tabela.appendChild(tr);
  });
}

function abrirModalDepartamento() {
  document.getElementById('deptoIdEdit').value = '';
  document.getElementById('deptoNome').value = '';
  document.getElementById('modalDeptoTitulo').innerText = 'Novo Departamento';
  document.getElementById('chkPermPedidosCriar').checked = true;
  document.getElementById('chkPermPedidosAtender').checked = false;
  document.getElementById('chkPermEstoque').checked = false;
  document.getElementById('chkPermVendas').checked = true;
  document.getElementById('chkPermChat').checked = true;
  document.getElementById('chkPermAdmin').checked = false;
  document.getElementById('modalDepartamento').style.display = 'flex';
}

function fecharModalDepartamento() {
  document.getElementById('modalDepartamento').style.display = 'none';
}

function editarDepartamento(id) {
  const deptos = obterDepartamentos();
  const d = deptos.find(item => item.id === id);
  if (!d) return;

  document.getElementById('deptoIdEdit').value = d.id;
  document.getElementById('deptoNome').value = d.nome;
  document.getElementById('modalDeptoTitulo').innerText = `Editar ${d.nome}`;

  const p = d.permissoes || {};
  document.getElementById('chkPermPedidosCriar').checked = !!p.pedidos_criar;
  document.getElementById('chkPermPedidosAtender').checked = !!p.pedidos_atender;
  document.getElementById('chkPermEstoque').checked = !!p.estoque_gerenciar;
  document.getElementById('chkPermVendas').checked = !!p.vendas_operar;
  document.getElementById('chkPermChat').checked = !!p.chat_acessar;
  document.getElementById('chkPermAdmin').checked = !!p.admin_ti;

  document.getElementById('modalDepartamento').style.display = 'flex';
}

function salvarDepartamento(e) {
  e.preventDefault();
  const idEdit = document.getElementById('deptoIdEdit').value;
  const nome = document.getElementById('deptoNome').value.trim();
  const deptos = obterDepartamentos();

  const permissoes = {
    pedidos_criar: document.getElementById('chkPermPedidosCriar').checked,
    pedidos_atender: document.getElementById('chkPermPedidosAtender').checked,
    estoque_gerenciar: document.getElementById('chkPermEstoque').checked,
    vendas_operar: document.getElementById('chkPermVendas').checked,
    chat_acessar: document.getElementById('chkPermChat').checked,
    admin_ti: document.getElementById('chkPermAdmin').checked
  };

  if (idEdit) {
    const d = deptos.find(item => item.id === idEdit);
    if (d) {
      d.nome = nome;
      d.permissoes = permissoes;
    }
  } else {
    const novoId = "DEP-" + (deptos.length + 101);
    deptos.push({ id: novoId, nome: nome, permissoes: permissoes });
  }

  salvarDepartamentosNoStorage(deptos);
  fecharModalDepartamento();
  renderizarTabelaDepartamentos();
  atualizarSelectDepartamentosCadastro();
  aplicarPermissoesInterface();
}

function excluirDepartamento(id) {
  if (id === 'DEP-TI') {
    alert("O departamento de TI é essencial e não pode ser excluído.");
    return;
  }
  const usuarios = obterUsuarios();
  if (usuarios.some(u => u.deptoId === id)) {
    alert("Não é possível excluir um departamento que ainda possui colaboradores vinculados.");
    return;
  }
  if (!confirm("Deseja realmente excluir este departamento?")) return;

  const deptos = obterDepartamentos().filter(d => d.id !== id);
  salvarDepartamentosNoStorage(deptos);
  renderizarTabelaDepartamentos();
  atualizarSelectDepartamentosCadastro();
}

function aplicarPermissoesInterface() {
  if (!usuarioLogado) return;
  const deptos = obterDepartamentos();
  const depto = deptos.find(d => d.id === usuarioLogado.deptoId);
  const p = depto ? (depto.permissoes || {}) : { admin_ti: false };

  // Controla exibição da aba de Governança TI
  const navItemDeptos = document.getElementById('navItemDepartamentos');
  const catAdmin = document.getElementById('sidebarCatAdmin');
  if (navItemDeptos) navItemDeptos.style.display = p.admin_ti ? 'flex' : 'none';
  if (catAdmin) catAdmin.style.display = p.admin_ti ? 'block' : 'none';

  // Se estiver sem permissão de admin e tentar acessar, redireciona para vendas
  const tabDeptos = document.getElementById('tab-departamentos');
  if (!p.admin_ti && tabDeptos && tabDeptos.classList.contains('active')) {
    switchTab('vendas');
  }
}


// ====================================================
// 16. INICIALIZAÇÃO
// ====================================================
window.addEventListener('DOMContentLoaded', () => {
  carregarDimensoes();
  atualizarSelectDepartamentosCadastro();
});

// ====================================================
// 17. BACKUP E RESTAURAÇÃO DE DADOS (JSON)
// ====================================================
function exportarBackupEstoque() {
  const dadosBackup = {
    sistema: "Davisory Portal Corporativo",
    versao: "2.0",
    dataExportacao: new Date().toISOString(),
    dimensoes: localStorage.getItem('davisory_estoque_dimensoes'),
    atributos: localStorage.getItem('davisory_estoque_atributos_v3'),
    estoque: localStorage.getItem('davisory_estoque_cat_v3'),
    vendas: localStorage.getItem('davisory_vendas_v1'),
    pedidos: localStorage.getItem('davisory_pedidos_v1'),
    movimentacoes: localStorage.getItem('davisory_movimentacoes_v1'),
    usuarios: localStorage.getItem('davisory_usuarios'),
    statusUsuarios: localStorage.getItem('davisory_usuarios_status_v1'),
    departamentos: localStorage.getItem('davisory_departamentos')
  };

  const jsonStr = JSON.stringify(dadosBackup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const dataHoje = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `davisory_backup_${dataHoje}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importarBackupEstoque() {
  const input = document.getElementById('inputArquivoBackup');
  if (input) {
    input.value = '';
    input.click();
  }
}

function processarArquivoBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);

      if (!backup || (!backup.estoque && !backup.sistema)) {
        alert("O arquivo selecionado não parece ser um backup válido da Davisory.");
        return;
      }

      if (!confirm("⚠️ ATENÇÃO: A restauração substituirá os dados atuais pelo arquivo selecionado.\nDeseja continuar?")) {
        return;
      }

      if (backup.dimensoes) localStorage.setItem('davisory_estoque_dimensoes', backup.dimensoes);
      if (backup.atributos) localStorage.setItem('davisory_estoque_atributos_v3', backup.atributos);
      if (backup.estoque) localStorage.setItem('davisory_estoque_cat_v3', backup.estoque);
      if (backup.vendas) localStorage.setItem('davisory_vendas_v1', backup.vendas);
      if (backup.pedidos) localStorage.setItem('davisory_pedidos_v1', backup.pedidos);
      if (backup.movimentacoes) localStorage.setItem('davisory_movimentacoes_v1', backup.movimentacoes);
      if (backup.usuarios) localStorage.setItem('davisory_usuarios', backup.usuarios);
      if (backup.statusUsuarios) localStorage.setItem('davisory_usuarios_status_v1', backup.statusUsuarios);
      if (backup.departamentos) localStorage.setItem('davisory_departamentos', backup.departamentos);

      carregarDimensoes();
      popularSelectsEstoque();
      renderizarEstoque();
      renderizarTabuleiroNaval();
      renderizarTabelaVendas();
      renderizarPedidos();
      renderizarTabelaMovimentacoes();
      renderizarListaUsuariosChat();

      alert("✅ Dados restaurados com sucesso a partir do arquivo de cópia de segurança!");
    } catch (err) {
      alert("Erro ao ler o arquivo JSON de backup: " + err.message);
    }
  };

  reader.readAsText(file);
}
