import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { CustomInputProps } from '@/type'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

const CustomInput = ({
  placeholder = 'Enter Text',
  value,
  onChangeText,
  label,
  secureTextEntry = false,
  keyboardType = "default",
  editable,
}: CustomInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  return (
    <View className="w-full">
      {label && <Text className="font-bold text-lg mb-2">{label}</Text>}

      <View className="flex-row items-center bg-gray-300 rounded-lg px-4">
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholder={placeholder}
          placeholderTextColor="#555"
          className="flex-1 py-4"
          editable={editable}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={22}
              color="#555"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default CustomInput
