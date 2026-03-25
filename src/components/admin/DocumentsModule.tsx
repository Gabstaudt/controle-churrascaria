import { FolderOpen } from 'lucide-react';

export default function DocumentsModule() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Documentos (Google Drive)</h2>
      <div className="glass-card p-8 text-center">
        <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display font-semibold text-foreground mb-2">Integração com Google Drive</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Este módulo requer configuração da API do Google Drive com OAuth2.
          Quando configurado, você poderá listar, fazer upload, organizar e visualizar
          arquivos diretamente do Google Drive.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
          {['Contratos', 'Fiscal', 'RH', 'Operacional'].map(cat => (
            <div key={cat} className="bg-secondary rounded p-3 text-center">
              <p className="text-sm text-foreground font-medium">{cat}</p>
              <p className="text-xs text-muted-foreground">0 arquivos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
