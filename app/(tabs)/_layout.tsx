import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StatusBar, View } from 'react-native';

export default function TabLayout() {
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#fff'); 
    }
  }, []);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
        paddingBottom: 40,
        backgroundColor: '#fff', 
      }}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none',
          },
        }}
      >
        <Tabs.Screen name="saved" />
        <Tabs.Screen name="home" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="favorite" />
        <Tabs.Screen name="featured" />
        <Tabs.Screen name="categories" />
        <Tabs.Screen name="discover" />
      </Tabs>
    </View>
  );
}
