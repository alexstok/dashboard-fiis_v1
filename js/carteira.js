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
        
        // Carregar dados dos FIIs
        dadosFIIs = await API.buscarDadosFIIs();
        
        // Carregar dados da carteira
        carregarCarteira();
        
        // Carregar transações
        carregarTransacoes();
        
        // Carregar plano de compras
        carregarPlanoCompras();
        
        // Verificar parâmetros da URL
        verificarParametrosURL();
        
        // Atualizar cards
        atualizarCards();
        
        // Renderizar tabelas
        renderizarTabelaCarteira();
        renderizarTabelaTransacoes();
        renderizarTabelaPlano();
        
        // Renderizar gráficos
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
    
    // Atualizar preços e valores da carteira
    carteira.forEach(item => {
        const fii = dadosFIIs.find(f => f.ticker === item.ticker);
        if (fii) {
            item.precoAtual = fii.precoAtual;
            item.ultimoDividendo = fii.ultimoDividendo;
            item.dyAnual = fii.dyAnual;
            item.segmento = fii.segmento;
            
            // Calcular valores
            item.total = item.quantidade * item.precoAtual;
            item.dividendoMensal = item.quantidade * item.ultimoDividendo;
            item.rentabilidade = ((item.precoAtual / item.precoMedio - 1) * 100).toFixed(2);
        }
    });

// Adicione ao arquivo carteira.js
function simularCenarios() {
  const cenarios = [
    { nome: 'Otimista', valorização: 0.15, dividendos: 0.12 },
    { nome: 'Moderado', valorização: 0.08, dividendos: 0.09 },
    { nome: 'Pessimista', valorização: 0.02, dividendos: 0.06 }
  ];
  
  const resultados = [];
  
  // Para cada cenário, calcular o resultado em 12 meses
  cenarios.forEach(cenario => {
    let valorTotal = carteira.reduce((sum, item) => sum + item.total, 0);
    let dividendosAcumulados = 0;
    
    // Simular 12 meses
    for (let i = 0; i < 12; i++) {
      // Calcular dividendos do mês
      const dividendosMes = valorTotal * (cenario.dividendos / 12);
      dividendosAcumulados += dividendosMes;
      
      // Calcular valorização do mês
      valorTotal = valorTotal * (1 + (cenario.valorização / 12));
    }
    
    resultados.push({
      cenario: cenario.nome,
      valorFinal: valorTotal,
      dividendosAcumulados,
      retornoTotal: ((valorTotal + dividendosAcumulados) / carteira.reduce((sum, item) => sum + item.total, 0) - 1) * 100
    });
  });
  
  // Renderizar resultados
  renderizarResultadosCenarios(resultados);
}

    // Adicione ao arquivo carteira.js
function calcularImpostoRenda() {
  // Obter transações de venda
  const vendasNoMes = transacoes.filter(t => 
    t.tipo === 'venda' && 
    new Date(t.data).getMonth() === new Date().getMonth() &&
    new Date(t.data).getFullYear() === new Date().getFullYear()
  );
  
  if (vendasNoMes.length === 0) {
    alert('Não há vendas no mês atual para calcular imposto.');
    return;
  }
  
  // Calcular lucro total nas vendas
  let lucroTotal = 0;
  
  vendasNoMes.forEach(venda => {
    // Encontrar preço médio de compra
    const fiiCarteira = carteira.find(item => item.ticker === venda.ticker);
    const precoMedioCompra = fiiCarteira ? fiiCarteira.precoMedio : 0;
    
    // Calcular lucro
    const valorVenda = venda.quantidade * venda.preco;
    const valorCompra = venda.quantidade * precoMedioCompra;
    const lucro = valorVenda - valorCompra;
    
    if (lucro > 0) {
      lucroTotal += lucro;
    }
  });
  
  // Calcular imposto (15% sobre o lucro)
  const impostoDevido = lucroTotal * 0.15;
  
  // Exibir resultado
  alert(`Lucro total nas vendas: R$ ${lucroTotal.toFixed(2)}\nImposto devido (15%): R$ ${impostoDevido.toFixed(2)}`);
}

    
    // Calcular percentual da carteira
    const totalCarteira = carteira.reduce((sum, item) => sum + item.total, 0);
    carteira.forEach(item => {
        item.percentual = ((item.total / totalCarteira) * 100).toFixed(2);
    });
    
    // Salvar carteira atualizada
    localStorage.setItem('carteira-fiis', JSON.stringify(carteira));
}

