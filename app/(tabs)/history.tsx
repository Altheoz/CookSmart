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
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import HomeContent from './home';

import CustomDrawerContent from '@/components/CustomDrawerContent';
import { useRecipeContext } from '@/contexts/RecipeContext';
import { CookingSession } from '@/services/cookingHistoryService';
import DiscoverContent from './discover';
import FavoriteContent from './favorite';
import FeaturedContent from './featured';
import ProfileContent from './profile';
import SavedContent from './saved';

const Drawer = createDrawerNavigator();

function HistoryContent() {
  const navigation = useNavigation<any>();
  const { 
    cookingHistory, 
    cookingStats, 
    getCookingHistoryCount, 
    refreshCookingHistory,
    deleteCookingSession,
    clearAllCookingHistory 
  } = useRecipeContext();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'time'>('date');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCookingHistory();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };



  const handleDeleteSession = (sessionId: string, mealName: string) => {
    Alert.alert(
      'Delete Cooking Session',
      `Are you sure you want to delete "${mealName}" from your history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteCookingSession(sessionId)
        }
      ]
    );
  };

  const handleClearAllHistory = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to clear all your cooking history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllCookingHistory();
              Alert.alert('Success', 'All cooking history has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filteredHistory = cookingHistory
    .filter(session => {
      if (filter === 'recent') {
        const daysDiff = Math.ceil((Date.now() - session.completedAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'time':
          return b.cookingTime - a.cookingTime;
        default:
          return b.completedAt.getTime() - a.completedAt.getTime();
      }
    });

  const renderMealCard = ({ item }: { item: CookingSession }) => (
    <TouchableOpacity 
      style={styles.mealCard}
      onPress={() => navigation.navigate('MealDetail', { meal: item.meal })}
      activeOpacity={0.7}
    >
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{item.meal.strMeal}</Text>
        <Text style={styles.cardSubtitle}>
          {formatDate(item.completedAt)} • {item.cookingTime} min • {item.category}
        </Text>
      </View>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(76,175,80,0.2)' }]}>
        <Ionicons name="restaurant" size={24} color="#4CAF50" />
      </View>
    </TouchableOpacity>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Your Cooking Journey</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cookingStats.totalMealsCooked}</Text>
          <Text style={styles.statLabel}>Meals Cooked</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Math.round(cookingStats.totalCookingTime / 60)}h</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cookingStats.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>
      
    </View>
  );

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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStatsCard()}

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All ({getCookingHistoryCount()})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filter === 'recent' && styles.filterButtonActive]}
              onPress={() => setFilter('recent')}
            >
              <Text style={[styles.filterText, filter === 'recent' && styles.filterTextActive]}>
                Recent
              </Text>
            </TouchableOpacity>

            {cookingHistory.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={handleClearAllHistory}
              >
                <Ionicons name="trash-outline" size={16} color="#F44336" />
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No cooking history yet</Text>
            <Text style={styles.emptySubtitle}>
              Start cooking some delicious recipes to see them here!
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('DrawerDiscover')}
            >
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.exploreButtonText}>Explore Recipes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredHistory}
            renderItem={renderMealCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={styles.mealList}
          />
        )}
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
      initialRouteName="DrawerHistory"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
        <Drawer.Screen name="DrawerHistory" component={HistoryContent} />
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
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
    top: 180,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
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
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 36,
    marginBottom: 20,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    marginLeft: 8,
    gap: 6,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F44336',
  },
  mealList: {
    paddingHorizontal: 24,
    gap: 18,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});