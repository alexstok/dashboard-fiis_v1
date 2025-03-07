/**
 * alertas.js - Script para a página de alertas
 */

// Dados globais
let dadosFIIs = [];
let alertas = [];
let notificacoes = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Atualizar data
        document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Carregar dados dos FIIs
        dadosFIIs = await API.buscarDadosFIIs();
        
        // Carregar alertas
        carregarAlertas();
        
        // Carregar notificações
        carregarNotificacoes();
        
        // Verificar parâmetros da URL
        verificarParametrosURL();
        
        // Preencher select de FIIs
        preencherSelectFIIs();
        
        // Renderizar tabelas
        renderizarTabelaAlertas();
        renderizarListaNotificacoes();
        
        // Configurar eventos
        configurarEventos();
        
        // Verificar alertas
        verificarAlertas();
        
    } catch (error) {
        console.error('Erro ao inicializar alertas:', error);
        alert('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    }
});

// Carregar alertas
function carregarAlertas() {
    alertas = JSON.parse(localStorage.getItem('alertas-fiis')) || [];
}

// Carregar notificações
function carregarNotificacoes() {
    notificacoes = JSON.parse(localStorage.getItem('notificacoes-fiis')) || [];
}

// Verificar parâmetros da URL
function verificarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const ticker = urlParams.get('ticker');
    
    if (ticker) {
        document.getElementById('alerta-ticker').value = ticker;
    }
}

// Preencher select de FIIs
function preencherSelectFIIs() {
    const select = document.getElementById('alerta-ticker');
    
    // Limpar opções existentes
    select.innerHTML = '';
    
    // Adicionar opção vazia
    const optionVazia = document.createElement('option');
    optionVazia.value = '';
    optionVazia.textContent = 'Selecione um FII';
    select.appendChild(optionVazia);
    
    // Adicionar opções de FIIs
    dadosFIIs.forEach(fii => {
        const option = document.createElement('option');
        option.value = fii.ticker;
        option.textContent = `${fii.ticker} - ${fii.segmento} - R$ ${fii.precoAtual.toFixed(2)}`;
        select.appendChild(option);
    });
}

// Renderizar tabela de alertas
function renderizarTabelaAlertas() {
    const tbody = document.querySelector('#tabela-alertas tbody');
    tbody.innerHTML = '';
    
    alertas.forEach(alerta => {
        const tr = document.createElement('tr');
        
        // Buscar FII
        const fii = dadosFIIs.find(f => f.ticker === alerta.ticker);
        
        // Verificar status do alerta
        let status = 'Pendente';
        let statusClass = 'bg-secondary';
        
        if (fii) {
            let condicaoAtendida = false;
            
            switch (alerta.tipo) {
                case 'preco-acima':
                    condicaoAtendida = fii.precoAtual >= alerta.valor;
                    break;
                case 'preco-abaixo':
                    condicaoAtendida = fii.precoAtual <= alerta.valor;
                    break;
                                case 'dy-acima':
                    condicaoAtendida = fii.dyAnual >= alerta.valor;
                    break;
                case 'dy-abaixo':
                    condicaoAtendida = fii.dyAnual <= alerta.valor;
                    break;
                case 'pvp-acima':
                    condicaoAtendida = fii.pvp >= alerta.valor;
                    break;
                case 'pvp-abaixo':
                    condicaoAtendida = fii.pvp <= alerta.valor;
                    break;
            }
            
            if (condicaoAtendida) {
                status = 'Atingido';
                statusClass = 'bg-success';
            }
        }
        
        // Formatar tipo de alerta
        let tipoFormatado = '';
        switch (alerta.tipo) {
            case 'preco-acima':
                tipoFormatado = 'Preço acima de';
                break;
            case 'preco-abaixo':
                tipoFormatado = 'Preço abaixo de';
                break;
            case 'dy-acima':
                tipoFormatado = 'DY acima de';
                break;
            case 'dy-abaixo':
                tipoFormatado = 'DY abaixo de';
                break;
            case 'pvp-acima':
                tipoFormatado = 'P/VP acima de';
                break;
            case 'pvp-abaixo':
                tipoFormatado = 'P/VP abaixo de';
                break;
        }
        
        // Formatar valor
        let valorFormatado = alerta.valor;
        if (alerta.tipo.startsWith('preco')) {
            valorFormatado = `R$ ${alerta.valor.toFixed(2)}`;
        } else if (alerta.tipo.startsWith('dy')) {
            valorFormatado = `${alerta.valor.toFixed(2)}%`;
        }
        
        // Formatar data
        const dataCriacao = new Date(alerta.dataCriacao).toLocaleDateString('pt-BR');
        
        tr.innerHTML = `
            <td>${alerta.ticker}</td>
            <td>${tipoFormatado}</td>
            <td>${valorFormatado}</td>
            <td><span class="badge ${statusClass}">${status}</span></td>
            <td>${dataCriacao}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removerAlerta(${alerta.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Renderizar lista de notificações
function renderizarListaNotificacoes() {
    const listaNotificacoes = document.getElementById('lista-notificacoes');
    listaNotificacoes.innerHTML = '';
    
    // Ordenar notificações por data (mais recentes primeiro)
    const notificacoesOrdenadas = [...notificacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Limitar a 10 notificações mais recentes
    const notificacoesRecentes = notificacoesOrdenadas.slice(0, 10);
    
    if (notificacoesRecentes.length === 0) {
        listaNotificacoes.innerHTML = '<div class="alert alert-info">Nenhuma notificação recente.</div>';
        return;
    }
    
    notificacoesRecentes.forEach(notificacao => {
        const data = new Date(notificacao.data).toLocaleString('pt-BR');
        
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action';
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${notificacao.titulo}</h5>
                <small>${data}</small>
            </div>
            <p class="mb-1">${notificacao.mensagem}</p>
        `;
        
        listaNotificacoes.appendChild(item);
    });
}

