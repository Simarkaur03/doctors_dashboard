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
        w-full flex items-center justify-between p-4 rounded-xl border transition-all
        ${isAvailable 
          ? 'bg-white border-[#D9E1E3] hover:border-[#2E7D6E] hover:shadow-md cursor-pointer' 
          : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isAvailable ? 'bg-[#2E7D6E]/10 text-[#2E7D6E]' : 'bg-gray-200 text-gray-500'}`}>
          <Clock className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-start">
          <span className={`font-semibold ${isAvailable ? 'text-[#1F2D2F]' : 'text-gray-500'}`}>
            {slot.time}
          </span>
          <span className="text-xs text-gray-500">
            {isAvailable ? 'Available' : 'Booked'}
          </span>
        </div>
      </div>
      
      {isAvailable && (
        <span className="text-sm font-medium text-[#2E7D6E]">
          Book
        </span>
      )}
    </button>
  );
}
