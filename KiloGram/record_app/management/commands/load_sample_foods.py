# record_app/management/commands/load_sample_foods.py
from django.core.management.base import BaseCommand
from record_app.models import StandardFood

class Command(BaseCommand):
    help = 'サンプル食品データを投入します'

    def handle(self, *args, **options):
        # サンプル食品データ（実際のデータに近い値）
        sample_foods = [
            # 穀類
            {
                'food_number': '01001',
                'name': '白米',
                'category': '穀類',
                'calories_per_100g': 168,
                'protein_per_100g': 2.5,
                'fat_per_100g': 0.3,
                'carbs_per_100g': 37.1,
                'fiber_per_100g': 0.3,
                'sodium_per_100g': 1,
                'calcium_per_100g': 3,
                'iron_per_100g': 0.1,
                'vitamin_a_per_100g': 0,
                'vitamin_b1_per_100g': 0.02,
                'vitamin_b2_per_100g': 0.01,
                'vitamin_c_per_100g': 0,
            },
            {
                'food_number': '01002',
                'name': '食パン',
                'category': '穀類',
                'calories_per_100g': 264,
                'protein_per_100g': 9.3,
                'fat_per_100g': 4.4,
                'carbs_per_100g': 46.7,
                'fiber_per_100g': 2.3,
                'sodium_per_100g': 500,
                'calcium_per_100g': 29,
                'iron_per_100g': 0.6,
                'vitamin_a_per_100g': 0,
                'vitamin_b1_per_100g': 0.07,
                'vitamin_b2_per_100g': 0.06,
                'vitamin_c_per_100g': 0,
            },
            # 肉類
            {
                'food_number': '11001',
                'name': '鶏胸肉（皮なし）',
                'category': '肉類',
                'calories_per_100g': 108,
                'protein_per_100g': 22.3,
                'fat_per_100g': 1.5,
                'carbs_per_100g': 0,
                'fiber_per_100g': 0,
                'sodium_per_100g': 49,
                'calcium_per_100g': 4,
                'iron_per_100g': 0.3,
                'vitamin_a_per_100g': 6,
                'vitamin_b1_per_100g': 0.08,
                'vitamin_b2_per_100g': 0.11,
                'vitamin_c_per_100g': 2,
            },
            {
                'food_number': '11002',
                'name': '豚ロース肉',
                'category': '肉類',
                'calories_per_100g': 263,
                'protein_per_100g': 19.3,
                'fat_per_100g': 19.2,
                'carbs_per_100g': 0.2,
                'fiber_per_100g': 0,
                'sodium_per_100g': 54,
                'calcium_per_100g': 3,
                'iron_per_100g': 0.6,
                'vitamin_a_per_100g': 8,
                'vitamin_b1_per_100g': 0.69,
                'vitamin_b2_per_100g': 0.23,
                'vitamin_c_per_100g': 1,
            },
            # 魚介類
            {
                'food_number': '10001',
                'name': '鮭',
                'category': '魚介類',
                'calories_per_100g': 138,
                'protein_per_100g': 22.3,
                'fat_per_100g': 4.1,
                'carbs_per_100g': 0.1,
                'fiber_per_100g': 0,
                'sodium_per_100g': 59,
                'calcium_per_100g': 10,
                'iron_per_100g': 0.5,
                'vitamin_a_per_100g': 11,
                'vitamin_b1_per_100g': 0.15,
                'vitamin_b2_per_100g': 0.21,
                'vitamin_c_per_100g': 1,
            },
            # 卵類
            {
                'food_number': '12001',
                'name': '鶏卵',
                'category': '卵類',
                'calories_per_100g': 151,
                'protein_per_100g': 12.3,
                'fat_per_100g': 10.3,
                'carbs_per_100g': 0.3,
                'fiber_per_100g': 0,
                'sodium_per_100g': 140,
                'calcium_per_100g': 51,
                'iron_per_100g': 1.8,
                'vitamin_a_per_100g': 150,
                'vitamin_b1_per_100g': 0.06,
                'vitamin_b2_per_100g': 0.43,
                'vitamin_c_per_100g': 0,
            },
            # 乳類
            {
                'food_number': '13001',
                'name': '牛乳',
                'category': '乳類',
                'calories_per_100g': 67,
                'protein_per_100g': 3.3,
                'fat_per_100g': 3.8,
                'carbs_per_100g': 4.8,
                'fiber_per_100g': 0,
                'sodium_per_100g': 41,
                'calcium_per_100g': 110,
                'iron_per_100g': 0.02,
                'vitamin_a_per_100g': 38,
                'vitamin_b1_per_100g': 0.04,
                'vitamin_b2_per_100g': 0.15,
                'vitamin_c_per_100g': 1,
            },
            # 野菜類
            {
                'food_number': '06001',
                'name': 'キャベツ',
                'category': '野菜類',
                'calories_per_100g': 23,
                'protein_per_100g': 1.3,
                'fat_per_100g': 0.2,
                'carbs_per_100g': 5.2,
                'fiber_per_100g': 1.8,
                'sodium_per_100g': 5,
                'calcium_per_100g': 43,
                'iron_per_100g': 0.3,
                'vitamin_a_per_100g': 5,
                'vitamin_b1_per_100g': 0.04,
                'vitamin_b2_per_100g': 0.03,
                'vitamin_c_per_100g': 41,
            },
            {
                'food_number': '06002',
                'name': 'トマト',
                'category': '野菜類',
                'calories_per_100g': 19,
                'protein_per_100g': 0.7,
                'fat_per_100g': 0.1,
                'carbs_per_100g': 4.7,
                'fiber_per_100g': 1.0,
                'sodium_per_100g': 3,
                'calcium_per_100g': 7,
                'iron_per_100g': 0.2,
                'vitamin_a_per_100g': 45,
                'vitamin_b1_per_100g': 0.05,
                'vitamin_b2_per_100g': 0.02,
                'vitamin_c_per_100g': 15,
            },
            # 果実類
            {
                'food_number': '07001',
                'name': 'りんご',
                'category': '果実類',
                'calories_per_100g': 56,
                'protein_per_100g': 0.2,
                'fat_per_100g': 0.3,
                'carbs_per_100g': 15.5,
                'fiber_per_100g': 1.9,
                'sodium_per_100g': 0,
                'calcium_per_100g': 4,
                'iron_per_100g': 0.1,
                'vitamin_a_per_100g': 3,
                'vitamin_b1_per_100g': 0.02,
                'vitamin_b2_per_100g': 0.01,
                'vitamin_c_per_100g': 6,
            },
            {
                'food_number': '07002',
                'name': 'バナナ',
                'category': '果実類',
                'calories_per_100g': 93,
                'protein_per_100g': 1.1,
                'fat_per_100g': 0.2,
                'carbs_per_100g': 22.5,
                'fiber_per_100g': 1.1,
                'sodium_per_100g': 0,
                'calcium_per_100g': 6,
                'iron_per_100g': 0.3,
                'vitamin_a_per_100g': 5,
                'vitamin_b1_per_100g': 0.05,
                'vitamin_b2_per_100g': 0.04,
                'vitamin_c_per_100g': 16,
            }
        ]

        created_count = 0
        updated_count = 0

        for food_data in sample_foods:
            obj, created = StandardFood.objects.update_or_create(
                food_number=food_data['food_number'],
                defaults=food_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'作成: {food_data["name"]}')
            else:
                updated_count += 1
                self.stdout.write(f'更新: {food_data["name"]}')

        self.stdout.write(
            self.style.SUCCESS(
                f'完了: {created_count}件作成, {updated_count}件更新'
            )
        )