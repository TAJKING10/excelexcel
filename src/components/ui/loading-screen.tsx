import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
          <div className="absolute inset-0 h-16 w-16 border-4 border-primary/20 rounded-full mx-auto animate-pulse" />
        </div>
        <p className="text-lg font-medium text-muted-foreground animate-pulse">
          Chargement...
        </p>
      </div>
    </div>
  );
}

export function PageLoadingScreen({ message = "Chargement de la page..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}
