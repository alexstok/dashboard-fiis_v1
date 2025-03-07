/**
 * API.js - Módulo para comunicação com APIs externas e manipulação de dados
 * Este arquivo contém funções para buscar dados de FIIs de APIs gratuitas
 */

// Configurações
const API_CONFIG = {
    cacheTimeout: 60 * 60 * 1000, // 1 hora em milissegundos
    apiKey: '', // Adicione sua chave de API se necessário
};

// Cache local para armazenar dados e reduzir requisições
let dadosCache = {
    fiis: null,
    ultimaAtualizacao: null,
    historico: {},
    dividendos: {}
};

/**
 * Busca dados dos FIIs
 * Em produção, conectar com APIs reais como Alpha Vantage, Yahoo Finance, etc.
 */
async function buscarDadosFIIs() {
    // Verificar se há dados em cache válidos
    if (dadosCache.fiis && dadosCache.ultimaAtualizacao && 
        (new Date() - dadosCache.ultimaAtualizacao < API_CONFIG.cacheTimeout)) {
        console.log('Usando dados em cache');
        return dadosCache.fiis;
    }

    try {
        // Em produção, substituir por chamada real à API
        // const response = await fetch('https://api.exemplo.com/fiis');
        // const data = await response.json();
        
        // Dados simulados para desenvolvimento
        const data = [
            { ticker: 'MXRF11', segmento: 'Recebíveis', precoAtual: 9.80, vpc: 10.32, ultimoDividendo: 0.09, dyMensal: 0.92, dyAnual: 12.6, pvp: 0.95, vacancia: 0, numAtivos: 45, liquidezDiaria: 3190000, capRate: 11.2, ffoYield: 13.1, gestora: 'Maxi Renda' },
            { ticker: 'KNCR11', segmento: 'Recebíveis', precoAtual: 10.12, vpc: 10.33, ultimoDividendo: 0.11, dyMensal: 1.09, dyAnual: 13.1, pvp: 0.98, vacancia: 0, numAtivos: 32, liquidezDiaria: 2870000, capRate: 12.5, ffoYield: 13.8, gestora: 'Kinea' },
            { ticker: 'HGLG11', segmento: 'Logístico', precoAtual: 15.80, vpc: 19.27, ultimoDividendo: 0.12, dyMensal: 0.76, dyAnual: 9.2, pvp: 0.82, vacancia: 3.2, numAtivos: 18, liquidezDiaria: 1950000, capRate: 8.7, ffoYield: 9.5, gestora: 'CSHG' },
            { ticker: 'VISC11', segmento: 'Shopping', precoAtual: 11.15, vpc: 12.67, ultimoDividendo: 0.08, dyMensal: 0.72, dyAnual: 8.7, pvp: 0.88, vacancia: 5.1, numAtivos: 12, liquidezDiaria: 1820000, capRate: 7.9, ffoYield: 9.1, gestora: 'Vinci' },
            { ticker: 'XPLG11', segmento: 'Logístico', precoAtual: 10.45, vpc: 12.29, ultimoDividendo: 0.08, dyMensal: 0.77, dyAnual: 9.3, pvp: 0.85, vacancia: 2.9, numAtivos: 15, liquidezDiaria: 2150000, capRate: 8.5, ffoYield: 9.8, gestora: 'XP Asset' },
            { ticker: 'HGRE11', segmento: 'Escritórios', precoAtual: 12.50, vpc: 15.63, ultimoDividendo: 0.09, dyMensal: 0.72, dyAnual: 8.5, pvp: 0.80, vacancia: 12.8, numAtivos: 8, liquidezDiaria: 1650000, capRate: 7.8, ffoYield: 8.9, gestora: 'CSHG' },
            { ticker: 'XPML11', segmento: 'Shopping', precoAtual: 10.80, vpc: 13.01, ultimoDividendo: 0.07, dyMensal: 0.65, dyAnual: 8.4, pvp: 0.83, vacancia: 4.8, numAtivos: 10, liquidezDiaria: 1740000, capRate: 7.6, ffoYield: 8.7, gestora: 'XP Asset' },
            { ticker: 'RECT11', segmento: 'Recebíveis', precoAtual: 17.20, vpc: 17.73, ultimoDividendo: 0.17, dyMensal: 0.99, dyAnual: 12.2, pvp: 0.97, vacancia: 0, numAtivos: 28, liquidezDiaria: 1320000, capRate: 11.5, ffoYield: 12.8, gestora: 'Riza' },
            { ticker: 'BCFF11', segmento: 'Fundo de Fundos', precoAtual: 7.40, vpc: 8.13, ultimoDividendo: 0.06, dyMensal: 0.81, dyAnual: 10.5, pvp: 0.91, vacancia: 0, numAtivos: 22, liquidezDiaria: 1280000, capRate: 9.8, ffoYield: 11.2, gestora: 'BTG Pactual' },
            { ticker: 'IRDM11', segmento: 'Recebíveis', precoAtual: 10.30, vpc: 10.40, ultimoDividendo: 0.12, dyMensal: 1.17, dyAnual: 14.2, pvp: 0.99, vacancia: 0, numAtivos: 38, liquidezDiaria: 2450000, capRate: 13.8, ffoYield: 14.5, gestora: 'Iridium' },
            { ticker: 'HFOF11', segmento: 'Fundo de Fundos', precoAtual: 7.25, vpc: 7.80, ultimoDividendo: 0.06, dyMensal: 0.83, dyAnual: 9.8, pvp: 0.93, vacancia: 0, numAtivos: 25, liquidezDiaria: 1150000, capRate: 9.2, ffoYield: 10.3, gestora: 'Hedge' },
            { ticker: 'RZTR11', segmento: 'Recebíveis', precoAtual: 8.70, vpc: 9.06, ultimoDividendo: 0.11, dyMensal: 1.26, dyAnual: 15.1, pvp: 0.96, vacancia: 0, numAtivos: 42, liquidezDiaria: 1920000, capRate: 14.2, ffoYield: 15.5, gestora: 'Riza' },
            { ticker: 'VGIP11', segmento: 'Recebíveis', precoAtual: 9.95, vpc: 10.26, ultimoDividendo: 0.11, dyMensal: 1.11, dyAnual: 13.7, pvp: 0.97, vacancia: 0, numAtivos: 30, liquidezDiaria: 1680000, capRate: 12.9, ffoYield: 14.1, gestora: 'Valora' },
            { ticker: 'KNRI11', segmento: 'Híbrido', precoAtual: 17.10, vpc: 21.11, ultimoDividendo: 0.12, dyMensal: 0.70, dyAnual: 8.4, pvp: 0.81, vacancia: 7.2, numAtivos: 20, liquidezDiaria: 2250000, capRate: 7.8, ffoYield: 8.9, gestora: 'Kinea' },
            { ticker: 'RBRR11', segmento: 'Recebíveis', precoAtual: 9.45, vpc: 9.84, ultimoDividendo: 0.10, dyMensal: 1.06, dyAnual: 12.8, pvp: 0.96, vacancia: 0, numAtivos: 35, liquidezDiaria: 1480000, capRate: 12.1, ffoYield: 13.2, gestora: 'RBR Asset' },
            { ticker: 'HCTR11', segmento: 'Híbrido', precoAtual: 11.25, vpc: 13.07, ultimoDividendo: 0.09, dyMensal: 0.80, dyAnual: 9.6, pvp: 0.86, vacancia: 5.8, numAtivos: 15, liquidezDiaria: 1350000, capRate: 8.9, ffoYield: 10.1, gestora: 'Hectare' },
            { ticker: 'HSML11', segmento: 'Shopping', precoAtual: 9.75, vpc: 11.47, ultimoDividendo: 0.07, dyMensal: 0.72, dyAnual: 8.6, pvp: 0.85, vacancia: 4.5, numAtivos: 8, liquidezDiaria: 1280000, capRate: 7.9, ffoYield: 9.0, gestora: 'CSHG' },
            { ticker: 'XPIN11', segmento: 'Logístico', precoAtual: 8.90, vpc: 10.47, ultimoDividendo: 0.07, dyMensal: 0.79, dyAnual: 9.5, pvp: 0.85, vacancia: 3.1, numAtivos: 12, liquidezDiaria: 1180000, capRate: 8.7, ffoYield: 9.9, gestora: 'XP Asset' },
            { ticker: 'RBRF11', segmento: 'Fundo de Fundos', precoAtual: 7.85, vpc: 8.63, ultimoDividendo: 0.07, dyMensal: 0.89, dyAnual: 10.7, pvp: 0.91, vacancia: 0, numAtivos: 28, liquidezDiaria: 1420000, capRate: 10.0, ffoYield: 11.3, gestora: 'RBR Asset' },
            { ticker: 'VINO11', segmento: 'Híbrido', precoAtual: 8.15, vpc: 9.59, ultimoDividendo: 0.06, dyMensal: 0.74, dyAnual: 8.8, pvp: 0.85, vacancia: 6.2, numAtivos: 14, liquidezDiaria: 980000, capRate: 8.1, ffoYield: 9.2, gestora: 'Vinci' },
            { ticker: 'HGRU11', segmento: 'Shopping', precoAtual: 14.20, vpc: 16.90, ultimoDividendo: 0.10, dyMensal: 0.70, dyAnual: 8.5, pvp: 0.84, vacancia: 4.2, numAtivos: 10, liquidezDiaria: 1680000, capRate: 7.8, ffoYield: 8.9, gestora: 'CSHG' },
            { ticker: 'BTLG11', segmento: 'Logístico', precoAtual: 11.50, vpc: 13.37, ultimoDividendo: 0.09, dyMensal: 0.78, dyAnual: 9.4, pvp: 0.86, vacancia: 2.5, numAtivos: 9, liquidezDiaria: 1580000, capRate: 8.6, ffoYield: 9.8, gestora: 'BTG Pactual' },
            { ticker: 'RECR11', segmento: 'Recebíveis', precoAtual: 10.05, vpc: 10.26, ultimoDividendo: 0.12, dyMensal: 1.19, dyAnual: 14.3, pvp: 0.98, vacancia: 0, numAtivos: 32, liquidezDiaria: 1380000, capRate: 13.5, ffoYield: 14.8, gestora: 'REC Gestão' },
            { ticker: 'HGBS11', segmento: 'Shopping', precoAtual: 16.80, vpc: 19.54, ultimoDividendo: 0.12, dyMensal: 0.71, dyAnual: 8.6, pvp: 0.86, vacancia: 3.8, numAtivos: 7, liquidezDiaria: 1520000, capRate: 7.9, ffoYield: 9.0, gestora: 'CSHG' },
            { ticker: 'VILG11', segmento: 'Logístico', precoAtual: 10.20, vpc: 11.85, ultimoDividendo: 0.08, dyMensal: 0.78, dyAnual: 9.4, pvp: 0.86, vacancia: 3.0, numAtivos: 12, liquidezDiaria: 1650000, capRate: 8.7, ffoYield: 9.9, gestora: 'Vinci' },
            { ticker: 'BRCR11', segmento: 'Escritórios', precoAtual: 8.95, vpc: 11.19, ultimoDividendo: 0.06, dyMensal: 0.67, dyAnual: 8.0, pvp: 0.80, vacancia: 14.5, numAtivos: 12, liquidezDiaria: 1280000, capRate: 7.3, ffoYield: 8.4, gestora: 'BTG Pactual' },
            { ticker: 'HGFF11', segmento: 'Fundo de Fundos', precoAtual: 8.10, vpc: 8.82, ultimoDividendo: 0.07, dyMensal: 0.86, dyAnual: 10.4, pvp: 0.92, vacancia: 0, numAtivos: 30, liquidezDiaria: 1350000, capRate: 9.7, ffoYield: 11.0, gestora: 'CSHG' },
            { ticker: 'XPCI11', segmento: 'Recebíveis', precoAtual: 9.65, vpc: 9.95, ultimoDividendo: 0.11, dyMensal: 1.14, dyAnual: 13.7, pvp: 0.97, vacancia: 0, numAtivos: 36, liquidezDiaria: 1580000, capRate: 12.8, ffoYield: 14.0, gestora: 'XP Asset' },
            { ticker: 'RBVA11', segmento: 'Recebíveis', precoAtual: 9.85, vpc: 10.16, ultimoDividendo: 0.11, dyMensal: 1.12, dyAnual: 13.4, pvp: 0.97, vacancia: 0, numAtivos: 28, liquidezDiaria: 1250000, capRate: 12.5, ffoYield: 13.8, gestora: 'RBR Asset' }
        ];

        // Calcular preço justo para cada FII
        data.forEach(fii => {
            fii.precoJusto = calcularPrecoJusto(fii);
            fii.potencial = ((fii.precoJusto / fii.precoAtual - 1) * 100).toFixed(2);
            fii.score = calcularScore(fii);
        });

        // Atualizar cache
        dadosCache.fiis = data;
        dadosCache.ultimaAtualizacao = new Date();
        
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados dos FIIs:', error);
        // Retornar dados em cache mesmo expirados, se disponíveis
        if (dadosCache.fiis) {
            return dadosCache.fiis;
        }
        throw error;
    }
}