// Carregar transações
function carregarTransacoes() {
    transacoes = JSON.parse(localStorage.getItem('transacoes-fiis')) || [];
}

// Carregar plano de compras
function carregarPlanoCompras() {
    planoCompras = JSON.parse(localStorage.getItem('plano-compras')) || [];
    
    // Atualizar status do plano
    const mesAtual = new Date().getMonth();
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    planoCompras.forEach(item => {
        const indiceMes = meses.indexOf(item.mes);
        
        if (indiceMes < mesAtual) {
            // Mês passado
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
            // Mês atual
            const fiiComprado = transacoes.some(t => 
                t.ticker === item.fii1 && new Date(t.data).getMonth() === indiceMes &&
                t.tipo === 'compra'
            );
            
            const fii2Comprado = transacoes.some(t => 
                t.ticker === item.fii2 && new Date(t.data
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
            // Mês futuro
            item.status = 'Futuro';
        }
    });
    
    // Salvar plano atualizado
    localStorage.setItem('plano-compras', JSON.stringify(planoCompras));
}

// Verificar parâmetros da URL
function verificarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const adicionarTicker = urlParams.get('adicionar');
    
    if (adicionarTicker) {
        const fii = dadosFIIs.find(f => f.ticker === adicionarTicker);
        if (fii) {
            // Preencher formulário de adição
            document.getElementById('ticker').value = adicionarTicker;
            document.getElementById('preco').value = fii.precoAtual.toFixed(2);
            document.getElementById('data').valueAsDate = new Date();
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('adicionarFiiModal'));
            modal.show();
        }
    }
}

