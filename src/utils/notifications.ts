import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let notificationHandlerConfigured = false;

/**
 * Register for push notifications and return the Expo push token.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Expo Go (SDK 53+) does not support remote push tokens.
  // Skip token registration to avoid runtime crash in Expo Go.
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient';
  if (isExpoGo) {
    console.log('Skipping remote push token registration in Expo Go');
    return null;
  }

  const Notifications = await import('expo-notifications');

  // Configure foreground behavior lazily, only in supported environments.
  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return null;
  }

  // Get Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId 
    ?? Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  // Android notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
    });
  }

  return tokenData.data;
}

/**
 * Save a distributor's push token to Firestore, keyed by their assigned row.
 */
export async function saveDistributorToken(row: string, token: string): Promise<void> {
  try {
    await setDoc(doc(db, 'distributorTokens', row), {
      pushToken: token,
      row,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`Saved push token for Row ${row}`);
  } catch (error) {
    console.error('Error saving distributor token:', error);
  }
}

/**
 * Send a push notification to the distributor assigned to a specific row.
 */
export async function notifyDistributor(
  row: string,
  participantName: string,
  seatRow: number,
  seatCol: number,
  items: string[]
): Promise<void> {
  try {
    // Look up the distributor's push token for this row
    const tokenDoc = await getDoc(doc(db, 'distributorTokens', row));
    if (!tokenDoc.exists()) {
      console.log(`No distributor token found for Row ${row}`);
      return;
    }

    const { pushToken } = tokenDoc.data();
    if (!pushToken) return;

    const itemsSummary = items.length <= 3 
      ? items.join(', ') 
      : `${items.slice(0, 3).join(', ')} +${items.length - 3} more`;

    // Send via Expo's push API
    const message = {
      to: pushToken,
      sound: 'default',
      title: `🙏 New Request — Row ${seatRow}, Seat ${seatCol}`,
      body: `${participantName} needs: ${itemsSummary}`,
      data: { row, seatRow, seatCol, items },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    console.log(`Notification sent to Row ${row} distributor`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
