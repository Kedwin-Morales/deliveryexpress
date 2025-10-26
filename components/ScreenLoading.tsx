import { images } from '@/constants'
import { Animated } from 'react-native'

export default function ScreenLoading() {
  return (
    <Animated.Image
            source={images.carga}
            style={{ width: '100%', height: '88%' }}
            resizeMode="cover"
          />
  )
}