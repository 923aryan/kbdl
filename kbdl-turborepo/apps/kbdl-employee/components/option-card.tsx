import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
interface OptionCardProps {
  title: string;
  description: string;
  IconComponent: any;
  iconBgColor: string;
  onPress: () => void;
  theme: any;
}

export const OptionCard = ({
  title,
  description,
  IconComponent,
  iconBgColor,
  onPress,
  theme,
}: OptionCardProps) => (
  <TouchableOpacity
    style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}
    onPress={onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
      <IconComponent width={32} height={32} />
    </View>
    <View style={styles.textContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>{description}</Text>
    </View>
    <Feather name="chevron-right" size={24} color={theme.text} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
    // Optional shadow for a slightly elevated look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 10,
  },
});
