/**
 * carteira.js - Script para a página de gerenciamento da carteira
 */

// Dados globais
let dadosFIIs = [];
let carteira = [];
let transacoes = [];
let planoCompras = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Atualizar data
        document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Carregar dados
        dadosFIIs = await API.buscarDadosFIIs();
        carregarCarteira();
        carregarTransacoes();
        carregarPlanoCompras();
        
        // Verificar parâmetros URL
        verificarParametrosURL();
        
        // Atualizar interface
        atualizarCards();
        renderizarTabelaCarteira();
        renderizarTabelaTransacoes();
        renderizarTabelaPlano();
        renderizarGraficoComposicao();
        renderizarGraficoDividendos();
        renderizarGraficoEvolucao();
        
        // Configurar eventos
        configurarEventos();
        
    } catch (error) {
        console.error('Erro ao inicializar carteira:', error);
        alert('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    }
});

// Carregar dados da carteira
function carregarCarteira() {
    carteira = JSON.parse(localStorage.getItem('carteira-fiis')) || [];
    carteira.forEach(item => {
        const fii = dadosFIIs.find(f => f.ticker === item.ticker);
        if (fii) {
            item.precoAtual = fii.precoAtual;
            item.ultimoDividendo = fii.ultimoDividendo;
            item.dyAnual = fii.dyAnual;
            item.segmento = fii.segmento;
            item.total = item.quantidade * item.precoAtual;
            item.dividendoMensal = item.quantidade * item.ultimoDividendo;
            item.rentabilidade = ((item.precoAtual / item.precoMedio - 1) * 100).toFixed(2);
        }
    });
    const totalCarteira = carteira.reduce((sum, item) => sum + item.total, 0);
    carteira.forEach(item => {
        item.percentual = ((item.total / totalCarteira) * 100).toFixed(2);
    });
    localStorage.setItem('carteira-fiis', JSON.stringify(carteira));
}

// Carregar transações
function carregarTransacoes() {
    transacoes = JSON.parse(localStorage.getItem('transacoes-fiis')) || [];
}

// Carregar plano de compras
function carregarPlanoCompras() {
    planoCompras = JSON.parse(localStorage.getItem('plano-compras')) || [];
    const mesAtual = new Date().getMonth();
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    planoCompras.forEach(item => {
        const indiceMes = meses.indexOf(item.mes);
        if (indiceMes < mesAtual) {
            const fiiComprado = transacoes.some(t => 
                t.ticker === item.fii1 && new Date(t.data).getMonth() === indiceMes &&
                t.tipo === 'compra'
            );
            const fii2Comprado = transacoes.some(t => 
                t.ticker === item.fii2 && new Date(t.data).getMonth() === indiceMes &&
                t.tipo === 'compra'
            );
            if (fiiComprado && fii2Comprado) {
                item.status = 'Concluído';
            } else if (fiiComprado || fii2Comprado) {
                item.status = 'Parcial';
            } else {
                item.status = 'Pendente';
            }
        } else if (indiceMes === mesAtual) {
            const fiiComprado = transacoes.some(t => 
                t.ticker === item.fii1 && new Date(t.data).getMonth() === indiceMes &&
                t.tipo === 'compra'
            );
            const fii2Comprado = transacoes.some(t => 
                t.ticker === item.fii2 && new Date(t.data).getMonth() === indiceMes &&
                t.tipo === 'compra'
            );
            if (fiiComprado && fii2Comprado) {
                item.status = 'Concluído';
            } else if (fiiComprado || fii2Comprado) {
                item.status = 'Parcial';
            } else {
                item.status = 'Em andamento';
            }
        } else {
            item.status = 'Futuro';
        }
    });
    localStorage.setItem('plano-compras', JSON.stringify(planoCompras));
}

// Verificar parâmetros da URL
function verificarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const adicionarTicker = urlParams.get('adicionar');
    if (adicionarTicker) {
        const fii = dadosFIIs.find(f => f.ticker === adicionarTicker);
        if (fii) {
            document.getElementById('ticker').value = adicionarTicker;
            document.getElementById('preco').value = fii.precoAtual.toFixed(2);
            document.getElementById('data').valueAsDate = new Date();
            const modal = new bootstrap.Modal(document.getElementById('adicionarFiiModal'));
            modal.show();
        }
    }
}

