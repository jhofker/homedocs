# Generated by Django 5.0 on 2023-12-15 18:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_alter_coating_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='name',
            field=models.CharField(default='Home', max_length=255),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='location',
            name='address',
            field=models.TextField(blank=True, null=True),
        ),
    ]