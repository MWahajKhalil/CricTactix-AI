import os
import sys
import numpy as np

# Runtime patch for NumPy 2.0 compatibility with older chromadb versions
if not hasattr(np, "float_"):
    np.float_ = np.float64

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

# Import LlamaIndex components
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
import chromadb

# Ensure Backend is in sys.path when running this service standalone/directly
backend_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.core.config import settings

def query_match_reports(query_str: str) -> str:
    """
    Connects to the persistent ChromaDB, loads the 'match_reports' collection index,
    queries it using LlamaIndex, and returns the response string.
    """
    # Resolve paths
    chroma_db_path = os.path.abspath(settings.CHROMA_DB_PATH)
    
    # Initialize Persistent Chroma DB client
    db_client = chromadb.PersistentClient(path=chroma_db_path)
    
    # Get the collection
    collection_name = "match_reports"
    chroma_collection = db_client.get_or_create_collection(collection_name)
    
    # Set up Vector Store
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # Configure LlamaIndex Embeddings settings
    Settings.embed_model = OpenAIEmbedding(
        model="text-embedding-3-small",
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Load index from vector store
    index = VectorStoreIndex.from_vector_store(
        vector_store=vector_store
    )
    
    # Create query engine and query
    # We use similarity_top_k=3 to retrieve the most relevant chunks
    query_engine = index.as_query_engine(similarity_top_k=3)
    response = query_engine.query(query_str)
    
    return str(response)

if __name__ == "__main__":
    # Small test script to verify connection and querying
    if len(sys.argv) > 1:
        test_query = " ".join(sys.argv[1:])
    else:
        test_query = "Who won the final match of PSL 2026 and who was the player of the match?"
        
    print(f"Testing RAG query: '{test_query}'...")
    try:
        res = query_match_reports(test_query)
        print("\nResponse:")
        print(res)
    except Exception as e:
        print(f"Error testing RAG query: {e}")
