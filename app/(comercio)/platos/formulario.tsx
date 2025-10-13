import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '@/constants';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function FormularioPlato() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const token = useAuthStore((state) => state.user?.token);

    const [nombre, setNombre] = useState('');
    const [desc, setDesc] = useState('');
    const [precio, setPrecio] = useState('');
    const [precioDescuento, setPrecioDescuento] = useState('');
    const [disponible, setDisponible] = useState<boolean | null>(null);
    const [imagen, setImagen] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            const fetchPlato = async () => {
                if (id) {
                    try {
                        const response = await axios.get(`${API_URL}/api/restaurantes/platos/${id}/`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const { nombre, descripcion, precio, disponible, imagen_url, precio_descuento } = response.data;
                        setNombre(nombre);
                        setDesc(descripcion);
                        setPrecio(precio.toString());
                        setDisponible(disponible);
                        setPrecioDescuento(precio_descuento)


                        if (imagen_url) {

                            if (imagen_url.startsWith('http')) {
                                setImagen(imagen_url);
                            } else {
                                setImagen(`${API_URL}/media/${imagen_url}`);
                            }
                        }

                    } catch (error) {
                        console.error('Error al cargar plato:', error);
                    }
                } else {
                    setNombre('');
                    setDesc('');
                    setPrecio('');
                    setDisponible(null);
                    setImagen(null);
                    setPrecioDescuento('')
                }
            };

            fetchPlato();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [id])
    );

    const seleccionarImagen = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            setImagen(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('descripcion', desc);
        formData.append('precio', precio);
        formData.append('disponible', disponible ? 'true' : 'false');
        formData.append('precio_descuento', precioDescuento)

        if (imagen && !imagen.startsWith('http')) {
            const filename = imagen.split('/').pop();
            const match = /\.(\w+)$/.exec(filename ?? '');
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('imagen', {
                uri: imagen,
                name: filename,
                type,
            } as any);
        }

        try {
            if (id) {
                await axios.put(`${API_URL}/api/restaurantes/platos/${id}/`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                await axios.post(`${API_URL}/api/restaurantes/platos/`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }
            router.replace('/(comercio)/platos');
        } catch (error) {
            console.error('Error al guardar plato:', error);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">

            <View className="flex-row items-center px-4 py-3 bg-white justify-between ">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.replace('/(comercio)/platos')} className="mr-3 flex-row">
                        <Ionicons name="arrow-back" size={22} color="#003399" />
                        <Text className="text-xl font-bold text-primary">Atrás</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
                    <Ionicons name="notifications" size={32} color="#FF6600" />
                </TouchableOpacity>
            </View>
            <ScrollView
                className="flex-1 px-6 mb-32"
                showsVerticalScrollIndicator={false}
            >
                {/* Botón volver */}
                <View className="relative items-center justify-center mb-8">

                    <Text className="text-xl font-bold text-secondary">
                        {id ? "Editar Plato" : "Crear Plato"}
                    </Text>
                </View>

                {/* Nombre */}
                <Text className="font-semibold mb-2">Nombre del plato</Text>
                <TextInput
                    className="bg-gray-200 elevation-md rounded-xl px-4 py-3 mb-5 text-gray-900"
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Ej. Pizza Hawaiana"
                    placeholderTextColor="#555"
                />

                {/* Descripción */}
                <Text className="font-semibold mb-2">Descripción</Text>
                <TextInput
                    className="bg-gray-200 elevation-md rounded-xl px-4 py-3 mb-5 h-28 text-gray-900"
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                    placeholder="Describe el plato..."
                    placeholderTextColor="#555"
                />

                {/* Precio */}
                <Text className="font-semibold mb-2">Precio</Text>
                <TextInput
                    className="bg-gray-200 elevation-md rounded-xl px-4 py-3 mb-5 text-gray-900"
                    value={precio}
                    onChangeText={setPrecio}
                    placeholder="10.00"
                    placeholderTextColor="#555"
                    keyboardType="numeric"
                />
                <Text className="font-semibold mb-2">Descuento</Text>
                <TextInput
                    className="bg-gray-200 elevation-md rounded-xl px-4 py-3 mb-5 text-gray-900"
                    value={precioDescuento}
                    onChangeText={setPrecioDescuento}
                    placeholder="0.00"
                    placeholderTextColor="#555"
                    keyboardType="numeric"
                />

                {/* Estado */}
                <Text className="font-semibold mb-2">Estado</Text>
                <View className="bg-gray-200 rounded-xl mb-6">
                    <Picker
                        selectedValue={disponible}
                        onValueChange={(value) => setDisponible(value)}
                        style={{ height: 52, color: '#555' }}
                    >
                        <Picker.Item label="Selecciona un estado" value={null} />
                        <Picker.Item label="Disponible" value={true} />
                        <Picker.Item label="No disponible" value={false} />
                    </Picker>
                </View>
                <View className="relative mb-8">
                    {imagen ? (
                        <>
                            <Image
                                source={{ uri: imagen }}
                                style={{
                                    width: "100%",
                                    height: 200,
                                    borderRadius: 16,
                                }}
                            />
                            {/* Botón sobre la imagen */}
                            <TouchableOpacity
                                onPress={seleccionarImagen}
                                className="absolute bg-gray-100 px-8 py-2 rounded-full flex-row items-center self-center bottom-2 "
                                activeOpacity={0.8}
                            >
                                <Ionicons name="camera" size={18} color="gray" />
                                <Text className="text-gray-600 font-semibold ml-2">Cambiar</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        // Si no hay imagen, muestra botón normal
                        <TouchableOpacity
                            onPress={seleccionarImagen}
                            className="bg-secondary/100 py-3 rounded-xl"
                            activeOpacity={0.85}
                        >
                            <Text className="text-center text-white text-lg font-semibold">
                                Seleccionar imagen
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>


                <View className="px-6 pb-6">
                    <TouchableOpacity
                        className="bg-primary rounded-full py-4"
                        activeOpacity={0.85}
                        onPress={handleSubmit}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            {id ? "Guardar Cambios" : "Guardar Plato"}
                        </Text>
                    </TouchableOpacity>

                    {id && (
                        <TouchableOpacity
                            className="bg-secondary rounded-full py-4 mt-4"
                            activeOpacity={0.85}
                            onPress={() => router.push({pathname:'/platos/formulario-opciones', params:{ id: id} } )}
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                               Extras
                            </Text>
                        </TouchableOpacity>
                    )} 
                </View>
            </ScrollView>

        </SafeAreaView>

    );
}
