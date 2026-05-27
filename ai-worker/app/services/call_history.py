import os
import json
import logging
import psycopg2
from datetime import datetime

def make_json_safe(value):
    """
    Recursively sanitizes values to be JSON-serializable.
    Converts UUID -> str, datetime/date -> isoformat, Decimal -> float, etc.
    """
    import uuid
    from decimal import Decimal
    from datetime import datetime as dt, date
    
    if isinstance(value, dict):
        return {str(k): make_json_safe(v) for k, v in value.items()}
    elif isinstance(value, (list, tuple, set)):
        return [make_json_safe(v) for v in value]
    elif isinstance(value, uuid.UUID):
        return str(value)
    elif isinstance(value, (dt, date)):
        return value.isoformat()
    elif isinstance(value, Decimal):
        return float(value)
    elif value is None or isinstance(value, (str, int, float, bool)):
        return value
    else:
        try:
            return str(value)
        except Exception:
            return None


logger = logging.getLogger("ai_worker.services.call_history")

# Global connection string
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    if not DATABASE_URL:
        # Avoid spamming logs if DB is intentionally disabled
        return None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        return None

def find_canonical_row_for_room(cur, room_name: str) -> str:
    """
    Selects one canonical row ID deterministically from multiple rows for the same room_name.
    Priority:
    1. row with positive duration_seconds
    2. row with non-empty transcript
    3. row with non-empty summary
    4. row with richer metadata (larger length of json string or key count)
    5. latest created_at as final fallback
    """
    cur.execute(
        """
        SELECT id, duration_seconds, transcript, summary, metadata, created_at
        FROM call_logs
        WHERE room_name = %s
        """,
        (room_name,)
    )
    rows = cur.fetchall()
    if not rows:
        return None
    if len(rows) == 1:
        return rows[0][0]
        
    # Helper to calculate rich metadata score
    def get_meta_score(meta_val):
        if not meta_val:
            return 0
        if isinstance(meta_val, dict):
            return len(meta_val)
        if isinstance(meta_val, str):
            try:
                parsed = json.loads(meta_val)
                return len(parsed) if isinstance(parsed, dict) else 0
            except:
                return 0
        return 0

    def sort_key(r):
        row_id, duration, transcript, summary, metadata, created_at = r
        
        has_duration = 1 if (duration and duration > 0) else 0
        
        has_transcript = 0
        if transcript:
            if isinstance(transcript, list) and len(transcript) > 0:
                has_transcript = 1
            elif isinstance(transcript, str):
                try:
                    parsed = json.loads(transcript)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        has_transcript = 1
                except:
                    pass
                    
        has_summary = 1 if (summary and str(summary).strip() and not str(summary).strip() == "Analytics skipped (User Policy).") else 0
        meta_score = get_meta_score(metadata)
        created_time = created_at or datetime.min
        
        # Priority order represented as a tuple for sorting:
        # Highest is better, so we sort by (has_duration, has_transcript, has_summary, meta_score, created_time) DESC
        return (has_duration, has_transcript, has_summary, meta_score, created_time)

    sorted_rows = sorted(rows, key=sort_key, reverse=True)
    canonical_id = sorted_rows[0][0]
    logger.info(f"[CALL_LOG_PERSIST] canonical_selected room_name={room_name} id={canonical_id} total_rows={len(rows)}")
    return canonical_id

