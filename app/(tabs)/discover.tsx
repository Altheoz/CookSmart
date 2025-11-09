import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  RefreshControl,
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
import HistoryContent from './history';
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
  const [showDescriptionError, setShowDescriptionError] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headerTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();
  }, [headerOpacity, headerTranslate, cardOpacity, cardTranslate]);

  useEffect(() => {
    if (showDescriptionError) {
      const timer = setTimeout(() => {
        setShowDescriptionError(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showDescriptionError]);

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
    setShowDescriptionError(false);
    setShowNoResults(false);
    setSearchQuery('');
  };

  const handleRefresh = () => {
    setRefreshing(true);
   
    setGeneratedMeals([]);
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedCuisine('');
    setSelectedDietary([]);
    setShowDescriptionError(false);
    setShowNoResults(false);
    setShowCuisineOptions(false);
    
   
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const handleGenerateRecipes = async () => {

    if (!searchQuery.trim()) {
      setShowDescriptionError(true);
      return;
    }

    setShowDescriptionError(false);
    setShowNoResults(false);
    setLoading(true);
    try {
      const generated = await aiService.generateAsianRecipes({
        query: [searchQuery, selectedDietary.length ? `Dietary: ${selectedDietary.join(', ')}` : ''].filter(Boolean).join(' | '),
        categories: selectedCategories,
        cuisine: selectedCuisine,
        maxResults: 4,
      });

      setGeneratedMeals(generated);
      if (generated.length === 0) {
        setShowNoResults(true);
      } else {
        setShowNoResults(false);
        setSearchQuery('');
        setSelectedCategories([]);
        setSelectedCuisine('');
        setSelectedDietary([]);
      }
    } catch (error) {
      setShowNoResults(true);
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

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 24 }} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
            title="Pull to refresh"
            titleColor="#666"
          />
        }
      >
        <Animated.View style={[styles.headerContainer, { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }]}>
          <Text style={styles.headerTitle}>Discover Recipes</Text>
          <Text style={styles.headerSubtitle}>Describe the recipe you want to create</Text>
        </Animated.View>

        <Animated.View style={[styles.generatorSection, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
          <View style={styles.searchContainer}>
            <View style={[styles.inputWrapper, showDescriptionError && styles.inputWrapperError]}>
              <Ionicons 
                name="create-outline" 
                size={20} 
                color={showDescriptionError ? "#FF6B35" : "#999"} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Describe the recipe you want to create..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (showDescriptionError && text.trim()) {
                    setShowDescriptionError(false);
                  }
                }}
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
            {showDescriptionError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF6B35" />
                <Text style={styles.errorText}>Please describe the recipe you want to create</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>Cuisine</Text>
          <View style={styles.dropdownRow}>
            <View style={styles.dropdownBox}>
              <TouchableOpacity onPress={() => setShowCuisineOptions(!showCuisineOptions)} style={styles.dropdownHeader}>
                <Text style={styles.dropdownHeaderText}>{selectedCuisine || 'Cuisine Type'}</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
              {showCuisineOptions && (
                <View style={styles.dropdownMenu}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                  >
                    {cuisineOptions.map(opt => (
                      <TouchableOpacity 
                        key={opt} 
                        onPress={() => { 
                          setSelectedCuisine(opt === 'Random' ? '' : opt); 
                          setShowCuisineOptions(false); 
                        }} 
                        style={styles.dropdownItem}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Dietary Preferences</Text>
          <View style={styles.pillGrid}>
            {dietaryOptions.map(tag => (
              <TouchableOpacity key={tag} onPress={() => setSelectedDietary(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} style={[styles.pill, selectedDietary.includes(tag) && styles.pillActive]}>
                <Text style={[styles.pillText, selectedDietary.includes(tag) && styles.pillTextActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="globe-outline" size={16} color="#6B7280" />
            <Text style={{ color: '#6B7280', marginLeft: 6, fontSize: 12 }}>Scope: Asia only</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discoverButton} onPress={handleGenerateRecipes} disabled={loading}>
              <Text style={styles.discoverButtonText}>{loading ? 'Discovering…' : 'Discover Recipes'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

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
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </ScrollView>


      <Modal
        visible={loading}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loadingContainer}>
              <View style={styles.aiIconContainer}>
                <Ionicons name="sparkles" size={40} color="#FF6B35" />
              </View>
              <Text style={styles.loadingTitle}>Discovering Recipes</Text>
              <Text style={styles.loadingSubtitle}>AI is creating personalized recipes for you...</Text>
              <View style={styles.loadingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNoResults && !loading}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.noResultsModalContent}>
            <View style={styles.noResultsContainer}>
              <View style={styles.noResultsIconContainer}>
                <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.noResultsTitle}>No Results Found</Text>
              <Text style={styles.noResultsMessage}>
                We couldn't find any recipes matching your description. This might be due to:
              </Text>
              <View style={styles.noResultsList}>
                <View style={styles.noResultsItem}>
                  <Ionicons name="wifi-outline" size={16} color="#6B7280" />
                  <Text style={styles.noResultsItemText}>Internet connection issues</Text>
                </View>
                <View style={styles.noResultsItem}>
                  <Ionicons name="create-outline" size={16} color="#6B7280" />
                  <Text style={styles.noResultsItemText}>Try a different description</Text>
                </View>
                <View style={styles.noResultsItem}>
                  <Ionicons name="refresh-outline" size={16} color="#6B7280" />
                  <Text style={styles.noResultsItemText}>Check your connection and try again</Text>
                </View>
              </View>
              <View style={styles.noResultsButtonContainer}>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => setShowNoResults(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={() => {
                    setShowNoResults(false);
                    handleGenerateRecipes();
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
      <Drawer.Screen name="DrawerHistory" component={HistoryContent} />
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
  generatorSection: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 220,
  },
  dropdownScrollView: {
    maxHeight: 220,
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
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: '#FF6B35',
    borderWidth: 2,
    backgroundColor: '#FFF4EB',
  },
  inputIcon: {
    marginTop: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  helperText: {
    color: '#6B7280',
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
  },

  sectionLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  pill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillText: {
    color: '#111827',
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
    marginTop: 8,
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.3,
  },
  clearButtonText: {
    color: '#111827',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  aiIconContainer: {
    backgroundColor: '#FFF4EB',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.6,
  },
  dot2: {
    opacity: 0.8,
  },
  dot3: {
    opacity: 1,
  },
  noResultsModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
  },
  noResultsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  noResultsIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noResultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  noResultsMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  noResultsList: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  noResultsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  noResultsItemText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 10,
    flex: 1,
  },
  noResultsButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
