import os
import json
import logging
import asyncio
from datetime import datetime
from app.services.call_history import complete_call_record, save_transcription
from openai import AsyncOpenAI

logger = logging.getLogger("ai_worker.services.analytics")

async def process_post_call_analytics(room_name: str, transcript: list, metadata: dict = None):
    """
    Processes post-call analytics for a finished session.
    
    Args:
        room_name (str): The LiveKit room name.
        transcript (list): List of transcription segments [{"speaker": "...", "text": "...", "timestamp": "..."}].
        metadata (dict): Additional call metadata (duration, caller_id, agent_slug, etc.).
    """
    # Defensive metadata
    meta = metadata or {}

    if not transcript:
        logger.info(f"No transcript for room {room_name}, skipping analytics.")
        try:
            complete_call_record(room_name=room_name, final_payload={
                **meta,
                "summary": "Analytics skipped (No conversation transcript).",
                "processed_at": datetime.utcnow().isoformat()
            })
        except Exception as e:
            logger.error(f"Failed to update empty transcript summary placeholder: {e}")
        return

    logger.info(f"Starting post-call analytics for {room_name} ({len(transcript)} segments)")

    # 1. Format transcript for LLM
    formatted_transcript = ""
    for entry in transcript:
        speaker = entry.get("speaker", "unknown").capitalize()
        text = entry.get("text", "")
        formatted_transcript += f"{speaker}: {text}\n"

    # 2. Extract Analytics using OpenAI (Conditional)
    sentiment_enabled = (metadata or {}).get("sentiment_analysis", False)
    analytics_data = {}
    summary_error = None
    if sentiment_enabled:
        try:
            analytics_data = await _extract_analytics_with_openai(formatted_transcript)
            if analytics_data.get("summary") == "Analytics processing failed.":
                summary_error = "OpenAI API call returned failure dictionary"
        except Exception as err:
            logger.error(f"OpenAI extraction failed: {err}")
            analytics_data = {
                "summary": "Analytics processing failed.",
                "sentiment": "Unknown",
                "action_items": []
            }
            summary_error = str(err)
    else:
        logger.info(f"Sentiment Analysis is DISABLED for {room_name}. Skipping OpenAI processing.")
        analytics_data = {
            "summary": "Analytics skipped (User Policy).",
            "sentiment": "N/A",
            "action_items": []
        }
    
    # 3. Save everything to the database/Redis
    try:
        # Save the full transcript
        save_transcription(room_name, transcript)
        
        # Merge analytics with metadata for final update
        final_payload = {
            **(metadata or {}),
            "summary": analytics_data.get("summary", "No summary generated."),
            "sentiment": analytics_data.get("sentiment", "Neutral"),
            "action_items": analytics_data.get("action_items", []),
            "processed_at": datetime.utcnow().isoformat()
        }
        if summary_error:
            final_payload["summary_error"] = summary_error
        
        # Update the call record in the DB/Redis
        complete_call_record(room_name=room_name, final_payload=final_payload)
        
        # 4. Sync with Complaints Table (Only if sentiment_enabled)
        if sentiment_enabled:
            recording_id = metadata.get("recording_id")
            sentiment = analytics_data.get("sentiment", "Calm")
            
            try:
                import asyncpg
                db_url = os.getenv("DATABASE_URL")
                if db_url:
                    conn = await asyncpg.connect(db_url)
                    try:
                        await conn.execute("""
                            UPDATE complaints 
                            SET sentiment = $1, recording_id = $2 
                            WHERE room_name = $3
                        """, sentiment, recording_id, room_name)
                        logger.info(f"Updated complaints table with sentiment and recording for room {room_name}")
                    finally:
                        await conn.close()
            except Exception as db_err:
                logger.error(f"Failed to sync sentiment to complaints table: {db_err}")

        logger.info(f"Post-call analytics completed and saved for {room_name}")
        
    except Exception as e:
        logger.error(f"Error saving post-call analytics for {room_name}: {e}")

async def _extract_analytics_with_openai(transcript_text: str) -> dict:
    """Uses OpenAI gpt-4o-mini to analyze the conversation."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not found, skipping OpenAI analytics.")
        return {}

    try:
        client = AsyncOpenAI(api_key=api_key)
        
        prompt = f"""
        Analyze the following conversation transcript from an AI voice agent call.
        Extract the following information in valid JSON format:
        1. "summary": A concise 2-3 sentence summary of the call.
        2. "sentiment": Overall user sentiment. Strictly choose ONE: "Frustrated", "Calm", or "Abusive".
        3. "action_items": A list of specific tasks or follow-ups mentioned in the call.

        Transcript:
        {transcript_text}

        Return ONLY the JSON object.
        """
        
        response = await client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {"role": "system", "content": "You are an analytical assistant that extracts JSON insights from call transcripts."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        result_text = response.choices[0].message.content
        if not result_text:
            return {}

        return json.loads(result_text)
        
    except Exception as e:
        logger.error(f"OpenAI analytics extraction failed: {e}")
        return {
            "summary": "Analytics processing failed.",
            "sentiment": "Unknown",
            "action_items": []
        }
