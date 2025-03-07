/**
 * monitoramento.js - Script para a página de monitoramento de FIIs
 */

// Dados globais
let dadosFIIs = [];
let dadosFiltrados = [];
let filtrosAtivos = {
    segmentos: ['Recebíveis', 'Logístico', 'Shopping', 'Escritórios', 'Fundo de Fundos', 'Híbrido'],
    dyMinimo: 8,
    pvpMaximo: 1,
    scoreMinimo: 60
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Atualizar data
        document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Carregar dados dos FIIs
        dadosFIIs = await API.buscarDadosFIIs();
        
        // Aplicar filtros iniciais
        aplicarFiltros();
        
        // Renderizar tabela
        renderizarTabelaFIIs();
        
        // Configurar eventos
        configurarEventos();
        
    } catch (error) {
        console.error('Erro ao inicializar monitoramento:', error);
        alert('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    }
});

// Configurar eventos da página
function configurarEventos() {
    // Botão de atualizar dados
    document.getElementById('atualizar-dados').addEventListener('click', async () => {
        try {
            // Recarregar dados
            dadosFIIs = await API.buscarDadosFIIs();
            
            // Aplicar filtros
            aplicarFiltros();
            
            // Atualizar tabela
            renderizarTabelaFIIs();
            
            // Atualizar data
            document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
            
            alert('Dados atualizados com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            alert('Erro ao atualizar dados. Por favor, tente novamente mais tarde.');
        }
    });
    
    // Botão de aplicar filtros
    document.getElementById('aplicar-filtros').addEventListener('click', () => {
        // Coletar valores dos filtros
        const segmentos = [];
        if (document.getElementById('filtro-recebiveis').checked) segmentos.push('Recebíveis');
        if (document.getElementById('filtro-logistico').checked) segmentos.push('Logístico');
        if (document.getElementById('filtro-shopping').checked) segmentos.push('Shopping');
        if (document.getElementById('filtro-escritorios').checked) segmentos.push('Escritórios');
        if (document.getElementById('filtro-fof').checked) segmentos.push('Fundo de Fundos');
        if (document.getElementById('filtro-hibrido').checked) segmentos.push('Híbrido');
        
        const dyMinimo = parseFloat(document.getElementById('filtro-dy-min').value);
        const pvpMaximo = parseFloat(document.getElementById('filtro-pvp-max').value);
        const scoreMinimo = parseFloat(document.getElementById('filtro-score-min').value);
        
        // Atualizar filtros ativos
        filtrosAtivos = {
            segmentos,
            dyMinimo,
            pvpMaximo,
            scoreMinimo
        };
        
        // Aplicar filtros
        aplicarFiltros();
        
        // Atualizar tabela
        renderizarTabelaFIIs();
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('filt
                // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('filtrosModal'));
        modal.hide();
    });
}

// Aplicar filtros aos dados
function aplicarFiltros() {
    dadosFiltrados = dadosFIIs.filter(fii => {
        // Filtrar por segmento
        if (!filtrosAtivos.segmentos.includes(fii.segmento)) return false;
        
        // Filtrar por DY mínimo
        if (fii.dyAnual < filtrosAtivos.dyMinimo) return false;
        
        // Filtrar por P/VP máximo
        if (fii.pvp > filtrosAtivos.pvpMaximo) return false;
        
        // Filtrar por score mínimo
        if (fii.score < filtrosAtivos.scoreMinimo) return false;
        
        // Filtrar por preço máximo (R$25,00)
        if (fii.precoAtual > 25) return false;
        
        return true;
    });
    
    // Ordenar por score (decrescente)
    dadosFiltrados.sort((a, b) => b.score - a.score);
    
    // Limitar a 30 FIIs
    dadosFiltrados = dadosFiltrados.slice(0, 30);
}

// Renderizar tabela de FIIs
function renderizarTabelaFIIs() {
    const tbody = document.querySelector('#tabela-fiis tbody');
    tbody.innerHTML = '';
    
    dadosFiltrados.forEach(fii => {
        const tr = document.createElement('tr');
        
        // Calcular potencial
        const potencial = ((fii.precoJusto / fii.precoAtual - 1) * 100).toFixed(2);
        const potencialClass = potencial > 0 ? 'text-success' : 'text-danger';
        
        tr.innerHTML = `
            <td><strong>${fii.ticker}</strong></td>
            <td>${fii.segmento}</td>
            <td>R$ ${fii.precoAtual.toFixed(2)}</td>
            <td>R$ ${fii.precoJusto}</td>
            <td class="${potencialClass}">${potencial}%</td>
            <td>R$ ${fii.ultimoDividendo.toFixed(2)}</td>
            <td>${fii.dyMensal.toFixed(2)}%</td>
            <td>${fii.dyAnual.toFixed(2)}%</td>
            <td>${fii.pvp.toFixed(2)}</td>
            <td>${fii.capRate.toFixed(2)}%</td>
            <td>${fii.ffoYield.toFixed(2)}%</td>
            <td>${fii.vacancia ? fii.vacancia.toFixed(2) + '%' : 'N/A'}</td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar ${getScoreColorClass(fii.score)}" 
                         role="progressbar" 
                         style="width: ${fii.score}%;" 
                         aria-valuenow="${fii.score}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        ${fii.score}
                    </div>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="mostrarDetalhesFII('${fii.ticker}')">
                    <i class="bi bi-info-circle"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="adicionarACarteira('${fii.ticker}')">
                    <i class="bi bi-plus-circle"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="criarAlerta('${fii.ticker}')">
                    <i class="bi bi-bell"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Obter classe de cor baseada no score
function getScoreColorClass(score) {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-info';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger';
}

// Mostrar detalhes de um FII
async function mostrarDetalhesFII(ticker) {
    const fii = dadosFIIs.find(f => f.ticker === ticker);
    if (!fii) return;
    
    const detalhesDiv = document.getElementById('detalhes-fii');
    detalhesDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p>Carregando dados...</p></div>';
    
    try {
        // Buscar dados históricos
        const dadosHistoricos = await API.buscarDadosHistoricos(ticker);
        
        // Buscar histórico de dividendos
        const historicoDividendos = await API.buscarHistoricoDividendos(ticker);
        
        // Renderizar detalhes
        detalhesDiv.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h4>${ticker} - ${fii.segmento}</h4>
                    <p>Gestora: ${fii.gestora}</p>
                    <div class="row">
                        <div class="col-md-6">
                            <ul class="list-group">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Preço Atual
                                    <span>R$ ${fii.precoAtual.toFixed(2)}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Preço Justo
                                    <span>R$ ${fii.precoJusto}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Potencial
                                    <span class="${((fii.precoJusto / fii.precoAtual - 1) * 100) > 0 ? 'text-success' : 'text-danger'}">
                                        ${((fii.precoJusto / fii.precoAtual - 1) * 100).toFixed(2)}%
                                    </span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    P/VP
                                    <span>${fii.pvp.toFixed(2)}</span>
                                </li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <ul class="list-group">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Último Dividendo
                                    <span>R$ ${fii.ultimoDividendo.toFixed(2)}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    DY Mensal
                                    <span>${fii.dyMensal.toFixed(2)}%</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    DY Anual
                                    <span>${fii.dyAnual.toFixed(2)}%</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Score
                                    <span class="${getScoreColorClass(fii.score)}" style="padding: 2px 8px; border-radius: 4px; color: white;">
                                        ${fii.score}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="d-grid gap-2 mt-3">
                        <button class="btn btn-success" onclick="adicionarACarteira('${fii.ticker}')">
                            <i class="bi bi-cart-plus"></i> Adicionar à Carteira
                        </button>
                        <button class="btn btn-warning" onclick="criarAlerta('${fii.ticker}')">
                            <i class="bi bi-bell"></i> Criar Alerta
                        </button>
                    </div>
                </div>
                <div class="col-md-6">
                    <canvas id="grafico-historico"></canvas>
                    <canvas id="grafico-dividendos" class="mt-3"></canvas>
                </div>
            </div>
        `;
        
        // Renderizar gráfico de preço histórico
        renderizarGraficoHistorico(dadosHistoricos);
        
        // Renderizar gráfico de dividendos
        renderizarGraficoDividendos(historicoDividendos);
        
    } catch (error) {
        console.error(`Erro ao carregar detalhes do FII ${ticker}:`, error);
        detalhesDiv.innerHTML = `<div class="alert alert-danger">Erro ao carregar detalhes do FII ${ticker}. Por favor, tente novamente mais tarde.</div>`;
    }
    
    // Rolar até a seção de detalhes
    detalhesDiv.scrollIntoView({ behavior: 'smooth' });
}

// Renderizar gráfico de preço histórico
function renderizarGraficoHistorico(dadosHistoricos) {
    const ctx = document.getElementById('grafico-historico').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dadosHistoricos.map(d => d.data),
            datasets: [{
                label: 'Preço de Fechamento (R$)',
                data: dadosHistoricos.map(d => d.fechamento),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Histórico de Preços'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Data'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Preço (R$)'
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de dividendos
function renderizarGraficoDividendos(historicoDividendos) {
    const ctx = document.getElementById('grafico-dividendos').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: historicoDividendos.map(d => {
                const data = new Date(d.data);
                return `${data.getMonth() + 1}/${data.getFullYear()}`;
            }),
            datasets: [{
                label: 'Dividendos (R$)',
                data: historicoDividendos.map(d => d.valor),
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Histórico de Dividendos'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Mês/Ano'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Adicionar FII à carteira
function adicionarACarteira(ticker) {
    const fii = dadosFIIs.find(f => f.ticker === ticker);
    if (!fii) return;
    
    // Redirecionar para a página de carteira com parâmetro
    window.location.href = `carteira.html?adicionar=${ticker}`;
}

// Criar alerta para um FII
function criarAlerta(ticker) {
    const fii = dadosFIIs.find(f => f.ticker === ticker);
    if (!fii) return;
    
    // Redirecionar para a página de alertas com parâmetro
    window.location.href = `alertas.html?ticker=${ticker}`;
}

// Adicione ao arquivo monitoramento.js
function exportarParaExcel() {
  // Obter dados da tabela
  const tabela = document.getElementById('tabela-fiis');
  const dados = [];
  
  // Obter cabeçalhos
  const cabecalhos = [];
  tabela.querySelectorAll('thead th').forEach(th => {
    cabecalhos.push(th.textContent);
  });
  
  // Obter linhas
  tabela.querySelectorAll('tbody tr').forEach(tr => {
    const linha = {};
    tr.querySelectorAll('td').forEach((td, index) => {
      linha[cabecalhos[index]] = td.textContent.replace(/\n/g, '').trim();
    });
    dados.push(linha);
  });
  
  // Criar workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dados);
  XLSX.utils.book_append_sheet(wb, ws, "FIIs");
  
  // Salvar arquivo
  XLSX.writeFile(wb, "fiis_monitorados.xlsx");
}

// Adicionar botão de exportação
document.getElementById('exportar-excel').addEventListener('click', exportarParaExcel);

// Adicione ao arquivo monitoramento.js
function compararFIIs() {
  const fiisParaComparar = [];
  
  // Obter FIIs selecionados
  document.querySelectorAll('.fii-checkbox:checked').forEach(checkbox => {
    fiisParaComparar.push(checkbox.value);
  });
  
  if (fiisParaComparar.length < 2) {
    alert('Selecione pelo menos 2 FIIs para comparar.');
    return;
  }
  
  // Buscar dados dos FIIs selecionados
  const dadosComparacao = fiisParaComparar.map(ticker => {
    return dadosFIIs.find(fii => fii.ticker === ticker);
  });
  
  // Renderizar gráfico de comparação
  renderizarGraficoComparacao(dadosComparacao);
  
  // Exibir tabela comparativa
  renderizarTabelaComparacao(dadosComparacao);
}


// Exportar funções para uso global
window.mostrarDetalhesFII = mostrarDetalhesFII;
window.adicionarACarteira = adicionarACarteira;
window.criarAlerta = criarAlerta;
