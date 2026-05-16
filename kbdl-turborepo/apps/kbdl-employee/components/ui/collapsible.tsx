import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={() => setIsOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          className="text-gray-700 dark:text-gray-300"
          style={{
            transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
          }}
        />

        <Text className="font-semibold text-textPrimary dark:text-white">{title}</Text>
      </TouchableOpacity>

      {isOpen && <View className="mt-2 ml-6">{children}</View>}
    </View>
  );
}
