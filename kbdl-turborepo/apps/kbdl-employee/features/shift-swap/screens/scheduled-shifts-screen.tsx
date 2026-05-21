import ShiftCard from "@/components/ui/shift-swap-card";
import { Colors } from "@/constants/theme";
import { useRef } from "react";
// Change SafeAreaView to standard View, and import useSafeAreaInsets
import Loader from "@/components/ui/loader";
import { Typography } from "@/components/ui/typography";
import { ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetEmployeeShifts } from "../api";
export default function ScheduledShifts() {
  const { data, isLoading } = useGetEmployeeShifts();
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // 1. Get dynamic safe area insets
  const insets = useSafeAreaInsets();

  console.log("scheduled shift screen: ", data);

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Loader />
        </View>
      )
        :
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: insets.bottom,
            paddingHorizontal: 16,
          }}
        >
          {data && data.length > 0 ? (
            data.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} buttonTitle='Approve' />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Typography
                variant="body"
                style={{ color: theme.textSecondary, textAlign: 'center' }}>
                No scheduled shifts found.
              </Typography>
            </View>
          )}
        </ScrollView>

      }
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
});