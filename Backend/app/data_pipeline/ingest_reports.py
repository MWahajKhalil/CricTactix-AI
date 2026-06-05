import os
import sys
import numpy as np
# Runtime patch for NumPy 2.0 compatibility with older chromadb versions
if not hasattr(np, "float_"):
    np.float_ = np.float64

from dotenv import load_dotenv, find_dotenv

# Load env variables (API Keys, Paths)
load_dotenv(find_dotenv())

# Add the Backend directory to the sys path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import settings

# LlamaIndex Imports
from llama_index.core import SimpleDirectoryReader, StorageContext, VectorStoreIndex, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
import chromadb

def ingest_match_reports():
    """Reads raw match reports, chunks and embeds them, and persists them into ChromaDB."""
    # Resolve paths
    chroma_db_path = os.path.abspath(settings.CHROMA_DB_PATH)
    reports_dir = os.path.abspath(settings.REPORTS_DIR)
    
    # Ensure directories exist
    os.makedirs(reports_dir, exist_ok=True)
    os.makedirs(chroma_db_path, exist_ok=True)
    
    # Initialize Persistent Chroma DB client
    print(f"Connecting to persistent ChromaDB at: {chroma_db_path}")
    db_client = chromadb.PersistentClient(path=chroma_db_path)
    
    # Create or get collection
    collection_name = "match_reports"
    chroma_collection = db_client.get_or_create_collection(collection_name)
    
    # Set up Vector Store and Storage Context
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    # Configure LlamaIndex Embeddings model
    print("Configuring LlamaIndex Embeddings settings...")
    Settings.embed_model = OpenAIEmbedding(
        model="text-embedding-3-small",
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Scan for files
    files = [f for f in os.listdir(reports_dir) if os.path.isfile(os.path.join(reports_dir, f))]
    if not files:
        print(f"Warning: No match reports found in '{reports_dir}'. Placing an empty file for initialization.")
        # Create a dummy initialization file if completely empty
        init_file = os.path.join(reports_dir, ".init_check")
        with open(init_file, "w") as f:
            f.write("CricTactix Vector Store Initialized.")
    
    # Load documents from directory
    print(f"Reading match reports from: {reports_dir}")
    reader = SimpleDirectoryReader(input_dir=reports_dir)
    documents = reader.load_data()
    print(f"Loaded {len(documents)} document page(s).")
    
    # Create Index and persist
    print("Building vector index and saving to ChromaDB...")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        show_progress=True
    )
    
    print(f"Successfully indexed and persisted reports into ChromaDB collection '{collection_name}'!")

if __name__ == "__main__":
    ingest_match_reports()
