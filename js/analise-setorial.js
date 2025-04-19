/**
 * analise-setorial.js - Script para a página de análise setorial
 */

// Dados globais
let dadosFIIs = [];
let dadosSetoriais = {};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Atualizar data
        document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Carregar dados dos FIIs
        dadosFIIs = await API.buscarDadosFIIs();
        
        // Analisar dados setoriais
        dadosSetoriais = API.analisarSetores(dadosFIIs);
        
        // Inicializar select de FIIs
        inicializarSelectFIIs();
        
        // Renderizar gráficos comparativos
        renderizarGraficoDYSetorial();
        renderizarGraficoPVPSetorial();
        renderizarGraficoVacanciaSetorial();
        renderizarGraficoPrecoSetorial();
        
        // Renderizar análise detalhada por segmento
        renderizarAnaliseDetalhada();
        
        // Renderizar gráficos de tendências
        renderizarGraficosTendencias();
        
    } catch (error) {
        console.error('Erro ao inicializar análise setorial:', error);
        alert('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    }
});

// Renderizar gráfico de DY por segmento
function renderizarGraficoDYSetorial() {
    const ctx = document.getElementById('grafico-dy-setorial').getContext('2d');
    
    const segmentos = Object.keys(dadosSetoriais);
    const valores = segmentos.map(seg => dadosSetoriais[seg].dyMedio);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: segmentos,
            datasets: [{
                label: 'Dividend Yield Médio (%)',
                data: valores,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 205, 86, 0.7)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
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
                    text: 'Dividend Yield Médio por Segmento'
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
                        text: 'DY Anual (%)'
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de P/VP por segmento
function renderizarGraficoPVPSetorial() {
    const ctx = document.getElementById('grafico-pvp-setorial').getContext('2d');
    
    const segmentos = Object.keys(dadosSetoriais);
    const valores = segmentos.map(seg => dadosSetoriais[seg].pvpMedio);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: segmentos,
            datasets: [{
                label: 'P/VP Médio',
                data: valores,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                                        'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 205, 86, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
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
                    text: 'P/VP Médio por Segmento'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'P/VP'
                    }
                }
            }
        }
    });
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
    const ctx = document.getElementById('grafico-preco-setorial').getContext('2d');
    
    const segmentos = Object.keys(dadosSetoriais);
    const valores = segmentos.map(seg => dadosSetoriais[seg].precoMedio);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: segmentos,
            datasets: [{
                label: 'Preço Médio (R$)',
                data: valores,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 205, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Preço Médio por Segmento'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Preço (R$)'
                    }
                }
            }
        }
    });
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

