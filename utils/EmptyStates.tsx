import { FileQuestion } from 'lucide-react';
import { Button } from "@/components/ui/button";
export const EmptyState = ({heading, heading2}:{heading: string; heading2: string;}) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8">
      <FileQuestion className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {heading}
      </h3>
      <p className="text-sm text-gray-500 text-center mb-4">
        {heading2}
      </p>
    </div>
  );
};