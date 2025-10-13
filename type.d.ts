import { Models } from "react-native-appwrite";

export interface MenuItem extends Models.Document {
    name: string;
    price: number;
    image_url: string;
    description: string;
    calories: number;
    protein: number;
    rating: number;
    type: string;
}

export interface Category extends Models.Document {
    name: string;
    description: string;
}

export interface User extends Models.Document {
    nombre: string;
    email: string;
    rol: string;
    token: string;
    telefono: string;
    foto_perfil: string;
    foto_perfil_url: string;
}

export interface CartCustomization {
    id: string;
    name: string;
    price: number;
    type: string;
}

export interface CartItemType {
    id: string; // menu item id
    name: string;
    price: number;
    image_url: string;
    quantity: number;
    customizations?: CartCustomization[];
}

export interface CartStore {
    items: CartItemType[];
    addItem: (item: Omit<CartItemType, "quantity">) => void;
    removeItem: (id: string, customizations: CartCustomization[]) => void;
    increaseQty: (id: string, customizations: CartCustomization[]) => void;
    decreaseQty: (id: string, customizations: CartCustomization[]) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}

interface PaymentInfoStripeProps {
    label: string;
    value: string;
    labelStyle?: string;
    valueStyle?: string;
}

interface CustomButtonProps {
    onPress?: () => void;
    title?: string;
    style?: string;
    leftIcon?: React.ReactNode;
    textStyle?: string;
    isLoading?: boolean;
}

interface CustomHeaderProps {
    title?: string;
}

interface CustomInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
    editable?:boolean;
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: ImageSourcePropType;
}

interface CreateUserPrams {
    email: string;
    password: string;
    name: string;
}

interface SignInParams {
    email: string;
    password: string;
}

interface GetMenuParams {
    category: string;
    query: string;
}

interface Role { id: string; nombre: string, icons };

interface Estado { id: string; nombre: string, descripcion: string };

interface Categoria { id: string; nombre: string, descripcion: string, imagen: string };

interface Restaurante {
  id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  horario_apertura: string; // formato HH:mm:ss
  horario_cierre: string;   // formato HH:mm:ss
  calificacion_promedio: number;
  estado: string;           // UUID del estado
  usuario: string;
  imagen_url: string;     // UUID del usuario 
  capacidad: string;
  pagina_web: string;
  telefono: string;
  categoria: Categoria | null; // UUID de la categoria
}

interface Plato {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen: string;
    disponible: boolean;           // UUID del estado
    restaurante: string; 
    imagen_url: string;     // UUID del restaurante
    restaurante_nombre: string;
    precio_descuento: number;
    }

interface MetodosPagos {
    id: string;
    nombre: string;
    descripcion: string;
    icons: string;
}

interface Direccion {
  id: string;
  usuario: string; // o un objeto Usuario si lo traes expandido
  nombre: string;
  direccion_texto: string;
  latitud: number;
  longitud: number;
  es_predeterminada: boolean;
}

interface OrdenDetalle {
    cantidad: number; 
    descuento?: number; 
    id: string; 
    plato: string, 
    plato_nombre: string; 
    precio_unitario: number; 
    subtotal: number;
    plato_imagen: string; 
}

interface Orden {
  id: string;
  restaurante: string;
  creado_en: string;
  total: number;
  estado: string;
  restaurante_nombre?: string;
  estado_nombre?: string;
  cliente_nombre?: string;
  numero_orden?:number;
  direccion_entrega?: string;
  latitud?: number;
  longitud?: number;
  detalles: OrdenDetalle[];
  restaurante_imagen?: string;
  cliente_email?:string;
  cliente_telefono?:string;
  cliente_foto?:string;
}