// Renderizar dados de um segmento específico
function renderizarDadosSegmento(segmento, idSegmento) {
    if (!dadosSetoriais[segmento]) return;
    
    // Renderizar indicadores
    const ulIndicadores = document.getElementById(`indicadores-${idSegmento}`);
    if (ulIndicadores) {
        ulIndicadores.innerHTML = `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                DY Médio
                <span class="badge bg-primary rounded-pill">${dadosSetoriais[segmento].dyMedio.toFixed(2)}%</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                P/VP Médio
                <span class="badge bg-primary rounded-pill">${dadosSetoriais[segmento].pvpMedio.toFixed(2)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Preço Médio
                <span class="badge bg-primary rounded-pill">R$ ${dadosSetoriais[segmento].precoMedio.toFixed(2)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Score Médio
                <span class="badge bg-primary rounded-pill">${dadosSetoriais[segmento].scoreMedio.toFixed(0)}</span>
            </li>
            ${segmento !== 'Recebíveis' && segmento !== 'Fundo de Fundos' ? `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Vacância Média
                <span class="badge bg-primary rounded-pill">${dadosSetoriais[segmento].vacanciaMedio.toFixed(2)}%</span>
            </li>
            ` : ''}
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Quantidade de FIIs
                <span class="badge bg-primary rounded-pill">${dadosSetoriais[segmento].fiis.length}</span>
            </li>
        `;
    }
    
    // Renderizar tabela de FIIs do segmento
    const tabelaSegmento = document.getElementById(`tabela-${idSegmento}`);
    if (tabelaSegmento) {
        const tbody = tabelaSegmento.querySelector('tbody') || tabelaSegmento;
        tbody.innerHTML = '';
        
        // Ordenar FIIs por score
        const fiisOrdenados = [...dadosSetoriais[segmento].fiis].sort((a, b) => b.score - a.score);
        
        fiisOrdenados.forEach(fii => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td><strong>${fii.ticker}</strong></td>
                <td>R$ ${fii.precoAtual.toFixed(2)}</td>
                <td>${fii.dyAnual.toFixed(2)}%</td>
                <td>${fii.pvp.toFixed(2)}</td>
                <td>${fii.score}</td>
            `;
            
            tbody.appendChild(tr);
        });
    }
}

// Renderizar gráficos de tendências
function renderizarGraficosTendencias() {
    // Simular dados históricos de DY
    renderizarGraficoTendenciaDY();
    
    // Simular dados históricos de P/VP
    renderizarGraficoTendenciaPVP();
}

// Renderizar gráfico de tendência de DY
function renderizarGraficoTendenciaDY() {
    const ctx = document.getElementById('grafico-tendencia-dy').getContext('2d');
    
    // Simular dados históricos (6 meses)
    const meses = ['Out/24', 'Nov/24', 'Dez/24', 'Jan/25', 'Fev/25', 'Mar/25'];
    
    // Criar datasets para cada segmento
    const datasets = Object.keys(dadosSetoriais).map((segmento, index) => {
        // Gerar dados simulados com tendência
        const dyBase = dadosSetoriais[segmento].dyMedio;
        const dados = meses.map((_, i) => {
            // Simular variação com tendência
            const variacao = (Math.sin(i / 2) * 0.5) + ((Math.random() - 0.5) * 0.3);
            return dyBase + variacao;
        });
        
        // Cores para cada segmento
        const cores = [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 205, 86, 1)'
        ];
        
        return {
            label: segmento,
            data: dados,
            borderColor: cores[index % cores.length],
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.1
        };
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'DY Anual (%)'
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de tendência de P/VP
function renderizarGraficoTendenciaPVP() {
    const ctx = document.getElementById('grafico-tendencia-pvp').getContext('2d');
    
    // Simular dados históricos (6 meses)
    const meses = ['Out/24', 'Nov/24', 'Dez/24', 'Jan/25', 'Fev/25', 'Mar/25'];
    
    // Criar datasets para cada segmento
    const datasets = Object.keys(dadosSetoriais).map((segmento, index) => {
        // Gerar dados simulados com tendência
        const pvpBase = dadosSetoriais[segmento].pvpMedio;
        const dados = meses.map((_, i) => {
            // Simular variação com tendência
            const variacao = (Math.sin(i / 2) * 0.05) + ((Math.random() - 0.5) * 0.03);
            return pvpBase + variacao;
        });
        
        // Cores para cada segmento
        const cores = [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 205, 86, 1)'
        ];
        
        return {
            label: segmento,
            data: dados,
            borderColor: cores[index % cores.length],
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.1
        };
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'P/VP'
                    }
                }
            }
        }
    });
}

// Renderizar gráfico candlestick com indicadores técnicos
function renderizarGraficoCandlestick(ticker) {
    const ctx = document.getElementById('grafico-candlestick').getContext('2d');
    
    // Simulando dados OHLC (Open, High, Low, Close) para demonstração
    const dadosOHLC = gerarDadosOHLC();
    
    // Calcular médias móveis exponenciais
    const ema9 = calcularEMA(dadosOHLC.map(d => d.close), 9);
    const ema20 = calcularEMA(dadosOHLC.map(d => d.close), 20);
    const ema50 = calcularEMA(dadosOHLC.map(d => d.close), 50);
    const ema200 = calcularEMA(dadosOHLC.map(d => d.close), 200);
    
    // Calcular Stochastic Oscillator
    const stochastic = calcularStochastic(dadosOHLC, 14, 3, 3);
    
    new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: ticker,
                data: dadosOHLC.map(d => ({
                    t: d.time,
                    o: d.open,
                    h: d.high,
                    l: d.low,
                    c: d.close
                }))
            },
            {
                label: 'EMA 9',
                data: ema9.map((value, index) => ({
                    t: dadosOHLC[index].time,
                    y: value
                })),
                type: 'line',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                fill: false
            },
            {
                label: 'EMA 20',
                data: ema20.map((value, index) => ({
                    t: dadosOHLC[index].time,
                    y: value
                })),
                type: 'line',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                fill: false
            },
            {
                label: 'EMA 50',
                data: ema50.map((value, index) => ({
                    t: dadosOHLC[index].time,
                    y: value
                })),
                type: 'line',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            },
            {
                label: 'EMA 200',
                data: ema200.map((value, index) => ({
                    t: dadosOHLC[index].time,
                    y: value
                })),
                type: 'line',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Preço (R$)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Análise Técnica - ${ticker}`
                }
            }
        }
    });
    
    // Renderizar Stochastic Oscillator em um gráfico separado
    const ctxStoch = document.getElementById('grafico-stochastic').getContext('2d');
    new Chart(ctxStoch, {
        type: 'line',
        data: {
            labels: dadosOHLC.map(d => d.time),
            datasets: [{
                label: '%K',
                data: stochastic.k,
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false
            },
            {
                label: '%D',
                data: stochastic.d,
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: false
            },
            {
                label: 'EMA 9',
                data: calcularEMA(stochastic.k, 9),
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Stochastic Oscillator'
                    }
                }
            }
        }
    });
}

