import Constants from 'expo-constants';
import { Meal } from './mealApi';

export interface GenerateAsianRecipesParams {
  query?: string;
  categories?: string[];
  cuisine?: string;
  maxResults?: number;
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

    // Add variation elements to generate different versions of the same dish
    const variationElements = [
      'traditional family recipe', 'modern restaurant style', 'regional variation', 'quick weeknight version',
      'authentic street food style', 'healthy low-sodium version', 'spicy hot variation', 'sweet and tangy style',
      'slow-cooked traditional', 'instant pot version', 'grilled variation', 'vegetarian adaptation'
    ];
    
    const randomVariation = variationElements[Math.floor(Math.random() * variationElements.length)];
    const timestamp = Date.now(); // Add timestamp for uniqueness
    
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
      `difficulty_level (beginner|intermediate|advanced), total_time, ingredients (item, amount), instructions (step, instruction), tags.\n` +
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
              .map((s: any) => `${s.step ? `${s.step}. ` : ''}${s.instruction || ''}`)
              .join('\n')
          : recipe.instructions || '';

        const fallbackImages: string[] = [
          'https://images.unsplash.com/photo-1604908176633-0504a9c10a8d?auto=format&fit=crop&w=800&q=80', // Asian food
          'https://images.unsplash.com/photo-1585238342028-4bbc1f05fa39?auto=format&fit=crop&w=800&q=80', // Chinese food
          'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80', // Sushi
          'https://images.unsplash.com/photo-1606788075761-9c3ce29562c1?auto=format&fit=crop&w=800&q=80', // Curry
        ];

        const imageUrl =
          typeof recipe.image_url === 'string' && recipe.image_url.startsWith('http')
            ? recipe.image_url
            : fallbackImages[index % fallbackImages.length];

        return {
          idMeal: id,
          strMeal: recipe.title || 'AI Recipe',
          strCategory: categories[0] || 'Misc',
          strArea: area,
          strInstructions: instr,
          strMealThumb: imageUrl
        } as Meal;
      };

      const meals = recipes.slice(0, maxResults).map(toMeal);

      return meals;
    } catch (e) {
      console.warn('AI generation failed', e);
      return [];
    }
  }
};