// Configurar eventos
function configurarEventos() {
    // Formulário de alerta
    document.getElementById('form-alerta').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const ticker = document.getElementById('alerta-ticker').value;
        const tipo = document.getElementById('alerta-tipo').value;
        const valor = parseFloat(document.getElementById('alerta-valor').value);
        
        if (!ticker || !tipo || isNaN(valor)) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }
        
        // Criar novo alerta
        const novoAlerta = {
            id: Date.now(),
            ticker,
            tipo,
            valor,
            ativo: true,
            dataCriacao: new Date().toISOString()
        };
        
        // Adicionar à lista de alertas
        alertas.push(novoAlerta);
        localStorage.setItem('alertas-fiis', JSON.stringify(alertas));
        
        // Atualizar tabela
        renderizarTabelaAlertas();
        
        // Limpar formulário
        document.getElementById('form-alerta').reset();
        
        alert('Alerta criado com sucesso!');
    });
    
    // Botão de limpar alertas
    document.getElementById('limpar-alertas').addEventListener('click', () => {
        if (!confirm('Tem certeza que deseja limpar todos os alertas?')) return;
        
        alertas = [];
        localStorage.setItem('alertas-fiis', JSON.stringify(alertas));
        
        renderizarTabelaAlertas();
        
        alert('Todos os alertas foram removidos!');
    });
    
    // Evento de mudança no tipo de alerta (ajustar label)
    document.getElementById('alerta-tipo').addEventListener('change', (e) => {
        const tipo = e.target.value;
        const labelValor = document.querySelector('label[for="alerta-valor"]');
        
        if (tipo.startsWith('preco')) {
            labelValor.textContent = 'Valor (R$)';
        } else if (tipo.startsWith('dy')) {
            labelValor.textContent = 'Valor (%)';
        } else if (tipo.startsWith('pvp')) {
            labelValor.textContent = 'Valor';
        }
    });
}

