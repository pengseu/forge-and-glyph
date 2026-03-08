export function toWebpAsset(path: string): string {
  return path.replace(/\.(png|jpe?g)$/i, '.webp')
}