/**
 * Busca dados históricos de um FII específico
 */
async function buscarDadosHistoricos(ticker, periodo = '1y') {
    // Verificar se há dados em cache
    const cacheKey = `${ticker}_${periodo}`;
    if (dadosCache.historico[cacheKey] && 
        dadosCache.historico[cacheKey].timestamp && 
        (new Date() - dadosCache.historico[cacheKey].timestamp < API_CONFIG.cacheTimeout)) {
        return dadosCache.historico[cacheKey].dados;
    }

    try {
        // Em produção, usar API real
        // const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.SA?interval=1d&range=${periodo}`;
        // const response = await fetch(url);
        // const data = await response.json();
        
        // Dados simulados para desenvolvimento
        const hoje = new Date();
        const dadosSimulados = [];
        
        // Gerar dados históricos simulados
        for (let i = 365; i >= 0; i--) {
            const data = new Date(hoje);
            data.setDate(data.getDate() - i);
            
            // Pular finais de semana
            if (data.getDay() === 0 || data.getDay() === 6) continue;
            
            // Gerar preço simulado com alguma variação
            const basePrice = ticker.includes('11') ? 10 : 20; // Preço base
            const randomFactor = Math.sin(i / 20) * 2 + (Math.random() - 0.5);
            const price = basePrice + randomFactor;
            
            dadosSimulados.push({
                data: data.toISOString().split('T')[0],
                abertura: (price - 0.1).toFixed(2),
                fechamento: price.toFixed(2),
                maximo: (price + 0.2).toFixed(2),
                minimo: (price - 0.3).toFixed(2),
                volume: Math.floor(Math.random() * 1000000) + 500000
            });
        }
        
        // Armazenar em cache
        dadosCache.historico[cacheKey] = {
            dados: dadosSimulados,
            timestamp: new Date()
        };
        
        return dadosSimulados;
    } catch (error) {
        console.error(`Erro ao buscar dados históricos para ${ticker}:`, error);
        // Retornar dados em cache mesmo expirados, se disponíveis
        if (dadosCache.historico[cacheKey]) {
            return dadosCache.historico[cacheKey].dados;
        }
        return [];
    }
}

