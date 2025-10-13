import { images, API_URL } from '@/constants';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { Plato } from '@/type';
import { Ionicons } from '@expo/vector-icons';

const filtros = ['Todos', 'Disponibles', 'Agotados'];

export default function Platos() {
  const token = useAuthStore((state) => state.user?.token);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  const getPlatos = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurantes/platos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlatos(response.data as Plato[]);

      console.log(platos)
    } catch (err) {
      console.error('Error al obtener platos:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getPlatos();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );


  const filteredPlatos = useMemo(() => {
    return platos?.filter((plato) => {
      let matchesFilter = true;

      if (selectedFilter === 'Disponibles') {
        matchesFilter = plato.disponible === true;
      } else if (selectedFilter === 'Agotados') {
        matchesFilter = plato.disponible === false;
      } else if (selectedFilter === 'Todos') {
        matchesFilter = true;
      }

      const matchesSearch = plato.nombre.toLowerCase().includes(searchText.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [searchText, selectedFilter, platos]);


  const handleAddPlato = () => {
    router.push('/platos/formulario');
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-5 pb-28 pt-4">

      <View className="flex-row items-center px-4 py-3 bg-white justify-between ">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 flex-row">
            <Ionicons name="arrow-back" size={22} color="#003399" />
            <Text className="text-xl font-bold text-primary">Atrás</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
          <Ionicons name="notifications" size={32} color="#FF6600" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center bg-tertiary rounded-lg px-4 py-1 mb-6 mx-4">
        <TextInput
          placeholder="Buscar platos..."
          value={searchText}
          onChangeText={setSearchText}
          className="flex-1 text-base text-gray-800 font-semibold"
          placeholderTextColor="#70747a"
        />

        <Image source={images.search} className="w-5 h-5 mr-2" resizeMode="contain" />
      </View>

      <FlatList
        data={filteredPlatos}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={() => (
          <>


            <View className="flex-row mb-4 px-4 justify-around">
              {filtros.map((filtro) => (
                <TouchableOpacity
                  key={filtro}
                  onPress={() => setSelectedFilter(filtro)}
                  className={`mr-2 px-4 py-2 rounded-full border ${selectedFilter === filtro ? 'bg-primary border-primary' : 'border-gray-300'}`}
                >
                  <Text className={`${selectedFilter === filtro ? 'text-white' : 'text-gray-700'}`}>
                    {filtro}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className='mb-3 ml-4 font-bold text-xl text-secondary'>Platos</Text>
          </>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/platos/formulario",
                params: { id: item.id },
              })
            }
            activeOpacity={0.9}
            className="flex-row items-center p-4 mb-4 mx-4 bg-gray-100 rounded-2xl elevation-md"
          >
            {/* Imagen */}
            <Image
              source={{ uri: `${API_URL}/media/${item.imagen_url}` }}
              className="h-32 w-32 rounded-xl"
              resizeMode="cover"
            />

            {/* Texto */}
            <View className="flex-1 mx-4">
              <Text className="font-semibold text-gray-900" numberOfLines={1}>
                {item.nombre}
              </Text>
              <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                {item.descripcion}
              </Text>

              <View className="flex-row items-center gap-2 mt-2">
                {item.precio_descuento && item.precio_descuento < item.precio ? (
                  <>
                    <Text className="font-bold text-primary text-lg">
                      ${item.precio_descuento}
                    </Text>
                    <Text className="text-gray-400 text-base line-through">
                      ${item.precio}
                    </Text>
                  </>
                ) : (
                  <Text className="font-bold text-primary text-lg">
                    ${item.precio}
                  </Text>
                )}
              </View>

              <TouchableOpacity className='bg-primary py-1 rounded-full self-end px-6' onPress={() =>
                router.push({
                  pathname: "/platos/formulario",
                  params: { id: item.id },
                })
              }>
                <Text className='text-center text-white font-semibold text-lg'>
                  Editar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Precio */}

          </TouchableOpacity>

        )}
        ListEmptyComponent={() => (
          <Text className="text-center text-gray-400 mt-10">No se encontraron platos</Text>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        onPress={handleAddPlato}
        className="bg-secondary rounded-xl px-5 py-3 flex-row items-center justify-center absolute bottom-32 shadow-md self-center"
      >
        <Image source={images.plus} className="w-6 h-6" style={{ tintColor: 'white' }} resizeMode="contain" />
        <Text className='text-white font-semibold ml-2 text-lg'>Agregar Plato</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
