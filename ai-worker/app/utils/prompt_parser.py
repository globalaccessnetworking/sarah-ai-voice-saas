import re
import logging

logger = logging.getLogger("ai_worker.utils.prompt_parser")

def parse_context_variables(text: str, caller_data: dict = None) -> str:
    """
    Parses a string containing {{Variable}} placeholders and replaces them with 
    actual data from caller_data.
    
    Args:
        text (str): The template string (e.g., system prompt or greeting).
        caller_data (dict): Dictionary mapping variable names to values.
        
    Returns:
        str: The string with variables replaced.
    """
    if not text:
        return ""
        
    if caller_data is None:
        caller_data = {}
        
    # Default mappings for common variables if not provided
    defaults = {
        "Name": "Customer",
        "FirstName": "Customer",
        "LastName": "",
        "CompanyName": "the company",
        "AgentName": "AI Assistant"
    }
    
    # Merge defaults with actual data
    context = {**defaults, **caller_data}
    
    # Find all occurrences of {{Variable}}
    pattern = r"\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}"
    
    def replace_var(match):
        var_name = match.group(1)
        # Try exact match first, then case-insensitive
        val = context.get(var_name)
        if val is None:
            # Try searching case-insensitively
            for k, v in context.items():
                if k.lower() == var_name.lower():
                    val = v
                    break
        
        if val is None:
            logger.debug(f"Variable '{{{{{var_name}}}}}' not found in context, leaving as is or using generic default.")
            return match.group(0) # Keep as {{Variable}} if absolutely no match found
            
        return str(val)

    parsed_text = re.sub(pattern, replace_var, text)
    return parsed_text
