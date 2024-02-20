# Generated by Django 5.0 on 2023-12-09 21:57

import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_alter_category_options_alter_itemcategory_options_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='RoomPhoto',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date_created', models.DateTimeField(auto_now_add=True)),
                ('date_updated', models.DateTimeField(auto_now=True)),
                ('date_deleted', models.DateTimeField(blank=True)),
                ('image', models.ImageField(upload_to='room_photos/')),
                ('caption', models.TextField(blank=True, null=True)),
                ('date_taken', models.DateField()),
                ('room', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.room')),
            ],
        ),
    ]