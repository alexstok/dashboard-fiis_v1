/**
 * alertas.js - Sistema de alertas com monitoramento em tempo real
 */

// Dados globais
let dadosFIIs = [];
let alertas = [];
let notificacoes = [];

// Inicializar monitoramento em tempo real
let unsubscribe = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Atualizar data
        document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Carregar dados
        dadosFIIs = await API.buscarDadosFIIs();
        carregarAlertas();
        carregarNotificacoes();
        
        // Popular select de FIIs
        const select = document.getElementById('alerta-ticker');
        dadosFIIs.sort((a, b) => a.ticker.localeCompare(b.ticker))
            .forEach(fii => {
                const option = document.createElement('option');
                option.value = fii.ticker;
                option.textContent = `${fii.ticker} - ${fii.segmento}`;
                select.appendChild(option);
            });
        
        // Configurar eventos
        configurarEventos();
        
        // Renderizar tabelas
        renderizarTabelaAlertas();
        renderizarListaNotificacoes();
        
        // Verificar parâmetros URL
        verificarParametrosURL();
        
        // Iniciar monitoramento em tempo real
        unsubscribe = realtimeMonitor.subscribe('alertas', (dadosAtualizados) => {
            dadosFIIs = dadosAtualizados;
            realtimeMonitor.verificarAlertas(dadosAtualizados);
            renderizarTabelaAlertas();
            document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        });
        
    } catch (error) {
        console.error('Erro ao inicializar alertas:', error);
        notify.error('Erro ao carregar dados. Tente novamente mais tarde.');
    }
});

// Parar monitoramento ao sair da página
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});

// Verificar parâmetros URL
function verificarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const ticker = urlParams.get('ticker');
    if (ticker) {
        document.getElementById('alerta-ticker').value = ticker;
    }
}

// Renderizar tabela de alertas otimizada
const renderizarTabelaAlertas = renderManager.debounce(() => {
    renderManager.enqueue('tabela-alertas', () => {
        const tbody = document.querySelector('#tabela-alertas tbody');
        const fragment = document.createDocumentFragment();
        
        tbody.innerHTML = '';
        
        // Ordenar alertas por data de criação (mais recentes primeiro)
        const alertasOrdenados = [...alertas].sort((a, b) => 
            new Date(b.dataCriacao) - new Date(a.dataCriacao)
        );
        
        alertasOrdenados.forEach(alerta => {
            const tr = document.createElement('tr');
            const fii = dadosFIIs.find(f => f.ticker === alerta.ticker);
            
            let valor = alerta.valor;
            if (alerta.tipo.includes('preco')) {
                valor = `R$ ${valor.toFixed(2)}`;
            } else {
                valor = `${valor.toFixed(2)}%`;
            }
            
            let status = 'Pendente';
            let statusClass = 'bg-secondary';
            
            if (fii) {
                const valorAtual = alerta.tipo.includes('preco') ? 
                    fii.precoAtual : 
                    alerta.tipo.includes('dy') ? 
                        fii.dyAnual : 
                        fii.pvp;
                        
                if (alerta.tipo.includes('acima') && valorAtual >= alerta.valor) {
                    status = 'Atingido';
                    statusClass = 'bg-success';
                } else if (alerta.tipo.includes('abaixo') && valorAtual <= alerta.valor) {
                    status = 'Atingido';
                    statusClass = 'bg-success';
                }
            }
            
            tr.innerHTML = `
                <td>${alerta.ticker}</td>
                <td>${alerta.tipo.replace('-', ' ').toUpperCase()}</td>
                <td>${valor}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
                <td>${new Date(alerta.dataCriacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-${alerta.ativo ? 'success' : 'secondary'}" onclick="toggleAlerta(${alerta.id})">
                            <i class="bi bi-${alerta.ativo ? 'bell' : 'bell-slash'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="removerAlerta(${alerta.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            fragment.appendChild(tr);
        });
        
        tbody.appendChild(fragment);
    }, 0); // Prioridade normal
}, 200);

// Renderizar lista de notificações otimizada
const renderizarListaNotificacoes = renderManager.debounce(() => {
    renderManager.enqueue('lista-notificacoes', () => {
        const lista = document.getElementById('lista-notificacoes');
        const fragment = document.createDocumentFragment();
        
        lista.innerHTML = '';
        
        // Ordenar notificações por data (mais recentes primeiro)
        const notificacoesOrdenadas = [...notificacoes].sort((a, b) => 
            new Date(b.data) - new Date(a.data)
        );
        
        // Limitar a 50 notificações mais recentes
        notificacoesOrdenadas.slice(0, 50).forEach(notificacao => {
            const div = document.createElement('div');
            div.className = 'list-group-item';
            div.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${notificacao.titulo}</h6>
                    <small>${new Date(notificacao.data).toLocaleString('pt-BR')}</small>
                </div>
                <p class="mb-1">${notificacao.mensagem}</p>
            `;
            fragment.appendChild(div);
        });
        
        lista.appendChild(fragment);
    }, 0); // Prioridade normal
}, 200);

// Funções de manipulação de alertas
function toggleAlerta(id) {
    const alerta = alertas.find(a => a.id === id);
    if (alerta) {
        alerta.ativo = !alerta.ativo;
        secureStorage.setItem('alertas-fiis', alertas);
        renderizarTabelaAlertas();
        notify.success(`Alerta ${alerta.ativo ? 'ativado' : 'desativado'} com sucesso!`);
    }
}

function removerAlerta(id) {
    if (!confirm('Tem certeza que deseja remover este alerta?')) return;
    
    const alertaIndex = alertas.findIndex(a => a.id === id);
    if (alertaIndex !== -1) {
        alertas.splice(alertaIndex, 1);
        secureStorage.setItem('alertas-fiis', alertas);
        renderizarTabelaAlertas();
        notify.success('Alerta removido com sucesso!');
    }
}

// Exportar funções para uso global
window.toggleAlerta = toggleAlerta;
window.removerAlerta = removerAlerta;