def create_call_record(call_id: str, agent_id: str, room_name: str, direction: str = "inbound", from_number: str = None, to_number: str = None, metadata: dict = None):
    """Creates a new record in call_logs, or updates an existing record for the same room_name to prevent duplicate rows."""
    logger.info(f"Creating call record: {call_id} for agent {agent_id} in room {room_name}")
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor() as cur:
            # 1. Acquire transaction-level exclusive advisory lock based on room_name
            if room_name:
                cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (room_name,))
                logger.info(f"[CALL_LOG_PERSIST] action=advisory_lock_acquired room_name={room_name}")
            
            # 2. Check if a record with the same room_name already exists using canonical priority
            existing_id = None
            existing_metadata = {}
            if room_name:
                existing_id = find_canonical_row_for_room(cur, room_name)
                if existing_id:
                    cur.execute("SELECT metadata FROM call_logs WHERE id = %s", (existing_id,))
                    row = cur.fetchone()
                    if row and row[0]:
                        if isinstance(row[0], dict):
                            existing_metadata = row[0]
                        elif isinstance(row[0], str):
                            try:
                                existing_metadata = json.loads(row[0])
                            except:
                                pass

            # 3. Merge metadata
            merged_metadata = {**existing_metadata}
            if metadata:
                merged_metadata.update(metadata)
            
            # Sanitize metadata recursively before serialization
            merged_metadata = make_json_safe(merged_metadata)

            if existing_id:
                # Update existing record for this room_name to keep it canonical
                logger.info(f"[CALL_LOG_PERSIST] action=update_existing room_name={room_name} id={existing_id}")
                cur.execute(
                    """
                    UPDATE call_logs
                    SET agent_id = %s,
                        direction = %s,
                        from_number = COALESCE(%s, from_number),
                        to_number = COALESCE(%s, to_number),
                        metadata = %s
                    WHERE id = %s
                    """,
                    (agent_id, direction, from_number, to_number, json.dumps(merged_metadata), existing_id)
                )
                resolved_id = existing_id
            else:
                # Insert new record
                logger.info(f"[CALL_LOG_PERSIST] action=create room_name={room_name} id={call_id}")
                cur.execute(
                    """
                    INSERT INTO call_logs (id, agent_id, room_name, direction, from_number, to_number, status, started_at, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET 
                        room_name = EXCLUDED.room_name, 
                        metadata = EXCLUDED.metadata
                    """,
                    (call_id, agent_id, room_name, direction, from_number, to_number, "ongoing", datetime.utcnow(), json.dumps(merged_metadata))
                )
                resolved_id = call_id
                
        conn.commit()
        return resolved_id
    except Exception as e:
        logger.error(f"Error creating call record: {e}")
        return None
    finally:
        conn.close()

def save_transcription(call_id_or_room: str, transcript: list):
    """Updates the transcript field for call logs matching the room name or ID."""
    logger.info(f"Saving transcription for {call_id_or_room}")
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor() as cur:
            # 1. First, check if a row matches the ID
            cur.execute("SELECT id, room_name FROM call_logs WHERE id = %s", (call_id_or_room,))
            row = cur.fetchone()
            
            canonical_id = None
            room_name = None
            if row:
                canonical_id = row[0]
                room_name = row[1]
            else:
                # If no ID matches, treat parameter as room_name and select canonical row
                room_name = call_id_or_room
                canonical_id = find_canonical_row_for_room(cur, room_name)

            if not canonical_id:
                logger.warning(f"No call log record found for save_transcription by key {call_id_or_room}")
                return

            # Acquire transaction-level advisory lock
            if room_name:
                cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (room_name,))
                logger.info(f"[CALL_LOG_PERSIST] action=advisory_lock_acquired room_name={room_name}")

            # Do not overwrite a non-empty transcript with an empty one
            if not transcript:
                # Fetch existing transcript to prevent overwriting with blank/empty
                cur.execute("SELECT transcript FROM call_logs WHERE id = %s", (canonical_id,))
                existing_row = cur.fetchone()
                if existing_row and existing_row[0]:
                    logger.info(f"[CALL_LOG_PERSIST] downgrade_protected field=transcript existing=non_empty incoming=empty")
                    # Keep existing
                    return

            logger.info(f"[CALL_LOG_PERSIST] action=save_transcription id={canonical_id} room_name={room_name} segments={len(transcript)}")
            cur.execute(
                """
                UPDATE call_logs 
                SET transcript = %s
                WHERE id = %s
                """,
                (json.dumps(transcript), canonical_id)
            )
        conn.commit()
    except Exception as e:
        logger.error(f"Error saving transcription: {e}")
    finally:
        conn.close()