// Função para inicializar o select de FIIs
function inicializarSelectFIIs() {
    const select = document.getElementById('select-fii-analise');
    if (!select) return;

    // Limpar opções existentes
    select.innerHTML = '<option value="">Selecione um FII</option>';

    // Ordenar FIIs por ticker
    const fiisOrdenados = [...dadosFIIs].sort((a, b) => a.ticker.localeCompare(b.ticker));

    // Adicionar opções
    fiisOrdenados.forEach(fii => {
        const option = document.createElement('option');
        option.value = fii.ticker;
        option.textContent = `${fii.ticker} - ${fii.segmento}`;
        select.appendChild(option);
    });
}

// Função para atualizar a análise técnica
function atualizarAnaliseTecnica() {
    const select = document.getElementById('select-fii-analise');
    const ticker = select.value;
    
    if (!ticker) {
        alert('Selecione um FII para análise');
        return;
    }
    
    renderizarGraficoCandlestick(ticker);
}

// Função para calcular EMA
function calcularEMA(dados, periodo) {
    const multiplicador = 2 / (periodo + 1);
    const ema = [dados[0]];
    
    for (let i = 1; i < dados.length; i++) {
        ema.push((dados[i] - ema[i-1]) * multiplicador + ema[i-1]);
    }
    
    return ema;
}

// Função para calcular Stochastic Oscillator
function calcularStochastic(dados, k, d, smooth) {
    const kValues = [];
    const dValues = [];
    
    // Calcular %K
    for (let i = k-1; i < dados.length; i++) {
        const periodo = dados.slice(i-k+1, i+1);
        const highestHigh = Math.max(...periodo.map(p => p.high));
        const lowestLow = Math.min(...periodo.map(p => p.low));
        const close = dados[i].close;
        
        const k = ((close - lowestLow) / (highestHigh - lowestLow)) * 100;
        kValues.push(k);
    }
    
    // Suavizar %K
    const kSmooth = calcularSMA(kValues, smooth);
    
    // Calcular %D (média móvel de %K)
    const dSmooth = calcularSMA(kSmooth, d);
    
    return {
        k: kSmooth,
        d: dSmooth
    };
}

// Função para calcular SMA (Simple Moving Average)
function calcularSMA(dados, periodo) {
    const sma = [];
    for (let i = periodo-1; i < dados.length; i++) {
        const soma = dados.slice(i-periodo+1, i+1).reduce((a, b) => a + b, 0);
        sma.push(soma / periodo);
    }
    return sma;
}

// Função para gerar dados OHLC simulados
function gerarDadosOHLC() {
    const dados = [];
    let preco = 100;
    const hoje = new Date();
    
    for (let i = 200; i > 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        
        const variacao = (Math.random() - 0.5) * 2;
        const high = preco + Math.random() * 2;
        const low = preco - Math.random() * 2;
        const open = preco;
        preco += variacao;
        
        dados.push({
            time: data,
            open: open,
            high: Math.max(high, open, preco),
            low: Math.min(low, open, preco),
            close: preco
        });
    }
    
    return dados;
}


