export type MockScenarioType =
  | 'default'
  | 'empty_catalog'
  | 'variable_latency'
  | 'network_failure'
  | 'http_500'
  | 'session_expired'
  | 'unauthorized'
  | 'register_conflict'
  | 'validation_error'
  | 'coupon_invalid'
  | 'coupon_expired'
  | 'price_changed_during_checkout'
  | 'edition_sold_out'
  | 'order_timeout'
  | 'payment_confirmed'
  | 'payment_declined'
  | 'order_pending';

export interface ScenarioDefinition {
  id: MockScenarioType;
  label: string;
  description: string;
}

export const SCENARIOS: ScenarioDefinition[] = [
  { id: 'default', label: 'Padrão (Sucesso)', description: 'Operação normal com catálogo populado e sucesso nos fluxos.' },
  { id: 'empty_catalog', label: 'Catálogo Vazio', description: 'Simula listagem de NFTs com zero resultados.' },
  { id: 'variable_latency', label: 'Latência Variável & Fora de Ordem', description: 'Insere atrasos randômicos entre 800ms e 2500ms.' },
  { id: 'network_failure', label: 'Falha de Conexão', description: 'Simula queda de rede (Network Error) nas requisições.' },
  { id: 'http_500', label: 'Erro 500 do Servidor', description: 'Retorna Internal Server Error transitório.' },
  { id: 'session_expired', label: 'Sessão Expirada', description: 'Retorna 401 Session Expired nas rotas privadas.' },
  { id: 'unauthorized', label: 'Não Autorizado (403)', description: 'Retorna 403 Forbidden ao tentar acessar recursos.' },
  { id: 'register_conflict', label: 'Conflito de Cadastro (409)', description: 'Retorna erro de e-mail já cadastrado.' },
  { id: 'validation_error', label: 'Erro de Validação de Formulário', description: 'Retorna 400 com campos inválidos detalhados.' },
  { id: 'coupon_invalid', label: 'Cupom Inválido', description: 'Rejeita qualquer cupom digitado como inválido.' },
  { id: 'coupon_expired', label: 'Cupom Expirado', description: 'Retorna erro de cupom vencido.' },
  { id: 'price_changed_during_checkout', label: 'Preço Alterado no Checkout', description: 'Simula aumento de preço do NFT durante a finalização.' },
  { id: 'edition_sold_out', label: 'Edição Esgotada no Checkout', description: 'Simula esgotamento de estoque antes do envio.' },
  { id: 'order_timeout', label: 'Timeout no Pedido (Idempotência)', description: 'Simula 408 Timeout para testar reenvio com mesma chave.' },
  { id: 'payment_confirmed', label: 'Pagamento Confirmado', description: 'Pedido aprovado imediatamente na rede.' },
  { id: 'payment_declined', label: 'Pagamento Recusado', description: 'Pedido rejeitado com falha de transação na rede.' },
  { id: 'order_pending', label: 'Pedido Pendente na Blockchain', description: 'Pedido criado com status pending aguardando confirmação na blockchain.' },
];

const SCENARIO_STORAGE_KEY = 'nft_mock_active_scenario';

class ScenarioManager {
  private activeScenario: MockScenarioType = 'default';

  constructor() {
    this.init();
  }

  public init() {
    // 1. Tenta ler da URL query string (?scenario=...)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlScenario = urlParams.get('scenario') as MockScenarioType;
      if (urlScenario && SCENARIOS.some((s) => s.id === urlScenario)) {
        this.activeScenario = urlScenario;
        return;
      }

      // 2. Tenta ler do localStorage
      try {
        const stored = localStorage.getItem(SCENARIO_STORAGE_KEY) as MockScenarioType;
        if (stored && SCENARIOS.some((s) => s.id === stored)) {
          this.activeScenario = stored;
        }
      } catch {
        this.activeScenario = 'default';
      }
    }
  }

  public getActiveScenario(): MockScenarioType {
    return this.activeScenario;
  }

  public setScenario(scenario: MockScenarioType) {
    this.activeScenario = scenario;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SCENARIO_STORAGE_KEY, scenario);
      } catch (e) {
        console.warn('Falha ao salvar cenário no storage:', e);
      }
    }
  }

  public resetToDefault() {
    this.activeScenario = 'default';
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(SCENARIO_STORAGE_KEY);
      } catch (e) {
        console.warn('Falha ao limpar cenário do storage:', e);
      }
    }
  }
}

export const scenarioManager = new ScenarioManager();
