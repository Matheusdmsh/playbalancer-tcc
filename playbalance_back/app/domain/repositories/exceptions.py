class NotFoundException(Exception):
    """Exception raised when an entity is not found."""
    pass

class UnauthorizedException(Exception):
    """Exception raised when a user is not authorized to perform an action."""
    pass

class DuplicationException(Exception):
    """Exception raised when a duplicate entity is found."""
    pass