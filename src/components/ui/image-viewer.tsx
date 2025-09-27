import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string;
  alt?: string;
}

export function ImageViewer({ open, onOpenChange, imageUrl, title, alt }: ImageViewerProps) {
  const [zoom, setZoom] = React.useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  React.useEffect(() => {
    if (open) {
      setZoom(1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{title || 'Image Viewer'}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 pt-2">
          <div className="flex items-center justify-center min-h-full">
            <img
              src={imageUrl}
              alt={alt || 'Viewer image'}
              style={{ 
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease-in-out',
                maxWidth: '100%',
                height: 'auto'
              }}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
