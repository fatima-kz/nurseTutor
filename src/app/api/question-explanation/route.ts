import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question_text, selected_answer, correct_answer } = body

    if (!question_text || !correct_answer) {
      return NextResponse.json(
        { error: 'question_text and correct_answer are required' },
        { status: 400 }
      )
    }

    const prompt = `As a nursing instructor, provide a clear and educational explanation for this nursing exam question:

Question: ${question_text}

Student's Answer: ${selected_answer || 'No answer selected'}
Correct Answer: ${correct_answer}

Please explain why the correct answer is right and provide educational context that would help a nursing student understand this concept better. Keep the explanation concise but informative (2-3 sentences).`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a knowledgeable nursing instructor who provides clear, educational explanations for nursing exam questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 512,
    })

    const explanation = completion.choices[0]?.message?.content

    if (!explanation) {
      return NextResponse.json({
        explanation: 'The correct answer is based on established nursing knowledge. Review your study materials to understand the underlying concepts.',
      })
    }

    return NextResponse.json({ explanation })
  } catch (error) {
    console.error('Question explanation API error:', error)
    return NextResponse.json({
      explanation: 'The correct answer is based on established nursing knowledge. Review your study materials to understand the underlying concepts.',
    })
  }
}
