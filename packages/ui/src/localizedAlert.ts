import { Alert, type AlertButton, type AlertOptions } from 'react-native';
import { translate } from '@datxe/shared';
export function localizedAlert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
  Alert.alert(translate(title), translate(message), buttons?.map(button => ({ ...button, text: translate(button.text) })), options);
}
