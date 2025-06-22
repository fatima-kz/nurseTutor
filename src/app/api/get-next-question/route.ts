// /api/get-next-question/route.ts
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase';
import { console } from "inspector";

export async function GET(request: NextRequest) {
    try {
        console.log("=== GET LATEST QUESTION API CALLED ===");
        console.log(request)

        const supabase = createClient();
        
        // Get the most recently added question from the database.
        // We do this by ordering by 'created_at' in descending order and taking the first one.
        const { data: questions, error } = await supabase
            .from('next_question')
            .select('*')
            .order('created_at', { ascending: false }) // Sort by creation time, newest first
            .limit(1);                               // We only need the top one

        if (error) {
            console.error("Error fetching question from Supabase:", error);
            return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 });
        }

        if (!questions || questions.length === 0) {
            console.log("No question found in database");
            return NextResponse.json({ question: null });
        }

        // The query result is an array, so we take the first element.
        const question = questions[0];

        console.log("Latest question found in database:", {
            id: question.id,
            question_text_preview: question.question_text?.substring(0, 50) + "..."
        });

        // The delete logic has been completely removed as requested.

        return NextResponse.json({ question });
        
    } catch (error) {
        console.error("Error in get-next-question:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}