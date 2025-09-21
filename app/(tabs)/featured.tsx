import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import CustomDrawerContent from '@/components/CustomDrawerContent';
import { MealCard } from '@/components/MealCard';
import { Category, Meal, mealApiService } from '@/services/mealApi';
import DiscoverContent from './discover';
import FavoriteContent from './favorite';
import HomeContent from './home';
import ProfileContent from './profile';
import SavedContent from './saved';

const Drawer = createDrawerNavigator();

const screenWidth = Dimensions.get('window').width;

function FeaturedContent() {
  const navigation = useNavigation<any>();
  const [featuredMeals, setFeaturedMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Meal[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadFeaturedMeals();
    loadCategories();
  }, []);

  const loadFeaturedMeals = async () => {
    try {
      setLoading(true);
      const randomMeals = await Promise.all([
        mealApiService.getRandomMeal(),
        mealApiService.getRandomMeal(),
        mealApiService.getRandomMeal(),
        mealApiService.getRandomMeal(),
        mealApiService.getRandomMeal(),
        mealApiService.getRandomMeal(),
      ]);

      const validMeals = randomMeals.filter(meal => meal !== null) as Meal[];
      setFeaturedMeals(validMeals);
    } catch (error) {
      console.error('Error loading featured meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await mealApiService.getMealCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleMealPress = (meal: Meal) => {
    navigation.navigate('MealDetail', { meal });
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryMeals', { category });
  };

  const renderMealCard = ({ item }: { item: Meal }) => (
    <MealCard
      meal={item}
      onPress={handleMealPress}
      style={{ width: '45%' }}
    />
  );

  const filteredMeals = featuredMeals.filter(m =>
    m.strMeal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayMeals = searchQuery.trim().length > 0 ? searchResults : filteredMeals;

  useEffect(() => {
    let active = true;
    const run = async () => {
      const q = searchQuery.trim();
      if (q.length === 0) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const results = await mealApiService.searchMealsByName(q);
      if (!active) return;
      setSearchResults(results);
      setSearching(false);
    };
    const timer = setTimeout(run, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobMid} />
      <View style={styles.bgBlobBottom} />

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

      <FlatList
        data={displayMeals}
        keyExtractor={(item) => item.idMeal}
        numColumns={2}
        renderItem={renderMealCard}
        contentContainerStyle={styles.mealsList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>Featured Recipes</Text>
              <Text style={styles.headerSubtitle}>Random picks, refreshed every visit</Text>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search featured recipes"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.idCategory}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryPill}
                  onPress={() => handleCategoryPress(item)}
                >
                  <Image source={{ uri: item.strCategoryThumb }} style={styles.categoryThumb} />
                  <Text style={styles.categoryLabel}>{item.strCategory}</Text>
                </TouchableOpacity>

              )}
            />
            <Text style={styles.sectionTitle}>Featured</Text>
          </View>
        }
        ListEmptyComponent={
          searching ? (
            <View style={styles.emptyState}> 
              <ActivityIndicator size="small" color="orange" />
              <Text style={styles.emptyText}>Searching recipes…</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#bbb" />
              <Text style={styles.emptyText}>No recipes found</Text>
              <Text style={styles.emptySubtext}>Try a different keyword</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

export default function FeatureScreen() {
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
      <Drawer.Screen name="DrawerFeatured" component={FeaturedContent} />

      <Drawer.Screen name="DrawerHome" component={HomeContent} />
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
    backgroundColor: '#FFFFFF',
  },
  bgBlobTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFF4EB',
    opacity: 0.8,
  },
  bgBlobMid: {
    position: 'absolute',
    top: 120,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FEE0C8',
    opacity: 0.7,
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFEBDD',
    opacity: 0.9,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderBottomEndRadius: 12,
    borderBottomStartRadius: 12,
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
    top: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    marginBottom: 16,
  },
  mealsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#666',
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  headerContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 30,
    textAlign: 'center',
    color: '#000',
    fontFamily: 'Sansita',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    color: '#555',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
});