// Atualizar cards principais
function atualizarCards() {
    // Calcular patrimônio total
    const patrimonioTotal = carteira.reduce((sum, item) => sum + item.total, 0);
    document.getElementById('patrimonio-total').textContent = `R$ ${patrimonioTotal.toFixed(2)}`;
    
    // Calcular dividendos mensais
    const dividendosMensais = carteira.reduce((sum, item) => sum + item.dividendoMensal, 0);
    document.getElementById('dividendos-mensais').textContent = `R$ ${dividendosMensais.toFixed(2)}`;
    
    // Calcular yield médio (ponderado pelo valor)
    let yieldMedio = 0;
    if (patrimonioTotal > 0) {
        yieldMedio = carteira.reduce((sum, item) => sum + (item.dyAnual * item.total), 0) / patrimonioTotal;
    }
    document.getElementById('yield-medio').textContent = `${yieldMedio.toFixed(2)}%`;
    
    // Calcular rentabilidade total
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
            <td class="${rentabilidadeClass}">${item.rentabilidade}%</td>
            <td>${item.percentual}%</td>
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
    
    // Ordenar transações por data (mais recentes primeiro)
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
    
    // Agrupar por segmento
    const segmentos = {};
    carteira.forEach(item => {
        if (!segmentos[item.segmento]) {
            segmentos[item.segmento] = 0;
        }
        segmentos[item.segmento] += item.total;
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
    
    // Gerar dados para os últimos 6 meses
    const hoje = new Date();
    const labels = [];
    const dados = [];
    
    for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje);
        data.setMonth(data.getMonth() - i);
        labels.push(`${data.getMonth() + 1}/${data.getFullYear()}`);
        
        // Buscar transações até esta data
        const dataLimite = new Date(data);
        dataLimite.setDate(dataLimite.getDate() + 30);
        
        const transacoesAteData = transacoes.filter(t => new Date(t.data) <= dataLimite);
        
        // Calcular carteira neste ponto
        const carteiraHistorica = calcularCarteiraHistorica(transacoesAteData);
        
        // Calcular dividendos
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
    
    // Gerar dados para os últimos 6 meses
    const hoje = new Date();
    const labels = [];
    const dadosPatrimonio = [];
    const dadosInvestimento = [];
    
    for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje);
        data.setMonth(data.getMonth() - i);
        labels.push(`${data.getMonth() + 1}/${data.getFullYear()}`);
        
        // Buscar transações até esta data
        const dataLimite = new Date(data);
        dataLimite.setDate(dataLimite.getDate() + 30);
        
        const transacoesAteData = transacoes.filter(t => new Date(t.data) <= dataLimite);
        
        // Calcular carteira neste ponto
        const carteiraHistorica = calcularCarteiraHistorica(transacoesAteData);
        
        // Calcular patrimônio e investimento
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
                // Adicionar novo FII à carteira
                carteiraHistorica.push({
                    ticker: transacao.ticker,
                    quantidade: transacao.quantidade,
                    precoMedio: transacao.preco
                });
            } else {
                // Atualizar FII existente
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
                // Reduzir quantidade
                const fii = carteiraHistorica[fiiIndex];
                const novaQuantidade = fii.quantidade - transacao.quantidade;
                
                if (novaQuantidade <= 0) {
                    // Remover FII da carteira
                    carteiraHistorica.splice(fiiIndex, 1);
                } else {
                    // Atualizar quantidade
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
    // Preencher select de tickers
    const selectTicker = document.getElementById('ticker');
    if (selectTicker) {
        selectTicker.innerHTML = '';
        
        // Adicionar opção vazia
        const optionVazia = document.createElement('option');
        optionVazia.value = '';
        optionVazia.textContent = 'Selecione um FII';
        selectTicker.appendChild(optionVazia);
        
        // Adicionar opções de FIIs
        dadosFIIs.forEach(fii => {
            const option = document.createElement('option');
            option.value = fii.ticker;
            option.textContent = `${fii.ticker} - ${fii.segmento} - R$ ${fii.precoAtual.toFixed(2)}`;
            selectTicker.appendChild(option);
        });
    }
    
        // Evento de mudança de ticker (atualizar preço)
    document.getElementById('ticker')?.addEventListener('change', (e) => {
        const ticker = e.target.value;
        const fii = dadosFIIs.find(f => f.ticker === ticker);
        
        if (fii) {
            document.getElementById('preco').value = fii.precoAtual.toFixed(2);
        }
    });
    
    // Evento de salvar FII
    document.getElementById('btn-salvar-fii')?.addEventListener('click', () => {
        const ticker = document.getElementById('ticker').value;
        const quantidade = parseInt(document.getElementById('quantidade').value);
        const preco = parseFloat(document.getElementById('preco').value);
        const data = document.getElementById('data').value;
        
        if (!ticker || isNaN(quantidade) || isNaN(preco) || !data) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }
        
        // Adicionar transação
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
        
        // Atualizar carteira
        const fiiIndex = carteira.findIndex(item => item.ticker === ticker);
        const fii = dadosFIIs.find(f => f.ticker === ticker);
        
        if (fiiIndex === -1) {
            // Adicionar novo FII à carteira
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
            // Atualizar FII existente
            const fiiCarteira = carteira[fiiIndex];
            const novaQuantidade = fiiCarteira.quantidade + quantidade;
            const novoPrecoMedio = ((fiiCarteira.precoMedio * fiiCarteira.quantidade) + (preco * quantidade)) / novaQuantidade;
            
            carteira[fiiIndex] = {
                ...fiiCarteira,
                quantidade: novaQuantidade,
                precoMedio: novoPrecoMedio
            };
        }
        
        // Recalcular valores da carteira
        carregarCarteira();
        
        // Atualizar interface
        atualizarCards();
        renderizarTabelaCarteira();
        renderizarTabelaTransacoes();
        renderizarGraficoComposicao();
        renderizarGraficoDividendos();
        renderizarGraficoEvolucao();
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('adicionarFiiModal'));
        modal.hide();
        
        // Limpar formulário
        document.getElementById('form-adicionar-fii').reset();
        
        alert('FII adicionado com sucesso!');
    });
    
    // Preencher select de transações
    const selectTransacaoTicker = document.getElementById('transacao-ticker');
    if (selectTransacaoTicker) {
        selectTransacaoTicker.innerHTML = '';
        
        // Adicionar opção vazia
        const optionVazia = document.createElement('option');
        optionVazia.value = '';
        optionVazia.textContent = 'Selecione um FII';
        selectTransacaoTicker.appendChild(optionVazia);
        
        // Adicionar opções de FIIs
        dadosFIIs.forEach(fii => {
            const option = document.createElement('option');
            option.value = fii.ticker;
            option.textContent = `${fii.ticker} - ${fii.segmento} - R$ ${fii.precoAtual.toFixed(2)}`;
            selectTransacaoTicker.appendChild(option);
        });
    }
    
    // Evento de mudança de ticker na transação
    document.getElementById('transacao-ticker')?.addEventListener('change', (e) => {
        const ticker = e.target.value;
        const fii = dadosFIIs.find(f => f.ticker === ticker);
        
        if (fii) {
            document.getElementById('transacao-preco').value = fii.precoAtual.toFixed(2);
        }
    });
    
    // Evento de salvar transação
    document.getElementById('btn-salvar-transacao')?.addEventListener('click', () => {
        const ticker = document.getElementById('transacao-ticker').value;
        const tipo = document.getElementById('transacao-tipo').value;
        const quantidade = parseInt(document.getElementById('transacao-quantidade').value);
        const preco = parseFloat(document.getElementById('transacao-preco').value);
        const data = document.getElementById('transacao-data').value;
        
        if (!ticker || !tipo || isNaN(quantidade) || isNaN(preco) || !data) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }
        
        // Verificar se há quantidade suficiente para venda
        if (tipo === 'venda') {
            const fiiCarteira = carteira.find(item => item.ticker === ticker);
            if (!fiiCarteira || fiiCarteira.quantidade < quantidade) {
                alert('Quantidade insuficiente para venda.');
                return;
            }
        }
        
        // Adicionar transação
        const novaTransacao = {
            id: Date.now(),
            ticker,
            tipo,
            quantidade,
            preco,
            data
        };
        
        transacoes.push(novaTransacao);
        localStorage.setItem('transacoes-fiis', JSON.stringify(transacoes));
        
        // Atualizar carteira
        if (tipo === 'compra') {
            const fiiIndex = carteira.findIndex(item => item.ticker === ticker);
            const fii = dadosFIIs.find(f => f.ticker === ticker);
            
            if (fiiIndex === -1) {
                // Adicionar novo FII à carteira
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
                // Atualizar FII existente
                const fiiCarteira = carteira[fiiIndex];
                const novaQuantidade = fiiCarteira.quantidade + quantidade;
                const novoPrecoMedio = ((fiiCarteira.precoMedio * fiiCarteira.quantidade) + (preco * quantidade)) / novaQuantidade;
                
                carteira[fiiIndex] = {
                    ...fiiCarteira,
                    quantidade: novaQuantidade,
                    precoMedio: novoPrecoMedio
                };
            }
        } else if (tipo === 'venda') {
            const fiiIndex = carteira.findIndex(item => item.ticker === ticker);
            
            if (fiiIndex !== -1) {
                const fiiCarteira = carteira[fiiIndex];
                const novaQuantidade = fiiCarteira.quantidade - quantidade;
                
                if (novaQuantidade <= 0) {
                    // Remover FII da carteira
                    carteira.splice(fiiIndex, 1);
                } else {
                    // Atualizar quantidade
                    carteira[fiiIndex] = {
                        ...fiiCarteira,
                        quantidade: novaQuantidade
                    };
                }
            }
        }
        
        // Recalcular valores da carteira
        carregarCarteira();
        
        // Atualizar interface
        atualizarCards();
        renderizarTabelaCarteira();
        renderizarTabelaTransacoes();
        renderizarGraficoComposicao();
        renderizarGraficoDividendos();
        renderizarGraficoEvolucao();
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('adicionarTransacaoModal'));
        modal.hide();
        
        // Limpar formulário
        document.getElementById('form-adicionar-transacao').reset();
        
        alert('Transação registrada com sucesso!');
    });
}

