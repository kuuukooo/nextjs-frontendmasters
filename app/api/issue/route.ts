import { NextResponse } from 'next/server'
import { db } from '@/db'
import { issues } from '@/db/schema'

export async function GET() {
  try {
    const allIssues = await db.query.issues.findMany()
    return NextResponse.json(allIssues)
  } catch (error) {
    console.error('Error obteniendo incidencias:', error)
    return NextResponse.json(
      { error: 'No se pudo obtener las incidencias' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.userId) {
      return NextResponse.json(
        { error: 'El titulo y el id del usuario son requeridos.' },
        { status: 400 }
      )
    }

    // Create the issue
    const newIssue = await db
      .insert(issues)
      .values({
        title: data.title,
        description: data.description || null,
        status: data.status || 'backlog',
        priority: data.priority || 'medium',
        userId: data.userId,
      })
      .returning()

    return NextResponse.json(
      { message: 'Incidencia creada de forma exitosa', issue: newIssue[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creando la incidencia:', error)
    return NextResponse.json(
      { error: 'No se pudo crear la incidencia' },
      { status: 500 }
    )
  }
}
