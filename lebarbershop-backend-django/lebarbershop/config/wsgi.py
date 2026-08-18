import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lebarbershop.settings')

application = get_wsgi_application()

# Ajouter cette ligne tout en bas pour Vercel
app = application
