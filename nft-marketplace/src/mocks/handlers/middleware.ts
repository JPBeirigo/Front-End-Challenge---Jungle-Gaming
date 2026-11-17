import { HttpResponse, delay } from 'msw';
import { scenarioManager } from '../scenarios';

/**
 * Interceptor de cenários que simula condições adversas de rede,
 * latência ou falhas globais antes do processamento normal da rota.
 */
export async function applyScenarioInterceptors(): Promise<Response | null> {
  const scenario = scenarioManager.getActiveScenario();

  // 1. Simulação de latência variável e respostas fora de ordem
  if (scenario === 'variable_latency') {
    const randomDelay = Math.floor(Math.random() * (2200 - 800 + 1)) + 800;
    await delay(randomDelay);
  } else {
    // Pequeno delay padrão para simular transporte de rede realista (150ms)
    await delay(150);
  }

  // 2. Simulação de falha de conexão (Network Error)
  if (scenario === 'network_failure') {
    return HttpResponse.error();
  }

  // 3. Simulação de erro HTTP 500 do servidor
  if (scenario === 'http_500') {
    return HttpResponse.json(
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Falha interna transitória simulada pelo cenário.',
        status: 500,
        retryable: true,
      },
      { status: 500 }
    );
  }

  return null;
}
