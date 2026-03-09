import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <>
      {/* Ensures the time and battery icons match the theme */}
      <StatusBar style={isDark ? "light" : "dark"} />

      <Stack
        screenOptions={{
          // Global Header Styling
          headerStyle: {
            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          },
          headerTintColor: isDark ? "#FFFFFF" : "#1C1C1E",
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 18,
          },
          // Removes the shadow/line for a flatter, modern look
          headerShadowVisible: false,
          // Background color for the screens underneath
          contentStyle: {
            backgroundColor: isDark ? "#000000" : "#F2F2F7",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Health Tracker",
            // On iOS, this allows the title to expand/shrink on scroll
            headerLargeTitle: true,
          }}
        />
      </Stack>
    </>
  );
}
