/**
 * main.js - Script principal para a página inicial
 * Versão atualizada com preferências do usuário e modo escuro
 */

// Dados globais
let dadosFIIs = [];
let carteira = [];
let planoCompras = [];

// Sistema de preferências do usuário
const preferenciasUsuario = {
    // Carregar preferências salvas
    carregar: function() {
        const prefsSalvas = localStorage.getItem('preferencias-usuario');
        return prefsSalvas ? JSON.parse(prefsSalvas) : {
            modoEscuro: false,
            coresPersonalizadas: {},
            colunasTabelaFIIs: ['ticker', 'segmento', 'precoAtual', 'precoJusto', 'dyAnual', 'pvp'],
            ordenacaoPadrao: 'dyAnual',
            filtrosPadrao: {
                segmentos: ['Recebíveis', 'Logístico', 'Shopping', 'Escritórios', 'Fundo de Fundos', 'Híbrido'],
                dyMinimo: 8,
                pvpMaximo: 1,
                scoreMinimo: 60
            }
        };
    },
    
    // Salvar preferências
    salvar: function(prefs) {
        localStorage.setItem('preferencias-usuario', JSON.stringify(prefs));
    },
    
    // Aplicar preferências
    aplicar: function() {
        const prefs = this.carregar();
        
        // Aplicar modo escuro
        if (prefs.modoEscuro) {
            document.body.classList.add('dark-mode');
            document.getElementById('btn-modo-escuro')?.innerHTML = '<i class="bi bi-sun"></i>';
        }
        
        // Aplicar cores personalizadas
        if (prefs.coresPersonalizadas) {
            Object.entries(prefs.coresPersonalizadas).forEach(([segmento, cor]) => {
                document.documentElement.style.setProperty(`--cor-${segmento.toLowerCase().replace(' ', '-')}`, cor);
            });
        }
        
        // Aplicar configurações de tabela
        if (prefs.colunasTabelaFIIs) {
            // Código para mostrar/ocultar colunas será implementado nas páginas específicas
        }
        
        // Aplicar filtros padrão
        if (prefs.filtrosPadrao && window.filtrosAtivos) {
            window.filtrosAtivos = prefs.filtrosPadrao;
        }
    }
};

// Sistema de notificações
const notificationSystem = {
    show: function(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container') || this.createContainer();
        
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show notification`;
        notification.role = 'alert';
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        container.appendChild(notification);
        
        // Auto-remover após duração especificada
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },
    
    createContainer: function() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(container);
        return container;
    },
    
    success: function(message) {
        this.show(message, 'success');
    },
    
    error: function(message) {
        this.show(message, 'danger', 8000);
    },
    
    warning: function(message) {
        this.show(message, 'warning', 6000);
    },
    
    info: function(message) {
        this.show(message, 'info');
    }
};

// Adicionar ao objeto window para uso global
window.notify = notificationSystem;

// Função para alternar modo escuro
function alternarModoEscuro() {
    document.body.classList.toggle('dark-mode');
    
    // Salvar preferência do usuário
    const prefs = preferenciasUsuario.carregar();
    prefs.modoEscuro = document.body.classList.contains('dark-mode');
    preferenciasUsuario.salvar(prefs);
    
    // Atualizar ícone do botão
    const botao = document.getElementById('btn-modo-escuro');
    if (botao) {
        botao.innerHTML = prefs.modoEscuro ? 
            '<i class="bi bi-sun"></i>' : 
            '<i class="bi bi-moon"></i>';
    }
}

// Renderizar gráfico dos top 5 FIIs por DY
function renderizarGraficoTopDY() {
    renderManager.enqueue('grafico-top-dy', () => {
        const ctx = document.getElementById('grafico-top-dy');
        renderManager.optimizeCanvas(ctx);

        const topFIIs = dadosFIIs
            .sort((a, b) => b.dyAnual - a.dyAnual)
            .slice(0, 5);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topFIIs.map(fii => fii.ticker),
                datasets: [{
                    label: 'DY Anual (%)',
                    data: topFIIs.map(fii => fii.dyAnual),
                    backgroundColor: topFIIs.map(fii => API.obterCoresSegmentos()[fii.segmento]),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const fii = topFIIs[context.dataIndex];
                                return [
                                    `DY: ${fii.dyAnual.toFixed(2)}%`,
                                    `Segmento: ${fii.segmento}`,
                                    `Preço: R$ ${fii.precoAtual.toFixed(2)}`
                                ];
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
    }, 1); // Alta prioridade
}

// Renderizar gráfico de distribuição por segmento
function renderizarGraficoSegmentos() {
    renderManager.enqueue('grafico-segmentos', () => {
        const ctx = document.getElementById('grafico-segmentos');
        renderManager.optimizeCanvas(ctx);

        const segmentos = {};
        dadosFIIs.forEach(fii => {
            if (!segmentos[fii.segmento]) {
                segmentos[fii.segmento] = 0;
            }
            segmentos[fii.segmento]++;
        });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(segmentos),
                datasets: [{
                    data: Object.values(segmentos),
                    backgroundColor: Object.keys(segmentos).map(seg => API.obterCoresSegmentos()[seg]),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                                return `${label}: ${value} FIIs (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }, 1); // Alta prioridade
}

