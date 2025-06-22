import { createClient } from '@/lib/supabase'

export interface ITestResult {
  id: string
  user_email: string
  questions_answered: number
  correct_answers: number
  percentage_score: number
  test_date: string
  time_spent?: number
  created_at?: string
}

export class TestResult {  static async create(testData: Omit<ITestResult, 'id' | 'created_at'>): Promise<ITestResult> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('test_results')
      .insert(testData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  static async filter(
    filters: Partial<ITestResult>,
    orderBy: string = 'test_date',
    limit?: number  ): Promise<ITestResult[]> {
    const supabase = createClient()
    let query = supabase.from('test_results').select('*')
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value)
      }
    })
    
    // Apply ordering
    if (orderBy.startsWith('-')) {
      const field = orderBy.substring(1)
      query = query.order(field, { ascending: false })
    } else {
      query = query.order(orderBy)
    }
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }
}
