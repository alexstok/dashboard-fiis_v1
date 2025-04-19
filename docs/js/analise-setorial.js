/**
 * analise-setorial.js - Script para a página de análise setorial
 */

// Dados globais
let dadosFIIs = [];
let dadosSetoriais = {};

// Inicializar monitoramento em tempo real
let unsubscribe = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Atualizar data
        document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Carregar dados dos FIIs
        dadosFIIs = await API.buscarDadosFIIs();
        
        // Analisar dados setoriais
        dadosSetoriais = API.analisarSetores(dadosFIIs);
        
        // Renderizar gráficos comparativos
        renderizarGraficoDYSetorial();
        renderizarGraficoPVPSetorial();
        renderizarGraficoVacanciaSetorial();
        renderizarGraficoPrecoSetorial();
        
        // Renderizar análise detalhada por segmento
        renderizarAnaliseDetalhada();
        
        // Renderizar gráficos de tendências
        renderizarGraficosTendencias();
        
        // Iniciar monitoramento em tempo real
        unsubscribe = realtimeMonitor.subscribe('analise-setorial', (dadosAtualizados) => {
            dadosFIIs = dadosAtualizados;
            dadosSetoriais = API.analisarSetores(dadosAtualizados);
            
            // Atualizar todos os gráficos e análises
            renderizarGraficoDYSetorial();
            renderizarGraficoPVPSetorial();
            renderizarGraficoVacanciaSetorial();
            renderizarGraficoPrecoSetorial();
            renderizarAnaliseDetalhada();
            renderizarGraficosTendencias();
            
            document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        });
        
    } catch (error) {
        console.error('Erro ao inicializar análise setorial:', error);
        alert('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    }
});

// Parar monitoramento ao sair da página
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});

// Funções de validação
function validarDadosSetoriais(dados) {
    return {
        isValid: Boolean(
            dados && 
            typeof dados.dyMedio === 'number' &&
            typeof dados.pvpMedio === 'number' &&
            typeof dados.precoMedio === 'number' &&
            Array.isArray(dados.fiis)
        ),
        errors: []
    };
}

// Função para calcular estatísticas do setor
function calcularEstatisticasSetor(fiisDoSetor) {
    try {
        if (!Array.isArray(fiisDoSetor) || fiisDoSetor.length === 0) {
            throw new Error('Lista de FIIs inválida');
        }

        const stats = {
            dyMedio: 0,
            pvpMedio: 0,
            precoMedio: 0,
            vacanciaMedio: 0,
            scoreMedio: 0,
            liquidezMedia: 0
        };

        fiisDoSetor.forEach(fii => {
            stats.dyMedio += fii.dyAnual || 0;
            stats.pvpMedio += fii.pvp || 0;
            stats.precoMedio += fii.precoAtual || 0;
            stats.vacanciaMedio += fii.vacanciaFisica || 0;
            stats.scoreMedio += fii.score || 0;
            stats.liquidezMedia += fii.liquidezDiaria || 0;
        });

        const count = fiisDoSetor.length;
        Object.keys(stats).forEach(key => {
            stats[key] = Number((stats[key] / count).toFixed(2));
        });

        return stats;
    } catch (error) {
        console.error('Erro ao calcular estatísticas:', error);
        notify.error('Erro ao calcular estatísticas do setor');
        return null;
    }
}

// Renderizar gráfico de DY por segmento
function renderizarGraficoDYSetorial() {
    const ctx = document.getElementById('grafico-dy').getContext('2d');
    renderizarGraficoSetorial('dy', dadosSetoriais, ctx);
}

// Renderizar gráfico de P/VP por segmento
function renderizarGraficoPVPSetorial() {
    const ctx = document.getElementById('grafico-pvp').getContext('2d');
    renderizarGraficoSetorial('pvp', dadosSetoriais, ctx);
}

