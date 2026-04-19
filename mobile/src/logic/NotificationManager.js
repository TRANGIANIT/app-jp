import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Behavior when notification triggers while app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * Schedule a daily reminder to review due cards
 */
export async function scheduleDailyReminder() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Clear previous schedules to prevent duplication
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule for tomorrow at 9:00 AM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌸 Giờ ôn tập tiếng Nhật!",
      body: "Bạn có thẻ Spaced Repetition cần ôn tập hôm nay. Đừng để dồn bài nhé!",
      sound: true,
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}
