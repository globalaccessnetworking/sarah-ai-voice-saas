# Suthra Punjab AI Tool Base Module
# This file is required for the tool registry and backward compatibility with obfuscated services.

import logging

logger = logging.getLogger("tools.base")

class ToolError(Exception):
    """Base exception for tool-related errors."""
    pass

class BaseTool:
    """Base class for all system tools."""
    def __init__(self, context=None):
        self.context = context
