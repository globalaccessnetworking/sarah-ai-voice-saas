import re
import json

def normalize_key(key):
    """Normalize a key to lowercase with underscores, safely."""
    if not isinstance(key, str):
        key = str(key)
    # Replace non-alphanumeric with underscore, strip leading/trailing underscores, lower
    return re.sub(r'[^a-zA-Z0-9]+', '_', key).strip('_').lower()

def normalize_lead_data(data):
    """Normalize a dictionary of lead data."""
    if not isinstance(data, dict):
        return {}
    
    normalized_data = {}
    for k, v in data.items():
        if isinstance(v, dict):
            # Flatten 1 level deep for nested config or lead fields
            for sub_k, sub_v in v.items():
                norm_key = normalize_key(sub_k)
                if norm_key:
                    normalized_data[norm_key] = sub_v
        else:
            norm_key = normalize_key(k)
            if norm_key:
                normalized_data[norm_key] = v
                
    # Standardize name aliases for fallback
    c_name = (
        normalized_data.get("name") or 
        normalized_data.get("contact_name") or 
        normalized_data.get("lead_name") or 
        normalized_data.get("caller_name") or 
        ""
    )
    if c_name:
        normalized_data["name"] = c_name
        normalized_data["contact_name"] = c_name
        normalized_data["lead_name"] = c_name
        
    return normalized_data

def render_template(text, data):
    """
    Render a template string supporting any {{dynamic_key}} from lead_data.
    Missing variables are replaced with an empty string.
    """
    if not text or not isinstance(text, str):
        return text
        
    normalized_data = normalize_lead_data(data)
    
    # Find all {{variable}} or {variable} occurrences
    matches = re.findall(r'\{\{([^}]+)\}\}|\{([^}]+)\}', text)
    variables = [m[0] or m[1] for m in matches]
    
    for var in variables:
        var_norm = normalize_key(var)
        # Safely replace missing keys with empty string to avoid crashes
        replacement = str(normalized_data.get(var_norm, ""))
        text = text.replace(f"{{{{{var}}}}}", replacement).replace(f"{{{var}}}", replacement)
        
    # Extra safety: Clean up multiple spaces that might result from empty replacements
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def build_lead_context(lead_data):
    """
    Safely inject lead_data into the LLM prompt.
    Caps large values and skips empty fields to prevent huge raw JSON dumps.
    """
    if not lead_data or not isinstance(lead_data, dict):
        return ""
        
    normalized = normalize_lead_data(lead_data)
    
    # Filter empty and cap long values
    clean_data = {}
    for k, v in normalized.items():
        if v is None or v == "":
            continue
        val_str = str(v)
        # Cap values to reasonable length (e.g., 200 chars max)
        if len(val_str) > 200:
            val_str = val_str[:197] + "..."
        clean_data[k] = val_str
        
    if not clean_data:
        return ""
        
    context_json = json.dumps(clean_data, indent=2)
    
    prompt_injection = f"""
<LEAD_DATA>
{context_json}
</LEAD_DATA>
<LEAD_DATA_INSTRUCTIONS>
Use lead_data naturally. Do not mention every field. Use only one or two relevant details. Do not pretend you researched the lead unless the data was provided. Ask one short question at a time.
</LEAD_DATA_INSTRUCTIONS>
"""
    return prompt_injection