// Renderizar tabela do plano de compras resumido
const renderizarPlanoResumo = renderManager.debounce(() => {
    renderManager.enqueue('tabela-plano-resumo', () => {
        const tbody = document.querySelector('#tabela-plano-resumo tbody');
        tbody.innerHTML = '';

        // Obter próximos 3 meses do plano
        const planoProximos = planoCompras.slice(0, 3);

        planoProximos.forEach(plano => {
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
    }, 0); // Prioridade normal
}, 200);

// Atualizar cards principais
const atualizarCards = renderManager.debounce(() => {
    renderManager.enqueue('cards', () => {
        // Total de FIIs monitorados
        document.getElementById('total-fiis').textContent = dadosFIIs.length;

        // Média de DY
        const mediaGeral = dadosFIIs.reduce((sum, fii) => sum + fii.dyAnual, 0) / dadosFIIs.length;
        document.getElementById('media-dy').textContent = `${mediaGeral.toFixed(2)}%`;

        // Total na carteira
        const totalCarteira = carteira.length;
        document.getElementById('total-carteira').textContent = totalCarteira;

        // Total de alertas
        const totalAlertas = (JSON.parse(localStorage.getItem('alertas-fiis')) || []).length;
        document.getElementById('total-alertas').textContent = totalAlertas;
    }, 2); // Máxima prioridade
}, 100);

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Aplicar preferências do usuário
        preferenciasUsuario.aplicar();
        
        // Adicionar botão de modo escuro se não existir
        if (!document.getElementById('btn-modo-escuro')) {
            const navbar = document.querySelector('.navbar-nav');
            if (navbar) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.innerHTML = `
                    <button id="btn-modo-escuro" class="btn btn-link nav-link">
                        <i class="bi bi-moon"></i>
                    </button>
                `;
                navbar.appendChild(li);
                
                // Adicionar evento ao botão
                document.getElementById('btn-modo-escuro').addEventListener('click', alternarModoEscuro);
            }
        }
        
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

// Função para alternar modo escuro
function alternarModoEscuro() {
    document.body.classList.toggle('dark-mode');
    
    // Salvar preferência do usuário
    const modoEscuroAtivo = document.body.classList.contains('dark-mode');
    localStorage.setItem('modo-escuro', modoEscuroAtivo);
    
    // Atualizar ícone do botão
    const botao = document.getElementById('btn-modo-escuro');
    if (botao) {
        botao.innerHTML = modoEscuroAtivo ? 
            '<i class="bi bi-sun"></i>' : 
            '<i class="bi bi-moon"></i>';
    }
}

// Verificar preferência salva
document.addEventListener('DOMContentLoaded', () => {
    const modoEscuroSalvo = localStorage.getItem('modo-escuro') === 'true';
    
    if (modoEscuroSalvo) {
        document.body.classList.add('dark-mode');
    }
    
    // Adicionar botão de modo escuro se não existir
    if (!document.getElementById('btn-modo-escuro')) {
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <button id="btn-modo-escuro" class="btn btn-link nav-link">
                    <i class="bi ${modoEscuroSalvo ? 'bi-sun' : 'bi-moon'}"></i>
                </button>
            `;
            navbar.appendChild(li);
            
            // Adicionar evento ao botão
            document.getElementById('btn-modo-escuro').addEventListener('click', alternarModoEscuro);
        }
    }
});
