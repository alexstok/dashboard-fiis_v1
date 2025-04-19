/**
 * carteira.js - Script para a página de gerenciamento da carteira
 */

// Dados globais
let dadosFIIs = [];
let carteira = [];
let transacoes = [];
let planoCompras = [];

// Inicializar monitoramento em tempo real
let unsubscribe = null;

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
        atualizarInterfaceCompleta();
        
        // Configurar eventos
        configurarEventos();
        
        // Iniciar monitoramento em tempo real
        unsubscribe = realtimeMonitor.subscribe('carteira', (dadosAtualizados) => {
            dadosFIIs = dadosAtualizados;
            carregarCarteira(); // Recalcular carteira com novos preços
            atualizarInterfaceCompleta();
            document.getElementById('ultima-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
        });
        
    } catch (error) {
        console.error('Erro ao inicializar carteira:', error);
        alert('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    }
});

// Parar monitoramento ao sair da página
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});

// Carregar dados da carteira
function carregarCarteira() {
    carteira = secureStorage.getItem('carteira-fiis') || [];
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
    secureStorage.setItem('carteira-fiis', carteira);
}

// Carregar transações
function carregarTransacoes() {
    transacoes = secureStorage.getItem('transacoes-fiis') || [];
}

// Carregar plano de compras
function carregarPlanoCompras() {
    planoCompras = secureStorage.getItem('plano-compras') || [];
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
    secureStorage.setItem('plano-compras', planoCompras);
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

// Renderizar gráfico de composição da carteira otimizado
function renderizarGraficoComposicao() {
    renderManager.enqueue('grafico-composicao', () => {
        const ctx = document.getElementById('grafico-composicao');
        renderManager.optimizeCanvas(ctx);

        // Agrupar FIIs por segmento
        const composicao = {};
        carteira.forEach(item => {
            const segmento = item.segmento;
            if (!composicao[segmento]) {
                composicao[segmento] = 0;
            }
            composicao[segmento] += item.total;
        });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(composicao),
                datasets: [{
                    data: Object.values(composicao),
                    backgroundColor: Object.keys(composicao).map(seg => API.obterCoresSegmentos()[seg]),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300
                },
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }, 1); // Alta prioridade
}

// Renderizar gráfico de dividendos otimizado
function renderizarGraficoDividendos() {
    renderManager.enqueue('grafico-dividendos', () => {
        const ctx = document.getElementById('grafico-dividendos');
        renderManager.optimizeCanvas(ctx);

        // Calcular dividendos mensais
        const hoje = new Date();
        const labels = [];
        const dados = new Float32Array(12); // Usar TypedArray para melhor performance

        for (let i = 11; i >= 0; i--) {
            const data = new Date(hoje);
            data.setMonth(data.getMonth() - i);
            labels.push(`${data.getMonth() + 1}/${data.getFullYear()}`);

            // Simular variação nos dividendos
            const dividendoBase = carteira.reduce((sum, item) => 
                sum + (item.quantidade * item.ultimoDividendo), 0);
            const variacao = (Math.random() * 0.2) - 0.1; // ±10%
            dados[11-i] = dividendoBase * (1 + variacao);
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Dividendos (R$)',
                    data: dados,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300
                },
                plugins: {
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
                            text: 'Dividendos (R$)'
                        }
                    }
                }
            }
        });
    }, 1);
}

// Renderizar gráfico de evolução do patrimônio otimizado
function renderizarGraficoEvolucao() {
    renderManager.enqueue('grafico-evolucao', () => {
        const ctx = document.getElementById('grafico-evolucao');
        renderManager.optimizeCanvas(ctx);

        // Calcular evolução do patrimônio
        const evolucao = calcularEvolucaoPatrimonio();

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: evolucao.labels,
                datasets: [{
                    label: 'Patrimônio (R$)',
                    data: evolucao.dados,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2
                }]
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
                            text: 'Patrimônio (R$)'
                        }
                    }
                }
            }
        });
    }, 1);
}