// Verificar alertas
function verificarAlertas() {
    if (alertas.length === 0) return;
    
    const novasNotificacoes = [];
    
    alertas.forEach(alerta => {
        if (!alerta.ativo) return;
        
        const fii = dadosFIIs.find(f => f.ticker === alerta.ticker);
        if (!fii) return;
        
        let condicaoAtendida = false;
        let mensagem = '';
        
        switch (alerta.tipo) {
            case 'preco-acima':
                condicaoAtendida = fii.precoAtual >= alerta.valor;
                mensagem = `${fii.ticker} atingiu preço acima de R$${alerta.valor.toFixed(2)} (Atual: R$${fii.precoAtual.toFixed(2)})`;
                break;
            case 'preco-abaixo':
                condicaoAtendida = fii.precoAtual <= alerta.valor;
                mensagem = `${fii.ticker} atingiu preço abaixo de R$${alerta.valor.toFixed(2)} (Atual: R$${fii.precoAtual.toFixed(2)})`;
                break;
            case 'dy-acima':
                condicaoAtendida = fii.dyAnual >= alerta.valor;
                mensagem = `${fii.ticker} atingiu DY acima de ${alerta.valor.toFixed(2)}% (Atual: ${fii.dyAnual.toFixed(2)}%)`;
                break;
            case 'dy-abaixo':
                condicaoAtendida = fii.dyAnual <= alerta.valor;
                mensagem = `${fii.ticker} atingiu DY abaixo de ${alerta.valor.toFixed(2)}% (Atual: ${fii.dyAnual.toFixed(2)}%)`;
                break;
            case 'pvp-acima':
                condicaoAtendida = fii.pvp >= alerta.valor;
                mensagem = `${fii.ticker} atingiu P/VP acima de ${alerta.valor.toFixed(2)} (Atual: ${fii.pvp.toFixed(2)})`;
                break;
            case 'pvp-abaixo':
                condicaoAtendida = fii.pvp <= alerta.valor;
                mensagem = `${fii.ticker} atingiu P/VP abaixo de ${alerta.valor.toFixed(2)} (Atual: ${fii.pvp.toFixed(2)})`;
                break;
        }
        
        if (condicaoAtendida) {
            // Verificar se já existe notificação recente para este alerta
            const notificacaoExistente = notificacoes.find(n => 
                n.titulo.includes(fii.ticker) && 
                n.mensagem === mensagem &&
                (new Date() - new Date(n.data)) < 24 * 60 * 60 * 1000 // Menos de 24h
            );
            
            if (!notificacaoExistente) {
                // Criar nova notificação
                const novaNotificacao = {
                    id: Date.now(),
                    titulo: `Alerta FII: ${fii.ticker}`,
                    mensagem,
                    data: new Date().toISOString()
                };
                
                novasNotificacoes.push(novaNotificacao);
            }
        }
    });
    
    // Adicionar novas notificações
    if (novasNotificacoes.length > 0) {
        notificacoes = [...novasNotificacoes, ...notificacoes];
        localStorage.setItem('notificacoes-fiis', JSON.stringify(notificacoes));
        
        // Atualizar lista de notificações
        renderizarListaNotificacoes();
        
        // Exibir notificações na tela
        exibirNotificacoes(novasNotificacoes);
    }
}

// Exibir notificações na tela
function exibirNotificacoes(notificacoesParaExibir) {
    notificacoesParaExibir.forEach(notificacao => {
        // Verificar se o navegador suporta notificações
        if ('Notification' in window) {
            // Verificar permissão
            if (Notification.permission === 'granted') {
                // Criar notificação
                new Notification(notificacao.titulo, {
                    body: notificacao.mensagem,
                    icon: '/img/logo.png'
                });
            } else if (Notification.permission !== 'denied') {
                // Solicitar permissão
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(notificacao.titulo, {
                            body: notificacao.mensagem,
                            icon: '/img/logo.png'
                        });
                    }
                });
            }
        }
        
        // Exibir alerta na página
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show';
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            <strong>${notificacao.titulo}</strong>
            <p>${notificacao.mensagem}</p>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.insertBefore(alertDiv, document.body.firstChild);
        
        // Remover alerta após 5 segundos
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 500);
        }, 5000);
    });
}

// Remover alerta
function removerAlerta(id) {
    if (!confirm('Tem certeza que deseja remover este alerta?')) return;
    
    const alertaIndex = alertas.findIndex(a => a.id === id);
    if (alertaIndex !== -1) {
        alertas.splice(alertaIndex, 1);
        localStorage.setItem('alertas-fiis', JSON.stringify(alertas));
        
        renderizarTabelaAlertas();
        
        alert('Alerta removido com sucesso!');
    }
}

// Exportar funções para uso global
window.removerAlerta = removerAlerta;

// Verificar alertas periodicamente
setInterval(verificarAlertas, 60000); // Verificar a cada minuto
