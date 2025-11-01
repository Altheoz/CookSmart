import Constants from 'expo-constants';
import { Meal } from './mealApi';

export interface GenerateAsianRecipesParams {
  query?: string;
  categories?: string[];
  cuisine?: string;
  maxResults?: number;
}

export interface ModifyRecipeParams {
  originalRecipe: Meal;
  modificationRequest: string;
}

export interface IngredientSubstitutionParams {
  originalRecipe: Meal;
  missingIngredients: string[];
}

export interface NutritionalAnalysisParams {
  meal: Meal;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servings: number;
}

export const aiService = {
  async generateAsianRecipes(params: GenerateAsianRecipesParams): Promise<Meal[]> {
    const {
      query = '',
      categories = [],
      cuisine = '',
      maxResults = 12
    } = params;

    const apiKey =
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      (Constants?.expoConfig?.extra as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
      (globalThis as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
      (Constants?.manifest as any)?.extra?.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('Missing EXPO_PUBLIC_GEMINI_API_KEY');
      return [];
    }

    const variationElements = [
      'traditional family recipe', 'modern restaurant style', 'regional variation', 'quick weeknight version',
      'authentic street food style', 'healthy low-sodium version', 'spicy hot variation', 'sweet and tangy style',
      'slow-cooked traditional', 'instant pot version', 'grilled variation', 'vegetarian adaptation'
    ];
    
    const randomVariation = variationElements[Math.floor(Math.random() * variationElements.length)];
    const timestamp = Date.now();
    
    const userPrompt =
      `Generate ${maxResults} Asian recipes as structured JSON. Constraints:\n` +
      `- Only Asian cuisines (Chinese, Japanese, Korean, Thai, Vietnamese, Filipino, Indian, Malaysian)\n` +
      `${query ? `- User intent: ${query} (generate DIFFERENT variations of this dish each time)\n` : ''}` +
      `${cuisine ? `- Cuisine type: ${cuisine}\n` : ''}` +
      `${categories.length ? `- Prefer categories: ${categories.join(', ')}\n` : ''}` +
      `- CRITICAL: Generate exactly ${Math.ceil(maxResults/3)} beginner recipes, ${Math.ceil(maxResults/3)} intermediate recipes, and ${Math.ceil(maxResults/3)} advanced recipes\n` +
      `- Beginner: Simple recipes with 5-8 ingredients, 15-30 min cooking time, basic techniques\n` +
      `- Intermediate: Moderate recipes with 8-12 ingredients, 30-60 min cooking time, some advanced techniques\n` +
      `- Advanced: Complex recipes with 12+ ingredients, 60+ min cooking time, advanced techniques and skills required\n` +
      `- Variation focus: ${randomVariation}\n` +
      `- IMPORTANT: If user searches for a specific dish (like "adobo"), generate DIFFERENT variations of that same dish each time - different ingredients, cooking methods, regional styles, or preparation techniques. Make each recipe unique while staying true to the dish.\n` +
      `- Include: title, description, cuisine_type (one of: chinese, japanese, korean, thai, vietnamese, filipino, indian, malaysian), ` +
      `difficulty_level (beginner|intermediate|advanced), total_time, ingredients (array of objects with "quantity" and "ingredient" fields), instructions (array of objects with "step" and "instruction" fields), tags.\n` +
      `- CRITICAL: For ingredients, use format: [{"quantity": "1 cup", "ingredient": "rice"}, {"quantity": "2 tbsp", "ingredient": "soy sauce"}]\n` +
      `- CRITICAL: For instructions, use format: [{"step": 1, "instruction": "Detailed step description with cooking techniques and timing"}, {"step": 2, "instruction": "Next step with specific details"}]\n` +
      `- Return JSON object with key "recipes" as an array. No extra commentary.`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 1.2,
        response_mime_type: 'application/json'
      }
    } as any;

    try {
      const resp = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify(body)
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        console.warn('Gemini error', resp.status, text);
        return [];
      }

      const data = await resp.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
      if (!content) return [];

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      }

      const recipes = parsed?.recipes || [];

      const toMeal = (recipe: any, index: number): Meal => {
        const id = `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
        const cuisine = recipe.cuisine_type || 'asian';

        const area = (() => {
          const map: Record<string, string> = {
            chinese: 'Chinese',
            japanese: 'Japanese',
            korean: 'Korean',
            thai: 'Thai',
            vietnamese: 'Vietnamese',
            filipino: 'Filipino',
            indian: 'Indian',
            malaysian: 'Malaysian',
            asian: 'Asian'
          };
          return map[String(cuisine).toLowerCase()] || 'Asian';
        })();

        
        const instr = Array.isArray(recipe.instructions)
          ? recipe.instructions
              .map((s: any, idx: number) => {
                const stepNum = s.step || (idx + 1);
                const instruction = s.instruction || s;
                return `${stepNum}. ${instruction}`;
              })
              .join('\n\n')
          : recipe.instructions || '';

       
        const meal: any = {
          idMeal: id,
          strMeal: recipe.title || 'AI Recipe',
          strCategory: categories[0] || 'Misc',
          strArea: area,
          strInstructions: instr,
          strMealThumb: typeof recipe.image_url === 'string' && recipe.image_url.startsWith('http')
            ? recipe.image_url
            : [
                'https://images.unsplash.com/photo-1604908176633-0504a9c10a8d?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1585238342028-4bbc1f05fa39?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1606788075761-9c3ce29562c1?auto=format&fit=crop&w=800&q=80',
              ][index % 4],
          isAIGenerated: true
        };

      
        if (Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach((ingredient: any, idx: number) => {
            if (idx < 20) { 
              const ingredientNum = idx + 1;
              if (typeof ingredient === 'string') {
                
                const parts = ingredient.split(/\s+(.+)/);
                if (parts.length >= 2) {
                  meal[`strMeasure${ingredientNum}`] = parts[0].trim();
                  meal[`strIngredient${ingredientNum}`] = parts[1].trim();
                } else {
                  meal[`strIngredient${ingredientNum}`] = ingredient.trim();
                  meal[`strMeasure${ingredientNum}`] = '';
                }
              } else if (ingredient && typeof ingredient === 'object') {
              
                meal[`strMeasure${ingredientNum}`] = ingredient.quantity || ingredient.measure || '';
                meal[`strIngredient${ingredientNum}`] = ingredient.name || ingredient.ingredient || '';
              }
            }
          });
        }

        return meal as Meal;
      };

      const meals = recipes.slice(0, maxResults).map(toMeal);

      
      const mealsWithNutrition = await Promise.all(
        meals.map(async (meal) => {
          try {
            const nutritionalInfo = await this.analyzeNutritionalInfo({ meal });
            return {
              ...meal,
              nutritionalInfo: nutritionalInfo || {
                calories: 300,
                protein: 15,
                carbs: 30,
                fat: 10,
                fiber: 5,
                sugar: 8,
                sodium: 600,
                servings: 4
              }
            };
          } catch (error) {
            console.warn('Failed to generate nutritional info for meal:', meal.strMeal, error);
            return {
              ...meal,
              nutritionalInfo: {
                calories: 300,
                protein: 15,
                carbs: 30,
                fat: 10,
                fiber: 5,
                sugar: 8,
                sodium: 600,
                servings: 4
              }
            };
          }
        })
      );

      return mealsWithNutrition;
    } catch (e) {
      console.warn('AI generation failed', e);
      return [];
    }
  },

  async modifyRecipe(params: ModifyRecipeParams): Promise<Meal | null> {
    const { originalRecipe, modificationRequest } = params;

    const apiKey =
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      (Constants?.expoConfig?.extra as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
      (globalThis as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
      (Constants?.manifest as any)?.extra?.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('Missing EXPO_PUBLIC_GEMINI_API_KEY');
      return null;
    }

    const userPrompt = `Modify this recipe based on the user's request while keeping the same dish name and maintaining the same output quality.

Original Recipe:
- Name: ${originalRecipe.strMeal}
- Category: ${originalRecipe.strCategory}
- Area: ${originalRecipe.strArea}
- Instructions: ${originalRecipe.strInstructions}

User's modification request: ${modificationRequest}

Please modify the recipe according to the user's request. The modified recipe should:
1. Keep the same dish name: ${originalRecipe.strMeal}
2. Maintain the same category and area
3. Update ingredients and instructions based on the modification request
4. Ensure the final dish is still recognizable as the same type of meal
5. Keep the same cooking time and difficulty level unless specifically requested to change

Return the modified recipe as JSON with the following structure:
{
  "strMeal": "dish name",
  "strCategory": "category",
  "strArea": "area", 
  "strInstructions": "step-by-step instructions",
  "strMealThumb": "image URL (keep original or suggest new one)"
}

Return only the JSON object, no additional text.`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        response_mime_type: 'application/json'
      }
    } as any;

    try {
      const resp = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify(body)
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        console.warn('Gemini error', resp.status, text);
        return null;
      }

      const data = await resp.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
      if (!content) return null;

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      }

      if (!parsed) return null;

      const modifiedMeal: Meal = {
        ...originalRecipe,
        strMeal: parsed.strMeal || originalRecipe.strMeal,
        strCategory: parsed.strCategory || originalRecipe.strCategory,
        strArea: parsed.strArea || originalRecipe.strArea,
        strInstructions: parsed.strInstructions || originalRecipe.strInstructions,
        
        strMealThumb: originalRecipe.strMealThumb,
        
        isModified: true,
        modificationDate: new Date().toISOString(),
        originalId: originalRecipe.idMeal,
        modificationRequest: modificationRequest
      } as any;

      
      try {
        const nutritionalInfo = await this.analyzeNutritionalInfo({ meal: modifiedMeal });
        if (nutritionalInfo) {
          modifiedMeal.nutritionalInfo = nutritionalInfo;
        }
      } catch (error) {
        console.warn('Failed to generate nutritional info for modified meal:', modifiedMeal.strMeal, error);
      }

      return modifiedMeal;
    } catch (e) {
      console.warn('AI recipe modification failed', e);
      return null;
    }
  },

  async suggestIngredientSubstitutions(params: IngredientSubstitutionParams): Promise<Meal | null> {
    const { originalRecipe, missingIngredients } = params;

    const apiKey =
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      (Constants?.expoConfig?.extra as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
      (globalThis as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
      (Constants?.manifest as any)?.extra?.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('Missing EXPO_PUBLIC_GEMINI_API_KEY');
      return null;
    }

    const userPrompt = `I need ingredient substitutions for this recipe. The user doesn't have these ingredients: ${missingIngredients.join(', ')}.

Original Recipe:
- Name: ${originalRecipe.strMeal}
- Instructions: ${originalRecipe.strInstructions}

IMPORTANT: First identify the CORE INGREDIENTS that define this dish and cannot be substituted (e.g., chicken in chicken curry, beef in beef stew, salmon in salmon fillet, etc.). These core ingredients should NOT be included in substitutions.

Please provide suitable substitutions for the missing ingredients and update the recipe accordingly. The substitutions should:
1. Maintain the same flavor profile and dish type
2. Be commonly available ingredients
3. Keep the same cooking method and timing
4. Provide the same or similar nutritional value
5. NEVER substitute core ingredients that define the dish

For each missing ingredient, suggest 1-2 alternatives with quantities adjusted if needed.

Return the modified recipe as JSON with the following structure:
{
  "strMeal": "dish name",
  "strCategory": "category",
  "strArea": "area", 
  "strInstructions": "updated step-by-step instructions with substitutions",
  "strMealThumb": "image URL (keep original)",
  "coreIngredients": ["list of core ingredients that cannot be substituted"],
  "substitutions": [
    {
      "original": "missing ingredient",
      "substitute": "suggested substitute",
      "quantity": "adjusted quantity if needed",
      "note": "brief explanation of why this works"
    }
  ],
  "cannotSubstitute": [
    {
      "ingredient": "core ingredient name",
      "reason": "why this ingredient cannot be substituted"
    }
  ]
}

Return only the JSON object, no additional text.`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        response_mime_type: 'application/json'
      }
    } as any;

    try {
      const resp = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify(body)
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        console.warn('Gemini error', resp.status, text);
        return null;
      }

      const data = await resp.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
      if (!content) return null;

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      }

      if (!parsed) return null;

      const substitutedMeal: Meal = {
        ...originalRecipe,
        strMeal: parsed.strMeal || originalRecipe.strMeal,
        strCategory: parsed.strCategory || originalRecipe.strCategory,
        strArea: parsed.strArea || originalRecipe.strArea,
        strInstructions: parsed.strInstructions || originalRecipe.strInstructions,
        
        strMealThumb: originalRecipe.strMealThumb,
        
        isSubstituted: true,
        substitutionDate: new Date().toISOString(),
        originalId: originalRecipe.idMeal,
        substitutions: parsed.substitutions || [],
        missingIngredients: missingIngredients
      } as any;

      
      try {
        const nutritionalInfo = await this.analyzeNutritionalInfo({ meal: substitutedMeal });
        if (nutritionalInfo) {
          substitutedMeal.nutritionalInfo = nutritionalInfo;
        }
      } catch (error) {
        console.warn('Failed to generate nutritional info for substituted meal:', substitutedMeal.strMeal, error);
      }

      return substitutedMeal;
    } catch (e) {
      console.warn('AI ingredient substitution failed', e);
      return null;
    }
  },

  async analyzeNutritionalInfo(params: NutritionalAnalysisParams): Promise<NutritionalInfo | null> {
    const { meal } = params;

    const apiKey =
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      (Constants?.expoConfig?.extra as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
      (globalThis as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
      (Constants?.manifest as any)?.extra?.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('Missing EXPO_PUBLIC_GEMINI_API_KEY');
      return null;
    }

   
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = (meal as any)[`strIngredient${i}`];
      const measure = (meal as any)[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const ingredientWithMeasure = measure && measure.trim() 
          ? `${measure.trim()} ${ingredient.trim()}`
          : ingredient.trim();
        ingredients.push(ingredientWithMeasure);
      }
    }

    const userPrompt = `Analyze the nutritional information for this recipe and provide accurate nutritional values per serving.

Recipe Details:
- Name: ${meal.strMeal}
- Category: ${meal.strCategory}
- Cuisine: ${meal.strArea}
- Ingredients: ${ingredients.join(', ')}
- Instructions: ${meal.strInstructions}

Please analyze this recipe and calculate the nutritional information per serving. Consider:
1. The actual ingredients and their quantities - be precise with measurements
2. Cooking methods that might affect nutritional values (frying adds fat, boiling may reduce some nutrients)
3. Standard serving sizes for this type of dish in ${meal.strArea} cuisine
4. Realistic portion sizes - consider this is likely a main dish, side dish, or appetizer
5. Oil and cooking fat usage in the preparation
6. Any marinades, sauces, or seasonings that add calories/nutrients

IMPORTANT: 
- If quantities are unclear (like "to taste" or "as needed"), use typical amounts for that ingredient in this type of dish
- Consider the cooking method: stir-frying uses more oil than steaming, deep-frying significantly increases calories
- Account for all ingredients including oils, butter, sauces, and seasonings
- Be realistic about serving sizes - this appears to be a ${meal.strCategory.toLowerCase()} dish

Provide accurate nutritional analysis based on the specific ingredients and cooking method. Use your knowledge of food nutrition to estimate values for ingredients without specific quantities.

Return the nutritional information as JSON with the following structure:
{
  "calories": number (total calories per serving),
  "protein": number (grams of protein per serving),
  "carbs": number (grams of carbohydrates per serving),
  "fat": number (grams of fat per serving),
  "fiber": number (grams of fiber per serving, optional),
  "sugar": number (grams of sugar per serving, optional),
  "sodium": number (milligrams of sodium per serving, optional),
  "servings": number (estimated number of servings this recipe makes)
}

Be as accurate as possible based on the ingredients and cooking method provided. Return only the JSON object, no additional text.`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3, 
        response_mime_type: 'application/json'
      }
    } as any;

    try {
      const resp = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify(body)
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        console.warn('Gemini error', resp.status, text);
        return null;
      }

      const data = await resp.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
      if (!content) return null;

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      }

      if (!parsed) return null;

    
      const nutritionalInfo: NutritionalInfo = {
        calories: Math.round(parsed.calories || 0),
        protein: Math.round((parsed.protein || 0) * 10) / 10,
        carbs: Math.round((parsed.carbs || 0) * 10) / 10,
        fat: Math.round((parsed.fat || 0) * 10) / 10,
        fiber: parsed.fiber ? Math.round(parsed.fiber * 10) / 10 : undefined,
        sugar: parsed.sugar ? Math.round(parsed.sugar * 10) / 10 : undefined,
        sodium: parsed.sodium ? Math.round(parsed.sodium) : undefined,
        servings: parsed.servings || 4
      };

      return nutritionalInfo;
    } catch (e) {
      console.warn('AI nutritional analysis failed', e);
      return null;
    }
  }
};
