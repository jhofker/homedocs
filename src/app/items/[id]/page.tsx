'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  warrantyUntil: string | null;
  manualUrl: string | null;
  images: string[] | null;
  room: {
    id: string;
    name: string;
    home: {
      id: string;
      name: string;
    };
  };
  _count: {
    tasks: number;
  };
}

export default function ItemPage({ params }: ItemPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    async function getParams() {
      const { id } = await params;
      setId(id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  async function fetchItem() {
    try {
      const response = await fetch(`/api/items/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch item');
      }
      const data = await response.json();
      setItem(data);
      if (data.images && data.images.length > 0) {
        setSelectedImage(data.images[0]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch item');
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/rooms/${item.room.id}`} className="text-blue-500 hover:text-blue-600">
          ← Back to {item.room.name}
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{item.name}</h1>
        <Link
          href={`/items/${item.id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Edit Item
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {item.images && item.images.length > 0 ? (
          <div className="space-y-4">
            <div className="relative aspect-square">
              <Image
                src={selectedImage || item.images[0]}
                alt={item.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            {item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`relative aspect-square ${
                      selectedImage === image ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${item.name} thumbnail ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">No images available</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <dl className="space-y-2">
              {item.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {item.room.home.name} - {item.room.name}
                </dd>
              </div>
              {item.category && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.category}</dd>
                </div>
              )}
              {item.purchaseDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(item.purchaseDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {item.warrantyUntil && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Warranty Until</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(item.warrantyUntil).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Product Information</h2>
            <dl className="space-y-2">
              {item.manufacturer && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.manufacturer}</dd>
                </div>
              )}
              {item.modelNumber && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Model Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.modelNumber}</dd>
                </div>
              )}
              {item.serialNumber && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.serialNumber}</dd>
                </div>
              )}
              {item.manualUrl && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Manual</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={item.manualUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      View Manual
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">Tasks</h2>
            <p className="text-gray-600">View and manage tasks for this item</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-semibold text-gray-700">{item._count.tasks}</span>
            <Link
              href={`/tasks/new?itemId=${item.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Task
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
