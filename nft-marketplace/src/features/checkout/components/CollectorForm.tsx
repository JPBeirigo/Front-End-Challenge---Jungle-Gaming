import type { CollectorInfo } from '../../../shared/types/contracts';
import { cn } from '../../../shared/ui/utils';

interface CollectorFormProps {
  collectorInfo: CollectorInfo;
  onChange: (info: CollectorInfo) => void;
  disabled?: boolean;
}

const inputClass =
  'h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:opacity-60';

const labelClass = 'mb-1.5 block text-[15px] leading-[15px] text-foreground';

/**
 * Bloco "Perfil do colecionador" do checkout: 2 colunas de campos com
 * inputs de 40 de altura, labels de 15 e asterisco coral.
 */
export function CollectorForm({ collectorInfo, onChange, disabled }: CollectorFormProps) {
  const handleChange = (field: keyof CollectorInfo, value: string) => {
    onChange({
      ...collectorInfo,
      [field]: value,
    });
  };

  return (
    <section aria-labelledby="collector-info-heading" className="rounded-[6px] bg-surface-card p-5 sm:p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 id="collector-info-heading" className="text-[18px] font-bold leading-4 text-foreground">
          Perfil do colecionador
        </h2>
        <span className="text-[12px] text-muted">Dados do certificado de posse</span>
      </div>
      <p className="mb-6 text-[13px] leading-5 text-secondary">
        Usamos estes dados para emitir o certificado e enviar o comprovante do pedido.
      </p>

      <div className="grid grid-cols-1 gap-x-7 gap-y-5 md:grid-cols-2">
        <div>
          <label htmlFor="collector-fullName" className={labelClass}>
            Nome completo <span className="text-[18px] leading-none text-coral">*</span>
          </label>
          <input
            id="collector-fullName"
            type="text"
            required
            disabled={disabled}
            value={collectorInfo.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Ex: Alexandre Silveira"
            autoComplete="name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="collector-email" className={labelClass}>
            E-mail <span className="text-[18px] leading-none text-coral">*</span>
          </label>
          <input
            id="collector-email"
            type="email"
            required
            disabled={disabled}
            value={collectorInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="seu.email@exemplo.com"
            autoComplete="email"
            aria-describedby="email-notice"
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="collector-phone" className={cn(labelClass, 'flex items-baseline gap-2')}>
            Telefone / WhatsApp
            <span className="text-[12px] leading-none text-muted">(opcional)</span>
          </label>
          <input
            id="collector-phone"
            type="tel"
            disabled={disabled}
            value={collectorInfo.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+55 11 99999-9999"
            autoComplete="tel"
            className={inputClass}
          />
        </div>
      </div>

      <p id="email-notice" className="mt-4 text-[12px] leading-5 text-muted">
        O recibo do pedido e a confirmação do mint serão enviados para este endereço de e-mail.
      </p>
    </section>
  );
}
