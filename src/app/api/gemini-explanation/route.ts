import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GEMINI_API_KEY = 'AIzaSyCkHgSXE38SgicJHN-FyBqfPw3CdrPA6As'

// Enable caching for better performance
export const revalidate = 60; // Cache for 60 seconds

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

    console.log("Calling Gemini API for explanation...")

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      
      // Store a fallback explanation
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

    const data = await response.json()
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const explanation = data.candidates[0].content.parts[0].text
      
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
    } else {
      console.error('Invalid Gemini API response:', data)
      
      // Store a fallback explanation
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
    
  } catch (error) {
    console.error('Gemini API route error:', error)
    
    // Return a fallback explanation
    return NextResponse.json({ 
      explanation: "The correct answer is based on established nursing knowledge. Review your study materials to understand the underlying concepts." 
    })
  }
}