import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
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
import { useRecipeContext } from '@/contexts/RecipeContext';
import DiscoverContent from './discover';
import FavoriteContent from './favorite';
import FeaturedContent from './featured';
import ProfileContent from './profile';
import SavedContent from './saved';

const Drawer = createDrawerNavigator();

function HomeContent() {
  const navigation = useNavigation<any>();
  const { getFavoritesCount, getSavedCount } = useRecipeContext();

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

      <View style={styles.greetingContainer}>
        <Text style={styles.greetingTitle}>Good Day!</Text>
        <Text style={styles.greetingSubtitle}>Ready to Start Cooking?</Text>
        <Text style={styles.greetingDescription}>
          Discover amazing recipes, get cooking guidance, and master new culinary
          skills with your personal AI assistance.
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("DrawerDiscover")}
        >
          <View>
            <Text style={styles.cardTitle}>Discover Recipes</Text>
            <Text style={styles.cardSubtitle}>Discover New Recipes With AI</Text>
          </View>
          <MaterialIcons name="search" size={24} color="orange" />
        </TouchableOpacity>

         <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("DrawerFeatured")}
        >
          <View>
            <Text style={styles.cardTitle}>Featured Recipes</Text>
            <Text style={styles.cardSubtitle}>Trending & Popular</Text>
          </View>
          <Ionicons name="restaurant" size={24} color="purple" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("DrawerSaved")}
        >
          <View>
            <Text style={styles.cardTitle}>Recipes Saved</Text>
            <Text style={styles.cardNumber}>{getSavedCount()}</Text>
          </View>
          <Ionicons name="bookmark" size={24} color="dodgerblue" />

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("DrawerFavorite")}
        >
          <View>
            <Text style={styles.cardTitle}>Favorites</Text>
            <Text style={styles.cardNumber}>{getFavoritesCount()}</Text>
          </View>
          <FontAwesome name="heart" size={24} color="crimson" />
        </TouchableOpacity>

       

        
      </View>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
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
      initialRouteName="DrawerHome"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="DrawerHome" component={HomeContent} />
      <Drawer.Screen name="DrawerFeatured" component={FeaturedContent} />
      <Drawer.Screen name="DrawerDiscover" component={DiscoverContent} />
      <Drawer.Screen name="DrawerFavorite" component={FavoriteContent} />
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
