import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import CustomDrawerContent from '@/components/CustomDrawerContent';
// Import other screens here
import DiscoverContent from './discover';
import FeaturedContent from './featured';
import HomeContent from './home';
import ProfileContent from './profile';
import SavedContent from './saved';

const Drawer = createDrawerNavigator();

function FavoriteContent() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="black" />
        </TouchableOpacity>
        <Image
          source={require('@/assets/images/imgg.png')}
          className="w-12 h-12 rounded-full"
        />
        <View style={{ width: 28 }} />
        
      </View>
      <Text>favorite</Text>

   
    </SafeAreaView>
  );
}

export default function FavoriteScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, []);

  if (!currentUser) {
    return null;
  }

  return (
   <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{ headerShown: false }}
  >
        <Drawer.Screen name="DrawerFavorite" component={FavoriteContent} />

    <Drawer.Screen name="DrawerHome" component={HomeContent} />
    <Drawer.Screen name="DrawerFeatured" component={FeaturedContent} />
    <Drawer.Screen name="DrawerDiscover" component={DiscoverContent} />
    <Drawer.Screen name="DrawerSaved" component={SavedContent} />
    <Drawer.Screen name="DrawerProfile" component={ProfileContent} />
  </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DFFFE0', 
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  greetingContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  greetingSubtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    color: '#000',
  },
  greetingDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    color: '#555',
  },
  cardContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
  },
});
