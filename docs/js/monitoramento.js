// Função para exportar dados para Excel
function exportarTabelaParaExcel() {
    // Verificar se a biblioteca SheetJS está disponível
    if (typeof XLSX === 'undefined') {
        // Carregar biblioteca dinamicamente se não estiver disponível
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = function() {
            realizarExportacao();
        };
        document.head.appendChild(script);
    } else {
        realizarExportacao();
    }
}

function realizarExportacao() {
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
            // Ignorar a última coluna (ações)
            if (index < cabecalhos.length - 1) {
                linha[cabecalhos[index]] = td.textContent.replace(/\n/g, '').trim();
            }
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

// Adicionar botão de exportação ao HTML
document.addEventListener('DOMContentLoaded', function() {
    const cardHeader = document.querySelector('#monitoramento .card-header div');
    if (cardHeader) {
        const btnExportar = document.createElement('button');
        btnExportar.className = 'btn btn-success me-2';
        btnExportar.innerHTML = '<i class="bi bi-file-excel"></i> Exportar Excel';
        btnExportar.addEventListener('click', exportarTabelaParaExcel);
        cardHeader.prepend(btnExportar);
    }
});

// Função para comparar FIIs selecionados
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
    
    // Criar modal de comparação
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'comparacaoModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'comparacaoModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="comparacaoModalLabel">Comparação de FIIs</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-4">
                        <div class="col-12">
                            <canvas id="grafico-comparacao"></canvas>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped" id="tabela-comparacao">
                            <thead>
                                <tr>
                                    <th>Indicador</th>
                                    ${dadosComparacao.map(fii => `<th>${fii.ticker}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Preço Atual</td>
                                    ${dadosComparacao.map(fii => `<td>R$ ${fii.precoAtual.toFixed(2)}</td>`).join('')}
                                </tr>
                                <tr>
                                    <td>Dividend Yield</td>
                                    ${dadosComparacao.map(fii => `<td>${fii.dyAnual.toFixed(2)}%</td>`).join('')}
                                </tr>
                                <tr>
                                    <td>P/VP</td>
                                    ${dadosComparacao.map(fii => `<td>${fii.pvp.toFixed(2)}</td>`).join('')}
                                </tr>
                                <tr>
                                    <td>Último Dividendo</td>
                                    ${dadosComparacao.map(fii => `<td>R$ ${fii.ultimoDividendo.toFixed(2)}</td>`).join('')}
                                </tr>
                                <tr>
                                    <td>Segmento</td>
                                    ${dadosComparacao.map(fii => `<td>${fii.segmento}</td>`).join('')}
                                </tr>
                                <tr>
                                    <td>Score</td>
                                    ${dadosComparacao.map(fii => `<td>${fii.score}</td>`).join('')}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostrar modal
    const modalInstance = new bootstrap.Modal(document.getElementById('comparacaoModal'));
    modalInstance.show();
    
    // Renderizar gráfico de comparação
    setTimeout(() => {
        const ctx = document.getElementById('grafico-comparacao').getContext('2d');
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['DY (%)', 'P/VP', 'Score', 'Liquidez', 'Vacância', 'Potencial (%)'],
                datasets: dadosComparacao.map((fii, index) => {
                    // Cores diferentes para cada FII
                    const cores = ['rgba(75, 192, 192, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)'];
                    
                    return {
                        label: fii.ticker,
                        data: [
                            fii.dyAnual,
                            fii.pvp * 10, // Multiplicar para escala
                            fii.score / 10, // Dividir para escala
                            Math.min(10, fii.liquidezDiaria / 500000), // Normalizar para 0-10
                            fii.vacancia ? 10 - fii.vacancia : 10, // Inverter (menor é melhor)
                            parseFloat(fii.potencial)
                        ],
                        backgroundColor: cores[index % cores.length],
                        borderColor: cores[index % cores.length].replace('0.7', '1'),
                        borderWidth: 1
                    };
                })
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                }
            }
        });
    }, 500);
}

// Adicionar checkboxes para seleção de FIIs
document.addEventListener('DOMContentLoaded', function() {
    const tabela = document.querySelector('#tabela-fiis');
    if (tabela) {
        // Adicionar coluna de seleção no cabeçalho
        const headerRow = tabela.querySelector('thead tr');
        const th = document.createElement('th');
        th.textContent = 'Comparar';
        headerRow.prepend(th);
        
        // Adicionar checkboxes em cada linha
        tabela.querySelectorAll('tbody tr').forEach(tr => {
            const td = document.createElement('td');
            const ticker = tr.querySelector('td:first-child').textContent;
            td.innerHTML = `<input type="checkbox" class="fii-checkbox" value="${ticker}">`;
            tr.prepend(td);
        });
        
        // Adicionar botão de comparação
        const cardHeader = document.querySelector('#monitoramento .card-header div');
        if (cardHeader) {
            const btnComparar = document.createElement('button');
            btnComparar.className = 'btn btn-info me-2';
            btnComparar.innerHTML = '<i class="bi bi-bar-chart"></i> Comparar FIIs';
            btnComparar.addEventListener('click', compararFIIs);
            cardHeader.prepend(btnComparar);
        }
    }
});
