import os
import logging
import random
import asyncpg
from typing import Annotated
from livekit.agents import llm, function_tool
 
logger = logging.getLogger("SubmitComplaintTool")
 
@function_tool(
    description="Call this ONLY at the very end of the conversation when ALL 6 pieces of data (Issue, Name, Phone, District, Address, Landmark) are collected to submit the final complaint."
)
async def submit_ticket(
    caller_name: Annotated[str, "The full name of the citizen/caller"],
    phone_number: Annotated[str, "The citizen's mobile number for contact"],
    issue_type: Annotated[str, "Brief but clear description of the waste/garbage complaint"],
    district: Annotated[str, "The specific district name in Punjab"],
    detailed_address: Annotated[str, "House number, street name, and UC details"],
    landmark: Annotated[str, "A nearby recognizable landmark for the location"]
):
    try:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            mock_id = str(random.randint(1000, 9999))
            logger.warning("DATABASE_URL not set, returning mock ID.")
            return f"Success. The complaint has been registered. Tell the user their Complaint ID is {mock_id} and say Allah Hafiz."

        conn = await asyncpg.connect(db_url)
        try:
            # Table Schema: id, name, phone, district, address, landmark, issue, created_at
            row = await conn.fetchrow("""
                INSERT INTO complaints (name, phone, issue, district, address, landmark)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            """, caller_name, phone_number, issue_type, district, detailed_address, landmark)
            
            complaint_id = row['id']
            logger.info(f"Complaint {complaint_id} successfully saved to PostgreSQL database.")
            return f"Success. The complaint has been registered. Tell the user their Complaint ID is {complaint_id} and say Allah Hafiz."
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Database error: {e}")
        return f"Error: Could not register complaint. Please try again later. (Error: {str(e)})"