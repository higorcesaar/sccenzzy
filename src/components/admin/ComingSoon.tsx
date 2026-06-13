import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">{phase}</p>
        <h1 className="font-serif text-3xl font-extrabold text-neutral-900">{title}</h1>
      </div>
      <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
        <CardContent className="py-12 text-center space-y-3">
          <Sparkles className="h-10 w-10 text-amber-600 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-neutral-900">Em construção</h2>
          <p className="text-sm text-stone-600 max-w-lg mx-auto">{description}</p>
          <p className="text-[11px] text-stone-500 uppercase tracking-widest">
            Será entregue na próxima fase aprovada do plano.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
