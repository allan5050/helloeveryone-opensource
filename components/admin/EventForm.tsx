'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { createClient } from '@/lib/supabase/client'

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  start_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  location: z.string().min(1, 'Location is required'),
  max_attendees: z.number().min(1, 'Capacity must be at least 1').optional(),
  is_active: z.boolean().default(true),
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
          start_date: event.start_time ? event.start_time.split('T')[0] : '',
          start_time: event.start_time ? event.start_time.split('T')[1]?.substring(0, 5) : '',
          end_time: event.end_time ? event.end_time.split('T')[1]?.substring(0, 5) : '',
          location: event.location,
          max_attendees: event.max_attendees,
          is_active: event.is_active ?? true,
        }
      : {},
  })

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true)
    try {
      // Combine date and time into ISO timestamp
      const startDateTime = `${data.start_date}T${data.start_time}:00`
      const endDateTime = `${data.start_date}T${data.end_time}:00`

      const eventData = {
        title: data.title,
        description: data.description,
        location: data.location,
        start_time: startDateTime,
        end_time: endDateTime,
        max_attendees: data.max_attendees || null,
        is_active: data.is_active,
      }

      if (isEdit && event) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)

        if (error) throw error
      } else {
        // Get current user for created_by field
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { error } = await supabase.from('events').insert([{
          ...eventData,
          created_by: user.id,
        }])

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
          Description *
        </label>
        <Textarea
          {...register('description')}
          rows={4}
          placeholder="Describe your event..."
          error={errors.description?.message}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Date *
          </label>
          <Input
            {...register('start_date')}
            type="date"
            error={errors.start_date?.message}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Start Time *
          </label>
          <Input
            {...register('start_time')}
            type="time"
            error={errors.start_time?.message}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            End Time *
          </label>
          <Input
            {...register('end_time')}
            type="time"
            error={errors.end_time?.message}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Capacity (optional)
          </label>
          <Input
            {...register('max_attendees', { valueAsNumber: true })}
            type="number"
            min="1"
            placeholder="Leave empty for unlimited"
            error={errors.max_attendees?.message}
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
          {...register('is_active')}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Event is active
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
