import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';

import { getAuth } from 'firebase/auth';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CustomDrawerContent(props: any) {
  const user = getAuth().currentUser;

  const menuItems = [
    { label: 'Home', icon: <Ionicons name="home" size={20} />, route: 'DrawerHome' },
    { label: 'Featured Recipe', icon: <Feather name="star" size={20} />, route: 'DrawerFeatured' },
    { label: 'Discover Recipe', icon: <MaterialIcons name="explore" size={20} />, route: 'DrawerDiscover' },
    { label: 'Favorites', icon: <FontAwesome name="heart" size={20} />, route: 'DrawerFavorite', count: 4 },
    { label: 'Recipes Saved', icon: <Ionicons name="bookmark" size={20} />, route: 'DrawerSaved', count: 3 },
  ];

  const currentRoute = props.state.routeNames[props.state.index];

  return (
    <DrawerContentScrollView contentContainerStyle={{ flex: 1 }} className="bg-white">
      <View className="flex-row items-center px-5 mb-5 pb-4 border-b border-green-600">
        <Image source={require('@/assets/images/imgg.png')} style={styles.logo} />
        <View>
          <Text style={styles.head} className="font-bold text-green-800">CookSmart</Text>
          <Text className="text-xs text-green-500">AI-Driven Cooking Assistant</Text>
        </View>
      </View>

      <View className="mt-2 px-4">
        {menuItems.map((item, index) => {
          const isActive = currentRoute === item.route;
          return (
            <TouchableOpacity
              key={index}
              className={`flex-row justify-between items-center px-1 py-3 rounded-md mb-1 ${isActive ? 'bg-green-100' : ''}`}
              onPress={() => props.navigation.navigate(item.route)}
            >
              <View className="flex-row items-center px-1">
                {item.icon}
                <Text className={`text-base mx-5 ${isActive ? 'text-green-800 font-semibold' : 'text-gray-800'}`}>
                  {item.label}
                </Text>
              </View>
              {item.count !== undefined && (
                <Text className="bg-gray-200 text-gray-700 px-2 rounded-full text-sm">{item.count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="mt-auto p-4 border-t border-green-600">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => props.navigation.navigate('DrawerProfile')}
        >
          <Ionicons className='bg-green-500 p-1 rounded-full' name="person-circle-outline" size={34} color="#fff" />
          <View className="ml-3">
            <Text className="text-black font-semibold text-sm">
              {user?.email}
            </Text>
            <Text className="text-green-500 text-xs">Ready to Cook</Text>
          </View>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: 'contain',
  },
  head: {
    fontSize: 25,
  },
});