def complete_call_record(call_id_or_room: str = None, final_payload: dict = None, room_name: str = None, call_id: str = None, **kwargs):
    """Finalizes a call record defensively, merging metadata and preventing downgrades."""
    # Robustly resolve final_payload
    if final_payload is None:
        final_payload = kwargs.get("final_payload") or {}

    # Extract all possible identifiers
    candidate_id = call_id or kwargs.get("id")
    candidate_room = room_name

    logger.info(f"Completing call record for call_id_or_room={call_id_or_room}, room_name={room_name}, call_id={call_id}")
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor() as cur:
            # 1. Resolve canonical row
            canonical_id = None
            resolved_room_name = None

            # First, check by explicitly provided IDs
            id_candidates = []
            if candidate_id:
                id_candidates.append(candidate_id)
            if call_id_or_room:
                id_candidates.append(call_id_or_room)
            
            for cid in id_candidates:
                if cid:
                    cur.execute("SELECT id, room_name FROM call_logs WHERE id = %s", (cid,))
                    row = cur.fetchone()
                    if row:
                        canonical_id = row[0]
                        resolved_room_name = row[1]
                        break

            # Next, check by room name if ID not found or if room name was explicitly provided
            if not canonical_id:
                room_candidates = []
                if candidate_room:
                    room_candidates.append(candidate_room)
                if call_id_or_room:
                    room_candidates.append(call_id_or_room)
                
                for rname in room_candidates:
                    if rname:
                        canonical_id = find_canonical_row_for_room(cur, rname)
                        if canonical_id:
                            resolved_room_name = rname
                            break

            # Print explicit log exactly as requested:
            # [CALL_LOG_PERSIST] complete_call_record args_resolved id=<id> room_name=<room_name>
            logger.info(f"[CALL_LOG_PERSIST] complete_call_record args_resolved id={canonical_id} room_name={resolved_room_name}")

            if not canonical_id:
                logger.warning(f"No existing call log found to complete for call_id_or_room={call_id_or_room}, room_name={room_name}, call_id={call_id}")
                return

            room_name = resolved_room_name

            # 2. Acquire transaction lock
            if room_name:
                cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (room_name,))
                logger.info(f"[CALL_LOG_PERSIST] action=advisory_lock_acquired room_name={room_name}")

            # 3. Fetch current status of the row
            cur.execute(
                "SELECT duration_seconds, summary, transcript, metadata FROM call_logs WHERE id = %s",
                (canonical_id,)
            )
            existing_row = cur.fetchone()
            if not existing_row:
                return

            existing_duration, existing_summary, existing_transcript, existing_metadata_raw = existing_row

            # Parse existing metadata safely
            existing_metadata = {}
            if existing_metadata_raw:
                if isinstance(existing_metadata_raw, dict):
                    existing_metadata = existing_metadata_raw
                elif isinstance(existing_metadata_raw, str):
                    try:
                        existing_metadata = json.loads(existing_metadata_raw)
                    except:
                        pass

            # 4. Downgrade protection - Duration
            incoming_duration = final_payload.get("duration", final_payload.get("duration_seconds", 0))
            resolved_duration = int(incoming_duration) if incoming_duration is not None else 0
            if existing_duration and existing_duration > resolved_duration:
                logger.info(f"[CALL_LOG_PERSIST] downgrade_protected field=duration existing={existing_duration} incoming={resolved_duration}")
                resolved_duration = existing_duration

            # 5. Downgrade protection - Summary
            # Auto-summary disabled policy behavior
            incoming_summary = final_payload.get("summary")
            resolved_summary = incoming_summary
            
            # Policy check: Do not overwrite a real existing summary with policy placeholders or None
            is_policy_placeholder = str(incoming_summary).strip() == "Analytics skipped (User Policy)."
            if not incoming_summary or is_policy_placeholder:
                if existing_summary and str(existing_summary).strip() and not str(existing_summary).strip() == "Analytics skipped (User Policy).":
                    logger.info(f"[CALL_LOG_PERSIST] downgrade_protected field=summary existing=non_empty incoming={incoming_summary}")
                    resolved_summary = existing_summary
                elif is_policy_placeholder:
                    resolved_summary = "Analytics skipped (User Policy)."

            # 6. Downgrade protection - Transcript
            incoming_transcript = final_payload.get("transcript")
            resolved_transcript = incoming_transcript
            if resolved_transcript is not None:
                # Validate if new transcript is empty
                is_incoming_empty = False
                if isinstance(resolved_transcript, list) and not resolved_transcript:
                    is_incoming_empty = True
                elif isinstance(resolved_transcript, str):
                    try:
                        parsed = json.loads(resolved_transcript)
                        if isinstance(parsed, list) and not parsed:
                            is_incoming_empty = True
                    except:
                        pass
                
                if is_incoming_empty and existing_transcript:
                    # Check if existing has items
                    has_existing_items = False
                    if isinstance(existing_transcript, list) and existing_transcript:
                        has_existing_items = True
                    elif isinstance(existing_transcript, str):
                        try:
                            parsed = json.loads(existing_transcript)
                            if isinstance(parsed, list) and parsed:
                                has_existing_items = True
                        except:
                            pass
                    if has_existing_items:
                        logger.info(f"[CALL_LOG_PERSIST] downgrade_protected field=transcript existing=non_empty incoming=empty")
                        resolved_transcript = existing_transcript
            else:
                # If incoming doesn't mention transcript, keep existing
                resolved_transcript = existing_transcript if existing_transcript else None

            # 7. Merge metadata safely
            merged_metadata = {**existing_metadata}
            # Clean and merge final_payload fields into merged_metadata
            for k, v in final_payload.items():
                if v is not None and v != "":
                    # Skip database column fields that we write directly
                    if k not in ("summary", "duration", "duration_seconds", "transcript"):
                        merged_metadata[k] = v

            # Sanitize metadata recursively before serialization
            merged_metadata = make_json_safe(merged_metadata)

            logger.info(f"[CALL_LOG_PERSIST] action=metadata_merge room_name={room_name} id={canonical_id}")

            # 8. Perform the database update
            # Save the transcript column safely if we have a resolved_transcript
            transcript_serialized = None
            if resolved_transcript is not None:
                transcript_serialized = json.dumps(resolved_transcript) if not isinstance(resolved_transcript, str) else resolved_transcript

            cur.execute(
                """
                UPDATE call_logs 
                SET status = 'completed',
                    summary = %s,
                    duration_seconds = %s,
                    metadata = %s,
                    ended_at = %s
                WHERE id = %s
                """,
                (
                    resolved_summary,
                    resolved_duration,
                    json.dumps(merged_metadata),
                    datetime.utcnow(),
                    canonical_id
                )
            )
            
            # Explicitly sync the transcript column if we resolved it
            if transcript_serialized is not None:
                cur.execute(
                    """
                    UPDATE call_logs
                    SET transcript = %s
                    WHERE id = %s
                    """,
                    (transcript_serialized, canonical_id)
                )

        conn.commit()
        logger.info(f"[CALL_LOG_PERSIST] complete_call_record finished id={canonical_id} room_name={room_name}")
    except Exception as e:
        logger.error(f"Error completing call record defensively: {e}")
    finally:
        conn.close()

def delete_call(call_id: str):
    """Deletes a call record (optional)."""
    conn = get_db_connection()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM call_logs WHERE id = %s", (call_id,))
        conn.commit()
    finally:
        conn.close()
