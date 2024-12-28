import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  const data = await request.json();

  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Process homes
      for (const home of data.homes) {
        // Skip if home already exists
        const existingHome = await tx.home.findUnique({
          where: { id: home.id },
        });
        if (existingHome) continue;

        // Create home
        const createdHome = await tx.home.create({
          data: {
            id: home.id,
            name: home.name,
            address: home.address,
            description: home.description,
            createdAt: new Date(home.createdAt),
            updatedAt: new Date(home.updatedAt),
            userId: session.id,
          },
        });

        // Create rooms
        for (const room of home.rooms) {
          const createdRoom = await tx.room.create({
            data: {
              id: room.id,
              name: room.name,
              description: room.description,
              createdAt: new Date(room.createdAt),
              updatedAt: new Date(room.updatedAt),
              homeId: createdHome.id,
            },
          });

          // Create room items
          for (const item of room.items) {
            await tx.item.create({
              data: {
                id: item.id,
                name: item.name,
                description: item.description,
                category: item.category,
                manufacturer: item.manufacturer,
                modelNumber: item.modelNumber,
                serialNumber: item.serialNumber,
                purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : null,
                warrantyUntil: item.warrantyUntil ? new Date(item.warrantyUntil) : null,
                manualUrl: item.manualUrl,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt),
                homeId: createdHome.id,
                roomId: createdRoom.id,
              },
            });
          }

          // Create room tasks
          for (const task of room.tasks) {
            await tx.task.create({
              data: {
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                isRecurring: task.isRecurring,
                interval: task.interval,
                unit: task.unit,
                lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : null,
                nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : null,
                createdAt: new Date(task.createdAt),
                updatedAt: new Date(task.updatedAt),
                creatorId: session.id,
                assigneeId: session.id,
                homeId: createdHome.id,
                roomId: createdRoom.id,
              },
            });
          }

          // Create room paints
          for (const paint of room.paints) {
            await tx.paint.create({
              data: {
                id: paint.id,
                name: paint.name,
                brand: paint.brand,
                color: paint.color,
                finish: paint.finish,
                code: paint.code,
                location: paint.location,
                notes: paint.notes,
                createdAt: new Date(paint.createdAt),
                updatedAt: new Date(paint.updatedAt),
                homeId: createdHome.id,
                roomId: createdRoom.id,
              },
            });
          }

          // Create room floorings
          for (const flooring of room.floorings) {
            await tx.flooring.create({
              data: {
                id: flooring.id,
                name: flooring.name,
                type: flooring.type,
                material: flooring.material,
                brand: flooring.brand,
                color: flooring.color,
                pattern: flooring.pattern,
                notes: flooring.notes,
                createdAt: new Date(flooring.createdAt),
                updatedAt: new Date(flooring.updatedAt),
                homeId: createdHome.id,
                roomId: createdRoom.id,
              },
            });
          }
        }

        // Create home tasks
        for (const task of home.tasks) {
          await tx.task.create({
            data: {
              id: task.id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: task.status,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              isRecurring: task.isRecurring,
              interval: task.interval,
              unit: task.unit,
              lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : null,
              nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : null,
              createdAt: new Date(task.createdAt),
              updatedAt: new Date(task.updatedAt),
              creatorId: session.id,
              assigneeId: session.id,
              homeId: createdHome.id,
            },
          });
        }

        // Create home paints
        for (const paint of home.paints) {
          await tx.paint.create({
            data: {
              id: paint.id,
              name: paint.name,
              brand: paint.brand,
              color: paint.color,
              finish: paint.finish,
              code: paint.code,
              location: paint.location,
              notes: paint.notes,
              createdAt: new Date(paint.createdAt),
              updatedAt: new Date(paint.updatedAt),
              homeId: createdHome.id,
            },
          });
        }

        // Create home floorings
        for (const flooring of home.floorings) {
          await tx.flooring.create({
            data: {
              id: flooring.id,
              name: flooring.name,
              type: flooring.type,
              material: flooring.material,
              brand: flooring.brand,
              color: flooring.color,
              pattern: flooring.pattern,
              notes: flooring.notes,
              createdAt: new Date(flooring.createdAt),
              updatedAt: new Date(flooring.updatedAt),
              homeId: createdHome.id,
            },
          });
        }
      }
    });

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error('Import error:', error);
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to import data',
      }),
      { status: 500 }
    );
  }
} 