// Renderizar gráfico de vacância por segmento
function renderizarGraficoVacanciaSetorial() {
    const ctx = document.getElementById('grafico-vacancia-setorial').getContext('2d');
    
    // Filtrar apenas segmentos com vacância
    const segmentosComVacancia = Object.keys(dadosSetoriais).filter(seg => 
        seg !== 'Recebíveis' && seg !== 'Fundo de Fundos'
    );
    
    const valores = segmentosComVacancia.map(seg => dadosSetoriais[seg].vacanciaMedio);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: segmentosComVacancia,
            datasets: [{
                label: 'Vacância Média (%)',
                data: valores,
                backgroundColor: [
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 205, 86, 0.7)'
                ],
                borderColor: [
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 205, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Vacância Média por Segmento'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Vacância (%)'
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de preço médio por segmento
function renderizarGraficoPrecoSetorial() {
    const ctx = document.getElementById('grafico-preco').getContext('2d');
    renderizarGraficoSetorial('preco', dadosSetoriais, ctx);
}

// Função otimizada para renderizar gráficos setoriais
function renderizarGraficoSetorial(tipo, dados, ctx) {
    renderManager.enqueue(`grafico-${tipo}`, () => {
        renderManager.optimizeCanvas(ctx);
        
        const config = {
            type: 'bar',
            data: {
                labels: Object.keys(dados),
                datasets: [{
                    label: tipo.toUpperCase(),
                    data: Object.values(dados).map(d => d[`${tipo}Medio`]),
                    backgroundColor: Object.keys(dados).map(seg => API.obterCoresSegmentos()[seg]),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300 // Reduzir duração da animação para melhor performance
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: `${tipo.toUpperCase()} Médio por Segmento`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }, 1); // Alta prioridade
}

// Renderizar análise detalhada por segmento
function renderizarAnaliseDetalhada() {
    // Renderizar dados para cada segmento
    renderizarDadosSegmento('Recebíveis', 'recebiveis');
    renderizarDadosSegmento('Logístico', 'logistico');
    renderizarDadosSegmento('Shopping', 'shopping');
    renderizarDadosSegmento('Escritórios', 'escritorios');
    renderizarDadosSegmento('Fundo de Fundos', 'fof');
    renderizarDadosSegmento('Híbrido', 'hibrido');
}

// Renderizar dados do segmento otimizado
const renderizarDadosSegmento = renderManager.debounce((segmento, idSegmento) => {
    renderManager.enqueue(`segmento-${idSegmento}`, () => {
        try {
            if (!dadosSetoriais[segmento]) return;

            const validacao = validarDadosSetoriais(dadosSetoriais[segmento]);
            if (!validacao.isValid) {
                console.error(`Dados inválidos para o segmento ${segmento}:`, validacao.errors);
                return;
            }

            // Renderizar indicadores usando Virtual DOM
            const indicadores = {
                dy: dadosSetoriais[segmento].dyMedio.toFixed(2),
                pvp: dadosSetoriais[segmento].pvpMedio.toFixed(2),
                preco: dadosSetoriais[segmento].precoMedio.toFixed(2),
                vacancia: dadosSetoriais[segmento].vacanciaMedio?.toFixed(2),
                score: dadosSetoriais[segmento].scoreMedio.toFixed(0),
                quantidade: dadosSetoriais[segmento].fiis.length
            };

            const ulIndicadores = document.getElementById(`indicadores-${idSegmento}`);
            if (ulIndicadores) {
                ulIndicadores.innerHTML = `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        DY Médio
                        <span class="badge bg-primary rounded-pill">${indicadores.dy}%</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        P/VP Médio
                        <span class="badge bg-primary rounded-pill">${indicadores.pvp}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Preço Médio
                        <span class="badge bg-primary rounded-pill">R$ ${indicadores.preco}</span>
                    </li>
                    ${segmento !== 'Recebíveis' && segmento !== 'Fundo de Fundos' ? `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Vacância Média
                        <span class="badge bg-primary rounded-pill">${indicadores.vacancia || '-'}%</span>
                    </li>
                    ` : ''}
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Score Médio
                        <span class="badge bg-primary rounded-pill">${indicadores.score}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Quantidade de FIIs
                        <span class="badge bg-primary rounded-pill">${indicadores.quantidade}</span>
                    </li>
                `;
            }

            // Renderizar tabela usando DocumentFragment
            const tabelaSegmento = document.getElementById(`tabela-${idSegmento}`);
            if (tabelaSegmento) {
                const fragment = document.createDocumentFragment();
                const tbody = tabelaSegmento.querySelector('tbody') || tabelaSegmento;
                tbody.innerHTML = '';

                // Ordenar FIIs por score
                const fiisOrdenados = [...dadosSetoriais[segmento].fiis]
                    .sort((a, b) => b.score - a.score);

                fiisOrdenados.forEach(fii => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${fii.ticker}</strong></td>
                        <td>R$ ${fii.precoAtual.toFixed(2)}</td>
                        <td>${fii.dyAnual.toFixed(2)}%</td>
                        <td>${fii.pvp.toFixed(2)}</td>
                        <td>${fii.score}</td>
                        <td>
                            <button class="btn btn-sm btn-primary me-1" onclick="window.location.href='carteira.html?adicionar=${fii.ticker}'">
                                <i class="bi bi-plus-circle"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="window.location.href='alertas.html?ticker=${fii.ticker}'">
                                <i class="bi bi-bell"></i>
                            </button>
                        </td>
                    `;
                    fragment.appendChild(tr);
                });

                tbody.appendChild(fragment);
            }
        } catch (error) {
            console.error(`Erro ao renderizar dados do segmento ${segmento}:`, error);
            notify.error(`Erro ao renderizar dados do segmento ${segmento}`);
        }
    }, 0); // Prioridade normal
}, 100);

// Renderizar gráficos de tendências
function renderizarGraficosTendencias() {
    try {
        const { labels, dadosDY, dadosPVP } = gerarDadosHistoricos();

        // Renderizar gráficos
        const ctxDY = document.getElementById('grafico-tendencia-dy').getContext('2d');
        renderizarGraficoTendencia('dy', labels, dadosDY, ctxDY);

        const ctxPVP = document.getElementById('grafico-tendencia-pvp').getContext('2d');
        renderizarGraficoTendencia('pvp', labels, dadosPVP, ctxPVP);
    } catch (error) {
        console.error('Erro ao renderizar gráficos de tendências:', error);
        notify.error('Erro ao renderizar gráficos de tendências');
    }
}

// Função otimizada para renderizar gráficos de tendências
function renderizarGraficoTendencia(tipo, labels, dados, ctx) {
    renderManager.enqueue(`grafico-tendencia-${tipo}`, () => {
        renderManager.optimizeCanvas(ctx);
        
        const config = {
            type: 'line',
            data: {
                labels,
                datasets: Object.keys(dados).map(segmento => ({
                    label: segmento,
                    data: dados[segmento],
                    borderColor: API.obterCoresSegmentos()[segmento],
                    backgroundColor: API.obterCoresSegmentos()[segmento].replace('0.7', '0.1'),
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 2 // Reduzir tamanho dos pontos para melhor performance
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Evolução do ${tipo.toUpperCase()} por Segmento`
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: tipo === 'dy' ? 'Dividend Yield (%)' : 'P/VP'
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }, 1);
}

// Função para gerar dados históricos simulados otimizada
function gerarDadosHistoricos() {
    const hoje = new Date();
    const labels = [];
    const dadosDY = {};
    const dadosPVP = {};

    // Inicializar dados por segmento
    Object.keys(dadosSetoriais).forEach(segmento => {
        dadosDY[segmento] = new Float32Array(12); // Usar TypedArray para melhor performance
        dadosPVP[segmento] = new Float32Array(12);
    });

    // Gerar dados para os últimos 12 meses
    for (let i = 11; i >= 0; i--) {
        const data = new Date(hoje);
        data.setMonth(data.getMonth() - i);
        labels.push(`${data.getMonth() + 1}/${data.getFullYear()}`);

        Object.keys(dadosSetoriais).forEach(segmento => {
            const variacao = new Float32Array([-0.1, 0.1]);
            dadosDY[segmento][11-i] = dadosSetoriais[segmento].dyMedio * (1 + Math.random() * (variacao[1] - variacao[0]) + variacao[0]);
            dadosPVP[segmento][11-i] = dadosSetoriais[segmento].pvpMedio * (1 + Math.random() * (variacao[1] - variacao[0]) + variacao[0]);
        });
    }

    return { labels, dadosDY, dadosPVP };
}


