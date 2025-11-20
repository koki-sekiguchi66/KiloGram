from rest_framework import serializers
from .models import MealRecord, MealRecordItem, CustomMenu, CustomMenuItem, StandardFood, CustomFood, WeightRecord, CafeteriaMenu
from django.contrib.auth.models import User

class MealRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealRecord
        fields = [
            'id', 'user', 'record_date', 'meal_timing', 'meal_name',
            'calories', 'protein', 'fat', 'carbohydrates',
            'dietary_fiber', 'sodium', 'calcium', 'iron',
            'vitamin_a', 'vitamin_b1', 'vitamin_b2', 'vitamin_c',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('user', 'id', 'created_at', 'updated_at')

class WeightRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightRecord
        fields = '__all__'
        read_only_fields = ('user', 'id', 'created_at', 'updated_at')

class StandardFoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = StandardFood
        fields = '__all__'

class CustomFoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomFood
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class UserRegistrationSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 8}
        }
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("パスワードが一致しません。")
        
        if len(data['password']) < 8:
            raise serializers.ValidationError("パスワードは8文字以上で入力してください。")
        
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user



class CafeteriaMenuSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = CafeteriaMenu
        fields = [
            'id', 'menu_id', 'name', 'category', 'category_display',
            'calories', 'protein', 'fat', 'carbohydrates',
            'dietary_fiber', 'sodium', 'calcium', 'iron',
            'vitamin_a', 'vitamin_b1', 'vitamin_b2', 'vitamin_c',
            'updated_at'
        ]

class MealRecordItemSerializer(serializers.ModelSerializer):
    """
    読み取り専用の合計栄養素は除外
    """
    
    class Meta:
        model = MealRecordItem
        fields = [
            'id',
            'item_type',
            'item_id',
            'item_name',
            'amount_grams',
            'display_order',
            'calories',
            'protein',
            'fat',
            'carbohydrates',
            'dietary_fiber',
            'sodium',
            'calcium',
            'iron',
            'vitamin_a',
            'vitamin_b1',
            'vitamin_b2',
            'vitamin_c',
        ]
        read_only_fields = ['id']

class MealRecordSerializer(serializers.ModelSerializer):
    items = MealRecordItemSerializer(many=True, required=False)
    
    class Meta:
        model = MealRecord
        fields = [
            'id',
            'user',
            'record_date',
            'meal_timing',
            'meal_name',
            'calories',
            'protein',
            'fat',
            'carbohydrates',
            'dietary_fiber',
            'sodium',
            'calcium',
            'iron',
            'vitamin_a',
            'vitamin_b1',
            'vitamin_b2',
            'vitamin_c',
            'created_at',
            'updated_at',
            'items',  
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """
        食事記録とアイテムを同時作成
        """
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user
        
        # 食事記録を作成
        meal_record = MealRecord.objects.create(user=user, **validated_data)
        
        # アイテムを一括作成
        if items_data:
            MealRecordItem.objects.bulk_create([
                MealRecordItem(meal_record=meal_record, **item_data)
                for item_data in items_data
            ])
        
        return meal_record
    
    def update(self, instance, validated_data):
        """
        食事記録とアイテムを同時更新
        現在は既存のitemsを全削除してから再作成
        部分更新が必要な場合は別途実装を検討
        """
        items_data = validated_data.pop('items', None)
        
        # MealRecordフィールドを更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # アイテムを更新（既存削除 + 再作成）
        if items_data is not None:
            instance.items.all().delete()
            if items_data:
                MealRecordItem.objects.bulk_create([
                    MealRecordItem(meal_record=instance, **item_data)
                    for item_data in items_data
                ])
        
        return instance


class MealRecordListSerializer(serializers.ModelSerializer):
    """
    食事記録一覧用のシリアライザー、アイテム数のみ提供
    """
    
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MealRecord
        fields = [
            'id',
            'record_date',
            'meal_timing',
            'meal_name',
            'calories',
            'protein',
            'fat',
            'carbohydrates',
            'items_count',
            'created_at',
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()

class CustomMenuItemSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = CustomMenuItem
        fields = [
            'id',
            'item_type',
            'item_id',
            'item_name',
            'amount_grams',
            'display_order',
            'calories',
            'protein',
            'fat',
            'carbohydrates',
            'dietary_fiber',
            'sodium',
            'calcium',
            'iron',
            'vitamin_a',
            'vitamin_b1',
            'vitamin_b2',
            'vitamin_c',
        ]
        read_only_fields = ['id']



class CustomMenuSerializer(serializers.ModelSerializer):   
    items = CustomMenuItemSerializer(many=True, required=True)
    
    class Meta:
        model = CustomMenu
        fields = [
            'id',
            'name',
            'description',
            'items',
            'total_calories',
            'total_protein',
            'total_fat',
            'total_carbohydrates',
            'total_dietary_fiber',
            'total_sodium',
            'total_calcium',
            'total_iron',
            'total_vitamin_a',
            'total_vitamin_b1',
            'total_vitamin_b2',
            'total_vitamin_c',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'total_calories',
            'total_protein',
            'total_fat',
            'total_carbohydrates',
            'total_dietary_fiber',
            'total_sodium',
            'total_calcium',
            'total_iron',
            'total_vitamin_a',
            'total_vitamin_b1',
            'total_vitamin_b2',
            'total_vitamin_c',
        ]
    
    def validate_items(self, value):
        """アイテムのバリデーション"""
        if not value:
            raise serializers.ValidationError("少なくとも1つのアイテムが必要です")
        return value
    
    def create(self, validated_data):
        """
        カスタムメニューとアイテムを同時作成し、合計栄養素を計算
        """
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        custom_menu = CustomMenu.objects.create(user=user, **validated_data)
        
        CustomMenuItem.objects.bulk_create([
            CustomMenuItem(custom_menu=custom_menu, **item_data)
            for item_data in items_data
        ])
        
        custom_menu.calculate_totals()
        custom_menu.save()
        
        return custom_menu
    
    def update(self, instance, validated_data):
        """
        カスタムメニューとアイテムを同時更新
        名前・説明のみ更新
        アイテムは既存削除 + 再作成
        """
        items_data = validated_data.pop('items', None)
        
        
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        
        
        if items_data is not None:
            instance.items.all().delete()
            if items_data:
                CustomMenuItem.objects.bulk_create([
                    CustomMenuItem(custom_menu=instance, **item_data)
                    for item_data in items_data
                ])
            
            # 合計栄養素を再計算
            instance.calculate_totals()
        
        instance.save()
        return instance


class CustomMenuListSerializer(serializers.ModelSerializer):
    """
    カスタムメニュー一覧用のシリアライザー
    アイテム数のみ提供
    """
    
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomMenu
        fields = [
            'id',
            'name',
            'description',
            'items_count',
            'total_calories',
            'total_protein',
            'total_fat',
            'total_carbohydrates',
            'created_at',
            'updated_at',
        ]
    
    def get_items_count(self, obj):
        """アイテム数を取得"""
        return obj.items.count()
