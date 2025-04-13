import os
import pdfplumber
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader, UnstructuredPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.vectorstores import FAISS
from langchain.schema import Document  # Required for correct formatting

# Define PDF file path
pdf_filename =r"C:\Users\NAVEENKUMAR\Documents\data\The_GALE_ENCYCLOPEDIA_of_MEDICINE_SECOND.pdf"
pdf_dir = r"C:\Users\NAVEENKUMAR\Documents\data"  # Update this if needed
pdf_path = os.path.join(pdf_dir, pdf_filename)  # Handles path correctly

# Step 1: Extract text from PDF
extracted_text = []
with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if text:  # Avoid storing empty pages
            extracted_text.append(text)

# Convert extracted text into a list of Document objects
documents = [Document(page_content=text) for text in extracted_text]

# Step 2: Create Chunks
def create_chunks(documents):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    text_chunks = text_splitter.split_documents(documents)
    return text_chunks

text_chunks = create_chunks(documents)
print("Length of Text Chunks: ", len(text_chunks))

# Step 3: Get embedding model
def get_embedding_model():
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

embedding_model = get_embedding_model()

# Step 4: Store embeddings in FAISS
DB_FAISS_PATH = os.path.join("vectorstore", "db_faiss")  # Proper path handling
os.makedirs(DB_FAISS_PATH, exist_ok=True)  # Ensure directory exists

db = FAISS.from_documents(text_chunks, embedding_model)
db.save_local(DB_FAISS_PATH)

print(f"FAISS vector store saved at: {DB_FAISS_PATH}")