// Editar FII
function editarFII(ticker) {
    const fii = carteira.find(item => item.ticker === ticker);
    if (!fii) return;
    
    // Preencher formulário
    document.getElementById('ticker').value = ticker;
    document.getElementById('quantidade').value = fii.quantidade;
    document.getElementById('preco').value = fii.precoMedio.toFixed(2);
    document.getElementById('data').valueAsDate = new Date();
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('adicionarFiiModal'));
    modal.show();
}

// Remover FII
function removerFII(ticker) {
    if (!confirm(`Tem certeza que deseja remover ${ticker} da carteira?`)) return;
    
    // Remover da carteira
    const fiiIndex = carteira.findIndex(item => item.ticker === ticker);
    if (fiiIndex !== -1) {
        carteira.splice(fiiIndex, 1);
        localStorage.setItem('carteira-fiis', JSON.stringify(carteira));
        
        // Atualizar interface
        atualizarCards();
        renderizarTabelaCarteira();
        renderizarGraficoComposicao();
        renderizarGraficoDividendos();
        renderizarGraficoEvolucao();
        
        alert(`${ticker} removido da carteira com sucesso!`);
    }
}

// Remover transação
function removerTransacao(id) {
    if (!confirm(`Tem certeza que deseja remover esta transação?`)) return;
    
    // Remover transação
    const transacaoIndex = transacoes.findIndex(t => t.id === id);
    if (transacaoIndex !== -1) {
        transacoes.splice(transacaoIndex, 1);
        localStorage.setItem('transacoes-fiis', JSON.stringify(transacoes));
        
        // Recalcular carteira
        recalcularCarteira();
        
        // Atualizar interface
        atualizarCards();
        renderizarTabelaCarteira();
        renderizarTabelaTransacoes();
        renderizarGraficoComposicao();
        renderizarGraficoDividendos();
        renderizarGraficoEvolucao();
        
        alert('Transação removida com sucesso!');
    }
}

