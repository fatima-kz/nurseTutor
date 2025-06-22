import { createClient } from '@/lib/supabase'

export interface IQuestion {
  id: string
  question_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  created_date?: string
}

export class Question {  static async list(orderBy: string = 'created_date', limit?: number): Promise<IQuestion[]> {
    const supabase = createClient()
    let query = supabase.from('questions').select('*')
    
    if (orderBy === '-created_date') {
      query = query.order('created_date', { ascending: false })
    } else if (orderBy === '?') {
      // For random questions, we'll order by a random function
      query = query.order('created_date', { ascending: false })
    } else {
      query = query.order(orderBy)
    }
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }  static async create(questionData: Omit<IQuestion, 'id'>): Promise<IQuestion> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('questions')
      .insert(questionData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
