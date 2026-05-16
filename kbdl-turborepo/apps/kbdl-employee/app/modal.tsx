import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center p-5">
      <Text className="text-textPrimary text-base">This is a modal</Text>

      <Link href="/" dismissTo className="mt-4 py-4">
        <Text className="text-primary">Go to home screen</Text>
      </Link>
    </View>
  );
}
