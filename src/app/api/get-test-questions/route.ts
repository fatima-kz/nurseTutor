import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty')

    if (error) {
      console.error('Error fetching questions from Supabase:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions available' }, { status: 404 })
    }

    const grouped: Record<string, typeof questions> = {
      Easy: [],
      Medium: [],
      Hard: [],
    }

    for (const q of questions) {
      const diff = q.difficulty || 'Medium'
      if (grouped[diff]) {
        grouped[diff].push(q)
      } else {
        grouped['Medium'].push(q)
      }
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort(() => Math.random() - 0.5)
    }

    return NextResponse.json({ questions: grouped })
  } catch (error) {
    console.error('Error in get-test-questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
