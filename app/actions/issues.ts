'use server'

import { db } from '@/db'
import { issues } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/dal'
import { z } from 'zod'
// Define Zod schema for issue validation
const IssueSchema = z.object({
  title: z
    .string()
    .min(3, 'El titulo debe ser de al menos 3 caracteres')
    .max(100, 'El titulo debe ser de menos de 100 caracteres  '),

  description: z.string().optional().nullable(),

  status: z.enum(['backlog', 'todo', 'in_progress', 'done'], {
    errorMap: () => ({ message: 'Por favor selecciona un estado válido.' }),
  }),

  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Por favor selecciona una prioridad válida.' }),
  }),
  userId: z.string().min(1, 'Se requiere el ID de usuario'),
})

export type IssueData = z.infer<typeof IssueSchema>

export type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  error?: string
}

export async function createIssue(data: IssueData): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'Acceso no autorizado',
        error: 'No autorizado',
      }
    }

    const validationResult = IssueSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'La validación falló',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    const validatedData = validationResult.data
    await db.insert(issues).values({
      title: validatedData.title,
      description: validatedData.description || null,
      status: validatedData.status,
      priority: validatedData.priority,
      userId: validatedData.userId,
    })

    return { success: true, message: 'Incidencia creada con éxito' }
  } catch (error) {
    console.error('Error creando la incidencia:', error)
    return {
      success: false,
      message: 'Ocurrió un error al crear la incidencia',
      error: 'No se pudo crear la incidencia',
    }
  }
}

export async function updateIssue(
  id: number,
  data: Partial<IssueData>
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'Acceso no autorizado',
        error: 'No autorizado',
      }
    }

    const UpdateIssueSchema = IssueSchema.partial()
    const validationResult = UpdateIssueSchema.safeParse(data)

    if (!validationResult.success) {
      return {
        success: false,
        message: 'La validación falló',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    const validatedData = validationResult.data
    const updateData: Record<string, unknown> = {}

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority

    // Update issue
    await db.update(issues).set(updateData).where(eq(issues.id, id))

    return { success: true, message: 'Incidencia actualizada con éxito' }
  } catch (error) {
    console.error('Error actualizando la incidencia:', error)
    return {
      success: false,
      message: 'Ocurrió un error al actualizar la incidencia',
      error: 'No se pudo actualizar la incidencia',
    }
  }
}

export async function deleteIssue(id: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('No autorizado')
    }

    await db.delete(issues).where(eq(issues.id, id))

    return { success: true, message: 'Incidencia eliminada con éxito' }
  } catch (error) {
    console.error('Error eliminando la incidencia:', error)
    return {
      success: false,
      message: 'Ocurrió un error al eliminar la incidencia',
      error: 'No se pudo eliminar la incidencia',
    }
  }
}