// Renderizar tabela da carteira otimizada
const renderizarTabelaCarteira = renderManager.debounce(() => {
    renderManager.enqueue('tabela-carteira', () => {
        const tbody = document.querySelector('#tabela-carteira tbody');
        const fragment = document.createDocumentFragment();
        
        tbody.innerHTML = '';
        
        // Ordenar FIIs por valor total
        const carteiraOrdenada = [...carteira].sort((a, b) => b.total - a.total);
        
        carteiraOrdenada.forEach(item => {
            const tr = document.createElement('tr');
            const dadosFII = dadosFIIs.find(f => f.ticker === item.ticker) || {};
            
            const rentabilidade = ((dadosFII.precoAtual - item.precoMedio) / item.precoMedio * 100);
            
            tr.innerHTML = `
                <td>${item.ticker}</td>
                <td>${dadosFII.segmento || '-'}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${item.precoMedio.toFixed(2)}</td>
                <td>R$ ${dadosFII.precoAtual?.toFixed(2) || '-'}</td>
                <td>R$ ${item.total.toFixed(2)}</td>
                <td>R$ ${(item.quantidade * dadosFII.ultimoDividendo || 0).toFixed(2)}</td>
                <td class="${rentabilidade >= 0 ? 'text-success' : 'text-danger'}">
                    ${rentabilidade.toFixed(2)}%
                </td>
                <td>${item.percentual}%</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editarFII('${item.ticker}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="removerFII('${item.ticker}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            fragment.appendChild(tr);
        });
        
        tbody.appendChild(fragment);
    }, 0);
}, 200);

// Renderizar tabela de transações otimizada
const renderizarTabelaTransacoes = renderManager.debounce(() => {
    renderManager.enqueue('tabela-transacoes', () => {
        const tbody = document.querySelector('#tabela-transacoes tbody');
        const fragment = document.createDocumentFragment();
        
        tbody.innerHTML = '';
        
        // Ordenar transações por data (mais recentes primeiro)
        const transacoesOrdenadas = [...transacoes].sort((a, b) => 
            new Date(b.data) - new Date(a.data)
        );
        
        transacoesOrdenadas.forEach(transacao => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(transacao.data).toLocaleDateString('pt-BR')}</td>
                <td>${transacao.ticker}</td>
                <td>${transacao.tipo === 'compra' ? 'Compra' : 'Venda'}</td>
                <td>${transacao.quantidade}</td>
                <td>R$ ${transacao.preco.toFixed(2)}</td>
                <td>R$ ${(transacao.quantidade * transacao.preco).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removerTransacao(${transacao.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            fragment.appendChild(tr);
        });
        
        tbody.appendChild(fragment);
    }, 0);
}, 200);

// Renderizar tabela do plano de compras otimizada
const renderizarTabelaPlano = renderManager.debounce(() => {
    renderManager.enqueue('tabela-plano', () => {
        const tbody = document.querySelector('#tabela-plano tbody');
        const fragment = document.createDocumentFragment();
        
        tbody.innerHTML = '';
        
        let valorAcumulado = 0;
        
        planoCompras.forEach(plano => {
            valorAcumulado += plano.valorMensal;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${plano.mes}</td>
                <td>${plano.fii1 || '-'}</td>
                <td>R$ ${plano.valorFii1?.toFixed(2) || '0.00'}</td>
                <td>${plano.fii2 || '-'}</td>
                <td>R$ ${plano.valorFii2?.toFixed(2) || '0.00'}</td>
                <td>R$ ${plano.valorMensal.toFixed(2)}</td>
                <td>R$ ${valorAcumulado.toFixed(2)}</td>
                <td>
                    <span class="badge ${plano.status === 'Concluído' ? 'bg-success' : 
                        plano.status === 'Em Andamento' ? 'bg-warning' : 'bg-secondary'}">
                        ${plano.status}
                    </span>
                </td>
            `;
            fragment.appendChild(tr);
        });
        
        tbody.appendChild(fragment);
    }, 0);
}, 200);

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

