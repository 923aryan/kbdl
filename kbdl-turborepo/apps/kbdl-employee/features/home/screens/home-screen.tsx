import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets(); // Grabs exact dimensions of the status bar

  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
}

// ... your styles