'use client';

import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from 'lucide-react';

interface CompressSingleImageButtonProps {
    onClick: () => void;
    isLoading: boolean;
}

export function CompressSingleImageButton({ onClick, isLoading }: CompressSingleImageButtonProps) {
    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            onClick={onClick}
            disabled={isLoading}
            title="Compress this image"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="sr-only">Compress image</span>
        </Button>
    );
}
