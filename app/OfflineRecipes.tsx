import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { MealCard } from '@/components/MealCard';
import { useRecipeContext } from '@/contexts/RecipeContext';
import { Meal } from '@/services/mealApi';

const OFFLINE_RECIPES_KEY = 'cooksmart_offline_recipes';

export default function OfflineRecipesScreen() {
    const { savedRecipes, removeFromSaved } = useRecipeContext();
    const [offlineRecipes, setOfflineRecipes] = useState<Meal[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const [lastSyncTime, setLastSyncTime] = useState<string>('');

    
    const loadOfflineRecipes = async () => {
        try {
            const stored = await AsyncStorage.getItem(OFFLINE_RECIPES_KEY);
            if (stored) {
                setOfflineRecipes(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading offline recipes:', error);
        }
    };

    
    const saveOfflineRecipes = async (recipes: Meal[]) => {
        try {
            await AsyncStorage.setItem(OFFLINE_RECIPES_KEY, JSON.stringify(recipes));
            setOfflineRecipes(recipes);
            setLastSyncTime(new Date().toLocaleString());
        } catch (error) {
            console.error('Error saving offline recipes:', error);
        }
    };

   
    const syncWithSavedRecipes = async () => {
        try {
            await saveOfflineRecipes(savedRecipes);
        } catch (error) {
            console.error('Error syncing with saved recipes:', error);
        }
    };

  
    const checkNetworkStatus = async () => {
        try {
            const netInfo = await NetInfo.fetch();
            setIsOnline(netInfo.isConnected ?? false);
        } catch (error) {
            console.error('Error checking network status:', error);
           
            setIsOnline(false);
        }
    };

    useEffect(() => {
        loadOfflineRecipes();
        checkNetworkStatus();
        
     
        syncWithSavedRecipes();

        
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    
    useEffect(() => {
        syncWithSavedRecipes();
    }, [savedRecipes]);

    const filteredOfflineRecipes = offlineRecipes.filter(meal =>
        meal.strMeal.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMealPress = (meal: Meal) => {
        router.push({
            pathname: '/OfflineMealDetail',
            params: { meal: JSON.stringify(meal) }
        });
    };

    const handleRemoveOffline = async (mealId: string) => {
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
                    onPress: async () => {
                   
                        const newOfflineRecipes = offlineRecipes.filter(meal => meal.idMeal !== mealId);
                        await saveOfflineRecipes(newOfflineRecipes);
                        
                        
                        if (isOnline) {
                            await removeFromSaved(mealId);
                        }
                    },
                },
            ]
        );
    };

    const handleSyncNow = async () => {
        if (isOnline) {
            await syncWithSavedRecipes();
            Alert.alert('Sync Complete', 'Your offline recipes have been synced with saved recipes.');
        } else {
            Alert.alert('No Internet', 'Please check your internet connection to sync recipes.');
        }
    };

    const renderMealCard = ({ item }: { item: Meal }) => (
        <MealCard
            meal={item}
            onPress={handleMealPress}
            onRemove={handleRemoveOffline}
            showRemoveButton={false}
            showFavoriteButton={false}
            showSavedButton={false}
            style={{ width: '45%' }}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.bgBlobTop} />
            <View style={styles.bgBlobMid} />
            <View style={styles.bgBlobBottom} />

            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="black" />
                </TouchableOpacity>
                <View style={styles.imageWrapper}>
                    <Image
                        source={require('@/assets/images/imgg.png')}
                        style={styles.profileImage}
                        resizeMode="cover"
                    />
                </View>
                <TouchableOpacity disabled onPress={handleSyncNow}>
                    <Ionicons 
                        name={isOnline ? "wifi" : "cloud-offline"} 
                        size={28} 
                        color={isOnline ? "green" : "red"} 
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Saved Recipes</Text>
                
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search saved recipes"
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {filteredOfflineRecipes.length > 0 ? (
                <FlatList
                    data={filteredOfflineRecipes}
                    keyExtractor={(item) => item.idMeal}
                    numColumns={2}
                    renderItem={renderMealCard}
                    contentContainerStyle={styles.mealsList}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="bookmark-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No saved recipes yet</Text>
                    <Text style={styles.emptySubtext}>
                        Save recipes to see them here
                    </Text>
                    <TouchableOpacity 
                        style={styles.ctaButton} 
                        onPress={() => router.push('/(tabs)/discover')}
                    >
                        <Text style={styles.ctaButtonText}>Discover Recipes</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        top: 120,
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
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 35,
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
    headerContainer: {
        marginTop: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 30,
        textAlign: 'center',
        color: '#000',
        fontFamily: 'Sansita',
    },
    headerSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 6,
        color: '#555',
    },
    syncTime: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
        color: '#888',
        fontStyle: 'italic',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    mealsList: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    ctaButton: {
        marginTop: 16,
        backgroundColor: 'orange',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        elevation: 2,
    },
    ctaButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
});
