import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRecipeContext } from '../contexts/RecipeContext';

type MenuItem = {
  label: string;
  lib: 'ion' | 'feather' | 'material' | 'fa';
  name: string;
  route: string;
  count?: number;
};

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

  const menuItems: MenuItem[] = [
    { label: 'Home', lib: 'ion', name: 'home', route: 'DrawerHome' },
    { label: 'Featured Recipe', lib: 'feather', name: 'star', route: 'DrawerFeatured' },
    { label: 'Discover Recipe', lib: 'material', name: 'explore', route: 'DrawerDiscover' },
    { label: 'Favorites', lib: 'fa', name: 'heart', route: 'DrawerFavorite', count: getFavoritesCount() },
    { label: 'Recipes Saved', lib: 'ion', name: 'bookmark', route: 'DrawerSaved', count: getSavedCount() },
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
          const iconColor = isActive ? 'orange' : '#1f2937';
          const renderIcon = () => {
            if (item.lib === 'ion') return <Ionicons name={item.name as any} size={20} color={iconColor} />;
            if (item.lib === 'feather') return <Feather name={item.name as any} size={20} color={iconColor} />;
            if (item.lib === 'material') return <MaterialIcons name={item.name as any} size={20} color={iconColor} />;
            return <FontAwesome name={item.name as any} size={20} color={iconColor} />;
          };
          const countStyle = [
            styles.menuCount,
            item.route === 'DrawerFavorite' && { backgroundColor: 'rgba(220,20,60,0.15)', color: 'crimson' },
            item.route === 'DrawerSaved' && { backgroundColor: 'rgba(30,144,255,0.15)', color: 'dodgerblue' },
          ];
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
                {renderIcon()}
                <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                  {item.label}
                </Text>
              </View>
              {item.count !== undefined && (
                <Text style={countStyle as any}>{item.count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.profileRow}>
          <TouchableOpacity style={styles.profileLeft} onPress={() => props.navigation.navigate('DrawerProfile')}>
            <Image source={avatar} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user?.email}
              </Text>
              <Text style={styles.profileStatus}>Ready to Cook</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => props.navigation.navigate('DrawerProfile')}>
            <Ionicons name="settings-outline" size={22} color="#1f2937" />
          </TouchableOpacity>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flexGrow: 1,
    backgroundColor: 'white', 
    paddingTop: 4,
    paddingBottom: 8,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f97316', 
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
    color: '#000', 
  },
  subtitle: {
    fontSize: 12,
    color: '#555', 
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
    backgroundColor: 'rgba(255,165,0,0.12)',
    borderLeftWidth: 4,
    borderLeftColor: 'orange',
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
    color: 'orange', 
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
    borderTopColor: '#f97316', 
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    maxWidth: '100%',
  },
  profileStatus: {
    fontSize: 12,
    color: '#555', 
  },
});
