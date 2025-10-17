from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, generics, permissions
from rest_framework.decorators import api_view, action, permission_classes
from datetime import date

from .models import MealRecord, WeightRecord, CustomFood, CafeteriaMenu

from .serializers import (MealRecordSerializer, UserRegistrationSerializer, WeightRecordSerializer,
                        CustomFoodSerializer, CafeteriaMenuSerializer
                        )

from .business_logic.nutrition_calculator import NutritionCalculatorService
from .tasks import update_cafeteria_menus_task


class MealRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MealRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MealRecord.objects.filter(user=self.request.user).order_by('-record_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WeightRecordViewSet(viewsets.ModelViewSet):
    serializer_class = WeightRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WeightRecord.objects.filter(user=self.request.user).order_by('-record_date')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        weight_data = serializer.validated_data['weight']
        record_date = serializer.validated_data['record_date']
        obj, created = WeightRecord.objects.update_or_create(
            user=request.user,
            record_date=record_date,
            defaults={'weight': weight_data}
        )
        response_serializer = self.get_serializer(obj)

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response(response_serializer.data, status=status_code)


class CustomFoodViewSet(viewsets.ModelViewSet):
    serializer_class = CustomFoodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CustomFood.objects.filter(user=self.request.user).order_by('name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def create_from_meal(self, request):
        """食事記録からカスタム食品を作成するAPI"""
        try:
            calculator = NutritionCalculatorService()
            custom_food = calculator.create_custom_food(request.user, request.data)

            return Response({
                'message': 'カスタム食品を作成しました',
                'food': {
                    'id': f'custom_{custom_food.id}',
                    'name': custom_food.name,
                    'type': 'custom'
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=400)


class MealTimingChoicesView(APIView):
    def get(self, request, *args, **kwargs):
        choices = MealRecord.MEAL_TIMING_CHOICES
        formatted_choices = [{"value": value, "label": label} for value, label in choices]
        return Response(formatted_choices, status=status.HTTP_200_OK)


class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_foods(request):
    """食品検索API"""
    query = request.GET.get('q', '')
    if not query:
        return Response({'error': '検索キーワードが必要です'}, status=400)

    if len(query) < 2:
        return Response({'foods': []})

    calculator = NutritionCalculatorService()
    results = calculator.search_foods(query)

    return Response({'foods': results})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def food_suggestions(request):
    """食品名候補API（オートコンプリート用）"""
    query = request.GET.get('q', '')
    if not query or len(query) < 2:
        return Response({'suggestions': []})

    calculator = NutritionCalculatorService()
    suggestions = calculator.get_food_suggestions(query)

    return Response({'suggestions': suggestions})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def calculate_nutrition(request):
    """栄養素計算API"""
    food_id = request.data.get('food_id')
    amount = request.data.get('amount', 100)

    if not food_id:
        return Response({'error': 'food_idが必要です'}, status=400)

    try:
        calculator = NutritionCalculatorService()
        nutrition = calculator.calculate_nutrition_for_amount(food_id, float(amount))

        return Response({
            'nutrition': nutrition,
            'amount': amount
        })
    except ValueError as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def daily_nutrition_summary(request):
    """日別栄養素サマリーAPI"""
    target_date_str = request.GET.get('date')

    if target_date_str:
        try:
            target_date = date.fromisoformat(target_date_str)
        except ValueError:
            return Response({'error': '日付形式が正しくありません（YYYY-MM-DD）'}, status=400)
    else:
        target_date = date.today()

    calculator = NutritionCalculatorService()
    summary = calculator.get_daily_nutrition_summary(request.user, target_date)

    return Response({
        'date': target_date,
        'nutrition_summary': summary
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_custom_food(request):
    """カスタム食品作成API"""
    try:
        calculator = NutritionCalculatorService()
        custom_food = calculator.create_custom_food(request.user, request.data)

        return Response({
            'message': 'カスタム食品を作成しました',
            'food': {
                'id': f'custom_{custom_food.id}',
                'name': custom_food.name,
                'type': 'custom'
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_custom_foods(request):
    """ユーザーのカスタム食品一覧取得API"""
    try:
        custom_foods = CustomFood.objects.filter(user=request.user).order_by('name')
        serializer = CustomFoodSerializer(custom_foods, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_custom_food(request, food_id):
    """カスタム食品更新API"""
    try:
        custom_food = CustomFood.objects.get(id=food_id, user=request.user)
        serializer = CustomFoodSerializer(custom_food, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    except CustomFood.DoesNotExist:
        return Response({'error': 'カスタム食品が見つかりません'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_custom_food(request, food_id):
    """カスタム食品削除API"""
    try:
        custom_food = CustomFood.objects.get(id=food_id, user=request.user)
        custom_food.delete()
        return Response({'message': 'カスタム食品を削除しました'}, status=204)
    except CustomFood.DoesNotExist:
        return Response({'error': 'カスタム食品が見つかりません'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_cafeteria_menus(request):
    """食堂メニュー一覧取得（毎週月曜8時更新）"""

    category = request.GET.get('category')
    menus = CafeteriaMenu.objects.all()

    if category:
        menus = menus.filter(category=category)

    serializer = CafeteriaMenuSerializer(menus, many=True)
    return Response(serializer.data)