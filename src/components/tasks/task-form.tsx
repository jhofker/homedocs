'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useLocationOptions } from '@/hooks/use-location-options';
import { Task, TaskPriority, TaskRecurrenceUnit, TaskStatus, User } from '@/types/prisma';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  interval: z.number().positive().optional(),
  unit: z.nativeEnum(TaskRecurrenceUnit).optional(),
  homeId: z.string().optional(),
  roomId: z.string().optional(),
  itemId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task & {
    room?: {
      id: string;
      name: string;
      homeId: string;
    };
    item?: {
      id: string;
      name: string;
      roomId: string;
      room: {
        id: string;
        name: string;
        homeId: string;
      };
    };
  };
  users: User[];
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  defaultHomeId?: string;
  defaultRoomId?: string;
  defaultItemId?: string;
}

export function TaskForm({
  task,
  users,
  onSubmit,
  onCancel,
  defaultHomeId,
  defaultRoomId,
  defaultItemId,
}: TaskFormProps) {
  const { homes, rooms, items } = useLocationOptions();
  const hasAutoSelectedHome = useRef(false);
  const hasSetDefaultValues = useRef(false);
  const previousHomeId = useRef<string | undefined>(
    task?.homeId || task?.room?.homeId || task?.item?.room?.homeId
  );
  const previousRoomId = useRef<string | undefined>(
    task?.roomId || task?.room?.id || task?.item?.roomId
  );

  // Find initial values based on defaults
  const initialValues = (() => {
    if (task) {
      return {
        title: task.title,
        description: task.description || undefined,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
        assigneeId: task.assigneeId || undefined,
        isRecurring: task.isRecurring,
        interval: task.interval || undefined,
        unit: task.unit || undefined,
        homeId: task.homeId || task.room?.homeId || task.item?.room?.homeId || undefined,
        roomId: task.roomId || task.room?.id || task.item?.roomId || undefined,
        itemId: task.itemId || task.item?.id || undefined,
      };
    }

    // Find initial values based on default IDs
    let homeId = defaultHomeId;
    let roomId = defaultRoomId;
    let itemId = defaultItemId;

    if (defaultItemId && items.length > 0) {
      const item = items.find((item) => item.id === defaultItemId);
      if (item && rooms.length > 0) {
        const room = rooms.find((room) => room.id === item.roomId);
        if (room && homes.length > 0) {
          const home = homes.find((home) => home.id === room.homeId);
          if (home) {
            itemId = defaultItemId;
            roomId = room.id;
            homeId = home.id;
          }
        }
      }
    } else if (defaultRoomId && rooms.length > 0) {
      const room = rooms.find((room) => room.id === defaultRoomId);
      if (room && homes.length > 0) {
        const home = homes.find((home) => home.id === room.homeId);
        if (home) {
          roomId = room.id;
          homeId = home.id;
        }
      }
    } else if (defaultHomeId && homes.length > 0) {
      const home = homes.find((home) => home.id === defaultHomeId);
      if (home) {
        homeId = home.id;
      }
    }

    return {
      priority: TaskPriority.LOW,
      status: TaskStatus.PENDING,
      isRecurring: false,
      dueDate: new Date().toISOString().split('T')[0],
      interval: 1,
      unit: TaskRecurrenceUnit.WEEKLY,
      homeId,
      roomId,
      itemId,
    };
  })();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: initialValues,
  });

  // Set default values once data is loaded
  useEffect(() => {
    if (!hasSetDefaultValues.current && homes.length > 0 && rooms.length > 0 && items.length > 0) {
      if (defaultItemId) {
        const item = items.find((item) => item.id === defaultItemId);
        if (item) {
          const room = rooms.find((room) => room.id === item.roomId);
          if (room) {
            const home = homes.find((home) => home.id === room.homeId);
            if (home) {
              setValue('homeId', home.id);
              setValue('roomId', room.id);
              setValue('itemId', item.id);
              hasSetDefaultValues.current = true;
            }
          }
        }
      } else if (defaultRoomId) {
        const room = rooms.find((room) => room.id === defaultRoomId);
        if (room) {
          const home = homes.find((home) => home.id === room.homeId);
          if (home) {
            setValue('homeId', home.id);
            setValue('roomId', room.id);
            hasSetDefaultValues.current = true;
          }
        }
      } else if (defaultHomeId) {
        const home = homes.find((home) => home.id === defaultHomeId);
        if (home) {
          setValue('homeId', home.id);
          hasSetDefaultValues.current = true;
        }
      }
    }
  }, [homes, rooms, items, defaultHomeId, defaultRoomId, defaultItemId, setValue]);

  const isRecurring = watch('isRecurring');
  const selectedHomeId = watch('homeId');
  const selectedRoomId = watch('roomId');
  const selectedItemId = watch('itemId');

  // Filter rooms based on selected home
  const availableRooms = selectedHomeId
    ? rooms.filter((room) => room.homeId === selectedHomeId)
    : rooms;

  // Filter items based on selected room
  const availableItems = selectedRoomId
    ? items.filter((item) => item.roomId === selectedRoomId)
    : items;

  // Clear dependent fields when parent selection changes
  useEffect(() => {
    if (selectedHomeId !== previousHomeId.current && homes.length > 0 && rooms.length > 0) {
      const roomExists =
        selectedHomeId && selectedRoomId
          ? rooms.some((room) => room.homeId === selectedHomeId && room.id === selectedRoomId)
          : false;
      if (!roomExists) {
        setValue('roomId', '');
        setValue('itemId', '');
      }
      previousHomeId.current = selectedHomeId;
    }
  }, [selectedHomeId, selectedRoomId, rooms, homes, setValue]);

  // Auto-select first home when there's only one and no home is selected
  useEffect(() => {
    if (!hasAutoSelectedHome.current && homes.length === 1 && !selectedHomeId && !defaultHomeId) {
      setValue('homeId', homes[0].id);
      hasAutoSelectedHome.current = true;
    }
  }, [homes, selectedHomeId, setValue, defaultHomeId]);

  useEffect(() => {
    if (selectedRoomId !== previousRoomId.current && rooms.length > 0 && items.length > 0) {
      const itemExists =
        selectedRoomId && selectedItemId
          ? items.some((item) => item.roomId === selectedRoomId && item.id === selectedItemId)
          : false;
      if (!itemExists) {
        setValue('itemId', '');
      }
      previousRoomId.current = selectedRoomId;
    }
  }, [selectedRoomId, selectedItemId, rooms, items, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          {...register('title')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            (Supports markdown: **bold**, *italic*, - lists, etc.)
          </span>
        </label>
        <textarea
          id="description"
          rows={5}
          placeholder="Task description using markdown...
Example:
**Important notes:**
- First item
- Second item

Visit https://example.com"
          {...register('description')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className={task ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Priority
          </label>
          <select
            id="priority"
            {...register('priority')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
            <option value={TaskPriority.URGENT}>Urgent</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
          )}
        </div>

        {task && (
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>
            <select
              id="status"
              {...register('status')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value={TaskStatus.PENDING}>Pending</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
              <option value={TaskStatus.CANCELLED}>Cancelled</option>
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="dueDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Due Date
        </label>
        <input
          type="date"
          id="dueDate"
          {...register('dueDate')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isRecurring"
          {...register('isRecurring')}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <label
          htmlFor="isRecurring"
          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
        >
          Recurring Task
        </label>
      </div>

      {isRecurring && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="interval"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Repeat every
            </label>
            <input
              type="number"
              id="interval"
              min="1"
              {...register('interval', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {errors.interval && (
              <p className="mt-1 text-sm text-red-600">{errors.interval.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="unit"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Unit
            </label>
            <select
              id="unit"
              {...register('unit')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a unit</option>
              <option value={TaskRecurrenceUnit.DAILY}>Days</option>
              <option value={TaskRecurrenceUnit.WEEKLY}>Weeks</option>
              <option value={TaskRecurrenceUnit.MONTHLY}>Months</option>
              <option value={TaskRecurrenceUnit.YEARLY}>Years</option>
            </select>
            {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="assigneeId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Assignee
        </label>
        <select
          id="assigneeId"
          {...register('assigneeId')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select an assignee</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>
        {errors.assigneeId && (
          <p className="mt-1 text-sm text-red-600">{errors.assigneeId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="homeId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Home
          </label>
          <select
            id="homeId"
            {...register('homeId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a home</option>
            {homes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.name}
              </option>
            ))}
          </select>
          {errors.homeId && <p className="mt-1 text-sm text-red-600">{errors.homeId.message}</p>}
        </div>

        <div>
          <label
            htmlFor="roomId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Room
          </label>
          <select
            id="roomId"
            {...register('roomId')}
            disabled={!selectedHomeId}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          >
            <option value="">Select a room</option>
            {availableRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          {errors.roomId && <p className="mt-1 text-sm text-red-600">{errors.roomId.message}</p>}
        </div>

        <div>
          <label
            htmlFor="itemId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Item
          </label>
          <select
            id="itemId"
            {...register('itemId')}
            disabled={!selectedRoomId}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          >
            <option value="">Select an item</option>
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {errors.itemId && <p className="mt-1 text-sm text-red-600">{errors.itemId.message}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
