import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { useRecipeContext } from '@/contexts/RecipeContext';
import { mealApiService } from '@/services/mealApi';

export default function MealDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { meal } = route.params;
  const { addToFavorites, addToSaved, isFavorite, isSaved } = useRecipeContext();
  const [searchQuery, setSearchQuery] = useState('');

  const ingredients = React.useMemo(() => mealApiService.extractIngredients(meal), [meal.idMeal]);
  const cookingTime = React.useMemo(() => mealApiService.getEstimatedCookingTime(meal), [meal.idMeal, meal.strInstructions]);
  const difficulty = React.useMemo(() => mealApiService.getDifficultyLevel(meal), [meal.idMeal, meal.strInstructions]);

  const handleAddToFavorites = async () => {
    if (isFavorite(meal.idMeal)) {
      Alert.alert('Already in Favorites', 'This recipe is already in your favorites.');
    } else {
      await addToFavorites(meal);
      Alert.alert('Added to Favorites', 'Recipe has been added to your favorites.');
    }
  };

  const handleAddToSaved = async () => {
    if (isSaved(meal.idMeal)) {
      Alert.alert('Already Saved', 'This recipe is already saved.');
    } else {
      await addToSaved(meal);
      Alert.alert('Recipe Saved', 'Recipe has been saved to your collection.');
    }
  };

  const rawInstructions = typeof meal?.strInstructions === 'string' ? meal.strInstructions : '';
  const instructions = rawInstructions
    .replace(/\r\n/g, '\n')
    .split(/\n+|(?<=\.)\s+(?=[A-Z])/)
    .map(instruction => instruction.trim())
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Image
          source={require('@/assets/images/imgg.png')}
          style={styles.logo}
        />
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: meal.strMealThumb }} style={styles.recipeImage} />

        <View style={styles.titleContainer}>
          <Text style={styles.recipeTitle}>{meal.strMeal}</Text>
          <View style={styles.recipeInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{cookingTime} min</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.infoText}>4 servings</Text>
            </View>
            <View style={styles.infoItem}>
              {(() => {
                const difficultyColors = {
                  Easy: '#4CAF50',
                  Medium: '#FF9800',
                  Hard: '#F44336'
                };
                const color = difficultyColors[difficulty];
                
                return (
                  <>
                    <Ionicons name="trending-up-outline" size={16} color={color} />
                    <Text style={[styles.infoText, { color }]}>{difficulty}</Text>
                  </>
                );
              })()}
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.addToListButton} onPress={handleAddToSaved}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addToListText}>Add to list</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.startCookingButton}
            onPress={() => navigation.navigate('CookingInterface', { meal })}
          >
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.startCookingText}>Start cooking now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.favoriteButton} onPress={handleAddToFavorites}>
            <Ionicons 
              name={isFavorite(meal.idMeal) ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite(meal.idMeal) ? "#ff6b6b" : "#666"} 
            />
            <Text style={styles.favoriteCount}>100</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ingredientsSection}>
          <View style={styles.ingredientsColumn}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {ingredients.map((item, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.checkbox} />
                <Text style={styles.ingredientText}>
                  {item.measure ? `${item.measure} ${item.ingredient}` : item.ingredient}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.nutritionColumn}>
            <Text style={styles.sectionTitle}>Nutritional Info</Text>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              <Text style={styles.nutritionValue}>350 Kcal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              <Text style={styles.nutritionValue}>25g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Carbs</Text>
              <Text style={styles.nutritionValue}>45g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fat</Text>
              <Text style={styles.nutritionValue}>12g</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionsSection}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="What to search for?"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Instructions</Text>
          {instructions.length === 0 ? (
            <Text style={styles.instructionText}>No instructions available.</Text>
          ) : (
            instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction.endsWith('.') ? instruction : `${instruction}.`}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  recipeImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addToListButton: {
    backgroundColor: '#4ecdc4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addToListText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  startCookingButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startCookingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  favoriteButton: {
    alignItems: 'center',
  },
  favoriteCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ingredientsSection: {
    flexDirection: 'row',
    backgroundColor: '#4ecdc4',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  ingredientsColumn: {
    flex: 1,
    paddingRight: 8,
  },
  nutritionColumn: {
    flex: 1,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ff6b6b',
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 2,
    marginRight: 8,
  },
  ingredientText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  nutritionItem: {
    marginBottom: 8,
  },
  nutritionLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  nutritionValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#4ecdc4',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
