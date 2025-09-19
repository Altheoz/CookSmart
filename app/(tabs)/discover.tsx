import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import CustomDrawerContent from '@/components/CustomDrawerContent';
import { MealCard } from '@/components/MealCard';
import { aiService } from '@/services/aiService';
import { Meal } from '@/services/mealApi';
import FavoriteContent from './favorite';
import FeaturedContent from './featured';
import HomeContent from './home';
import ProfileContent from './profile';
import SavedContent from './saved';

const Drawer = createDrawerNavigator();

function DiscoverContent() {
  const navigation = useNavigation<any>();
  const [generatedMeals, setGeneratedMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [showCuisineOptions, setShowCuisineOptions] = useState(false);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  const categoryOptions = [
    'Beef', 'Chicken', 'Seafood', 'Vegetarian', 'Vegan', 'Pasta', 'Dessert', 'Breakfast', 'Pork', 'Lamb', 'Rice'
  ];

  const ASIAN_AREAS = useMemo(() => [
    'Chinese', 'Japanese', 'Thai', 'Indian', 'Malaysian', 'Filipino', 'Vietnamese', 'Korean'
  ], []);

  const cuisineOptions = ['Random', ...ASIAN_AREAS];
  const dietaryOptions = ['Vegetarian', 'High-Protein', 'Low-Carb', 'Sugar-free', 'Low-sodium', 'Halal', 'Low-cholesterol'];

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const handleClear = () => {
    setSelectedCategories([]);
    setSelectedCuisine('');
    setSelectedDietary([]);
    setGeneratedMeals([]);
  };

  const handleGenerateRecipes = async () => {
    setLoading(true);
    try {
      const generated = await aiService.generateAsianRecipes({
        query: [searchQuery, selectedDietary.length ? `Dietary: ${selectedDietary.join(', ')}` : ''].filter(Boolean).join(' | '),
        categories: selectedCategories,
        cuisine: selectedCuisine,
        maxResults: 12,
      });

      setGeneratedMeals(generated);
      if (generated.length === 0) {
        Alert.alert('No results', 'Try different categories or difficulty. Only Asian cuisines are included.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate recipes. Please try again.');
    } finally {
      setLoading(false);
    }
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

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Discover recipes</Text>
        <Text style={styles.heroSubtitle}>Describe the recipe you want to create…</Text>
      </View>

      <View style={styles.generatorSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Describe the recipe you want to create …"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={4}
          />
        </View>
        <View style={styles.dropdownRow}>
          <View style={styles.dropdownBox}>
            <TouchableOpacity onPress={() => setShowCuisineOptions(!showCuisineOptions)} style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>{selectedCuisine || 'Cuisine Type'}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
            {showCuisineOptions && (
              <View style={styles.dropdownMenu}>
                {cuisineOptions.map(opt => (
                  <TouchableOpacity key={opt} onPress={() => { setSelectedCuisine(opt === 'Random' ? '' : opt); setShowCuisineOptions(false); }} style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.pillGrid}>
          {dietaryOptions.map(tag => (
            <TouchableOpacity key={tag} onPress={() => setSelectedDietary(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} style={[styles.pill, selectedDietary.includes(tag) && styles.pillActive]}>
              <Text style={[styles.pillText, selectedDietary.includes(tag) && styles.pillTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="globe-outline" size={16} color="#fff" />
          <Text style={{ color: 'white', marginLeft: 6, fontSize: 12 }}>Scope: Asia only</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.discoverButton} onPress={handleGenerateRecipes} disabled={loading}>
            <Text style={styles.discoverButtonText}>{loading ? 'Discovering…' : 'Discover Recipes'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {generatedMeals.length > 0 && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsHeaderText}>Discovered Recipes</Text>
          </View>
          <FlatList
            data={generatedMeals}
            keyExtractor={(item) => item.idMeal}
            numColumns={2}
            renderItem={({ item }) => (
              <MealCard
                meal={item}
                onPress={handleMealPress}
                style={{ width: '45%' }}
              />
            )}
            scrollEnabled={false}
            contentContainerStyle={styles.resultsList}
          />
        </View>
      )}

      </ScrollView>
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
  generatorSection: {
    backgroundColor: '#8B7355',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dropdownBox: {
    position: 'relative',
    flex: 1,
  },
  dropdownHeader: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownHeaderText: {
    fontSize: 14,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
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
  fontSize: 16,
  color: '#000',
  height: 120, 
  textAlignVertical: 'top',
},

  sectionLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: 'white',
  },
  pillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#8B7355',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: 'white',
  },
  segmentText: {
    color: 'white',
    fontWeight: '600',
  },
  segmentTextActive: {
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
  resultsHeader: {
    backgroundColor: '#1E7D32',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  resultsHeaderText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  resultsList: {
    paddingBottom: 20,
  },
});
