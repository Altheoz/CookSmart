import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { Meal, mealApiService } from '@/services/mealApi';
import FavoriteContent from './favorite';
import FeaturedContent from './featured';
import HomeContent from './home';
import ProfileContent from './profile';
import SavedContent from './saved';

const Drawer = createDrawerNavigator();

function DiscoverContent() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveredMeals, setDiscoveredMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [cuisineType, setCuisineType] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const filterOptions = [
    'Vegetarian', 'High-Protein', 'Low-Carb', 'Sugar-free', 
    'Low-sodium', 'Halal', 'Low-cholesterol'
  ];

  const cuisineTypes = [
    'American', 'Italian', 'Mexican', 'Chinese', 'Indian', 
    'French', 'Japanese', 'Thai', 'Mediterranean', 'Korean'
  ];

  const difficultyLevels = ['Easy', 'Medium', 'Hard'];

  const handleDiscoverRecipes = async () => {
    if (!searchQuery.trim() && selectedFilters.length === 0) {
      Alert.alert('Search Required', 'Please enter a search term or select filters to discover recipes.');
      return;
    }

    setLoading(true);
    try {
      let meals: Meal[] = [];
      
      if (searchQuery.trim()) {
        meals = await mealApiService.searchMealsByName(searchQuery);
      } else {
        const randomMeals = await Promise.all([
          mealApiService.getRandomMeal(),
          mealApiService.getRandomMeal(),
          mealApiService.getRandomMeal(),
          mealApiService.getRandomMeal(),
          mealApiService.getRandomMeal(),
        ]);
        meals = randomMeals.filter(meal => meal !== null) as Meal[];
      }

      let filteredMeals = meals;
      
      if (cuisineType) {
        filteredMeals = filteredMeals.filter(meal => 
          meal.strArea.toLowerCase().includes(cuisineType.toLowerCase())
        );
      }

      if (selectedFilters.includes('Vegetarian')) {
        filteredMeals = filteredMeals.filter(meal => 
          !meal.strInstructions.toLowerCase().includes('meat') &&
          !meal.strInstructions.toLowerCase().includes('chicken') &&
          !meal.strInstructions.toLowerCase().includes('beef')
        );
      }

      setDiscoveredMeals(filteredMeals.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      Alert.alert('Error', 'Failed to discover recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedFilters([]);
    setCuisineType('');
    setDifficulty('');
    setDiscoveredMeals([]);
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleMealPress = (meal: Meal) => {
    navigation.navigate('MealDetail', { meal });
  };

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

      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Discover recipes?</Text>
        <Text style={styles.heroSubtitle}>Search for the name and customize what you want.</Text>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.dropdownContainer}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownText}>
              {cuisineType || 'Cuisine Type'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
          
          <View style={styles.dropdown}>
            <Text style={styles.dropdownText}>
              {difficulty || 'Difficulty'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        </View>

        <View style={styles.filterPills}>
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                selectedFilters.includes(filter) && styles.filterPillActive
              ]}
              onPress={() => toggleFilter(filter)}
            >
              <Text style={[
                styles.filterPillText,
                selectedFilters.includes(filter) && styles.filterPillTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.discoverButton} 
            onPress={handleDiscoverRecipes}
            disabled={loading}
          >
            <Text style={styles.discoverButtonText}>
              {loading ? 'Discovering...' : 'Discover Recipes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {discoveredMeals.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            Discovered Recipes ({discoveredMeals.length})
          </Text>
          <FlatList
            data={discoveredMeals}
            keyExtractor={(item) => item.idMeal}
            numColumns={2}
            renderItem={({ item }) => (
              <MealCard
                meal={item}
                onPress={handleMealPress}
                style={{ width: '45%' }}
              />
            )}
            contentContainerStyle={styles.resultsList}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

export default function DiscoverScreen() {
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
        <Drawer.Screen name="DrawerDiscover" component={DiscoverContent} />

    <Drawer.Screen name="DrawerHome" component={HomeContent} />
    <Drawer.Screen name="DrawerFeatured" component={FeaturedContent} />
    <Drawer.Screen name="DrawerFavorite" component={FavoriteContent} />
    <Drawer.Screen name="DrawerSaved" component={SavedContent} />
    <Drawer.Screen name="DrawerProfile" component={ProfileContent} />
  </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE5D4',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  filterSection: {
    backgroundColor: '#8B7355',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flex: 0.48,
  },
  dropdownText: {
    fontSize: 14,
    color: '#666',
  },
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  filterPillActive: {
    backgroundColor: 'white',
  },
  filterPillText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#8B7355',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.3,
  },
  clearButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  discoverButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.65,
  },
  discoverButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B7355',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultsList: {
    paddingBottom: 20,
  },
});
