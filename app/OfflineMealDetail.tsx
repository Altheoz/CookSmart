import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
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

import { mealApiService } from '@/services/mealApi';
import { OfflineRecipeService } from '@/services/offlineRecipeService';

export default function OfflineMealDetailScreen() {
    const route = useRoute<any>();
    const { meal: mealParam } = route.params;

   
    const meal = React.useMemo(() => {
        if (typeof mealParam === 'string') {
            try {
                return JSON.parse(mealParam);
            } catch (error) {
                console.error('Error parsing meal data:', error);
                return mealParam;
            }
        }
        return mealParam;
    }, [mealParam]);

    const ingredients = React.useMemo(() => mealApiService.extractIngredients(meal), [meal.idMeal]);
    const cookingTime = React.useMemo(() => mealApiService.getEstimatedCookingTime(meal), [meal.idMeal, meal.strInstructions]);
    const difficulty = React.useMemo(() => mealApiService.getDifficultyLevel(meal), [meal.idMeal, meal.strInstructions]);

    const rawInstructions = typeof meal?.strInstructions === 'string' ? meal.strInstructions : '';
    const instructions: string[] = rawInstructions
        .replace(/\r\n/g, '\n')
        .split(/\n+|(?<=\.)\s+(?=[A-Z])/)
        .map((instruction: string) => instruction.trim())
        .filter((text: string) => Boolean(text));

    const getIngredientSubstitution = (ingredient: string) => {
        return OfflineRecipeService.getIngredientSubstitution(meal, ingredient);
    };

    const isCoreIngredient = (ingredient: string) => {
        return OfflineRecipeService.isCoreIngredient(meal, ingredient);
    };

    const handleRemoveFromOffline = async () => {
        Alert.alert(
            'Remove Recipe',
            'Are you sure you want to remove this recipe from offline storage?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        
                        router.back();
                    },
                },
            ]
        );
    };

    
    if (!meal || !meal.idMeal) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading recipe...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.heroContainer}>
                    <StatusBar style="dark" />
                    <Image 
                        source={{ uri: meal.strMealThumb }} 
                        style={styles.recipeImage}
                        onError={(error) => console.log('Image load error:', error)}
                        onLoad={() => console.log('Image loaded successfully')}
                    />
                    <View style={styles.imageOverlay} />

                    <View style={styles.topControls}>
                        <TouchableOpacity style={styles.overlayButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                    
                    </View>

                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>{meal.strMeal}</Text>
                        <View style={styles.badgeContainer}>
                            <View style={styles.offlineBadge}>
                                <Ionicons name="cloud-done-outline" size={12} color="#fff" />
                                <Text style={styles.offlineBadgeText}>Offline Recipe</Text>
                            </View>
                        </View>
                        <View style={styles.metaChipsRow}>
                            <View style={styles.chip}>
                                <Ionicons name="time-outline" size={14} color="#111" />
                                <Text style={styles.chipText}>{cookingTime} min</Text>
                            </View>
                            <View style={styles.chip}>
                                <Ionicons name="people-outline" size={14} color="#111" />
                                <Text style={styles.chipText}>
                                    {meal.nutritionalInfo?.servings || 4} servings
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
                                    <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }]}>
                                        <Text style={[styles.chipText, { color: colors.text }]}>{difficulty}</Text>
                                    </View>
                                );
                            })()}
                        </View>
                    </View>
                </View>

                <View style={styles.contentContainer}>

                    <View style={styles.ingredientsSection}>
                        <View style={styles.ingredientsColumn}>
                            <Text style={styles.sectionTitle}>Ingredients</Text>
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

                        {meal.nutritionalInfo && (
                            <View style={styles.nutritionColumn}>
                                <Text style={styles.sectionTitle}>Nutrition</Text>
                                <View style={styles.nutritionItem}>
                                    <Text style={styles.nutritionLabel}>Calories</Text>
                                    <Text style={styles.nutritionValue}>{meal.nutritionalInfo.calories} Kcal</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                    <Text style={styles.nutritionLabel}>Protein</Text>
                                    <Text style={styles.nutritionValue}>{meal.nutritionalInfo.protein}g</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                    <Text style={styles.nutritionLabel}>Carbs</Text>
                                    <Text style={styles.nutritionValue}>{meal.nutritionalInfo.carbs}g</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                    <Text style={styles.nutritionLabel}>Fat</Text>
                                    <Text style={styles.nutritionValue}>{meal.nutritionalInfo.fat}g</Text>
                                </View>
                                {meal.nutritionalInfo.fiber && (
                                    <View style={styles.nutritionItem}>
                                        <Text style={styles.nutritionLabel}>Fiber</Text>
                                        <Text style={styles.nutritionValue}>{meal.nutritionalInfo.fiber}g</Text>
                                    </View>
                                )}
                                {meal.nutritionalInfo.sugar && (
                                    <View style={styles.nutritionItem}>
                                        <Text style={styles.nutritionLabel}>Sugar</Text>
                                        <Text style={styles.nutritionValue}>{meal.nutritionalInfo.sugar}g</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.instructionsSection}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        {instructions.length === 0 ? (
                            <Text style={styles.instructionText}>No instructions available.</Text>
                        ) : (
                            instructions.map((instruction: string, index: number) => (
                                <View key={index} style={styles.instructionItem}>
                                    <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.instructionText}>{instruction.endsWith('.') ? instruction : `${instruction}.`}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    {meal.substitutions && meal.substitutions.length > 0 && (
                        <View style={styles.substitutionsSection}>
                            <Text style={styles.sectionTitle}>Available Substitutions</Text>
                            {meal.substitutions.map((sub: any, index: number) => (
                                <View key={index} style={styles.substitutionItem}>
                                    <View style={styles.substitutionHeader}>
                                        <Text style={styles.substitutionOriginal}>{sub.original}</Text>
                                        <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
                                        <Text style={styles.substitutionSubstitute}>{sub.substitute}</Text>
                                    </View>
                                    {sub.note && (
                                        <Text style={styles.substitutionNote}>{sub.note}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
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
    badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 6,
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
        alignSelf: 'flex-start',
    },
    offlineBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
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
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
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
    ingredientContent: {
        flex: 1,
    },
    ingredientText: {
        color: '#333',
        fontSize: 14,
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
        color: '#666',
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
    substitutionsSection: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    substitutionItem: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    substitutionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    substitutionOriginal: {
        fontSize: 14,
        color: '#666',
        textDecorationLine: 'line-through',
        marginRight: 8,
    },
    substitutionSubstitute: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
        marginLeft: 8,
    },
    substitutionNote: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
});