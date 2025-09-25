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
  showSavedButton = false,
  showRemoveButton = false,
  onRemove,
  style,
}) => {
  const { isFavorite, addToFavorites, removeFromFavorites } = useRecipeContext();
  
  const cookingTime = React.useMemo(() => mealApiService.getEstimatedCookingTime(meal), [meal.idMeal, meal.strInstructions]);
  const difficulty = React.useMemo(() => mealApiService.getDifficultyLevel(meal), [meal.idMeal, meal.strInstructions]);

  const handleFavoritePress = async () => {
    if (isFavorite(meal.idMeal)) {
      await removeFromFavorites(meal.idMeal);
    } else {
      await addToFavorites(meal);
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
          borderRadius: 16,
          margin: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 5,
          overflow: 'hidden',
        },
        style,
      ]}
      onPress={() => onPress?.(meal)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: meal.strMealThumb }}
        style={{
          width: '100%',
          height: 180,
          resizeMode: 'cover',
        }}
      />
      
      <View style={{ padding: 12 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#111',
            marginBottom: 6,
          }}
          numberOfLines={2}
        >
          {meal.strMeal}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>{cookingTime} min</Text>
          </View>
          {(() => {
            const difficultyColors = {
              Easy: { bg: '#E8F5E8', text: '#2E7D32', border: '#4CAF50' },
              Medium: { bg: '#FFF3E0', text: '#F57C00', border: '#FF9800' },
              Hard: { bg: '#FFEBEE', text: '#C62828', border: '#F44336' },
            } as const;
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
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text, textTransform: 'uppercase' }}>{difficulty}</Text>
              </View>
            );
          })()}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showFavoriteButton && (
              <TouchableOpacity
                onPress={handleFavoritePress}
                style={{
                  borderRadius: 16,
                  padding: 6,
                  marginRight: 8,
                }}
              >
                <Ionicons
                  name={isFavorite(meal.idMeal) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite(meal.idMeal) ? '#ff6b6b' : '#666'}
                />
              </TouchableOpacity>
            )}
          </View>

          {showRemoveButton && (
            <TouchableOpacity
              onPress={handleRemovePress}
              style={{
                backgroundColor: '#ff6b6b',
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="trash-outline" size={16} color="white" />
              <Text style={{ color: 'white', marginLeft: 6, fontSize: 12, fontWeight: '600' }}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
