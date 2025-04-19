/**
 * monitoramento.js - Script para a página de monitoramento de FIIs
 * Versão atualizada com sistema de renderização otimizada
 */

// Dados globais
let dadosFIIs = [];
let filtrosAtivos = {
    segmentos: ['Recebíveis', 'Logístico', 'Shopping', 'Escritórios', 'Fundo de Fundos', 'Híbrido'],
    dyMinimo: 8,
    pvpMaximo: 1,
    scoreMinimo: 60
};

// Inicializar monitoramento em tempo real
let unsubscribe = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Atualizar data
        document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Carregar dados dos FIIs
        await atualizarDados();
        
        // Configurar eventos
        configurarEventos();
        
        // Iniciar monitoramento em tempo real
        unsubscribe = realtimeMonitor.subscribe('monitoramento', (dadosAtualizados) => {
            dadosFIIs = dadosAtualizados;
            renderizarTabela();
            document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
            notify.success('Dados atualizados com sucesso!');
        });
        
    } catch (error) {
        console.error('Erro ao inicializar monitoramento:', error);
        notify.error('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    }
});

// Parar monitoramento ao sair da página
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});

// Atualizar dados dos FIIs
async function atualizarDados() {
    try {
        // Mostrar indicador de carregamento
        const tbody = document.querySelector('#tabela-fiis tbody');
        tbody.innerHTML = '<tr><td colspan="14" class="text-center">Carregando dados...</td></tr>';
        
        // Buscar dados atualizados
        dadosFIIs = await API.buscarDadosFIIs();
        
        // Renderizar tabela com novos dados
        renderizarTabela();
        
        notify.success('Dados atualizados com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        notify.error('Erro ao atualizar dados. Tente novamente.');
    }
}

// Renderizar tabela de FIIs
const renderizarTabela = renderManager.debounce(() => {
    renderManager.enqueue('tabela-fiis', () => {
        const tbody = document.querySelector('#tabela-fiis tbody');
        tbody.innerHTML = '';
        
        // Filtrar FIIs
        const fiisFiltrados = dadosFIIs.filter(fii => 
            filtrosAtivos.segmentos.includes(fii.segmento) &&
            fii.dyAnual >= filtrosAtivos.dyMinimo &&
            fii.pvp <= filtrosAtivos.pvpMaximo &&
            fii.score >= filtrosAtivos.scoreMinimo &&
            fii.precoAtual <= 25 // Filtro fixo de preço máximo
        );
        
        // Ordenar por score
        const fiisOrdenados = [...fiisFiltrados].sort((a, b) => b.score - a.score);
        
        // Limitar aos top 30
        const fiisTop30 = fiisOrdenados.slice(0, 30);
        
        fiisTop30.forEach(fii => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fii.ticker}</td>
                <td>${fii.segmento}</td>
                <td>R$ ${fii.precoAtual.toFixed(2)}</td>
                <td>R$ ${fii.precoJusto.toFixed(2)}</td>
                <td>${((fii.precoJusto / fii.precoAtual - 1) * 100).toFixed(2)}%</td>
                <td>R$ ${fii.ultimoDividendo.toFixed(2)}</td>
                <td>${(fii.dyAnual / 12).toFixed(2)}%</td>
                <td>${fii.dyAnual.toFixed(2)}%</td>
                <td>${fii.pvp.toFixed(2)}</td>
                <td>${fii.capRate?.toFixed(2) || '-'}%</td>
                <td>${fii.ffoYield?.toFixed(2) || '-'}%</td>
                <td>${fii.vacanciaFisica?.toFixed(2) || '-'}%</td>
                <td>${fii.score.toFixed(0)}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="window.location.href='carteira.html?adicionar=${fii.ticker}'">
                        <i class="bi bi-plus-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="window.location.href='alertas.html?ticker=${fii.ticker}'">
                        <i class="bi bi-bell"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="mostrarDetalhesFII('${fii.ticker}')">
                        <i class="bi bi-info-circle"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }, 1); // Alta prioridade
}, 200);

// Configurar eventos
function configurarEventos() {
    // Botão de atualizar dados
    document.getElementById('atualizar-dados').addEventListener('click', async () => {
        try {
            // Mostrar loading
            const button = document.getElementById('atualizar-dados');
            const iconOriginal = button.innerHTML;
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Atualizando...';
            button.disabled = true;
            
            // Forçar atualização imediata
            await realtimeMonitor.update();
            
            // Restaurar botão
            button.innerHTML = iconOriginal;
            button.disabled = false;
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            notify.error('Erro ao atualizar dados. Tente novamente.');
        }
    });
    
    // Aplicar filtros
    document.getElementById('aplicar-filtros').addEventListener('click', () => {
        // Coletar segmentos selecionados
        filtrosAtivos.segmentos = [];
        ['recebiveis', 'logistico', 'shopping', 'escritorios', 'fof', 'hibrido'].forEach(id => {
            const checkbox = document.getElementById(`filtro-${id}`);
            if (checkbox.checked) {
                filtrosAtivos.segmentos.push(checkbox.value);
            }
        });
        
        // Coletar outros filtros
        filtrosAtivos.dyMinimo = parseFloat(document.getElementById('filtro-dy-min').value);
        filtrosAtivos.pvpMaximo = parseFloat(document.getElementById('filtro-pvp-max').value);
        filtrosAtivos.scoreMinimo = parseInt(document.getElementById('filtro-score-min').value);
        
        // Salvar preferências
        const prefs = preferenciasUsuario.carregar();
        prefs.filtrosPadrao = { ...filtrosAtivos };
        preferenciasUsuario.salvar(prefs);
        
        // Renderizar tabela com novos filtros
        renderizarTabela();
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('filtrosModal'));
        modal.hide();
        
        notify.success('Filtros aplicados com sucesso!');
    });
}

