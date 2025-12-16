import os
from django.core.wsgi import get_wsgi_application

# デフォルトをproductionにする（WSGI経由で動かすのは通常本番のみのため）
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kilogram_project.settings.production')

application = get_wsgi_application()