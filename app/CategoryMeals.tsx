import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { MealCard } from '@/components/MealCard';
import { Meal, mealApiService } from '@/services/mealApi';

export default function CategoryMealsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { category } = route.params;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategoryMeals();
  }, []);

  const loadCategoryMeals = async () => {
    try {
      setLoading(true);
      const mealsData = await mealApiService.getMealsByCategory(category.strCategory);
      setMeals(mealsData);
    } catch (error) {
      console.error('Error loading category meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const mealsData = await mealApiService.getMealsByCategory(category.strCategory);
      setMeals(mealsData);
    } catch (error) {
      console.error('Error refreshing category meals:', error);
    } finally {
      setRefreshing(false);
    }
  }, [category.strCategory]);

  const handleMealPress = (meal: Meal) => {
    navigation.navigate('MealDetail', { meal });
  };

  const filteredMeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? meals.filter((m) => m.strMeal.toLowerCase().includes(q)) : meals;
  }, [meals, searchQuery]);


  const renderMealCard = ({ item }: { item: Meal }) => (
    <MealCard
      meal={item}
      onPress={handleMealPress}
      style={{ width: '48%', margin: 0, marginBottom: 12 }}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.strCategory}</Text>
        <View style={styles.iconPlaceholder} />
      </View>

      <View style={styles.hero}>
        <Image source={{ uri: category.strCategoryThumb }} style={styles.heroImage} />
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>{category.strCategory}</Text>
          <Text style={styles.heroSubtitle}>{meals.length} meals</Text>
        </View>
      </View>

      <Text style={styles.categoryDescription}>
        {category.strCategoryDescription}
      </Text>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={16} color="#666" />
          <TextInput
            placeholder={`Search in ${category.strCategory}`}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>

    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="pizza-outline" size={36} color="#bbb" />
      <Text style={styles.emptyTitle}>No meals found</Text>
      <Text style={styles.emptySubtitle}>Try a different search or clear filters.</Text>
    </View>
  );

  const LoadingGrid = () => (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <>
          {renderHeader()}
          <LoadingGrid />
        </>
      ) : (
        <FlatList
          data={filteredMeals}
          keyExtractor={(item) => item.idMeal}
          numColumns={2}
          renderItem={renderMealCard}
          contentContainerStyle={styles.mealsList}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 0 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={ListEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#999" />
          }
          initialNumToRender={8}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  iconPlaceholder: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  hero: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  heroImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#777',
  },
  categoryDescription: {
    marginTop: 10,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  searchRow: {
    marginTop: 12,
    marginBottom: 6,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchInput: {
    marginLeft: 6,
    flex: 1,
    color: '#111',
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipActive: {
    backgroundColor: '#FFE5D4',
    borderColor: '#ffd1b3',
  },
  chipText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#b85c38',
  },
  mealsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#777',
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonCard: {
    width: '48%',
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#f1f1f1',
  },
});
