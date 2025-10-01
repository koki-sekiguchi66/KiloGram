# record_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    MealTimingChoicesView, 
    MealRecordViewSet,
    WeightRecordViewSet, 
    CustomFoodViewSet,
    UserRegistrationView,
    search_foods,
    food_suggestions,
    calculate_nutrition,
    daily_nutrition_summary,
    create_custom_food,
    list_custom_foods,
    update_custom_food,
    delete_custom_food
)

router = DefaultRouter()
router.register(r'meals', MealRecordViewSet, basename='meal')
router.register(r'weights', WeightRecordViewSet, basename='weight')
router.register(r'foods/custom', CustomFoodViewSet, basename='custom-food')

urlpatterns = [
    # 基本URL
    path('meal-timings/', MealTimingChoicesView.as_view(), name='meal-timing-choices'),
    path('', include(router.urls)),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', obtain_auth_token, name='login'),
    
    # 食品検索・栄養計算関連
    path('foods/search/', search_foods, name='search-foods'),
    path('foods/suggestions/', food_suggestions, name='food-suggestions'),
    path('foods/calculate/', calculate_nutrition, name='calculate-nutrition'),
    path('foods/custom/', create_custom_food, name='create-custom-food'),
    path('foods/custom/list/', list_custom_foods, name='list-custom-foods'),
    path('foods/custom/<int:food_id>/', update_custom_food, name='update-custom-food'),
    path('foods/custom/<int:food_id>/delete/', delete_custom_food, name='delete-custom-food'),
    
    # 栄養サマリー
    path('nutrition/daily-summary/', daily_nutrition_summary, name='daily-nutrition-summary'),
]