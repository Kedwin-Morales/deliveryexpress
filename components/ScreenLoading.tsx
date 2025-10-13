import { images } from '@/constants'
import { Animated } from 'react-native'

export default function ScreenLoading() {
  return (
    <Animated.Image
            source={images.carga}
            style={{ flex: 1, width: '100%', height: '100%' }}
            resizeMode="cover"
          />
  )
}