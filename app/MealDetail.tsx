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
  const { addToSaved, isSaved, removeFromSaved } = useRecipeContext();
  const [searchQuery, setSearchQuery] = useState('');

  const ingredients = React.useMemo(() => mealApiService.extractIngredients(meal), [meal.idMeal]);
  const cookingTime = React.useMemo(() => mealApiService.getEstimatedCookingTime(meal), [meal.idMeal, meal.strInstructions]);
  const difficulty = React.useMemo(() => mealApiService.getDifficultyLevel(meal), [meal.idMeal, meal.strInstructions]);

  const handleToggleSaved = async () => {
    if (isSaved(meal.idMeal)) {
      await removeFromSaved(meal.idMeal);
      Alert.alert('Removed', 'Recipe removed from your saved list.');
    } else {
      await addToSaved(meal);
      Alert.alert('Saved', 'Recipe saved to your collection.');
    }
  };

  const rawInstructions = typeof meal?.strInstructions === 'string' ? meal.strInstructions : '';
  const instructions: string[] = rawInstructions
    .replace(/\r\n/g, '\n')
    .split(/\n+|(?<=\.)\s+(?=[A-Z])/)
    .map((instruction: string) => instruction.trim())
    .filter((text: string) => Boolean(text));

  const filteredInstructions = React.useMemo(() => {
    if (!searchQuery.trim()) return instructions;
    const q = searchQuery.trim().toLowerCase();
    return instructions.filter((step: string) => step.toLowerCase().includes(q));
  }, [instructions, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: meal.strMealThumb }} style={styles.recipeImage} />
          <View style={styles.imageOverlay} />

          <View style={styles.topControls}>
            <TouchableOpacity style={styles.overlayButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.overlayButton, isSaved(meal.idMeal) && styles.overlayButtonActive]}
              onPress={handleToggleSaved}
            >
              <Ionicons name={isSaved(meal.idMeal) ? 'bookmark' : 'bookmark-outline'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>{meal.strMeal}</Text>
            <View style={styles.metaChipsRow}>
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={14} color="#111" />
                <Text style={styles.chipText}>{cookingTime} min</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="people-outline" size={14} color="#111" />
                <Text style={styles.chipText}>4 servings</Text>
              </View>
              {(() => {
                const difficultyColors = {
                  Easy: { bg: '#E8F5E8', text: '#2E7D32', border: '#4CAF50' },
                  Medium: { bg: '#FFF3E0', text: '#F57C00', border: '#FF9800' },
                  Hard: { bg: '#FFEBEE', text: '#C62828', border: '#F44336' },
                } as const;
                const colors = difficultyColors[difficulty];
                return (
                  <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }] }>
                    <Ionicons name="trending-up-outline" size={14} color={colors.text} />
                    <Text style={[styles.chipText, { color: colors.text }]}>{difficulty}</Text>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>

        <View style={styles.actionButtonsCentered}>
          <TouchableOpacity 
            style={styles.startCookingButton}
            onPress={() => navigation.navigate('CookingInterface', { meal })}
          >
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.startCookingText}>Start cooking now</Text>
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
            <TouchableOpacity style={styles.applyButton} onPress={() => {}}>
              <Text style={styles.applyButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Instructions</Text>
          {filteredInstructions.length === 0 ? (
            <Text style={styles.instructionText}>No instructions available.</Text>
          ) : (
            filteredInstructions.map((instruction: string, index: number) => (
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
    paddingTop: 30,
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  heroContainer: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  topControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlayButton: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  overlayButtonActive: {
    backgroundColor: 'rgba(255,107,53,0.65)',
  },
  heroTextContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    marginBottom: 10,
  },
  metaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    color: '#111',
    fontWeight: '700',
    textTransform: 'uppercase',
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
  actionButtonsCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  iconPill: {
    backgroundColor: 'white',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconPillActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  startCookingButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: "25%",
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startCookingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ingredientsSection: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ingredientsColumn: {
    flex: 1,
    paddingRight: 8,
  },
  nutritionColumn: {
    flex: 1,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',

  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
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
    borderWidth: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    marginRight: 8,
  },
  ingredientText: {
    color: '#333',
    fontSize: 14,
    flex: 1,
  },
  nutritionItem: {
    marginBottom: 8,
  },
  nutritionLabel: {
    color: '#555',
    fontSize: 12,
    fontWeight: '500',
  },
  nutritionValue: {
    color: '#111',
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
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#FF6B35',
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
