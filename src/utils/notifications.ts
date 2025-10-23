import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// 🧩 Configura el comportamiento de las notificaciones cuando llegan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // 👈 nuevo en SDK 54
    shouldShowList: true,   // 👈 nuevo en SDK 54
  }),
});

export async function registerForPushNotificationsAsync() {
  let token: string | undefined;

  // 📱 Verificar que sea un dispositivo físico
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("No se pudieron obtener permisos para notificaciones push.");
      return;
    }

    // ⚠️ En SDK 54 necesitas pasar el projectId (lo obtienes desde app.json o app.config.js)
    const projectId = "53dd9d3e-b6e7-427c-9374-9bb0366fece8"; // ejemplo: "12345678-abcd-efgh-ijkl-1234567890ab"

    const response = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = response.data;

    console.log("✅ Token de notificación Expo:", token);
  } else {
    alert("Debes usar un dispositivo físico para recibir notificaciones push.");
  }

  // ⚙️ Configuración Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string
) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data: { type: "order_created" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}
