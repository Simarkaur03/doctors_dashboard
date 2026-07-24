import React from 'react';
import { Clock } from 'lucide-react';

interface Slot {
  id: string;
  date: string;
  time: string;
  status: 'available' | 'booked' | 'unavailable';
}

interface SlotCardProps {
  slot: Slot;
  onClick: (slot: Slot) => void;
}

export default function SlotCard({ slot, onClick }: SlotCardProps) {
  const isAvailable = slot.status === 'available';

  return (
    <button
      onClick={() => isAvailable && onClick(slot)}
      disabled={!isAvailable}
      className={`
        w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150
        ${isAvailable
          ? 'bg-white border-slate-200 hover:border-primary hover:shadow-sm active:scale-[0.98] cursor-pointer'
          : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isAvailable ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'}`}>
          <Clock className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-start">
          <span className={`font-semibold ${isAvailable ? 'text-slate-900' : 'text-slate-500'}`}>
            {slot.time}
          </span>
          <span className="text-xs text-slate-500">
            {isAvailable ? 'Available' : 'Booked'}
          </span>
        </div>
      </div>
      
      {isAvailable && (
        <span className="text-sm font-medium text-primary">
          Book
        </span>
      )}
    </button>
  );
}
