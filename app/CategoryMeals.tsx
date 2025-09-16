import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
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

const handleMealPress = (meal: Meal) => {

  navigation.navigate('MealDetail', { meal });
};


  const renderMealCard = ({ item }: { item: Meal }) => (
    <MealCard
      meal={item}
      onPress={handleMealPress}
      style={{ width: '45%' }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.strCategory}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.categoryInfo}>
        <Text style={styles.categoryDescription}>{category.strCategoryDescription}</Text>
      </View>

      <FlatList
        data={meals}
        keyExtractor={(item) => item.idMeal}
        numColumns={2}
        renderItem={renderMealCard}
        contentContainerStyle={styles.mealsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE5D4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  categoryInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  mealsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
