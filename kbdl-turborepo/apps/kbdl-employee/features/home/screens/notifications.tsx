import { Text, View } from 'react-native';

export default function Notifications() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black p-4">
      <Text className="text-textPrimary dark:text-white text-lg">
        This is notifications
      </Text>
    </View>
  );
}