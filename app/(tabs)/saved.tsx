import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import CustomDrawerContent from '@/components/CustomDrawerContent';
import { MealCard } from '@/components/MealCard';
import { useRecipeContext } from '@/contexts/RecipeContext';
import { Meal } from '@/services/mealApi';
import DiscoverContent from './discover';
import FavoriteContent from './favorite';
import FeaturedContent from './featured';
import HomeContent from './home';
import ProfileContent from './profile';

const Drawer = createDrawerNavigator();

function SavedContent() {
    const navigation = useNavigation<any>();
    const { savedRecipes, removeFromSaved } = useRecipeContext();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSavedRecipes = savedRecipes.filter(meal =>
        meal.strMeal.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMealPress = (meal: Meal) => {
        navigation.navigate('MealDetail', { meal });
    };

    const handleRemoveSaved = async (mealId: string) => {
        await removeFromSaved(mealId);
    };

    const renderMealCard = ({ item }: { item: Meal }) => (
        <MealCard
            meal={item}
            onPress={handleMealPress}
            onRemove={handleRemoveSaved}
            showRemoveButton={true}
            showFavoriteButton={false}
            showSavedButton={false}
            style={{ width: '45%' }}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={28} color="black" />
                </TouchableOpacity>
                <Image
                    source={require('@/assets/images/imgg.png')}
                    className="w-12 h-12 rounded-full"
                />
                <View style={{ width: 28 }} />
            </View>

            <Text style={styles.title}>Recipe Saved</Text>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {filteredSavedRecipes.length > 0 ? (
                <FlatList
                    data={filteredSavedRecipes}
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
                </View>
            )}
        </SafeAreaView>
    );
}

export default function SavedScreen() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                router.replace('/');
            }
        });

        return () => unsubscribe();
    }, []);

    if (!currentUser) {
        return null;
    }

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Drawer.Screen name="DrawerSaved" component={SavedContent} />
            <Drawer.Screen name="DrawerHome" component={HomeContent} />
            <Drawer.Screen name="DrawerFeatured" component={FeaturedContent} />
            <Drawer.Screen name="DrawerDiscover" component={DiscoverContent} />
            <Drawer.Screen name="DrawerFavorite" component={FavoriteContent} />
            <Drawer.Screen name="DrawerProfile" component={ProfileContent} />
        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFE5D4',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#8B7355',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginBottom: 20,
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
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
