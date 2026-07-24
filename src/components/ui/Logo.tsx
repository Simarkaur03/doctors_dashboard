import { Stethoscope } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-primary">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
        <Stethoscope className="h-5 w-5" />
      </div>
      <span className="text-lg font-semibold">MediCare</span>
    </div>
  );
}
