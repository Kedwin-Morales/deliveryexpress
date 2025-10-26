/* eslint-disable @typescript-eslint/no-unused-vars */
import CustomButton from '@/components/CustomButton'
import CustomInput from '@/components/CustomInput'
import { Link, router } from 'expo-router'
import React, { useState } from 'react'
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { API_URL, images } from '@/constants'
import CountryPicker from 'react-native-country-picker-modal'
import PopupMessage from '@/components/PopupMessage'
import { MaterialIcons } from '@expo/vector-icons'

const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const rol = useAuthStore((state) => state.selectedRole)
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    rol
  })

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  // País seleccionado
  const [country, setCountry] = useState({
  cca2: 'VE', // 🇻🇪 Venezuela
  callingCode: ['58']
})
  const [visible, setVisible] = useState(false)

  const onSelect = (countrySelected: any) => {
    setCountry(countrySelected)
  }

  const submit = async () => {
    if (!form.email || !form.password || !form.nombre || !form.telefono) {

      showPopup('Por favor completa todos los campos' , 'warning')
    }

    if (form.password !== form.confirmPassword) {
      return showPopup('Las contraseñas no coinciden' , 'cancel')
    }

    // Validar largo del teléfono (solo 10 dígitos)
    if (form.telefono.length !== 10) {
      return showPopup('El número de teléfono debe tener exactamente 10 dígitos' , 'cancel')
    }

    setIsSubmitting(true)

    try {
      const fullPhone = `+${country.callingCode[0]}${form.telefono}`
      const payload = {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        telefono: fullPhone,
        rol: form.rol,
      }

      await axios.post(`${API_URL}/api/user/register/`, payload)
      
      showPopup('Cuenta creada correctamente', 'check-circle')

      // 👇 2. Iniciar sesión automáticamente
      const loginResponse = await axios.post(`${API_URL}/api/user/login/`, {
        email: form.email,
        password: form.password,
      })

      const { usuario, token } = loginResponse.data

      // 👇 3. Guardar en Zustand
      login({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token: token.access,
        $id: usuario.id,
        telefono: usuario.telefono,
        foto_perfil: usuario.foto_perfil,
        foto_perfil_url: usuario.foto_perfil_url,
        $collectionId: '',
        $databaseId: '',
        $createdAt: '',
        $updatedAt: '',
        $permissions: [],
      })

      // 👇 4. Redirigir según el rol
      setTimeout(() => {
        if (usuario.rol === 'comercio') router.replace('/(comercio)')
        if (usuario.rol === 'cliente') router.replace('/(tabs)')
        if (usuario.rol === 'conductor') router.replace('/(delivery)')
      }, 1000)

      
    } catch (error: any) {
      showPopup('Ocurrió un error al registrarte' , 'cancel')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View className='gap-4 bg-white rounded-lg p-5'>
      {/* Header con back */}
      <View className="w-full relative" style={{ height: Dimensions.get('screen').height / 14 }}>
        <View className="absolute top-8 left-5 z-10 flex-row items-center">
          <Link href="/role-select" asChild>
            <TouchableOpacity className="flex-row items-center">
              <Image source={images.arrowBack} style={{ tintColor: '#003399', width: 20, height: 20 }} />
              <Text className="text-xl text-primary ml-2 font-bold">Atrás</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <Text className='text-secondary font-extrabold text-center text-3xl'>Registro</Text>

      <CustomInput
        placeholder="Ingresa tu nombre completo"
        value={form.nombre}
        onChangeText={(text) => setForm((prev) => ({ ...prev, nombre: text }))}
        label='Nombre completo'
      />

      <CustomInput
        placeholder="Ingresa tu correo electrónico"
        value={form.email}
        onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
        label='Correo Electrónico'
        keyboardType="email-address"
      />

      <CustomInput
        placeholder="Ingresa tu contraseña"
        value={form.password}
        onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
        label='Contraseña'
        secureTextEntry
      />

      <CustomInput
        placeholder="Confirma tu contraseña"
        value={form.confirmPassword}
        onChangeText={(text) => setForm((prev) => ({ ...prev, confirmPassword: text }))}
        label='Confirmar contraseña'
        secureTextEntry
      />

      {/* Selector de país y campo teléfono */}
      <View>
        <View className='flex-row items-center gap-2'>

          <View  className='flex-row items-center bg-gray-300 px-1 py-3 rounded-lg'>
            <CountryPicker
            countryCode={country.cca2 as any}  // 👈 convierte a tipo permitido
            withFilter
            withFlag
            withCallingCode
            withEmoji
            onSelect={onSelect}
            visible={visible}
            onClose={() => setVisible(false)}
          />

          <TouchableOpacity onPress={() => setVisible(true)}>
            <Text style={{ fontSize: 16, marginRight: 5 }}>+{country.callingCode[0]}</Text>
          </TouchableOpacity>

          </View>
          
          <View style={{ flex: 1 }}>
            <CustomInput
              label=""
              placeholder="Ingresa tu numero de telefono"
              value={form.telefono}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '')
                if (cleaned.length <= 10) {
                  setForm((prev) => ({ ...prev, telefono: cleaned }))
                }
              }}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <CustomButton
        title='Crear Cuenta'
        style='bg-secondary'
        isLoading={isSubmitting}
        onPress={submit}
      />

      <View className='flex justify-center flex-row gap-2'>
        <Text className='text-gray-600'>¿Ya tienes cuenta?</Text>
        <Link href="/sign-in" className="font-bold text-primary">Iniciar sesión</Link>
      </View>

      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  )
}

export default SignUp
