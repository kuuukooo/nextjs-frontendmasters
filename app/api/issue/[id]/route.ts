import { NextResponse } from 'next/server'
import { db } from '@/db'
import { issues } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { id: any } }
) {
  try {
    const id = params.id

    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, id),
    })

    if (!issue) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 })
    }

    return NextResponse.json(issue)
  } catch (error) {
    console.error('Error obteniendo la incidencia:', error)
    return NextResponse.json(
      { error: 'No se pudo obtener la incidencia' },
      { status: 500 }
    )
  }
}