// Funções de validação
function validarTransacao(dados) {
    const erros = [];
    
    if (!dados.ticker) {
        erros.push('Selecione um FII');
    }
    
    if (!dados.tipo) {
        erros.push('Selecione o tipo de transação');
    }
    
    if (!dados.quantidade || dados.quantidade <= 0) {
        erros.push('A quantidade deve ser maior que zero');
    }
    
    if (!dados.preco || dados.preco <= 0) {
        erros.push('O preço deve ser maior que zero');
    }
    
    if (!dados.data) {
        erros.push('Selecione uma data');
    }
    
    return erros;
}

// Sobrescrever função configurarEventos
function configurarEventos() {
    // Formulário de adicionar transação
    document.getElementById('form-adicionar-transacao').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dados = {
            ticker: document.getElementById('transacao-ticker').value,
            tipo: document.getElementById('transacao-tipo').value,
            quantidade: parseInt(document.getElementById('transacao-quantidade').value),
            preco: parseFloat(document.getElementById('transacao-preco').value),
            data: document.getElementById('transacao-data').value
        };
        
        const erros = validarTransacao(dados);
        if (erros.length > 0) {
            notify.error(erros.join('<br>'));
            return;
        }
        
        try {
            // Adicionar transação
            const novaTransacao = {
                id: Date.now(),
                ...dados
            };
            
            transacoes.push(novaTransacao);
            secureStorage.setItem('transacoes-fiis', transacoes);
            
            // Recalcular carteira
            recalcularCarteira();
            
            // Atualizar interface
            atualizarInterfaceCompleta();
            
            // Fechar modal e limpar formulário
            const modal = bootstrap.Modal.getInstance(document.getElementById('adicionarTransacaoModal'));
            modal.hide();
            e.target.reset();
            
            notify.success('Transação registrada com sucesso!');
        } catch (error) {
            console.error('Erro ao registrar transação:', error);
            notify.error('Erro ao registrar transação. Tente novamente.');
        }
    });
    
    // Validações em tempo real
    document.getElementById('transacao-quantidade').addEventListener('input', (e) => {
        const valor = parseInt(e.target.value);
        if (valor <= 0) {
            e.target.classList.add('is-invalid');
        } else {
            e.target.classList.remove('is-invalid');
        }
    });
    
    document.getElementById('transacao-preco').addEventListener('input', (e) => {
        const valor = parseFloat(e.target.value);
        if (valor <= 0) {
            e.target.classList.add('is-invalid');
        } else {
            e.target.classList.remove('is-invalid');
        }
    });
}

// Substituir função removerTransacao
function removerTransacao(id) {
    if (!confirm('Tem certeza que deseja remover esta transação?')) return;
    
    try {
        // Remover transação
        const transacaoIndex = transacoes.findIndex(t => t.id === id);
        if (transacaoIndex !== -1) {
            const transacaoRemovida = transacoes[transacaoIndex];
            transacoes.splice(transacaoIndex, 1);
            secureStorage.setItem('transacoes-fiis', transacoes);
            
            // Recalcular carteira
            recalcularCarteira();
            
            // Atualizar interface
            atualizarInterfaceCompleta();
            
            notify.success(`Transação do FII ${transacaoRemovida.ticker} removida com sucesso!`);
        }
    } catch (error) {
        console.error('Erro ao remover transação:', error);
        notify.error('Erro ao remover transação. Tente novamente.');
    }
}

// Função para atualizar toda a interface
function atualizarInterfaceCompleta() {
    atualizarCards();
    renderizarTabelaCarteira();
    renderizarTabelaTransacoes();
    renderizarTabelaPlano();
    renderizarGraficoComposicao();
    renderizarGraficoDividendos();
    renderizarGraficoEvolucao();
}

// Exportar funções para uso global
window.editarFII = editarFII;
window.removerFII = removerFII;
window.removerTransacao = removerTransacao;


