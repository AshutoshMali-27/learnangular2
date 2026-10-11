import { RotateCw } from 'lucide-react'
import { useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cropImage } from '@/lib/crop-image'

interface CropDialogProps {
  /** Object URL of the picked image. */
  src: string
  onCancel: () => void
  onCropped: (image: Blob) => void
}

/** Zoom, rotate and crop an image before it is uploaded as a JPEG. */
export function CropDialog({ src, onCancel, onCropped }: CropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [area, setArea] = useState<Area | null>(null)

  const confirm = async () => {
    if (area) onCropped(await cropImage(src, area, rotation))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>Drag to position, then zoom or rotate as needed.</DialogDescription>
        </DialogHeader>

        <div className="relative h-80 overflow-hidden rounded-md bg-muted">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
            showGrid={false}
            restrictPosition={false}
            aspect={4 / 3}
          />
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="crop-zoom" className="text-sm">
            Zoom
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRotation((value) => (value + 90) % 360)}
          >
            <RotateCw />
            Rotate
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={confirm} disabled={!area}>
            Crop & Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
