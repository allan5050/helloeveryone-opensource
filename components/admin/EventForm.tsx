'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  category: z.string().min(1, 'Category is required'),
  is_published: z.boolean().default(false),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventFormProps {
  event?: any
  isEdit?: boolean
}

export function EventForm({ event, isEdit = false }: EventFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue: _setValue,
    watch: _watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          capacity: event.capacity,
          category: event.category,
          is_published: event.is_published,
        }
      : {},
  })

  const categories = [
    'networking',
    'social',
    'professional',
    'hobby',
    'sports',
    'culture',
    'education',
    'other',
  ]

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true)
    try {
      const eventData = {
        ...data,
        capacity: data.capacity || null,
      }

      if (isEdit && event) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('events').insert([eventData])

        if (error) throw error
      }

      router.push('/admin/events')
      router.refresh()
    } catch (error) {
      console.error('Error saving event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-lg bg-white p-6 shadow"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Event Title *
          </label>
          <Input
            {...register('title')}
            placeholder="Enter event title"
            error={errors.title?.message}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            {...register('category')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">
              {errors.category.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description *
        </label>
        <Textarea
          {...register('description')}
          rows={4}
          placeholder="Describe your event..."
          error={errors.description?.message}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Date *
          </label>
          <Input
            {...register('date')}
            type="date"
            error={errors.date?.message}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Time *
          </label>
          <Input
            {...register('time')}
            type="time"
            error={errors.time?.message}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Capacity (optional)
          </label>
          <Input
            {...register('capacity', { valueAsNumber: true })}
            type="number"
            min="1"
            placeholder="Leave empty for unlimited"
            error={errors.capacity?.message}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Location *
        </label>
        <Input
          {...register('location')}
          placeholder="Enter event location"
          error={errors.location?.message}
        />
      </div>

      <div className="flex items-center">
        <input
          {...register('is_published')}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Publish event immediately
        </label>
      </div>

      <div className="flex justify-end space-x-4 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEdit
              ? 'Updating...'
              : 'Creating...'
            : isEdit
              ? 'Update Event'
              : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}
