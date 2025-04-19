/**
 * render-manager.js - Sistema de renderização otimizada
 */

const renderManager = {
    // Fila de renderização
    queue: new Map(),
    
    // Flag para indicar se há uma renderização em andamento
    isRendering: false,
    
    // Registrar componente para renderização
    enqueue: function(id, renderFn, priority = 0) {
        this.queue.set(id, { renderFn, priority });
        this.scheduleRender();
    },
    
    // Agendar próxima renderização
    scheduleRender: function() {
        if (!this.isRendering) {
            this.isRendering = true;
            requestAnimationFrame(() => this.processQueue());
        }
    },
    
    // Processar fila de renderização
    processQueue: function() {
        // Ordenar por prioridade
        const sortedQueue = Array.from(this.queue.entries())
            .sort((a, b) => b[1].priority - a[1].priority);
        
        // Limpar fila
        this.queue.clear();
        
        // Executar renderizações
        sortedQueue.forEach(([id, { renderFn }]) => {
            try {
                const startTime = performance.now();
                renderFn();
                const endTime = performance.now();
                
                // Registrar métricas de performance
                this.logPerformance(id, endTime - startTime);
            } catch (error) {
                console.error(`Erro ao renderizar ${id}:`, error);
                notify.error(`Erro ao atualizar ${id}`);
            }
        });
        
        this.isRendering = false;
        
        // Verificar se há novas renderizações na fila
        if (this.queue.size > 0) {
            this.scheduleRender();
        }
    },
    
    // Sistema de métricas de performance
    metrics: new Map(),
    
    logPerformance: function(id, duration) {
        if (!this.metrics.has(id)) {
            this.metrics.set(id, []);
        }
        
        const metrics = this.metrics.get(id);
        metrics.push(duration);
        
        // Manter apenas as últimas 100 métricas
        if (metrics.length > 100) {
            metrics.shift();
        }
        
        // Calcular média móvel
        const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
        
        // Alertar se a performance estiver ruim
        if (avg > 100) { // mais de 100ms
            console.warn(`Performance baixa em ${id}: ${avg.toFixed(2)}ms (média)`);
        }
    },
    
    // Otimizador de Canvas
    optimizeCanvas: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Ajustar resolução para tela
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        ctx.scale(dpr, dpr);
        
        return ctx;
    },
    
    // Debounce para renderizações frequentes
    debounce: function(func, wait) {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle para renderizações contínuas
    throttle: function(func, limit) {
        let inThrottle;
        
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Exportar para uso global
window.renderManager = renderManager;