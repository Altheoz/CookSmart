export interface Meal {
  idMeal: string;
  strMeal: string;
  strDrinkAlternate?: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags?: string;
  strYoutube?: string;
  strIngredient1?: string;
  strIngredient2?: string;
  strIngredient3?: string;
  strIngredient4?: string;
  strIngredient5?: string;
  strIngredient6?: string;
  strIngredient7?: string;
  strIngredient8?: string;
  strIngredient9?: string;
  strIngredient10?: string;
  strIngredient11?: string;
  strIngredient12?: string;
  strIngredient13?: string;
  strIngredient14?: string;
  strIngredient15?: string;
  strIngredient16?: string;
  strIngredient17?: string;
  strIngredient18?: string;
  strIngredient19?: string;
  strIngredient20?: string;
  strMeasure1?: string;
  strMeasure2?: string;
  strMeasure3?: string;
  strMeasure4?: string;
  strMeasure5?: string;
  strMeasure6?: string;
  strMeasure7?: string;
  strMeasure8?: string;
  strMeasure9?: string;
  strMeasure10?: string;
  strMeasure11?: string;
  strMeasure12?: string;
  strMeasure13?: string;
  strMeasure14?: string;
  strMeasure15?: string;
  strMeasure16?: string;
  strMeasure17?: string;
  strMeasure18?: string;
  strMeasure19?: string;
  strMeasure20?: string;
  strSource?: string;
  strImageSource?: string;
  strCreativeCommonsConfirmed?: string;
  dateModified?: string;
}

export interface MealResponse {
  meals: Meal[] | null;
}

export interface Category {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

export interface CategoryResponse {
  categories: Category[];
}

class MealApiService {
  private baseUrl = 'https://www.themealdb.com/api/json/v1/1';

  async searchMealsByName(query: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search.php?s=${encodeURIComponent(query)}`);
      const data: MealResponse = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error searching meals by name:', error);
      return [];
    }
  }

  async searchMealsByFirstLetter(letter: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search.php?f=${letter}`);
      const data: MealResponse = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error searching meals by first letter:', error);
      return [];
    }
  }

  async getMealById(id: string): Promise<Meal | null> {
    try {
      const response = await fetch(`${this.baseUrl}/lookup.php?i=${id}`);
      const data: MealResponse = await response.json();
      return data.meals?.[0] || null;
    } catch (error) {
      console.error('Error getting meal by ID:', error);
      return null;
    }
  }

  async getRandomMeal(): Promise<Meal | null> {
    try {
      const response = await fetch(`${this.baseUrl}/random.php`);
      const data: MealResponse = await response.json();
      return data.meals?.[0] || null;
    } catch (error) {
      console.error('Error getting random meal:', error);
      return null;
    }
  }

  async getMealCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories.php`);
      const data: CategoryResponse = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error getting meal categories:', error);
      return [];
    }
  }

  async getMealsByCategory(category: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/filter.php?c=${encodeURIComponent(category)}`);
      const data: MealResponse = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error getting meals by category:', error);
      return [];
    }
  }

  async getMealsByArea(area: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/filter.php?a=${encodeURIComponent(area)}`);
      const data: MealResponse = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error getting meals by area:', error);
      return [];
    }
  }

  extractIngredients(meal: Meal): { ingredient: string; measure: string }[] {
    const ingredients: { ingredient: string; measure: string }[] = [];
    
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}` as keyof Meal] as string;
      const measure = meal[`strMeasure${i}` as keyof Meal] as string;
      
      if (ingredient && ingredient.trim()) {
        ingredients.push({
          ingredient: ingredient.trim(),
          measure: measure ? measure.trim() : ''
        });
      }
    }
    
    return ingredients;
  }

  getEstimatedCookingTime(meal: Meal): number {
    const ingredientCount = this.extractIngredients(meal).length;
    const instructionLength = meal.strInstructions?.length || 0;
    
    let baseTime = 15; 
    baseTime += Math.min(ingredientCount * 2, 30);
    baseTime += Math.min(Math.floor(instructionLength / 100), 20); 
    
    return Math.min(baseTime, 120); 
  }
}

export const mealApiService = new MealApiService();
