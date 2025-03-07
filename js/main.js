/**
 * main.js - Script principal para a página inicial
 */

// Dados globais
let dadosFIIs = [];
let carteira = [];
let planoCompras = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Atualizar data
        document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Carregar dados dos FIIs
        dadosFIIs = await API.buscarDadosFIIs();
        
        // Carregar dados da carteira do localStorage
        carregarCarteira();
        
        // Carregar plano de compras
        carregarPlanoCompras();
        
        // Atualizar cards
        atualizarCards();
        
        // Renderizar gráficos
        renderizarGraficoTopDY();
        renderizarGraficoSegmentos();
        
        // Renderizar tabela de plano resumido
        renderizarPlanoResumo();
        
    } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
        alert('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    }
});

// Função para atualizar os cards principais
function atualizarCards() {
    document.getElementById('total-fiis').textContent = dadosFIIs.length;
    
    // Calcular média de DY
    const mediaDY = dadosFIIs.reduce((sum, fii) => sum + fii.dyAnual, 0) / dadosFIIs.length;
    document.getElementById('media-dy').textContent = mediaDY.toFixed(2) + '%';
    
    // Total de FIIs na carteira
    document.getElementById('total-carteira').textContent = carteira.length;
    
    // Total de alertas
    const alertas = JSON.parse(localStorage.getItem('alertas-fiis')) || [];
    document.getElementById('total-alertas').textContent = alertas.length;
}

// Função para carregar dados da carteira
function carregarCarteira() {
    carteira = JSON.parse(localStorage.getItem('carteira-fiis')) || [];
}

// Função para carregar plano de compras
function carregarPlanoCompras() {
    // Tentar carregar do localStorage
    const planoSalvo = JSON.parse(localStorage.getItem('plano-compras')) || null;
    
    if (planoSalvo) {
        planoCompras = planoSalvo;
    } else {
        // Criar plano padrão
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        // FIIs recomendados para o plano
        const fiisRecomendados = [
            { mes: 'Janeiro', fii1: 'MXRF11', fii2: 'BCFF11' },
            { mes: 'Fevereiro', fii1: 'IRDM11', fii2: 'XPLG11' },
            { mes: 'Março', fii1: 'KNCR11', fii2: 'VISC11' },
            { mes: 'Abril', fii1: 'RZTR11', fii2: 'HGLG11' },
            { mes: 'Maio', fii1: 'VGIP11', fii2: 'HFOF11' },
            { mes: 'Junho', fii1: 'RBRR11', fii2: 'XPML11' },
            { mes: 'Julho', fii1: 'MXRF11', fii2: 'HGRE11' },
            { mes: 'Agosto', fii1: 'IRDM11', fii2: 'KNRI11' },
            { mes: 'Setembro', fii1: 'KNCR11', fii2: 'BCFF11' },
            { mes: 'Outubro', fii1: 'RZTR11', fii2: 'XPLG11' },
            { mes: 'Novembro', fii1: 'VGIP11', fii2: 'VISC11' },
            { mes: 'Dezembro', fii1: 'RBRR11', fii2: 'HGLG11' }
        ];
        
        planoCompras = fiisRecomendados.map(item => {
            // Encontrar preços dos FIIs
            const fii1 = dadosFIIs.find(f => f.ticker === item.fii1) || { precoAtual: 10 };
            const fii2 = dadosFIIs.find(f => f.ticker === item.fii2) || { precoAtual: 10 };
            
            return {
                mes: item.mes,
                fii1: item.fii1,
                valorFii1: fii1.precoAtual,
                fii2: item.fii2,
                valorFii2: fii2.precoAtual,
                status: 'Pendente'
            };
        });
        
        // Calcular valores acumulados
        let acumulado = 0;
        planoCompras.forEach(item => {
            item.valorMensal = item.valorFii1 + item.valorFii2;
            acumulado += item.valorMensal;
            item.valorAcumulado = acumulado;
        });
        
        // Salvar no localStorage
        localStorage.setItem('plano-compras', JSON.stringify(planoCompras));
    }
}

// Renderizar gráfico de top 5 FIIs por DY
function renderizarGraficoTopDY() {
    const ctx = document.getElementById('grafico-top-dy').getContext('2d');
    
    // Ordenar FIIs por DY e pegar os top 5
    const top5 = [...dadosFIIs].sort((a, b) => b.dyAnual - a.dyAnual).slice(0, 5);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top5.map(fii => fii.ticker),
            datasets: [{
                label: 'Dividend Yield Anual (%)',
                data: top5.map(fii => fii.dyAnual),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `DY: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Dividend Yield (%)'
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de distribuição por segmento
function renderizarGraficoSegmentos() {
    const ctx = document.getElementById('grafico-segmentos').getContext('2d');
    
    // Contar FIIs por segmento
    const segmentos = {};
    dadosFIIs.forEach(fii => {
        segmentos[fii.segmento] = (segmentos[fii.segmento] || 0) + 1;
    });
    
    // Cores para os segmentos
    const cores = {
        'Recebíveis': 'rgba(75, 192, 192, 0.7)',
        'Logístico': 'rgba(54, 162, 235, 0.7)',
        'Shopping': 'rgba(153, 102, 255, 0.7)',
        'Escritórios': 'rgba(255, 159, 64, 0.7)',
        'Fundo de Fundos': 'rgba(255, 99, 132, 0.7)',
        'Híbrido': 'rgba(255, 205, 86, 0.7)'
    };
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(segmentos),
            datasets: [{
                data: Object.values(segmentos),
                backgroundColor: Object.keys(segmentos).map(seg => cores[seg] || 'rgba(201, 203, 207, 0.7)'),
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Renderizar tabela de plano resumido (próximos 3 meses)
function renderizarPlanoResumo() {
    const tbody = document.querySelector('#tabela-plano-resumo tbody');
    tbody.innerHTML = '';
    
    // Obter mês atual
    const mesAtual = new Date().getMonth();
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    // Filtrar próximos 3 meses
    const proximos3Meses = [];
    for (let i = 0; i < 3; i++) {
        const indice = (mesAtual + i) % 12;
        const mes = meses[indice];
        const planoMes = planoCompras.find(p => p.mes === mes);
        if (planoMes) {
            proximos3Meses.push(planoMes);
        }
    }
    
    // Renderizar linhas da tabela
    proximos3Meses.forEach(plano => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${plano.mes}</td>
            <td>${plano.fii1}</td>
            <td>R$ ${plano.valorFii1.toFixed(2)}</td>
            <td>${plano.fii2}</td>
            <td>R$ ${plano.valorFii2.toFixed(2)}</td>
            <td>R$ ${plano.valorMensal.toFixed(2)}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

