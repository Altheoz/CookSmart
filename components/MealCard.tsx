import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useRecipeContext } from '../contexts/RecipeContext';
import { Meal, mealApiService } from '../services/mealApi';

interface MealCardProps {
  meal: Meal;
  onPress?: (meal: Meal) => void;
  showFavoriteButton?: boolean;
  showSavedButton?: boolean;
  showRemoveButton?: boolean;
  onRemove?: (mealId: string) => void;
  style?: any;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onPress,
  showFavoriteButton = true,
  showSavedButton = true,
  showRemoveButton = false,
  onRemove,
  style,
}) => {
  const { isFavorite, isSaved, addToFavorites, removeFromFavorites, addToSaved, removeFromSaved } = useRecipeContext();
  
  // Calculate cooking time and difficulty once to ensure consistency
  const cookingTime = React.useMemo(() => mealApiService.getEstimatedCookingTime(meal), [meal.idMeal, meal.strInstructions]);
  const difficulty = React.useMemo(() => mealApiService.getDifficultyLevel(meal), [meal.idMeal, meal.strInstructions]);

  const handleFavoritePress = async () => {
    if (isFavorite(meal.idMeal)) {
      await removeFromFavorites(meal.idMeal);
    } else {
      await addToFavorites(meal);
    }
  };

  const handleSavedPress = async () => {
    if (isSaved(meal.idMeal)) {
      await removeFromSaved(meal.idMeal);
    } else {
      await addToSaved(meal);
    }
  };

  const handleRemovePress = () => {
    if (onRemove) {
      onRemove(meal.idMeal);
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: 'white',
          borderRadius: 12,
          margin: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          overflow: 'hidden',
        },
        style,
      ]}
      onPress={() => onPress?.(meal)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: meal.strMealThumb }}
        style={{
          width: '100%',
          height: 150,
          resizeMode: 'cover',
        }}
      />
      
      <View style={{ padding: 12 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#000',
            marginBottom: 4,
          }}
          numberOfLines={2}
        >
          {meal.strMeal}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>
            {cookingTime} min
          </Text>
        </View>

        {/* Difficulty Level */}
        <View style={{ marginBottom: 8 }}>
          {(() => {
            const difficultyColors = {
              Easy: { bg: '#E8F5E8', text: '#2E7D32', border: '#4CAF50' },
              Medium: { bg: '#FFF3E0', text: '#F57C00', border: '#FF9800' },
              Hard: { bg: '#FFEBEE', text: '#C62828', border: '#F44336' }
            };
            const colors = difficultyColors[difficulty];
            
            return (
              <View style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: colors.text,
                  textTransform: 'uppercase',
                }}>
                  {difficulty}
                </Text>
              </View>
            );
          })()}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showFavoriteButton && (
              <TouchableOpacity
                onPress={handleFavoritePress}
                style={{ marginRight: 8 }}
              >
                <Ionicons
                  name={isFavorite(meal.idMeal) ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorite(meal.idMeal) ? "#ff6b6b" : "#666"}
                />
              </TouchableOpacity>
            )}
            
            {showSavedButton && (
              <TouchableOpacity
                onPress={handleSavedPress}
                style={{ marginRight: 8 }}
              >
                <Ionicons
                  name={isSaved(meal.idMeal) ? "bookmark" : "bookmark-outline"}
                  size={20}
                  color={isSaved(meal.idMeal) ? "#4ecdc4" : "#666"}
                />
              </TouchableOpacity>
            )}
          </View>

          {showRemoveButton && (
            <TouchableOpacity
              onPress={handleRemovePress}
              style={{
                backgroundColor: '#ff6b6b',
                borderRadius: 4,
                padding: 4,
              }}
            >
              <Ionicons name="trash-outline" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
