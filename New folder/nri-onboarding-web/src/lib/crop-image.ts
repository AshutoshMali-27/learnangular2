export interface PixelArea {
  x: number
  y: number
  width: number
  height: number
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read the image.'))
    image.src = src
  })

/** Crops and rotates an image, returning a JPEG at quality 0.9 as the MVC cropper did. */
export async function cropImage(src: string, area: PixelArea, rotation = 0): Promise<Blob> {
  const image = await loadImage(src)
  const radians = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(radians))
  const cos = Math.abs(Math.cos(radians))
  const boxWidth = image.width * cos + image.height * sin
  const boxHeight = image.width * sin + image.height * cos

  // Draw the rotated image, then copy the requested area out of it.
  const rotated = document.createElement('canvas')
  rotated.width = boxWidth
  rotated.height = boxHeight
  const rotatedContext = rotated.getContext('2d')
  if (!rotatedContext) throw new Error('Canvas is not available.')
  rotatedContext.translate(boxWidth / 2, boxHeight / 2)
  rotatedContext.rotate(radians)
  rotatedContext.drawImage(image, -image.width / 2, -image.height / 2)

  const output = document.createElement('canvas')
  output.width = area.width
  output.height = area.height
  const outputContext = output.getContext('2d')
  if (!outputContext) throw new Error('Canvas is not available.')
  outputContext.drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)

  return new Promise((resolve, reject) =>
    output.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not crop the image.'))),
      'image/jpeg',
      0.9,
    ),
  )
}