// Recalcular carteira com base nas transações
function recalcularCarteira() {
    // Limpar carteira
    carteira = [];
    
    // Reconstruir carteira a partir das transações
    transacoes.forEach(transacao => {
        if (transacao.tipo === 'compra') {
            const fiiIndex = carteira.findIndex(item => item.ticker === transacao.ticker);
            const fii = dadosFIIs.find(f => f.ticker === transacao.ticker);
            
            if (fiiIndex === -1) {
                // Adicionar novo FII à carteira
                carteira.push({
                    ticker: transacao.ticker,
                    quantidade: transacao.quantidade,
                    precoMedio: transacao.preco,
                    precoAtual: fii ? fii.precoAtual : transacao.preco,
                    ultimoDividendo: fii ? fii.ultimoDividendo : 0,
                    dyAnual: fii ? fii.dyAnual : 0,
                    segmento: fii ? fii.segmento : 'Desconhecido'
                });
            } else {
                // Atualizar FII existente
                const fiiCarteira = carteira[fiiIndex];
                const novaQuantidade = fiiCarteira.quantidade + transacao.quantidade;
                const novoPrecoMedio = ((fiiCarteira.precoMedio * fiiCarteira.quantidade) + (transacao.preco * transacao.quantidade)) / novaQuantidade;
                
                carteira[fiiIndex] = {
                    ...fiiCarteira,
                    quantidade: novaQuantidade,
                    precoMedio: novoPrecoMedio
                };
            }
        } else if (transacao.tipo === 'venda') {
            const fiiIndex = carteira.findIndex(item => item.ticker === transacao.ticker);
            
            if (fiiIndex !== -1) {
                const fiiCarteira = carteira[fiiIndex];
                const novaQuantidade = fiiCarteira.quantidade - transacao.quantidade;
                
                if (novaQuantidade <= 0) {
                    // Remover FII da carteira
                    carteira.splice(fiiIndex, 1);
                } else {
                    // Atualizar quantidade
                    carteira[fiiIndex] = {
                        ...fiiCarteira,
                        quantidade: novaQuantidade
                    };
                }
            }
        }
    });
    
    // Recalcular valores da carteira
    carregarCarteira();
    
    // Salvar carteira atualizada
    localStorage.setItem('carteira-fiis', JSON.stringify(carteira));
}

// Exportar funções para uso global
window.editarFII = editarFII;
window.removerFII = removerFII;
window.removerTransacao = removerTransacao;


