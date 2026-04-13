import { Platform, Alert, type AlertButton } from 'react-native';

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 0) {
      const hasCancel = buttons.some(b => b.style === 'cancel');
      const destructiveButton = buttons.find(b => b.style === 'destructive');
      const defaultButton = buttons.find(b => b.style !== 'cancel' && b.style !== 'destructive');
      const primaryButton = destructiveButton || defaultButton;

      if (hasCancel && primaryButton) {
        const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
        if (confirmed && primaryButton.onPress) {
          primaryButton.onPress();
        }
      } else {
        window.alert(message ? `${title}\n${message}` : title);
        const firstButton = buttons[0];
        if (firstButton.onPress) {
          firstButton.onPress();
        }
      }
    } else {
      window.alert(message ? `${title}\n${message}` : title);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
