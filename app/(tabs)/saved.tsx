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
            <View style={styles.bgBlobTop} />
            <View style={styles.bgBlobMid} />
            <View style={styles.bgBlobBottom} />

            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={28} color="black" />
                </TouchableOpacity>
                <View style={styles.imageWrapper}>
                    <Image
                        source={require('@/assets/images/imgg.png')}
                        style={styles.profileImage}
                        resizeMode="cover"
                    />
                </View>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Saved Recipes</Text>
                <Text style={styles.headerSubtitle}>Quick access to your saved picks</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search saved recipes"
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
                    <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('DrawerDiscover')}>
                        <Text style={styles.ctaButtonText}>Discover Recipes</Text>
                    </TouchableOpacity>
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
        paddingTop: 16,
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
