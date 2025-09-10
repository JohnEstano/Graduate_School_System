// components/SuccessPrompt.tsx
import React from "react";
import { CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from "@/components/ui/button"; // Import the shadcn button

interface SuccessPromptProps {
  message: string;
  onClose: () => void;
}

const SuccessPrompt: React.FC<SuccessPromptProps> = ({ message, onClose }) => {
  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <AlertDialogTitle className="text-xl">Success!</AlertDialogTitle>
            <p className="text-gray-700 mt-2">{message}</p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
            <Button onClick={onClose}>
              OK
            </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SuccessPrompt;