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
        <Tabs.Screen name="index" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}
