import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// This route uses request.url and cookies (supabase server client), so it must be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log("Checking for AI explanation for session:", sessionId)

    // First, check if we already have an explanation for this session
    const supabase = await createClient()
    
    const { data: existingExplanation, error: fetchError } = await supabase
      .from('ai_explanations')
      .select('explanation, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching existing explanation:', fetchError)
    }

    if (existingExplanation && existingExplanation.length > 0) {
      console.log("Found existing explanation for session:", sessionId)
      return NextResponse.json({ 
        explanation: existingExplanation[0].explanation 
      })
    }

    // If no explanation exists, check if we have the question data
    const { data: questionData, error: questionError } = await supabase
      .from('test_sessions')
      .select('question_text, selected_answer, correct_answer')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (questionError || !questionData || questionData.length === 0) {
      console.log("No question data found for session:", sessionId)
      return NextResponse.json({ 
        explanation: "AI explanation is being generated. Please wait a moment." 
      })
    }

    const question = questionData[0]
    
    // Generate AI explanation
    const prompt = `As a nursing instructor, provide a clear and educational explanation for this nursing exam question:

Question: ${question.question_text}

Student's Answer: ${question.selected_answer}
Correct Answer: ${question.correct_answer}

Please explain why the correct answer is right and provide educational context that would help a nursing student understand this concept better. Keep the explanation concise but informative (2-3 sentences).`

    console.log("Calling OpenAI API for explanation...")

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a knowledgeable nursing instructor who provides clear, educational explanations for nursing exam questions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    })

    const explanation = completion.choices[0]?.message?.content

    if (!explanation) {
      console.error('Invalid OpenAI API response:', completion)

      const fallbackExplanation = "The correct answer is based on established nursing knowledge. Review your study materials to understand the underlying concepts."

      await supabase
        .from('ai_explanations')
        .insert({
          session_id: sessionId,
          explanation: fallbackExplanation,
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        explanation: fallbackExplanation
      })
    }

    // Store the explanation for future use
    await supabase
      .from('ai_explanations')
      .insert({
        session_id: sessionId,
        explanation: explanation,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      explanation: explanation
    })
    
  } catch (error) {
    console.error('OpenAI API route error:', error)
    
    // Return a fallback explanation
    return NextResponse.json({ 
      explanation: "The correct answer is based on established nursing knowledge. Review your study materials to understand the underlying concepts." 
    })
  }
}
