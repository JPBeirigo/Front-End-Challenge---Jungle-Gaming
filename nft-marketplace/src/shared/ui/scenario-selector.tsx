import { useState } from 'react';
import { SCENARIOS, scenarioManager, type MockScenarioType } from '../../mocks/scenarios';
import { mockDb } from '../../mocks/db';
import { mockSocketEmitter } from '../../mocks/socket/emitter';
import { Settings, RefreshCw, ChevronUp, ChevronDown, Zap } from 'lucide-react';

export function ScenarioSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState<MockScenarioType>(scenarioManager.getActiveScenario());
  const [feedback, setFeedback] = useState<string | null>(null);

  // Não exibe se mocks estiverem completamente desligados em produção pura
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
    return null;
  }

  const handleSelectScenario = (scenarioId: MockScenarioType) => {
    scenarioManager.setScenario(scenarioId);
    setActive(scenarioId);
    setFeedback(`Cenário alterado para: ${scenarioId}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleResetDb = () => {
    mockDb.reset();
    scenarioManager.resetToDefault();
    setActive('default');
    setFeedback('Banco mock resetado para o estado inicial!');
    setTimeout(() => {
      setFeedback(null);
      window.location.reload();
    }, 800);
  };

  const handleTriggerPriceChange = () => {
    const randomPrice = (Math.random() * (2.5 - 0.5) + 0.5).toFixed(4);
    mockDb.updateNFTPriceOrAvailability('nft_1', randomPrice);
    mockSocketEmitter.emitNftUpdated({
      nftId: 'nft_1',
      priceEth: randomPrice,
      totalAvailable: 3,
    });
    setFeedback(`Socket.IO: Preço do NFT #01 alterado para ${randomPrice} ETH!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <aside
      aria-label="Controle de Cenários de Teste e Mocks"
      className="fixed bottom-4 right-4 z-50 text-xs font-sans"
    >
      <div className="bg-surface-card border border-border rounded-[6px] shadow-2xl p-3 max-w-xs transition-all duration-200">
        <header className="flex items-center justify-between gap-2 pb-2 border-b border-border">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mocks & Cenários</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-surface-raised rounded text-muted-foreground hover:text-foreground transition-colors"
            title={isOpen ? 'Recolher painel' : 'Expandir painel'}
            aria-expanded={isOpen}
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </header>

        <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Ativo: <strong className="text-foreground">{active}</strong></span>
          <button
            onClick={handleResetDb}
            className="flex items-center gap-1 text-primary hover:underline"
            title="Restaurar dados originais"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>

        {isOpen && (
          <div className="mt-3 pt-2 border-t border-border space-y-3">
            <div>
              <label htmlFor="scenario-select" className="block text-[11px] text-muted-foreground mb-1">
                Selecione o cenário:
              </label>
              <select
                id="scenario-select"
                value={active}
                onChange={(e) => handleSelectScenario(e.target.value as MockScenarioType)}
                className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground italic mt-1">
                {SCENARIOS.find((s) => s.id === active)?.description}
              </p>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="block text-[11px] text-muted-foreground mb-1 font-medium">
                Simulações de Tempo Real:
              </span>
              <button
                type="button"
                onClick={handleTriggerPriceChange}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-[11px] font-medium"
              >
                <Zap className="w-3 h-3" /> Emitir `nft.updated`
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <div
            role="status"
            className="mt-2 text-[10px] text-primary font-medium animate-pulse"
          >
            {feedback}
          </div>
        )}
      </div>
    </aside>
  );
}
