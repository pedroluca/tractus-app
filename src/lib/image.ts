import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'

/**
 * Abre a galeria e devolve a imagem já reduzida (JPEG), pronta para upload.
 * Fotos de celular passam fácil de 5 MB; reduzindo aqui o upload fica rápido até no 4G.
 */
export async function pickImage(options: { square: boolean; maxSize: number }): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) throw new Error('permission')

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: options.square,
    aspect: options.square ? [1, 1] : undefined,
    quality: 1,
  })
  if (result.canceled || !result.assets[0]) return null

  const asset = result.assets[0]
  const context = ImageManipulator.manipulate(asset.uri)
  const largest = Math.max(asset.width, asset.height)
  if (largest > options.maxSize) {
    context.resize(asset.width >= asset.height ? { width: options.maxSize } : { height: options.maxSize })
  }
  const image = await context.renderAsync()
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG })
  return saved.uri
}
