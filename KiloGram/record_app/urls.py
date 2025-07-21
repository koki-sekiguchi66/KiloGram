from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    MealTimingChoicesView, 
    MealRecordViewSet,
    WeightRecordViewSet, 
    UserRegistrationView
)

router = DefaultRouter()
router.register(r'meals', MealRecordViewSet, basename='meal') #ルーターに各モデルのURLのパスでViewSetを登録
router.register(r'weights', WeightRecordViewSet, basename='weight')

urlpatterns = [
    path('meal-timings/', MealTimingChoicesView.as_view(), name='meal-timing-choices'),
    path('', include(router.urls)),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', obtain_auth_token, name='login'),
]