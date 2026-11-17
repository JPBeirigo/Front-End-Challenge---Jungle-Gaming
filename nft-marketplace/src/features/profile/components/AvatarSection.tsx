import { useRef, type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';

interface AvatarSectionProps {
  currentAvatarUrl?: string;
  onSelectAvatar: (url: string) => void;
  disabled?: boolean;
}

/**
 * Avatar compacto do Figma: círculo de 50px com botões "Alterar" e "Remover".
 */
export function AvatarSection({ currentAvatarUrl, onSelectAvatar, disabled }: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Selecione um arquivo de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSelectAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-[50px] w-[50px] shrink-0 overflow-hidden rounded-full bg-surface-raised">
        {currentAvatarUrl ? (
          <img src={currentAvatarUrl} alt="Avatar atual" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted">
            <Camera className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 items-center justify-center rounded-[3px] border border-primary px-3 text-[13px] font-medium text-accent transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          Alterar
        </button>
        <button
          type="button"
          disabled={disabled || !currentAvatarUrl}
          onClick={() => onSelectAvatar('')}
          className="inline-flex h-9 items-center justify-center rounded-[3px] border border-border px-3 text-[13px] text-secondary transition-colors hover:border-primary/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remover
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
        disabled={disabled}
      />
    </div>
  );
}
