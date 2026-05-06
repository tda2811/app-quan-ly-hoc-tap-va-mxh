// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'book.fill': 'menu-book',
  'star.fill': 'star',
  'person.fill': 'person',
  'message.fill': 'chat',
  'person.2.fill': 'group',
  // MaterialIcons does not reliably include 'bar-chart' in all builds; use a known-safe icon.
  'chart.bar.fill': 'insert-chart',
  'chart.bar': 'insert-chart',
  'list.bullet.indent': 'school',
  'list.number': 'format-list-numbered',
  'bubbles.and.sparkles.fill': 'forum',
  'folder.fill': 'folder',
  'calendar.fill': 'calendar-today',
  'clock.fill': 'schedule',
  'clock': 'schedule',
  'doc.text.fill': 'description',
  'doc.text': 'description',
  'mappin.and.ellipse': 'place',
  'qrcode.viewfinder': 'qr-code-scanner',
  'camera.fill': 'photo-camera',
  'arrow.clockwise': 'refresh',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'bell.fill': 'notifications',
  'bell.slash.fill': 'notifications-off',
  'plus': 'add',
  'calendar': 'event',
  'chevron.left': 'chevron-left',
  'hand.thumbsup.fill': 'thumb-up',
  'bubble.left.fill': 'chat',
  'line.3.horizontal': 'menu',
} as const satisfies Record<string, MaterialIconName>;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
