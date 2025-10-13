import { images } from "@/constants";
import { useAuthStore } from '@/store/auth.store';
import { TabBarIconProps } from "@/type";
import cn from "clsx";
import { Redirect, Tabs } from "expo-router";
import { Image, Text, View } from "react-native";

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    <View
        className={cn(
            "flex tab-icon justify-center items-center w-24 rounded-xl h-16",
            focused ? "bg-blue-100" : ""
        )}
    >
        <Image
            source={icon}
            className="size-7 mb-1"
            resizeMode="contain"
            tintColor={focused ? "#0033A0" : "#5D5F6D"}
        />
        <Text
            className={cn(
                "text-sm font-bold",
                focused ? "text-blue-500" : "text-gray-400"
            )}
        >
            {title}
        </Text>
    </View>

)
export default function TabsLayout() {

   

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) return <Redirect href="/sign-in" />
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
                position: 'absolute',
                height: 80,
                backgroundColor: 'white'
            }
        }}>
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Inicio" icon={images.home} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='historial'
                options={{
                    title: 'Historial',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Historial" icon={images.search} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='wallet'
                options={{
                    title: 'Wallet',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Wallet" icon={images.bag} focused={focused} />
                }}
            />

             <Tabs.Screen
                name="orden/orden-detalle"
                options={{
                    href: null, // 👈 evita que aparezca como tab
                }}
            />
            {/*
            <Tabs.Screen
                name="orden/pago-movil"
                options={{
                    href: null, // 👈 evita que aparezca como tab
                    tabBarStyle: { display: 'none' } // 👈 oculta el tab bar en esta pantalla
                }}
            /> */}
        </Tabs>
    );
}
