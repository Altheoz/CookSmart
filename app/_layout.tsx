import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import "./global.css";

import { RecipeProvider } from '@/contexts/RecipeContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Sansita: require('../assets/fonts/SansitaSwashed-Black.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <RecipeProvider>
      <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="MealDetail" options={{ headerShown: false }} />
          <Stack.Screen name="CookingInterface" options={{ headerShown: false }} />
          <Stack.Screen name="RecipeCompletion" options={{ headerShown: false }} />
          <Stack.Screen name="CategoryMeals" options={{ headerShown: false }} />
          <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="resetPassword" options={{ headerShown: false }} />
          <Stack.Screen name="TermsAndConditions" options={{ headerShown: false }} />
          <Stack.Screen name="OfflineRecipes" options={{ headerShown: false }} />
          <Stack.Screen name="OfflineMealDetail" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </RecipeProvider>
  );
}
