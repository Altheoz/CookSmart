import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { Category, mealApiService } from '@/services/mealApi';

export default function CategoriesScreen() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await mealApiService.getMealCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryMeals', { category });
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
    >
      <Image source={{ uri: item.strCategoryThumb }} style={styles.categoryImage} />
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.strCategory}</Text>
        <Text style={styles.categoryDescription} numberOfLines={2}>
          {item.strCategoryDescription}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.idCategory}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.categoriesList}
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
  categoriesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});
