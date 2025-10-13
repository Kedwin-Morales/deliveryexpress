import { View, Image, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { images } from '@/constants';

const CardButton = () => {
    const totalItems = 10;
  return (
    <TouchableOpacity className='cart-btn' onPress={() => console.log('CardButton pressed')}>

        <Image source={images.bag}  className='size-5' resizeMode='contain' />

        {totalItems > 0 && (
            <View className='cart-badge'>
                <Text className='text-white small-bold'>{totalItems}</Text>
            </View>
        )}
    </TouchableOpacity>
  )
}

export default CardButton