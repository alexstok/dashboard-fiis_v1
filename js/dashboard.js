// Configurações iniciais
const dataAtual = new Date();
const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
document.getElementById('ultima-atualizacao').textContent = dataFormatada;

// Dados simulados dos FIIs (em produção, estes dados viriam de uma API)
const dadosFIIs = [
    { ticker: 'MXRF11', segmento: 'Recebíveis', precoAtual: 9.80, precoJusto: 10.50, ultimoDividendo: 0.09, dyMensal: 0.92, dyAnual: 12.6, pvp: 0.95, vacancia: 0 },
    { ticker: 'KNCR11', segmento: 'Recebíveis', precoAtual: 10.12, precoJusto: 10.80, ultimoDividendo: 0.11, dyMensal: 1.09, dyAnual: 13.1, pvp: 0.98, vacancia: 0 },
    { ticker: 'HGLG11', segmento: 'Logístico', precoAtual: 15.80, precoJusto: 17.20, ultimoDividendo: 0.12, dyMensal: 0.76, dyAnual: 9.2, pvp: 0.82, vacancia: 3.2 },
    { ticker: 'VISC11', segmento: 'Shopping', precoAtual: 11.15, precoJusto: 12.30, ultimoDividendo: 0.08, dyMensal: 0.72, dyAnual: 8.7, pvp: 0.88, vacancia: 5.1 },
    { ticker: 'XPLG11', segmento: 'Logístico', precoAtual: 10.45, precoJusto: 11.50, ultimoDividendo: 0.08, dyMensal: 0.77, dyAnual: 9.3, pvp: 0.85, vacancia: 2.9 },
    { ticker: 'HGRE11', segmento: 'Escritórios', precoAtual: 12.50, precoJusto: 13.80, ultimoDividendo: 0.09, dyMensal: 0.72, dyAnual: 8.5, pvp: 0.80, vacancia: 12.8 },
    { ticker: 'XPML11', segmento: 'Shopping', precoAtual: 10.80, precoJusto: 11.90, ultimoDividendo: 0.07, dyMensal: 0.65, dyAnual: 8.4, pvp: 0.83, vacancia: 4.8 },
    { ticker: 'RECT11', segmento: 'Recebíveis', precoAtual: 17.20, precoJusto: 18.10, ultimoDividendo: 0.17, dyMensal: 0.99, dyAnual: 12.2, pvp: 0.97, vacancia: 0 },
    { ticker: 'BCFF11', segmento: 'Fundo de Fundos', precoAtual: 7.40, precoJusto: 8.20, ultimoDividendo: 0.06, dyMensal: 0.81, dyAnual: 10.5, pvp: 0.91, vacancia: 0 },
    { ticker: 'IRDM11', segmento: 'Recebíveis', precoAtual: 10.30, precoJusto: 11.20, ultimoDividendo: 0.12, dyMensal: 1.17, dyAnual: 14.2, pvp: 0.99, vacancia: 0 },
    { ticker: 'HFOF11', segmento: 'Fundo de Fundos', precoAtual: 7.25, precoJusto: 7.90, ultimoDividendo: 0.06, dyMensal: 0.83, dyAnual: 9.8, pvp: 0.93, vacancia: 0 },
    {

