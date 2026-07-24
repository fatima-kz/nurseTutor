import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TOTAL_QUESTIONS = 10

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty')
      .limit(TOTAL_QUESTIONS)

    if (error) {
      console.error('Error fetching questions from Supabase:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions available' }, { status: 404 })
    }

    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(TOTAL_QUESTIONS, shuffled.length))

    return NextResponse.json({ questions: selected, total: selected.length })
  } catch (error) {
    console.error('Error in get-test-questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
