from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, generics, permissions
from django.utils import timezone
from datetime import date
from .models import MealRecord, WeightRecord
from .serializers import MealRecordSerializer, UserRegistrationSerializer, WeightRecordSerializer


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
        print("aaaaa")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        weight_data = serializer.validated_data['weight']
        obj, created = WeightRecord.objects.update_or_create(
            user=request.user, 
            record_date=timezone.now().today(),
            defaults={'weight': weight_data}
        )
        response_serializer = self.get_serializer(obj)
        
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        
        return Response(response_serializer.data, status=status_code)




        
class MealTimingChoicesView(APIView):
    def get(self, request, *args, **kwargs):
        choices = MealRecord.MEAL_TIMING_CHOICES
        formatted_choices = [{"value": value, "label": label} for value, label in choices]
        return Response(formatted_choices, status=status.HTTP_200_OK)


class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]