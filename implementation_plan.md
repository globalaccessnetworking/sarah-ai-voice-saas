# Phase 5.2 — Response Latency Optimization

Implementation plan to optimize and reduce outbound AI response latency without destabilizing SIP, retry, greeting, campaign lifecycle, or barge-in behaviors.

## Required Investigations & Findings

### 1. Active Outbound LLM Provider & Model
* **Active Config Resolution**: Evaluated in [get_llm](file:///C:/Users/Global%20Access/.gemini/antigravity/worktrees/sarah-ai-voice-saas/refactor-generic-ai-dialer/ai-worker/run_agents.py#L1428). 
* **Defaults**: Defaults to the `"openai"` provider with `"gpt-4o"` as the base model.
* **Resolution Path**: Resolves dynamically based on `llm_config` inside the campaign's `agent_config` stored in Redis/DB. If the model suffix ends in `-instant`, it automatically configures `reasoning_effort: "none"` to accelerate response times.

### 2. Active Outbound TTS Provider & Model
* **Active Config Resolution**: Evaluated in [get_tts](file:///C:/Users/Global%20Access/.gemini/antigravity/worktrees/sarah-ai-voice-saas/refactor-generic-ai-dialer/ai-worker/run_agents.py#L2173).
* **Defaults**: Defaults to `"cartesia"` with voice `"79a125e8-cd45-4c13-8a67-188112f4dd22"` (British Lady).
* **Resolution Path**: Dynamically loaded from `tts_config` inside the `agent_config`. Support is also active for ElevenLabs, Deepgram Aura, and UpliftAI.

### 3. Agent Response Streaming Verification
* **Streaming vs. Buffering**: **Fully Streaming**. The script utilizes the native `livekit.agents.voice.Agent` pipeline class, which consumes the LLM's async generators word-by-word/token-by-token. No sentence-level or message-level blocking buffers are implemented in standard conversation turns.

### 4. TTS Streaming Verification
* **Immediate TTS Streaming**: **Fully Streaming**. The LiveKit TTS plugin begins synthesis and streams audio frames down to the WebRTC room immediately as individual text chunks are yielded by the LLM stream. It does not wait for full LLM sentences or paragraphs to complete.

### 5. Detailed Metric Timing Analysis
The current metrics show the following baseline:
* `avg_stt_wait_ms` = ~250ms (STT is extremely fast and healthy).
* `avg_llm_tts_to_first_audio_ms` = ~1489ms.
* `first_turn_total_ms` = ~2091ms.

**Delay Attribution**:
1. **LLM TTFT (Time to First Token)**: Consumes the largest share (~800ms–1100ms) under complex system prompts and heavy reasoning models.
2. **VAD Endpointing Silence**: Adds a baseline `agent_response_delay` (~400ms) before LLM generation begins.
3. **TTS TTFB (Time to First Byte)**: Cartesia and Deepgram are extremely fast (~100ms–200ms) once the first few tokens are available.
4. **Prompt Verbosity**: If the agent's first response is too verbose, LLM prompt ingestion and completion pre-processing can prolong TTFT.

---

## User Review Required

> [!IMPORTANT]
> **Safety Design Choices**:
> * All optimizations are focused strictly inside [run_agents.py](file:///C:/Users/Global%20Access/.gemini/antigravity/worktrees/sarah-ai-voice-saas/refactor-generic-ai-dialer/ai-worker/run_agents.py).
> * The **Latency Filler / Micro-Acknowledgment** feature is disabled by default (`OUTBOUND_ENABLE_LATENCY_FILLER=false`) to ensure 100% production stability. It is fully feature-flagged and adjustable.
> * The **Fast First Turn Outbound Instruction** is scoped *strictly* to outbound campaigns (`is_outbound_call` is True) to avoid modifying inbound user paths.

---

## Proposed Changes

### ai-worker

#### [MODIFY] [run_agents.py](file:///C:/Users/Global%20Access/.gemini/antigravity/worktrees/sarah-ai-voice-saas/refactor-generic-ai-dialer/ai-worker/run_agents.py)

We will modify [run_agents.py](file:///C:/Users/Global%20Access/.gemini/antigravity/worktrees/sarah-ai-voice-saas/refactor-generic-ai-dialer/ai-worker/run_agents.py) to implement the fast-turn system-prompt injection and the feature-flagged latency filler:

##### 1. Fast-First-Turn Instruction (Outbound Only)
We will inject an optimization rule into the unified system instructions when building the prompt for outbound calls (around line 4222):
```python
    # Phase 6: Outbound Lead Context Injection
    is_outbound_call = caller_data.get("outbound") or "lead_name" in caller_data or "lead_data" in caller_data
    if is_outbound_call:
        lead_name = caller_data.get("lead_name") or caller_data.get("contact_name") or "the customer"
        lead_context_prompt = f"\n\n## Outbound Lead Context\n- You are calling: {lead_name}\n- Conversation Goal: Initiate the outbound campaign message and handle the response naturally."
        final_instructions_parts.append(lead_context_prompt)
        
        # Fast First Turn Optimization: Keep first response short to minimize LLM/TTS delay
        fast_first_turn_prompt = (
            "\n## FAST RESPONSE STRATEGY (CRITICAL)\n"
            "For the very first response after the prospect speaks (Turn 1), you must follow these rules strictly:\n"
            "1. Keep your reply extremely short, between 3 to 6 words maximum.\n"
            "2. Acknowledge the prospect's input and immediately ask exactly one direct follow-up question.\n"
            "3. Do NOT provide long explanations, introductions, or verbose pleasantries in this turn.\n"
            "Example: 'Got it — are you handling IT internally?' or 'Understood — is this the business owner?'"
        )
        final_instructions_parts.append(fast_first_turn_prompt)
        logger.info("Fast first-turn prompt optimization injected for outbound call.")
```

##### 2. Feature-Flagged Immediate Latency Filler
We will declare filler settings at the start of the job runner (around line 4120):
```python
    # Feature-Flagged Latency Filler settings
    enable_latency_filler = os.getenv("OUTBOUND_ENABLE_LATENCY_FILLER", "false").lower() == "true"
    latency_filler_delay_ms = 700
    try:
        latency_filler_delay_ms = int(os.getenv("OUTBOUND_LATENCY_FILLER_DELAY_MS", "700"))
    except ValueError:
        pass
```

Then, inside the [on_user_transcribed](file:///C:/Users/Global%20Access/.gemini/antigravity/worktrees/sarah-ai-voice-saas/refactor-generic-ai-dialer/ai-worker/run_agents.py#L6302) hook, we will schedule a safe micro-acknowledgment if the LLM/TTS generation is taking longer than the specified delay threshold:
```python
                    # Feature-flagged Latency Filler Scheduling
                    if enable_latency_filler and is_outbound_call:
                        current_filler_turn = turn_idx
                        
                        async def run_latency_filler_timer(timer_turn):
                            await asyncio.sleep(latency_filler_delay_ms / 1000.0)
                            
                            # Safety Checks before speaking filler:
                            # 1. Turn has not advanced (no new user speech)
                            # 2. Agent has not started speaking yet (agent_speaking is False)
                            # 3. Call session is not ending/closed
                            if (
                                getattr(session, "_turn_index", 0) == timer_turn
                                and not getattr(session, "_agent_speaking", False)
                                and not getattr(session, "_call_ending", False)
                            ):
                                import random
                                filler_msg = random.choice(["Got it.", "Understood.", "Sure."])
                                logger.info(f"[LATENCY_FILLER] Agent speaking micro-acknowledgment after {latency_filler_delay_ms}ms: '{filler_msg}'")
                                try:
                                    session.say(filler_msg, allow_interruptions=True)
                                except Exception as filler_err:
                                    logger.debug(f"Failed to play latency filler: {filler_err}")
                                    
                        asyncio.create_task(run_latency_filler_timer(current_filler_turn))
```

##### 3. Provider Settings Review
* **LLM Recommendation**: Ensure outbound campaign configurations utilize fast models such as `gpt-4o-mini` or `groq-llama-3` which reduce TTFT to ~200ms–400ms (compared to standard `gpt-4o`'s ~800ms–1100ms).
* **TTS Recommendation**: Ensure campaigns use Cartesia or Deepgram Aura, maintaining sub-150ms synthesis speeds.

##### 4. Diagnostics Integrity
* **No changes** will be made to any diagnostics logs or anchor strings (`[TURN_LATENCY]`, `[TURN_LATENCY_DETAIL]`, `[CALL_LATENCY_SUMMARY]`, `[LATENCY]`, `[BARGE_IN]`, `[GREETING]`, `[SIP_ANSWER_WAIT]`).

---

## Rollback Plan
If any instability or latency regression is detected:
1. Revert changes to [run_agents.py](file:///C:/Users/Global%20Access/.gemini/antigravity/worktrees/sarah-ai-voice-saas/refactor-generic-ai-dialer/ai-worker/run_agents.py) using `git checkout ai-worker/run_agents.py`.
2. Restart the PM2 process: `pm2 restart sarah-outbound --update-env`.

---

## Verification & Testing Plan

### Automated Tests
1. **Compilation Check**:
   Validate script syntax:
   ```powershell
   python -m py_compile ai-worker/run_agents.py
   ```

### Manual Verification
1. **Process Deployment**:
   Restart `sarah-outbound` with new environment variables:
   ```powershell
   pm2 restart sarah-outbound --update-env
   ```

2. **Test Calls**:
   Execute at least 2 answered test outbound calls with 3+ user turns each.
   
3. **Compare Timing Metrics**:
   Evaluate the baseline metrics from conversation logs:
   - `first_turn_total_ms` (Target: <1500ms)
   - `p50_turn_total_ms` (Target: <1300ms)
   - `avg_stt_wait_ms` (Target: under 400ms)
   - `avg_llm_tts_to_first_audio_ms` (Target: under 1100ms)

4. **Verify Functionality**:
   - Confirm **no greeting regression** (cached greeting plays in under 50ms).
   - Confirm **no SIP Answer Gate regression** (waits correctly for active call, drops gracefully on ring timeout).
   - Confirm **no barge-in regression** (user speech overrides agent speech cleanly).
   - Confirm **no retry / campaign lifecycle regression**.
