/**
 * realtime-monitor.js - Sistema de monitoramento em tempo real
 */

const realtimeMonitor = {
    // Configurações
    config: {
        updateInterval: 60000, // 1 minuto
        retryDelay: 5000, // 5 segundos
        maxRetries: 3
    },
    
    // Estado do monitor
    state: {
        isRunning: false,
        lastUpdate: null,
        updateTimer: null,
        retryCount: 0,
        subscribers: new Map()
    },
    
    // Iniciar monitoramento
    start: function() {
        if (this.state.isRunning) return;
        
        this.state.isRunning = true;
        this.update();
        
        // Agendar próximas atualizações
        this.state.updateTimer = setInterval(() => {
            this.update();
        }, this.config.updateInterval);
    },
    
    // Parar monitoramento
    stop: function() {
        this.state.isRunning = false;
        if (this.state.updateTimer) {
            clearInterval(this.state.updateTimer);
            this.state.updateTimer = null;
        }
    },
    
    // Atualizar dados
    update: async function() {
        try {
            // Buscar dados atualizados
            const dadosAtualizados = await API.buscarDadosFIIs();
            
            // Atualizar timestamp
            this.state.lastUpdate = new Date();
            
            // Notificar subscribers
            this.notifySubscribers(dadosAtualizados);
            
            // Resetar contador de tentativas
            this.state.retryCount = 0;
            
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            
            // Tentar novamente se não excedeu limite
            if (this.state.retryCount < this.config.maxRetries) {
                this.state.retryCount++;
                setTimeout(() => this.update(), this.config.retryDelay);
            } else {
                notify.error('Erro ao atualizar dados em tempo real. Tentando novamente em 1 minuto.');
                this.state.retryCount = 0;
            }
        }
    },
    
    // Registrar subscriber
    subscribe: function(id, callback) {
        this.state.subscribers.set(id, callback);
        
        // Iniciar monitoramento se for o primeiro subscriber
        if (this.state.subscribers.size === 1) {
            this.start();
        }
        
        // Retornar função para cancelar subscrição
        return () => this.unsubscribe(id);
    },
    
    // Remover subscriber
    unsubscribe: function(id) {
        this.state.subscribers.delete(id);
        
        // Parar monitoramento se não houver mais subscribers
        if (this.state.subscribers.size === 0) {
            this.stop();
        }
    },
    
    // Notificar subscribers
    notifySubscribers: function(dados) {
        this.state.subscribers.forEach(callback => {
            try {
                callback(dados);
            } catch (error) {
                console.error('Erro ao notificar subscriber:', error);
            }
        });
    },
    
    // Verificar alertas
    verificarAlertas: function(dados) {
        try {
            const alertas = secureStorage.getItem('alertas-fiis') || [];
            const notificacoes = [];
            
            alertas.forEach(alerta => {
                if (!alerta.ativo) return;
                
                const fii = dados.find(f => f.ticker === alerta.ticker);
                if (!fii) return;
                
                let condicaoAtendida = false;
                let mensagem = '';
                
                switch (alerta.tipo) {
                    case 'preco-acima':
                        condicaoAtendida = fii.precoAtual >= alerta.valor;
                        mensagem = `${fii.ticker} atingiu preço acima de R$ ${alerta.valor.toFixed(2)}`;
                        break;
                    case 'preco-abaixo':
                        condicaoAtendida = fii.precoAtual <= alerta.valor;
                        mensagem = `${fii.ticker} atingiu preço abaixo de R$ ${alerta.valor.toFixed(2)}`;
                        break;
                    case 'dy-acima':
                        condicaoAtendida = fii.dyAnual >= alerta.valor;
                        mensagem = `${fii.ticker} atingiu DY acima de ${alerta.valor.toFixed(2)}%`;
                        break;
                    case 'dy-abaixo':
                        condicaoAtendida = fii.dyAnual <= alerta.valor;
                        mensagem = `${fii.ticker} atingiu DY abaixo de ${alerta.valor.toFixed(2)}%`;
                        break;
                }
                
                if (condicaoAtendida) {
                    notificacoes.push({
                        titulo: `Alerta: ${fii.ticker}`,
                        mensagem,
                        tipo: 'warning'
                    });
                }
            });
            
            // Exibir notificações
            notificacoes.forEach(notif => {
                notify[notif.tipo](notif.mensagem);
            });
            
        } catch (error) {
            console.error('Erro ao verificar alertas:', error);
        }
    }
};

// Exportar para uso global
window.realtimeMonitor = realtimeMonitor;