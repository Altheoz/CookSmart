import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRecipeContext } from '../contexts/RecipeContext';

export default function CustomDrawerContent(props: any) {
  const user = getAuth().currentUser;
  const [avatar, setAvatar] = useState(require('@/assets/images/avatars/avatar_1.jpg'));
  const { getFavoritesCount, getSavedCount } = useRecipeContext();

  useEffect(() => {
    const loadAvatar = async () => {
      const uri = await AsyncStorage.getItem('userAvatar');
      if (uri) setAvatar({ uri });
    };

    loadAvatar();

    const unsubscribe = props.navigation.addListener('focus', loadAvatar);
    return unsubscribe;
  }, [props.navigation]);

  const menuItems = [
    { label: 'Home', icon: <Ionicons name="home" size={20} color="black" />, route: 'DrawerHome' },
    { label: 'Featured Recipe', icon: <Feather name="star" size={20} color="black" />, route: 'DrawerFeatured' },
    { label: 'Discover Recipe', icon: <MaterialIcons name="explore" size={20} color="black" />, route: 'DrawerDiscover' },
    { label: 'Favorites', icon: <FontAwesome name="heart" size={20} color="black" />, route: 'DrawerFavorite', count: getFavoritesCount() },
    { label: 'Recipes Saved', icon: <Ionicons name="bookmark" size={20} color="black" />, route: 'DrawerSaved', count: getSavedCount() },
  ];

  const currentRoute = props.state.routeNames[props.state.index];

  return (
    <DrawerContentScrollView contentContainerStyle={styles.drawerContainer}>
  
      <View style={styles.header}>
        <Image source={require('@/assets/images/imgg.png')} style={styles.logo} />
        <View>
          <Text style={styles.title}>CookSmart</Text>
          <Text style={styles.subtitle}>AI-Driven Cooking Assistant</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const isActive = currentRoute === item.route;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive
              ]}
              onPress={() => props.navigation.navigate(item.route)}
            >
              <View style={styles.menuItemLeft}>
                {item.icon}
                <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                  {item.label}
                </Text>
              </View>
              {item.count !== undefined && (
                <Text style={styles.menuCount}>{item.count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.profileRow} onPress={() => props.navigation.navigate('DrawerProfile')}>
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileStatus}>Ready to Cook</Text>
          </View>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: 'white', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#16a34a', 
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: 'contain',
    borderRadius: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#166534', 
  },
  subtitle: {
    fontSize: 12,
    color: '#22c55e', 
  },
  menuContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#bbf7d0', 
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
    marginLeft: 12,
    color: '#1f2937', 
  },
  menuLabelActive: {
    fontWeight: '600',
    color: '#166534', 
  },
  menuCount: {
    backgroundColor: '#e5e7eb',
    color: '#374151', 
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 12,
  },
  footer: {
    marginTop: 'auto',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#16a34a', 
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  profileInfo: {
    marginLeft: 12,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  profileStatus: {
    fontSize: 12,
    color: '#22c55e', 
  },
});
