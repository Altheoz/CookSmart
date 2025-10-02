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
  TouchableOpacity,
  View
} from 'react-native';

import { useRecipeContext } from '@/contexts/RecipeContext';
import { aiService, NutritionalInfo } from '@/services/aiService';
import { mealApiService } from '@/services/mealApi';

export default function MealDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { meal } = route.params;
  const { addToSaved, isSaved, removeFromSaved, addEditedRecipe, removeEditedRecipe, isEdited } = useRecipeContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedMeal, setModifiedMeal] = useState<any>(null);
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [coreIngredients, setCoreIngredients] = useState<string[]>([]);
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  
  const currentMeal = modifiedMeal || meal;

  const ingredients = React.useMemo(() => mealApiService.extractIngredients(currentMeal), [currentMeal.idMeal]);
  const cookingTime = React.useMemo(() => mealApiService.getEstimatedCookingTime(currentMeal), [currentMeal.idMeal, currentMeal.strInstructions]);
  const difficulty = React.useMemo(() => mealApiService.getDifficultyLevel(currentMeal), [currentMeal.idMeal, currentMeal.strInstructions]);


  const fetchNutritionalInfo = React.useCallback(async (mealToAnalyze: any) => {
    setIsLoadingNutrition(true);
    setNutritionError(null);
    
    try {
      const nutritionData = await aiService.analyzeNutritionalInfo({ meal: mealToAnalyze });
      if (nutritionData) {
        setNutritionalInfo(nutritionData);
      } else {
        setNutritionError('Unable to analyze nutritional information');
      }
    } catch (error) {
      console.error('Error fetching nutritional info:', error);
      setNutritionError('Failed to load nutritional information');
    } finally {
      setIsLoadingNutrition(false);
    }
  }, []);

  
  React.useEffect(() => {
    fetchNutritionalInfo(currentMeal);
  }, [currentMeal.idMeal, fetchNutritionalInfo]);

  const handleToggleSaved = async () => {
    if (isSaved(meal.idMeal)) {
      await removeFromSaved(meal.idMeal);
      Alert.alert('Removed', 'Recipe removed from your saved list.');
    } else {
      await addToSaved(meal);
      Alert.alert('Saved', 'Recipe saved to your collection.');
    }
  };

  const handleModifyRecipe = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter what you want to change about the recipe.');
      return;
    }

    setIsModifying(true);
    try {
      const modifiedRecipe = await aiService.modifyRecipe({
        originalRecipe: meal,
        modificationRequest: searchQuery.trim()
      });

      if (modifiedRecipe) {
        setModifiedMeal(modifiedRecipe);
      } else {
        Alert.alert('Error', 'Failed to modify the recipe. Please try again.');
      }
    } catch (error) {
      console.error('Error modifying recipe:', error);
      Alert.alert('Error', 'Failed to modify the recipe. Please try again.');
    } finally {
      setIsModifying(false);
    }
  };

  

  const handleResetRecipe = () => {
    setModifiedMeal(null);
    setSearchQuery('');
    setMissingIngredients([]);
  };

  const handleIngredientSubstitution = async () => {
    if (missingIngredients.length === 0) {
      Alert.alert('Error', 'Please select ingredients you don\'t have.');
      return;
    }

    setIsModifying(true);
    try {
      const substitutedRecipe = await aiService.suggestIngredientSubstitutions({
        originalRecipe: meal,
        missingIngredients: missingIngredients
      });

      if (substitutedRecipe) {
        setModifiedMeal(substitutedRecipe);
        setCoreIngredients((substitutedRecipe as any).coreIngredients || []);
        setShowSubstitutionModal(false);
      } else {
        Alert.alert('Error', 'Failed to find suitable substitutions. Please try again.');
      }
    } catch (error) {
      console.error('Error finding substitutions:', error);
      Alert.alert('Error', 'Failed to find ingredient substitutions. Please try again.');
    } finally {
      setIsModifying(false);
    }
  };

  const toggleMissingIngredient = (ingredient: string) => {
    setMissingIngredients(prev => 
      prev.includes(ingredient) 
        ? prev.filter(item => item !== ingredient)
        : [...prev, ingredient]
    );
  };

  const getIngredientSubstitution = (ingredient: string) => {
    if (!modifiedMeal?.substitutions) return null;
    return modifiedMeal.substitutions.find((sub: any) => 
      sub.original.toLowerCase() === ingredient.toLowerCase()
    );
  };

  const isCoreIngredient = (ingredient: string) => {
    return coreIngredients.some(core => 
      core.toLowerCase().includes(ingredient.toLowerCase()) ||
      ingredient.toLowerCase().includes(core.toLowerCase())
    );
  };
  
  const rawInstructions = typeof currentMeal?.strInstructions === 'string' ? currentMeal.strInstructions : '';
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
            <Text style={styles.heroTitle}>{currentMeal.strMeal}</Text>
            {modifiedMeal && (
              <View style={styles.modifiedBadge}>
                <Ionicons name="create-outline" size={12} color="#fff" />
                <Text style={styles.modifiedBadgeText}>Modified</Text>
              </View>
            )}
            <View style={styles.metaChipsRow}>
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={14} color="#111" />
                <Text style={styles.chipText}>{cookingTime} min</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="people-outline" size={14} color="#111" />
                <Text style={styles.chipText}>
                  {nutritionalInfo?.servings || 4} servings
                </Text>
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

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.startCookingButton}
            onPress={() => navigation.navigate('CookingInterface', { meal: currentMeal })}
          >
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.startCookingText}>Start cooking now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ingredientsSection}>
          <View style={styles.ingredientsColumn}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              
            </View>
            <TouchableOpacity 
              style={styles.substitutionButtonBottom}
              onPress={() => setShowSubstitutionModal(true)}
            >
              <Ionicons name="swap-horizontal-outline" size={16} color="#FF6B35" />
              <Text style={styles.substitutionButtonBottomText}>Find Substitutions</Text>
            </TouchableOpacity>
            
            {ingredients.map((item, index) => {
              const substitution = getIngredientSubstitution(item.ingredient);
              const isCore = isCoreIngredient(item.ingredient);
              
              return (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.checkbox} />
                  <View style={styles.ingredientContent}>
                    {substitution ? (
                      <View style={styles.substitutedIngredient}>
                        <Text style={styles.originalIngredientText}>
                          {item.measure ? `${item.measure} ${item.ingredient}` : item.ingredient}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color="#4CAF50" />
                        <Text style={styles.substituteIngredientText}>
                          {substitution.quantity ? `${substitution.quantity} ${substitution.substitute}` : substitution.substitute}
                        </Text>
                        {substitution.note && (
                          <Text style={styles.substitutionNoteText}>{substitution.note}</Text>
                        )}
                      </View>
                    ) : (
                      <Text style={[
                        styles.ingredientText,
                        isCore && styles.coreIngredientText
                      ]}>
                        {item.measure ? `${item.measure} ${item.ingredient}` : item.ingredient}
                        {isCore && (
                          <Text style={styles.coreIngredientBadge}> (Core)</Text>
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
            
            
          </View>

          <View style={styles.nutritionColumn}>
            <View style={styles.nutritionHeader}>
              <Text style={styles.sectionTitle}>Nutritional Info</Text>
            </View>
            
            {nutritionError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{nutritionError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => fetchNutritionalInfo(currentMeal)}
                >
                  <Ionicons name="refresh-outline" size={16} color="#FF6B35" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : nutritionalInfo ? (
              <>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                  <Text style={styles.nutritionValue}>{nutritionalInfo.calories} Kcal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                  <Text style={styles.nutritionValue}>{nutritionalInfo.protein}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                  <Text style={styles.nutritionValue}>{nutritionalInfo.carbs}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                  <Text style={styles.nutritionValue}>{nutritionalInfo.fat}g</Text>
                </View>
                {nutritionalInfo.fiber && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Fiber</Text>
                    <Text style={styles.nutritionValue}>{nutritionalInfo.fiber}g</Text>
                  </View>
                )}
                {nutritionalInfo.sodium && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Sodium</Text>
                    <Text style={styles.nutritionValue}>{nutritionalInfo.sodium}mg</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.nutritionPlaceholder}>
                <Text style={styles.placeholderText}>Loading nutritional information...</Text>
              </View>
            )}

            {isLoadingNutrition && (
              <View style={styles.loadingIndicatorBottom}>
                <Text style={styles.loadingText}>Analyzing...</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.instructionsSection}>
         

          {modifiedMeal && (
            <View style={styles.modifiedControls}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleResetRecipe}
              >
                <Ionicons name="refresh-outline" size={16} color="#fff" />
                <Text style={styles.resetButtonText}>Reset to Original</Text>
              </TouchableOpacity>
            </View>
          )}

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

          {modifiedMeal?.substitutions && modifiedMeal.substitutions.length > 0 && (
            <View style={styles.substitutionsSection}>
              <Text style={styles.sectionTitle}>Ingredient Substitutions</Text>
              {modifiedMeal.substitutions.map((sub: any, index: number) => (
                <View key={index} style={styles.substitutionItem}>
                  <View style={styles.substitutionHeader}>
                    <Text style={styles.originalIngredient}>{sub.original}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#666" />
                    <Text style={styles.substituteIngredient}>{sub.substitute}</Text>
                  </View>
                  {sub.quantity && (
                    <Text style={styles.substitutionQuantity}>Quantity: {sub.quantity}</Text>
                  )}
                  {sub.note && (
                    <Text style={styles.substitutionNote}>{sub.note}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {showSubstitutionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Missing Ingredients</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSubstitutionModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Which ingredients do you not have?</Text>
            
            <ScrollView style={styles.ingredientsList}>
              {ingredients.map((item, index) => {
                const isCore = isCoreIngredient(item.ingredient);
                const isSelected = missingIngredients.includes(item.ingredient);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.ingredientOption,
                      isSelected && styles.ingredientOptionSelected,
                      isCore && styles.ingredientOptionDisabled
                    ]}
                    onPress={() => !isCore && toggleMissingIngredient(item.ingredient)}
                    disabled={isCore}
                  >
                    <View style={[
                      styles.ingredientCheckbox,
                      isSelected && styles.ingredientCheckboxSelected,
                      isCore && styles.ingredientCheckboxDisabled
                    ]}>
                      {isSelected && !isCore && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                      {isCore && (
                        <Ionicons name="lock-closed" size={12} color="#999" />
                      )}
                    </View>
                    <View style={styles.ingredientOptionContent}>
                      <Text style={[
                        styles.ingredientOptionText,
                        isCore && styles.ingredientOptionTextDisabled
                      ]}>
                        {item.measure ? `${item.measure} ${item.ingredient}` : item.ingredient}
                      </Text>
                      {isCore && (
                        <Text style={styles.coreIngredientLabel}>Core ingredient - cannot substitute</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSubstitutionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.findSubstitutionsButton, missingIngredients.length === 0 && styles.findSubstitutionsButtonDisabled]}
                onPress={handleIngredientSubstitution}
                disabled={missingIngredients.length === 0 || isModifying}
              >
                <Text style={styles.findSubstitutionsButtonText}>
                  {isModifying ? 'Finding...' : `Find Substitutions (${missingIngredients.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  actionButtonsContainer: {
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
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  startCookingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
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
  modifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  modifiedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  applyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modifiedControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFE5D9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modifiedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modifiedInfoText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  resetButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  substitutionsSection: {
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
  substitutionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  substitutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  originalIngredient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
    flex: 1,
  },
  substituteIngredient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    flex: 1,
    textAlign: 'right',
  },
  substitutionQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  substitutionNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  ingredientsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  ingredientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  ingredientOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#FF6B35',
  },
  ingredientCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientCheckboxSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  ingredientOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  findSubstitutionsButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  findSubstitutionsButtonDisabled: {
    backgroundColor: '#ccc',
  },
  findSubstitutionsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientContent: {
    flex: 1,
  },
  substitutedIngredient: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  originalIngredientText: {
    fontSize: 14,
    color: '#f44336',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  substituteIngredientText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  substitutionNoteText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
    width: '100%',
  },
  coreIngredientText: {
    fontWeight: '600',
  },
  coreIngredientBadge: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  ingredientOptionDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    opacity: 0.6,
  },
  ingredientCheckboxDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  ingredientOptionTextDisabled: {
    color: '#999',
  },
  ingredientOptionContent: {
    flex: 1,
  },
  coreIngredientLabel: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
  substitutionButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    marginBottom: 15,
    gap: 8,
  },
  substitutionButtonBottomText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: '600',
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 10,
    color: '#FF6B35',
    fontStyle: 'italic',
  },
  loadingIndicatorBottom: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
    gap: 4,
  },
  retryButtonText: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '600',
  },
  nutritionPlaceholder: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
