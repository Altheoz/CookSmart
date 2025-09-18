# CookSmart Data Flow Diagram (DFD)

## High-Level Overview
This Data Flow Diagram illustrates the processes, data stores, and external entities within the CookSmart mobile application. The diagram shows how different users (Regular Users and Admin) interact with various functionalities and data.

## Key Components and Their Interactions

### 1. External Entities
- **User (Regular Users):** End-users who perform various actions like logging in, discovering recipes, managing favorites, and viewing content
- **Admin:** Administrative user responsible for system management, user registration, content moderation, and data management

### 2. Processes (Rounded Rectangles)

#### User-Facing Processes:
- **1 Access Application (Sign up/Login):** The entry point for users to sign up or log into the system
- **2 Discover Recipes (Search/Filter/Explore):** Allows users to search, filter, and explore recipes with various criteria
- **3 Manage Favorites (Add/Remove/View Favorites):** Enables users to add, remove, and view their favorite recipes
- **4 Manage Saved Recipes (Add/Remove/View Saved):** Allows users to save, remove, and view saved recipes
- **5 View Recipe Details (Ingredients/Instructions/Nutrition):** Provides detailed recipe information including ingredients, instructions, and nutritional data
- **6 Profile Management (View/Edit Profile):** Enables users to view and modify their personal profile information
- **7 Recipe Categories (Browse by Category/Area):** Allows users to browse recipes by categories and cuisine areas

#### Admin-Facing Processes:
- **1 User Management (Create/Manage User Accounts):** (Admin side) Allows the Admin to create and manage user accounts
- **2 Content Moderation (Review/Approve Content):** (Admin side) Enables the Admin to review and moderate user-generated content
- **3 System Monitoring (View Analytics/Reports):** (Admin side) Provides the Admin with system analytics and monitoring capabilities

### 3. Data Stores (Open-ended Rectangles with 'D')

- **D User Data (Profiles, Authentication):** Stores all user profiles, authentication data, and user preferences
- **D Recipe Data (Meals, Categories, Ingredients):** Central data store for all recipe information, categories, and ingredient details
- **D User Preferences (Favorites, Saved Recipes):** Stores user-specific data including favorites and saved recipes
- **D External API Data (TheMealDB):** External data source for recipe information and meal database

## Detailed Flow Descriptions

### User (Regular Users) Flows:

1. **Application Access and Authentication:**
   - The `User` performs `Login/Signup` to `1 Access Application (Sign up/Login)`
   - From `1 Access Application`, the user can `Access Main App`, leading to the main application interface
   - `1 Access Application` interacts with `D User Data (Profiles, Authentication)` to `Store/Verify User Credentials`

2. **Recipe Discovery and Search:**
   - The `User` can `Search Recipes` via `2 Discover Recipes (Search/Filter/Explore)`
   - `2 Discover Recipes` interacts with `D External API Data (TheMealDB)` to `Fetch Recipe Data`
   - `2 Discover Recipes` performs `Query Search Data` from `D Recipe Data (Meals, Categories, Ingredients)`

3. **Favorites Management:**
   - The `User` can `Manage Favorites` via `3 Manage Favorites (Add/Remove/View Favorites)`
   - `3 Manage Favorites` interacts with `D User Preferences (Favorites, Saved Recipes)` to `Store/Retrieve Favorites`

4. **Saved Recipes Management:**
   - The `User` can `Manage Saved Recipes` via `4 Manage Saved Recipes (Add/Remove/View Saved)`
   - `4 Manage Saved Recipes` interacts with `D User Preferences (Favorites, Saved Recipes)` to `Store/Retrieve Saved Recipes`

5. **Recipe Details Viewing:**
   - The `User` can `View Recipe Details` via `5 View Recipe Details (Ingredients/Instructions/Nutrition)`
   - `5 View Recipe Details` performs `Fetch Recipe Details` from `D Recipe Data (Meals, Categories, Ingredients)`

6. **Profile Management:**
   - The `User` can `Manage Profile` via `6 Profile Management (View/Edit Profile)`
   - `6 Profile Management` performs `View/Edit Profile Data` with `D User Data (Profiles, Authentication)`

7. **Category Browsing:**
   - The `User` can `Browse Categories` via `7 Recipe Categories (Browse by Category/Area)`
   - `7 Recipe Categories` performs `Query Category Data` from `D Recipe Data (Meals, Categories, Ingredients)`

### Admin Flows:

1. **User Management:**
   - The `Admin` performs `Login` to `1 User Management (Create/Manage User Accounts)`
   - The `Admin` can `Manage Users` via `1 User Management`
   - `1 User Management` adds user accounts to `D User Data (Profiles, Authentication)` via `Add/Update User Account`

2. **Content Moderation:**
   - The `Admin` can `Moderate Content` via `2 Content Moderation (Review/Approve Content)`
   - `2 Content Moderation` updates `D Recipe Data (Meals, Categories, Ingredients)` via `Update Content Status`

3. **System Monitoring:**
   - The `Admin` can `Monitor System` via `3 System Monitoring (View Analytics/Reports)`
   - `3 System Monitoring` interacts with `D User Data (Profiles, Authentication)` via `Generate Analytics Reports`

## Interconnections between User and Admin

The `D User Data (Profiles, Authentication)` data store serves as a central hub, connecting various user-facing processes (Profile Management, Authentication) with admin-facing processes (User Management, System Monitoring). This indicates that user profiles and authentication data are managed by both users (for their own data) and administrators (for system-wide management).

The `D Recipe Data (Meals, Categories, Ingredients)` data store connects recipe discovery processes with content moderation, showing that recipe data is both consumed by users and managed by administrators.

## Data Flow Summary

- **Authentication Flow:** User credentials flow from login/signup to user data store
- **Recipe Discovery Flow:** Search queries flow to external API and recipe data store
- **User Preferences Flow:** Favorites and saved recipes flow between user actions and preferences data store
- **Content Management Flow:** Recipe data flows from external API to recipe data store, accessible by both users and admins
- **Profile Management Flow:** User profile data flows between user actions and user data store

## Technology Stack Integration

- **Frontend:** React Native with Expo Router for navigation
- **Authentication:** Firebase Authentication
- **Database:** Firebase Firestore for user data and preferences
- **External API:** TheMealDB API for recipe data
- **Local Storage:** AsyncStorage for offline data persistence
- **State Management:** React Context API for recipe management

