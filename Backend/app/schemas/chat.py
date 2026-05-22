from pydantic import BaseModel

class ChatRequest(BaseModel):
    query: str
    


# pydantic model for chat request, currently only has the query string but can be extended in the future if we want to add more parameters like top_k, temperature, etc.
# pydantic models can be extended in the future if we want to add more parameters like top_k, temperature, etc.
