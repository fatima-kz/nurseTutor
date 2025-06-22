# Make.com Integration Setup

## Overview
This setup allows Make.com to handle intelligent question selection and delivery to your Next.js nursing exam app.

## Flow Description

### 1. User Submits Answer
When a user submits an answer, your app sends data to Make.com:

**Endpoint:** `https://hook.us2.make.com/mes4xll9rgrosp3plsd7ycplfo162v66`
**Method:** POST
**Payload:**
```json
{
  "question_id": "q123",
  "selected_option": "A",
  "current_difficulty": "Medium",
  "user_email": "user@example.com",
  "session_id": "session_1703123456789_abc123",
  "is_correct": true,
  "callback_url": "https://yourdomain.com/api/receive-question"
}
```

### 2. Make.com Callback
After processing the answer, Make.com should call back to your app:

**Endpoint:** `https://yourdomain.com/api/receive-question`
**Method:** POST
**Payload:**
```json
{
  "question": {
    "id": "q124",
    "question_id": "q124", 
    "question_text": "What is the priority nursing intervention for...",
    "option_a": "Monitor vital signs",
    "option_b": "Administer medication",
    "option_c": "Assess pain level",
    "option_d": "Document findings",
    "correct_answer": "A",
    "difficulty": "Medium"
  },
  "user_email": "user@example.com",
  "session_id": "session_1703123456789_abc123",
  "previous_question_id": "q123"
}
```

## Make.com Scenario Setup

### Modules Required:
1. **Webhook (Trigger)** - Receives answer data from your app
2. **Data Processing** - Analyze user performance and select next question
3. **Database/Airtable Module** - Fetch appropriate next question
4. **HTTP Request** - Send next question back to your app

### Key Logic to Implement:
- Track user performance history
- Adjust difficulty based on correct/incorrect answers
- Ensure question variety and topic coverage
- Implement spaced repetition if desired
- Avoid repeating recent questions

### Example Make.com Logic:
```
IF user_score > 80% AND last_3_correct:
  difficulty = increase_difficulty(current_difficulty)
ELSE IF user_score < 60%:
  difficulty = decrease_difficulty(current_difficulty)

next_question = get_question_by_difficulty_and_topic(
  difficulty, 
  avoid_recent_questions(user_email, last_10_questions)
)

send_to_callback_url(next_question)
```

## Testing the Integration

### 1. Test Answer Submission
```bash
curl -X POST https://hook.us2.make.com/mes4xll9rgrosp3plsd7ycplfo162v66 \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "test_q1",
    "selected_option": "A", 
    "user_email": "test@example.com",
    "session_id": "test_session_123",
    "is_correct": true,
    "callback_url": "https://your-app.com/api/receive-question"
  }'
```

### 2. Test Question Callback
```bash
curl -X POST https://your-app.com/api/receive-question \
  -H "Content-Type: application/json" \
  -d '{
    "question": {
      "question_id": "test_q2",
      "question_text": "Test question?",
      "option_a": "Option A",
      "option_b": "Option B", 
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_answer": "A"
    },
    "user_email": "test@example.com",
    "session_id": "test_session_123",
    "previous_question_id": "test_q1"
  }'
```

## Benefits of This Approach
- **Intelligent Question Selection**: Make.com can implement complex algorithms
- **Performance Tracking**: Centralized user performance analysis
- **Scalability**: Offload processing from your Next.js app
- **Flexibility**: Easy to modify question selection logic without app updates
- **Analytics**: Comprehensive data collection in Make.com

## Fallback Mechanism
If Make.com is unavailable, the app will automatically fall back to loading questions directly from the Supabase database, ensuring the test can continue uninterrupted.
