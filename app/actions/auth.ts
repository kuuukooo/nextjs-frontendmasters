'use server'

import { z } from 'zod'
import {
  verifyPassword,
  createSession,
  createUser,
  deleteSession,
} from '@/lib/auth'
import { getUserByEmail } from '@/lib/dal'
import { redirect } from 'next/navigation'

// Define Zod schema for signIn validation
const SignInSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido').email('Formato de correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida '),
})

// Define Zod schema for signup validation
const SignUpSchema = z
  .object({
    email: z.string().min(1, 'El correo electrónico es requerido').email('Formato de correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Por favor confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ['confirmPassword'],
  })

export type SignInData = z.infer<typeof SignInSchema>
export type SignUpData = z.infer<typeof SignUpSchema>

export type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  error?: string
}

export const signIn = async (formData: FormData): Promise<ActionResponse> => {
  try { 
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validationResult = SignInSchema.safeParse(data)

  if (!validationResult.success) {
    return {
      success: false,
      message: 'La validación falló',
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  const user = await getUserByEmail(data.email)
  if (!user) {
    return {
      success: false,
      message: 'Email o Contraseñas inválidos',
      errors: {
        email: ['Email o Contraseñas inválidos'],
      },
    }
  }

  const isPasswordValid = await verifyPassword(data.password, user.password)
  if (!isPasswordValid) {
    return {
      success: false,
      message: 'Email o Contraseñas inválidos',
      errors: {
        password: ['Email o Contraseñas inválidos'],
      },
    }
  }

  await createSession(user.id)

  return {
    success: true,
    message: "Accedido con éxito"
  }
  } catch  (e)  {
    console.error(e)
    return {
      success: false,
      message: 'Algo malo ocurrió',
      error: 'Algo malo ocurrió :(',
    }
  }
}

export async function signUp(formData: FormData): Promise<ActionResponse> {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    const validationResult = SignUpSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'La validación falló',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    const existingUser = await getUserByEmail(data.email)
    if (existingUser) {
      return {
        success: false,
        message: 'El usuario con este correo electrónico ya existe',
        errors: {
          email: ['El usuario con este correo electrónico ya existe'],
        },
      }
    }

    const user = await createUser(data.email, data.password)
    if (!user) {
      return {
        success: false,
        message: 'La creación del usuario falló',
        error: 'La creación del usuario falló',
      }
    }

    await createSession(user.id)

    return {
      success: true,
      message: 'Cuenta creada con éxito',
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      success: false,
      message: 'La creación de la cuenta falló',
      error: 'La creación de la cuenta falló  ',
    }
  }
}

export async function signOut(): Promise<void> {
  try {
    await deleteSession()
  } catch (error) {
    console.error('Error de cierre de sesión:', error)
    throw new Error('La finalización de la sesión falló')
  } finally {
    redirect('/signin')
  }
}
