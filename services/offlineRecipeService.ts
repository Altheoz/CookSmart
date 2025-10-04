import { aiService, NutritionalInfo } from './aiService';
import { Meal } from './mealApi';

export interface EnhancedMeal extends Meal {
  substitutions?: {
    original: string;
    substitute: string;
    quantity?: string;
    note?: string;
  }[];
  coreIngredients?: string[];
  nutritionalInfo?: NutritionalInfo;
  offlineData: {
    lastUpdated: string;
    hasCompleteData: boolean;
  };
}

export class OfflineRecipeService {
 
  static async enhanceMealForOffline(meal: Meal): Promise<EnhancedMeal> {
    try {
      const enhancedMeal: EnhancedMeal = {
        ...meal,
        offlineData: {
          lastUpdated: new Date().toISOString(),
          hasCompleteData: false
        }
      };

      
      const ingredients = this.extractIngredients(meal);
      const ingredientNames = ingredients.map(ing => ing.ingredient);

     
      
      if (meal.nutritionalInfo && typeof meal.nutritionalInfo === 'object' && meal.nutritionalInfo.calories > 0) {
        console.log('Preserving existing nutritional info:', meal.nutritionalInfo);
        enhancedMeal.nutritionalInfo = meal.nutritionalInfo;
      } else {
        console.log('Fetching new nutritional info for meal:', meal.strMeal);
        console.log('[DEBUG] Current meal.nutritionalInfo:', meal.nutritionalInfo);
         try {
           const nutritionalInfo = await aiService.analyzeNutritionalContent({ meal });
           if (nutritionalInfo) {
             enhancedMeal.nutritionalInfo = nutritionalInfo;
           } else {
           
             enhancedMeal.nutritionalInfo = {
               calories: 300,
               protein: 15,
               carbs: 30,
               fat: 10,
               fiber: 5,
               sugar: 8,
               sodium: 600,
               servings: 4
             };
           }
         } catch (error) {
           console.warn('Failed to fetch nutritional info:', error);
          
           enhancedMeal.nutritionalInfo = {
             calories: 300,
             protein: 15,
             carbs: 30,
             fat: 10,
             fiber: 5,
             sugar: 8,
             sodium: 600,
             servings: 4
           };
         }
       }

    
       
       if (meal.substitutions && meal.substitutions.length > 0) {
         enhancedMeal.substitutions = meal.substitutions;
       } else {
         try {
           const substitutions = this.generateIngredientSubstitutions(ingredientNames);
           if (substitutions && substitutions.length > 0) {
             enhancedMeal.substitutions = substitutions;
           }
         } catch (error) {
           console.warn('Failed to generate substitutions:', error);
         }
       }

      
       
       if (meal.coreIngredients && meal.coreIngredients.length > 0) {
         enhancedMeal.coreIngredients = meal.coreIngredients;
       } else {
         try {
           const coreIngredients = this.identifyCoreIngredients(meal, ingredientNames);
           if (coreIngredients && coreIngredients.length > 0) {
             enhancedMeal.coreIngredients = coreIngredients;
           }
         } catch (error) {
           console.warn('Failed to identify core ingredients:', error);
         }
       }

     
      enhancedMeal.offlineData.hasCompleteData = !!enhancedMeal.nutritionalInfo;

      return enhancedMeal;
    } catch (error) {
      console.error('Error enhancing meal for offline:', error);
     
      return {
        ...meal,
        offlineData: {
          lastUpdated: new Date().toISOString(),
          hasCompleteData: false
        }
      };
    }
  }

  
  private static extractIngredients(meal: Meal): { ingredient: string; measure: string }[] {
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

   
   private static generateIngredientSubstitutions(ingredients: string[]): {
     original: string;
     substitute: string;
     quantity?: string;
     note?: string;
   }[] {
   
    const substitutionMap: Record<string, { substitute: string; note: string }> = {
      'butter': { substitute: 'margarine', note: '1:1 ratio, may affect flavor slightly' },
      'milk': { substitute: 'almond milk', note: '1:1 ratio, unsweetened preferred' },
      'cream': { substitute: 'coconut cream', note: '1:1 ratio, may add slight coconut flavor' },
      'eggs': { substitute: 'flax eggs', note: '1 tbsp ground flaxseed + 3 tbsp water per egg' },
      'flour': { substitute: 'almond flour', note: 'Use 1/4 less than regular flour' },
      'sugar': { substitute: 'honey', note: 'Use 3/4 cup honey for 1 cup sugar, reduce liquid' },
      'oil': { substitute: 'applesauce', note: '1:1 ratio, may make baked goods denser' },
      'sour cream': { substitute: 'greek yogurt', note: '1:1 ratio, same tangy flavor' },
      'cheese': { substitute: 'nutritional yeast', note: 'Adds cheesy flavor, use sparingly' },
      'breadcrumbs': { substitute: 'almond meal', note: '1:1 ratio, adds nutty flavor' },
      'pasta': { substitute: 'zucchini noodles', note: 'Spiralize zucchini for low-carb option' },
      'rice': { substitute: 'cauliflower rice', note: '1:1 ratio, cook until tender' },
      'potatoes': { substitute: 'sweet potatoes', note: 'Similar texture, sweeter flavor' },
      'onions': { substitute: 'shallots', note: 'More delicate flavor, use 1/2 amount' },
      'garlic': { substitute: 'garlic powder', note: '1/8 tsp powder = 1 clove fresh' },
      'lemon juice': { substitute: 'lime juice', note: '1:1 ratio, similar acidity' },
      'vinegar': { substitute: 'lemon juice', note: '1:1 ratio, adds similar acidity' },
      'salt': { substitute: 'sea salt', note: '1:1 ratio, may need slightly less' },
      'pepper': { substitute: 'cayenne pepper', note: 'Use 1/4 amount, much spicier' },
      'herbs': { substitute: 'dried herbs', note: 'Use 1/3 amount of fresh herbs' }
    };

    const substitutions: {
      original: string;
      substitute: string;
      quantity?: string;
      note?: string;
    }[] = [];

    ingredients.forEach(ingredient => {
      const lowerIngredient = ingredient.toLowerCase();
      
  
      if (substitutionMap[lowerIngredient]) {
        substitutions.push({
          original: ingredient,
          substitute: substitutionMap[lowerIngredient].substitute,
          note: substitutionMap[lowerIngredient].note
        });
        return;
      }

   
      for (const [key, value] of Object.entries(substitutionMap)) {
        if (lowerIngredient.includes(key) || key.includes(lowerIngredient)) {
          substitutions.push({
            original: ingredient,
            substitute: value.substitute,
            note: value.note
          });
          break;
        }
      }
    });

    return substitutions;
  }

   
   private static identifyCoreIngredients(meal: Meal, ingredients: string[]): string[] {
    
    const coreIngredients: string[] = [];
    
    const dishName = meal.strMeal.toLowerCase();
    const category = meal.strCategory.toLowerCase();
    const area = meal.strArea.toLowerCase();

    
    if (dishName.includes('chicken') || category.includes('chicken')) {
      coreIngredients.push('chicken');
    }
    if (dishName.includes('beef') || category.includes('beef')) {
      coreIngredients.push('beef');
    }
    if (dishName.includes('fish') || dishName.includes('salmon') || dishName.includes('tuna')) {
      coreIngredients.push(...ingredients.filter(ing => 
        ing.toLowerCase().includes('fish') || 
        ing.toLowerCase().includes('salmon') || 
        ing.toLowerCase().includes('tuna')
      ));
    }
    if (dishName.includes('pork') || category.includes('pork')) {
      coreIngredients.push('pork');
    }

   
    if (category.includes('vegetarian') || category.includes('vegan')) {
    
      const mainVeggies = ingredients.filter(ing => 
        ing.toLowerCase().includes('tofu') || 
        ing.toLowerCase().includes('beans') || 
        ing.toLowerCase().includes('lentils') ||
        ing.toLowerCase().includes('mushrooms')
      );
      coreIngredients.push(...mainVeggies.slice(0, 2));
    }

   
    if (dishName.includes('pasta') || dishName.includes('spaghetti') || dishName.includes('noodles')) {
      coreIngredients.push(...ingredients.filter(ing => 
        ing.toLowerCase().includes('pasta') || 
        ing.toLowerCase().includes('noodles')
      ));
    }

  
    if (dishName.includes('rice') || dishName.includes('risotto')) {
      coreIngredients.push('rice');
    }

  
    if (dishName.includes('bread') || dishName.includes('sandwich')) {
      coreIngredients.push('bread');
    }

    return coreIngredients.slice(0, 3); 
  }

  
  static hasCompleteOfflineData(meal: Meal): boolean {
    return !!(meal as EnhancedMeal).offlineData?.hasCompleteData;
  }

  
  static getIngredientSubstitution(meal: Meal, ingredient: string): {
    original: string;
    substitute: string;
    quantity?: string;
    note?: string;
  } | null {
    const enhancedMeal = meal as EnhancedMeal;
    if (!enhancedMeal.substitutions) return null;
    
    return enhancedMeal.substitutions.find(sub => 
      sub.original.toLowerCase() === ingredient.toLowerCase()
    ) || null;
  }

  
  static isCoreIngredient(meal: Meal, ingredient: string): boolean {
    const enhancedMeal = meal as EnhancedMeal;
    if (!enhancedMeal.coreIngredients) return false;
    
    return enhancedMeal.coreIngredients.some(core => 
      core.toLowerCase() === ingredient.toLowerCase()
    );
  }
}
