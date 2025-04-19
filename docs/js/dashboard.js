// Importar dados
import { listaTodosFIIs, gerarDadosSimulados } from './data/fiis.js';

// Configurações iniciais
const dataAtual = new Date();
const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
document.getElementById('ultima-atualizacao').textContent = dataFormatada;

// Gerar dados simulados para todos os FIIs
const dadosFIIs = listaTodosFIIs.map(ticker => {
    const dados = gerarDadosSimulados(ticker);
    dados.precoJusto = (dados.precoAtual * (1 + Math.random() * 0.3)).toFixed(2) * 1;
    dados.dyMensal = (dados.dyAnual / 12).toFixed(2) * 1;
    return dados;
});

