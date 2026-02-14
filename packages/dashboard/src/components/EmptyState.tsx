import { FlagOff } from 'lucide-react';

export default function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FlagOff className="h-12 w-12 text-slate-600 mb-4" />
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {description && <p className="text-slate-400 mb-4">{description}</p>}
      {action}
    </div>
  );
}
