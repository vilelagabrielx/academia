# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0029_userprofile_timezone'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='photo_base64',
            field=models.TextField(blank=True, help_text='Low-res base64 encoded photo for the member profile.', null=True, verbose_name='Photo'),
        ),
    ]