// Adicione ao arquivo api.js
async function buscarDadosStatusInvest(ticker) {
  try {
    // Em ambiente real, você precisaria de um proxy CORS
    const response = await fetch(`https://cors-anywhere.herokuapp.com/https://statusinvest.com.br/fundos-imobiliarios/${ticker}`);
    const html = await response.text();
    
    // Use Cheerio para extrair dados (adicione a biblioteca ao seu projeto)
    const $ = cheerio.load(html);
    
    // Extrair dados específicos
    const precoAtual = parseFloat($('.price-current').text().replace('R$', '').trim());
    const dy = parseFloat($('.indicator-value[title="Dividend Yield"]').text().replace('%', '').trim());
    
    return { precoAtual, dy };
  } catch (error) {
    console.error('Erro ao buscar dados do Status Invest:', error);
    return null;
  }
}


/**
 * Busca histórico de dividendos de um FII
 */
async function buscarHistoricoDividendos(ticker) {
    // Verificar cache
    if (dadosCache.dividendos[ticker] && 
        dadosCache.dividendos[ticker].timestamp && 
        (new Date() - dadosCache.dividendos[ticker].timestamp < API_CONFIG.cacheTimeout)) {
        return dadosCache.dividendos[ticker].dados;
    }

    try {
        // Em produção, usar API real ou web scraping
        // const url = `https://api.exemplo.com/dividendos/${ticker}`;
        // const response = await fetch(url);
        // const data = await response.json();
        
        // Dados simulados para desenvolvimento
        const hoje = new Date();
        const dadosSimulados = [];
        
        // Gerar 12 meses de dividendos simulados
        for (let i = 11; i >= 0; i--) {
            const data = new Date(hoje);
            data.setMonth(data.getMonth() - i);
            
            // Valor base do dividendo com variação sazonal
            const baseDiv = 0.08 + (Math.sin(i / 2) * 0.02);
            // Adicionar variação por ticker
            const tickerFactor = ticker.charCodeAt(0) % 5 / 100;
            
            dadosSimulados.push({
                data: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-15`,
                valor: (baseDiv + tickerFactor).toFixed(2),
                dataBase: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-10`,
                dataPagamento: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-15`
            });
        }
        
        // Armazenar em cache
        dadosCache.dividendos[ticker] = {
            dados: dadosSimulados,
            timestamp: new Date()
        };
        
        return dadosSimulados;
    } catch (error) {
        console.error(`Erro ao buscar histórico de dividendos para ${ticker}:`, error);
        // Retornar dados em cache mesmo expirados, se disponíveis
        if (dadosCache.dividendos[ticker]) {
            return dadosCache.dividendos[ticker].dados;
        }
        return [];
    }
}

/**
 * Calcula o preço justo de um FII usando múltiplos métodos
 */
function calcularPrecoJusto(fii) {
    // Método 1: Baseado no P/VP médio do segmento
    const pvpAlvo = {
        'Recebíveis': 1.05,
        'Logístico': 0.95,
        'Shopping': 0.90,
        'Escritórios': 0.85,
        'Fundo de Fundos': 1.00,
        'Híbrido': 0.92
    };
    
    const precoJustoPVP = fii.vpc * (pvpAlvo[fii.segmento] || 0.95);
    
    // Método 2: Baseado no Dividend Yield alvo
    const dyAlvo = {
        'Recebíveis': 0.12, // 12% ao ano
        'Logístico': 0.09,  // 9% ao ano
        'Shopping': 0.085,  // 8.5% ao ano
        'Escritórios': 0.08, // 8% ao ano
        'Fundo de Fundos': 0.10, // 10% ao ano
        'Híbrido': 0.09     // 9% ao ano
    };
    
    const dividendoAnual = fii.ultimoDividendo * 12;
    const precoJustoDY = dividendoAnual / (dyAlvo[fii.segmento] || 0.10);
    
    // Média ponderada dos métodos
    const precoJusto = (precoJustoPVP * 0.6 + precoJustoDY * 0.4).toFixed(2);
    
    return precoJusto;
}

/**
 * Calcula um score (0-100) para o FII baseado em seus indicadores
 */
function calcularScore(fii) {
    // Pesos dos indicadores
    const pesos = {
        dyAnual: 25,
        pvp: 20,
        liquidez: 15,
        vacancia: 15,
        diversificacao: 10,
        gestao: 15
    };
    
    // Pontuações normalizadas (0-10)
    const pontos = {
        dyAnual: Math.min(10, fii.dyAnual / 1.5),
        pvp: Math.max
            // Pontuações normalizadas (0-10)
    const pontos = {
        dyAnual: Math.min(10, fii.dyAnual / 1.5),
        pvp: Math.max(0, 10 - (fii.pvp - 0.7) * 10),
        liquidez: Math.min(10, fii.liquidezDiaria / 500000),
        vacancia: fii.segmento === 'Recebíveis' || fii.segmento === 'Fundo de Fundos' ? 
                 10 : Math.max(0, 10 - fii.vacancia),
        diversificacao: Math.min(10, fii.numAtivos / 5),
        gestao: 7 // Valor padrão se não disponível
    };
    
    // Cálculo do score ponderado
    let scoreTotal = 0;
    for (const [indicador, peso] of Object.entries(pesos)) {
        scoreTotal += pontos[indicador] * peso / 100;
    }
    
    return Math.round(scoreTotal * 10);
}

/**
 * Analisa dados setoriais dos FIIs
 */
function analisarSetores(dadosFIIs) {
    // Agrupar FIIs por setor
    const setores = {};
    
    dadosFIIs.forEach(fii => {
        if (!setores[fii.segmento]) {
            setores[fii.segmento] = {
                fiis: [],
                dyMedio: 0,
                pvpMedio: 0,
                vacanciaMedio: 0,
                precoMedio: 0,
                scoreMedio: 0
            };
        }
        
        setores[fii.segmento].fiis.push(fii);
    });
    
    // Calcular médias por setor
    Object.keys(setores).forEach(segmento => {
        const fiisSetor = setores[segmento].fiis;
        const numFiis = fiisSetor.length;
        
        setores[segmento].dyMedio = fiisSetor.reduce((sum, fii) => sum + fii.dyAnual, 0) / numFiis;
        setores[segmento].pvpMedio = fiisSetor.reduce((sum, fii) => sum + fii.pvp, 0) / numFiis;
        setores[segmento].vacanciaMedio = fiisSetor.reduce((sum, fii) => sum + (fii.vacancia || 0), 0) / numFiis;
        setores[segmento].precoMedio = fiisSetor.reduce((sum, fii) => sum + fii.precoAtual, 0) / numFiis;
        setores[segmento].scoreMedio = fiisSetor.reduce((sum, fii) => sum + fii.score, 0) / numFiis;
    });
    
    return setores;
}

// Exportar funções
window.API = {
    buscarDadosFIIs,
    buscarDadosHistoricos,
    buscarHistoricoDividendos,
    calcularPrecoJusto,
    calcularScore,
    analisarSetores
};
