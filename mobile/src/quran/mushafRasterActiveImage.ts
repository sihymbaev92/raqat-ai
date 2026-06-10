export function mushafRasterActiveImageUri(
  isActive: boolean,
  imageUri: string | null,
  imageErr: boolean
): string | null {
  if (!isActive || imageErr) return null;
  return imageUri;
}