// Atualizar cards principais
function atualizarCards() {
    const patrimonioTotal = carteira.reduce((sum, item) => sum + item.total, 0);
    document.getElementById('patrimonio-total').textContent = `R$ ${patrimonioTotal.toFixed(2)}`;
    const dividendosMensais = carteira.reduce((sum, item) => sum + item.dividendoMensal, 0);
    document.getElementById('dividendos-mensais').textContent = `R$ ${dividendosMensais.toFixed(2)}`;
    let yieldMedio = 0;
    if (patrimonioTotal > 0) {
        yieldMedio = carteira.reduce((sum, item) => sum + (item.dyAnual * item.total), 0) / patrimonioTotal;
    }
    document.getElementById('yield-medio').textContent = `${yieldMedio.toFixed(2)}%`;
    const investimentoTotal = carteira.reduce((sum, item) => sum + (item.precoMedio * item.quantidade), 0);
    const rentabilidadeTotal = investimentoTotal > 0 ? ((patrimonioTotal / investimentoTotal - 1) * 100) : 0;
    document.getElementById('rentabilidade-total').textContent = `${rentabilidadeTotal.toFixed(2)}%`;
}

// Renderizar tabela da carteira
function renderizarTabelaCarteira() {
    const tbody = document.querySelector('#tabela-carteira tbody');
    tbody.innerHTML = '';
    carteira.forEach(item => {
        const tr = document.createElement('tr');
        const rentabilidadeClass = parseFloat(item.rentabilidade) >= 0 ? 'text-success' : 'text-danger';
        tr.innerHTML = `
            <td><strong>${item.ticker}</strong></td>
            <td>${item.segmento}</td>
            <td>${item.quantidade}</td>
            <td>R$ ${item.precoMedio.toFixed(2)}</td>
            <td>R$ ${item.precoAtual.toFixed(2)}</td>
            <td>R$ ${item.total.toFixed(2)}</td>
            <td>R$ ${item.dividendoMensal.toFixed(2)}</td>
            <td>${item.percentual}%</td>
            <td class="${rentabilidadeClass}">${item.rentabilidade}%</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editarFII('${item.ticker}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="removerFII('${item.ticker}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Renderizar tabela de transações
function renderizarTabelaTransacoes() {
    const tbody = document.querySelector('#tabela-transacoes tbody');
    tbody.innerHTML = '';
    const transacoesOrdenadas = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
    transacoesOrdenadas.forEach(transacao => {
        const tr = document.createElement('tr');
        const data = new Date(transacao.data).toLocaleDateString('pt-BR');
        const tipoClass = transacao.tipo === 'compra' ? 'text-success' : 'text-danger';
        const tipoTexto = transacao.tipo === 'compra' ? 'Compra' : 'Venda';
        tr.innerHTML = `
            <td>${data}</td>
            <td>${transacao.ticker}</td>
            <td class="${tipoClass}">${tipoTexto}</td>
            <td>${transacao.quantidade}</td>
            <td>R$ ${transacao.preco.toFixed(2)}</td>
            <td>R$ ${(transacao.quantidade * transacao.preco).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removerTransacao(${transacao.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Renderizar tabela do plano de compras
function renderizarTabelaPlano() {
    const tbody = document.querySelector('#tabela-plano tbody');
    tbody.innerHTML = '';
    planoCompras.forEach(plano => {
        const tr = document.createElement('tr');
        let statusClass = '';
        switch (plano.status) {
            case 'Concluído':
                statusClass = 'bg-success text-white';
                break;
            case 'Parcial':
                statusClass = 'bg-warning';
                break;
            case 'Em andamento':
                statusClass = 'bg-info text-white';
                break;
            case 'Pendente':
                statusClass = 'bg-danger text-white';
                break;
            default:
                statusClass = 'bg-light';
        }
        tr.innerHTML = `
            <td>${plano.mes}</td>
            <td>${plano.fii1}</td>
            <td>R$ ${plano.valorFii1.toFixed(2)}</td>
            <td>${plano.fii2}</td>
            <td>R$ ${plano.valorFii2.toFixed(2)}</td>
            <td>R$ ${plano.valorMensal.toFixed(2)}</td>
            <td>R$ ${plano.valorAcumulado.toFixed(2)}</td>
            <td><span class="badge ${statusClass}">${plano.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Renderizar gráfico de composição da carteira
function renderizarGraficoComposicao() {
    const ctx = document.getElementById('grafico-composicao').getContext('2d');
    const segmentos = {};
    carteira.forEach(item => {
        if (!segmentos[item.segmento]) {
            segmentos[item.segmento] = 0;
        }
        segmentos[item.segmento] += item.total;
    });
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
                title: {
                    display: true,
                    text: 'Composição por Segmento'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de dividendos
function renderizarGraficoDividendos() {
    const ctx = document.getElementById('grafico-dividendos').getContext('2d');
    const hoje = new Date();
    const labels = [];
    const dados = [];
    for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje);
        data.setMonth(data.getMonth() - i);
        labels.push(`${data.getMonth() + 1}/${data.getFullYear()}`);
        const dataLimite = new Date(data);
        dataLimite.setDate(dataLimite.getDate() + 30);
        const transacoesAteData = transacoes.filter(t => new Date(t.data) <= dataLimite);
        const carteiraHistorica = calcularCarteiraHistorica(transacoesAteData);
        const dividendosMes = carteiraHistorica.reduce((sum, item) => {
            const fii = dadosFIIs.find(f => f.ticker === item.ticker);
            return sum + (fii ? item.quantidade * fii.ultimoDividendo : 0);
        }, 0);
        dados.push(dividendosMes);
    }
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Dividendos Mensais (R$)',
                data: dados,
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução dos Dividendos'
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
                        text: 'Valor (R$)'
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de evolução do patrimônio
function renderizarGraficoEvolucao() {
    const ctx = document.getElementById('grafico-evolucao').getContext('2d');
    const hoje = new Date();
    const labels = [];
    const dadosPatrimonio = [];
    const dadosInvestimento = [];
    for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje);
        data.setMonth(data.getMonth() - i);
        labels.push(`${data.getMonth() + 1}/${data.getFullYear()}`);
        const dataLimite = new Date(data);
        dataLimite.setDate(dataLimite.getDate() + 30);
        const transacoesAteData = transacoes.filter(t => new Date(t.data) <= dataLimite);
        const carteiraHistorica = calcularCarteiraHistorica(transacoesAteData);
        let patrimonio = 0;
        let investimento = 0;
        carteiraHistorica.forEach(item => {
            const fii = dadosFIIs.find(f => f.ticker === item.ticker);
            if (fii) {
                patrimonio += item.quantidade * fii.precoAtual;
                investimento += item.quantidade * item.precoMedio;
            }
        });
        dadosPatrimonio.push(patrimonio);
        dadosInvestimento.push(investimento);
    }
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Patrimônio (R$)',
                    data: dadosPatrimonio,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: 'Investimento (R$)',
                    data: dadosInvestimento,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderWidth: 2,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução do Patrimônio'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: R$ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    }
                }
            }
        }
    });
}

// Calcular carteira histórica com base em transações
function calcularCarteiraHistorica(transacoesHistoricas) {
    const carteiraHistorica = [];
    transacoesHistoricas.forEach(transacao => {
        const fiiIndex = carteiraHistorica.findIndex(item => item.ticker === transacao.ticker);
        if (transacao.tipo === 'compra') {
            if (fiiIndex === -1) {
                carteiraHistorica.push({
                    ticker: transacao.ticker,
                    quantidade: transacao.quantidade,
                    precoMedio: transacao.preco
                });
            } else {
                const fii = carteiraHistorica[fiiIndex];
                const novaQuantidade = fii.quantidade + transacao.quantidade;
                const novoPrecoMedio = ((fii.precoMedio * fii.quantidade) + (transacao.preco * transacao.quantidade)) / novaQuantidade;
                carteiraHistorica[fiiIndex] = {
                    ...fii,
                    quantidade: novaQuantidade,
                    precoMedio: novoPrecoMedio
                };
            }
        } else if (transacao.tipo === 'venda') {
            if (fiiIndex !== -1) {
                const fii = carteiraHistorica[fiiIndex];
                const novaQuantidade = fii.quantidade - transacao.quantidade;
                if (novaQuantidade <= 0) {
                    carteiraHistorica.splice(fiiIndex, 1);
                } else {
                    carteiraHistorica[fiiIndex] = {
                        ...fii,
                        quantidade: novaQuantidade
                    };
                }
            }
        }
    });
    return carteiraHistorica;
}

// Configurar eventos
function configurarEventos() {
    const selectTicker = document.getElementById('ticker');
    if (selectTicker) {
        selectTicker.innerHTML = '';
        const optionVazia = document.createElement('option');
        optionVazia.value = '';
        optionVazia.textContent = 'Selecione um FII';
        selectTicker.appendChild(optionVazia);
        dadosFIIs.forEach(fii => {
            const option = document.createElement('option');
            option.value = fii.ticker;
            option.textContent = `${fii.ticker} - ${fii.segmento} - R$ ${fii.precoAtual.toFixed(2)}`;
            selectTicker.appendChild(option);
        });
    }
    document.getElementById('ticker')?.addEventListener('change', (e) => {
        const ticker = e.target.value;
        const fii = dadosFIIs.find(f => f.ticker === ticker);
        if (fii) {
            document.getElementById('preco').value = fii.precoAtual.toFixed(2);
        }
    });
    document.getElementById('btn-salvar-fii')?.addEventListener('click', () => {
        const ticker = document.getElementById('ticker').value;
        const quantidade = parseInt(document.getElementById('quantidade').value);
        const preco = parseFloat(document.getElementById('preco').value);
        const data = document.getElementById('data').value;
        if (!ticker || isNaN(quantidade) || isNaN(preco) || !data) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }
        const novaTransacao = {
            id: Date.now(),
            ticker,
            tipo: 'compra',
            quantidade,
            preco,
            data
        };
        transacoes.push(novaTransacao);
        localStorage.setItem('transacoes-fiis', JSON.stringify(transacoes));
        const fiiIndex = carteira.findIndex(item => item.ticker === ticker);
        const fii = dadosFIIs.find(f => f.ticker === ticker);
        if (fiiIndex === -1) {
            carteira.push({
                ticker,
                quantidade,
                precoMedio: preco,
                precoAtual: fii ? fii.precoAtual : preco,
                ultimoDividendo: fii ? fii.ultimoDividendo : 0,
                dyAnual: fii ? fii.dyAnual : 0,
                segmento: fii ? fii.segmento : 'Desconhecido',
                total: quantidade * (fii ? fii.precoAtual : preco),
                dividendoMensal: quantidade * (fii ? fii.ultimoDividendo : 0),
                rentabilidade: 0,
                percentual: 0
            });
        } else {
            const fiiCarteira = carteira[fiiIndex];
            const novaQuantidade = fiiCarteira.quantidade + quantidade;
            const novoPrecoMedio = ((fiiCarteira.precoMedio * fiiCarteira.quantidade) + (preco * quantidade)) / novaQuantidade;
            carteira[fiiIndex] = {
                ...fiiCarteira,
                quantidade: novaQuantidade,
                precoMedio: novoPrecoMedio
            };
        }
        carregarCarteira();
        atualizarCards();
        renderizarTabelaCarteira();
        renderizarTabelaTransacoes();
        renderizarGraficoComposicao();
        renderizarGraficoDividendos();
        renderizarGraficoEvolucao();
        const modal = bootstrap.Modal.getInstance(document.getElementById('adicionarFiiModal'));
        modal.hide();
        document.getElementById('form-adicionar-fii').reset();
        alert('FII adicionado com sucesso!');
    });
}

// Exportar funções para uso global
window.editarFII = editarFII;
window.removerFII = removerFII;
window.removerTransacao = removerTransacao;


