export interface QAInsight {
    likely_answered: boolean;
    likely_interested: boolean;
    appointment_mentioned: boolean;
    objection_detected: boolean;
    wrong_number: boolean;
    callback_requested: boolean;
    do_not_call_requested: boolean;
    lead_quality_score: number; // 0 - 100
    recommended_next_action: string;
}

export function computeQAInsights(lead: any, callLog: any): QAInsight {
    const disposition = String(lead?.disposition || '').toLowerCase().trim();
    const summary = String(callLog?.summary || lead?.failureReason || '').toLowerCase().trim();
    
    // Extract transcript text
    let transcriptText = "";
    if (callLog?.transcript) {
        if (Array.isArray(callLog.transcript)) {
            transcriptText = callLog.transcript.map((m: any) => {
                if (typeof m.text === 'string') return m.text;
                if (typeof m.content === 'string') return m.content;
                if (m.content && typeof m.content === 'object' && m.content.text) return m.content.text;
                return '';
            }).join(" ").toLowerCase();
        } else if (typeof callLog.transcript === 'string') {
            try {
                const parsed = jsonParseDefensive(callLog.transcript);
                if (Array.isArray(parsed)) {
                    transcriptText = parsed.map((m: any) => {
                        if (typeof m.text === 'string') return m.text;
                        if (typeof m.content === 'string') return m.content;
                        if (m.content && typeof m.content === 'object' && m.content.text) return m.content.text;
                        return '';
                    }).join(" ").toLowerCase();
                } else {
                    transcriptText = callLog.transcript.toLowerCase();
                }
            } catch(e) {
                transcriptText = callLog.transcript.toLowerCase();
            }
        }
    }

    const fullText = `${disposition} ${summary} ${transcriptText}`;

    // 1. likely_answered: duration > 0 or has non-empty transcript
    const duration = callLog?.durationSeconds || lead?.lastCallDurationSeconds || 0;
    const likely_answered = duration > 0 || transcriptText.length > 0;

    // 2. Conservative Do Not Call requested detection (strict constraint #2)
    const dncPhrases = [
        "do not call",
        "don't call",
        "dont call",
        "remove me",
        "take me off your list",
        "stop calling",
        "take me off",
        "remove from list",
        "dnc"
    ];
    const isDncByPhrase = dncPhrases.some(phrase => fullText.includes(phrase));
    const isDncByDisposition = disposition.includes("dnc") || disposition.includes("do not call");
    const do_not_call_requested = isDncByPhrase || isDncByDisposition;

    // 3. wrong_number
    const wrongKeywords = ["wrong number", "not john", "not the person", "wrong person", "incorrect number", "no longer works"];
    const wrong_number = wrongKeywords.some(k => fullText.includes(k)) || disposition.includes("wrong");

    // 4. likely_interested
    const interestKeywords = [
        "interested", "yes", "sure", "sign me up", "want to", "callback", "call back", 
        "send info", "send email", "sounds good", "great", "ok", "okay", "tell me more"
    ];
    const isSuccess = lead?.status === 'completed' || disposition === 'success';
    const likely_interested = likely_answered && !do_not_call_requested && !wrong_number && (isSuccess || interestKeywords.some(k => fullText.includes(k)));

    // 5. appointment_mentioned
    const apptKeywords = ["appt", "appointment", "schedule", "book", "meeting", "meet", "time", "calendar", "tomorrow", "next week"];
    const appointment_mentioned = likely_answered && !do_not_call_requested && !wrong_number && apptKeywords.some(k => fullText.includes(k));

    // 6. objection_detected
    const objectionKeywords = ["busy", "not interested", "no thanks", "expensive", "cost", "price", "quit", "stop", "later"];
    const objection_detected = likely_answered && !do_not_call_requested && !wrong_number && objectionKeywords.some(k => fullText.includes(k));

    // 7. callback_requested
    const callbackKeywords = ["callback", "call back", "call me later", "call me back", "tomorrow", "after 5", "next week"];
    const callback_requested = likely_answered && !do_not_call_requested && !wrong_number && callbackKeywords.some(k => fullText.includes(k));

    // 8. lead_quality_score (0-100) (strict constraint #2: if DNC, score = 0)
    let score = 30; // base score if answered
    if (!likely_answered) {
        score = 0;
    } else if (do_not_call_requested || wrong_number) {
        score = 0;
    } else {
        if (likely_interested) score += 30;
        if (appointment_mentioned) score += 25;
        if (callback_requested) score += 15;
        if (objection_detected) score -= 15;
    }
    const lead_quality_score = Math.max(0, Math.min(100, score));

    // 9. recommended_next_action (strict constraint #2: if DNC, must be specific action)
    let recommended_next_action = "No action needed (Not answered)";
    if (likely_answered) {
        if (do_not_call_requested) {
            recommended_next_action = "Add to DNC / Do not call again";
        } else if (wrong_number) {
            recommended_next_action = "Mark as Bad Number / Remove";
        } else if (appointment_mentioned) {
            recommended_next_action = "Schedule follow-up / Send booking link";
        } else if (likely_interested) {
            recommended_next_action = "Send email / Follow up in 24 hours";
        } else if (callback_requested) {
            recommended_next_action = "Callback scheduled / Call at requested time";
        } else if (objection_detected) {
            recommended_next_action = "Review objections / Place on low-priority nurturing";
        } else {
            recommended_next_action = "Follow up via email or SMS";
        }
    }

    return {
        likely_answered,
        likely_interested,
        appointment_mentioned,
        objection_detected,
        wrong_number,
        callback_requested,
        do_not_call_requested,
        lead_quality_score,
        recommended_next_action
    };
}

function jsonParseDefensive(str: string): any {
    try {
        return JSON.parse(str);
    } catch(e) {
        return null;
    }
}
