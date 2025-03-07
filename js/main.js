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
    
    // Continuação do código do main.js

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
