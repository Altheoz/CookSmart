import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
          <View style={styles.imageWrapper}>
            <Image
              source={require('@/assets/images/imgg.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
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
            style={[styles.card, styles.cardAccentDiscover]}
            onPress={() => navigation.navigate("DrawerDiscover")}
            activeOpacity={0.7}
          >
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Discover Recipes</Text>
              <Text style={styles.cardSubtitle}>Discover New Recipes With AI</Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,165,0,0.2)' }]}>
              <MaterialIcons name="search" size={24} color="orange" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardAccentFeatured]}
            onPress={() => navigation.navigate("DrawerFeatured")}
            activeOpacity={0.7}
          >
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Featured Recipes</Text>
              <Text style={styles.cardSubtitle}>Trending & Popular</Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(128,0,128,0.2)' }]}>
              <Ionicons name="restaurant" size={24} color="purple" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardAccentSaved]}
            onPress={() => navigation.navigate("DrawerSaved")}
            activeOpacity={0.7}
          >
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Recipes Saved</Text>
              <Text style={styles.cardNumber}>{getSavedCount()}</Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(30,144,255,0.2)' }]}>
              <Ionicons name="bookmark" size={24} color="dodgerblue" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardAccentFavorite]}
            onPress={() => navigation.navigate("DrawerFavorite")}
            activeOpacity={0.7}
          >
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Favorites</Text>
              <Text style={styles.cardNumber}>{getFavoritesCount()}</Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(220,20,60,0.2)' }]}>
              <FontAwesome name="heart" size={24} color="crimson" />
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
    width: 60,
    height: 60,
    position: 'relative',
    top: 8, 
  
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  greetingContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  greetingTitle: {
    fontSize: 30,
    textAlign: 'center',
    color: '#000',
    fontFamily: 'Sansita',
  },
  greetingSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    color: '#000',
    fontFamily: 'Sansita',
  },
  greetingDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 14,
    color: '#555',
  },
  cardContainer: {
    marginTop: 36,
    paddingHorizontal: 24,
    gap: 18, 
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    borderLeftWidth: 4,  
  },
  cardAccentDiscover: {
    borderLeftColor: 'orange',
  },
  cardAccentFeatured: {
    borderLeftColor: 'purple',
  },
  cardAccentSaved: {
    borderLeftColor: 'dodgerblue',
  },
  cardAccentFavorite: {
    borderLeftColor: 'crimson',
  },
  cardText: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    marginTop: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