// Mostrar detalhes do FII
const mostrarDetalhesFII = renderManager.debounce((ticker) => {
    renderManager.enqueue('detalhes-fii', async () => {
        try {
            const fii = dadosFIIs.find(f => f.ticker === ticker);
            if (!fii) throw new Error('FII não encontrado');
            
            const detalhesDiv = document.getElementById('detalhes-fii');
            detalhesDiv.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h4>${fii.ticker} - ${fii.segmento}</h4>
                        <p><strong>Preço Atual:</strong> R$ ${fii.precoAtual.toFixed(2)}</p>
                        <p><strong>Dividend Yield Anual:</strong> ${fii.dyAnual.toFixed(2)}%</p>
                        <p><strong>P/VP:</strong> ${fii.pvp.toFixed(2)}</p>
                        <p><strong>Último Dividendo:</strong> R$ ${fii.ultimoDividendo.toFixed(2)}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Score:</strong> ${fii.score.toFixed(0)}/100</p>
                        <p><strong>Vacância Física:</strong> ${fii.vacanciaFisica?.toFixed(2) || '-'}%</p>
                        <p><strong>Vacância Financeira:</strong> ${fii.vacanciaFinanceira?.toFixed(2) || '-'}%</p>
                        <p><strong>Liquidez Diária:</strong> R$ ${(fii.liquidezDiaria || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-12">
                        <div class="btn-group">
                            <button class="btn btn-primary" onclick="window.location.href='carteira.html?adicionar=${fii.ticker}'">
                                <i class="bi bi-plus-circle"></i> Adicionar à Carteira
                            </button>
                            <button class="btn btn-warning" onclick="window.location.href='alertas.html?ticker=${fii.ticker}'">
                                <i class="bi bi-bell"></i> Criar Alerta
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao mostrar detalhes:', error);
            notify.error('Erro ao carregar detalhes do FII');
        }
    }, 0); // Prioridade normal
}, 100);

// Exportar função para uso global
window.mostrarDetalhesFII = mostrarDetalhesFII;
