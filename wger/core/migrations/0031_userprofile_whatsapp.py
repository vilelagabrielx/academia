# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0030_userprofile_photo_base64'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='whatsapp',
            field=models.CharField(blank=True, help_text='Format: 5511999999999', max_length=20, null=True, verbose_name='WhatsApp'),
        ),
    ]
