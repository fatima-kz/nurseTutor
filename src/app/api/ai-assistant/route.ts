import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are NCLEX Harmony's AI Assistant, an expert nursing instructor specialized in NCLEX exam preparation. You help nursing students understand concepts, explain rationales behind answers, and provide study guidance.

Your expertise covers:
- Medical-surgical nursing
- Pharmacology
- Maternal-newborn nursing
- Pediatric nursing
- Psychiatric/mental health nursing
- Fundamentals of nursing
- Anatomy and physiology
- Pathophysiology
- Nursing priorities and the nursing process (ADPIE: Assessment, Diagnosis, Planning, Implementation, Evaluation)
- Maslow's hierarchy and prioritization
- Lab values and diagnostic tests
- Patient safety and infection control

Guidelines for your responses:
- Be accurate, evidence-based, and aligned with current NCLEX-RN test plans
- When explaining concepts, always include the "why" — the underlying pathophysiology or rationale
- Use clear, encouraging, and professional language
- Keep responses focused and concise unless the student asks for detail
- When a student asks about a specific condition, briefly cover: definition, key signs/symptoms, nursing interventions, and common NCLEX priorities
- If a student asks a practice question, walk through the rationale for each option
- Remind students of mnemonics or frameworks (ABC, Maslow, safety first, least invasive first) when relevant
- If you are unsure or the topic is outside nursing, say so honestly and suggest they consult a qualified instructor

You are friendly, supportive, and genuinely invested in the student's success on the NCLEX.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body as { messages: Array<{ role: 'user' | 'assistant'; content: string }> }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })

    const reply = completion.choices[0]?.message?.content

    if (!reply) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ response: reply })
  } catch (error) {
    console.error('AI Assistant API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
