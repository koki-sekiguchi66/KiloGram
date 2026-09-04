from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('record_app', '0009_weightrecord_unique_constraint')]
    operations = [
        migrations.CreateModel(
            name='GoogleAccount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subject', models.CharField(max_length=255, unique=True)),
                ('email', models.EmailField(max_length=254)),
                ('linked_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='google_account', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
