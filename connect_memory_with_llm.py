import os
import fitz  # PyMuPDF for PDF text extraction
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEndpoint

#  Set FAISS Vectorstore Path
DB_FAISS_PATH = r"C:\Users\NAVEENKUMAR\Documents\data\vectorstore"
PDF_PATH = r"C:\Users\NAVEENKUMAR\Documents\data\The_GALE_ENCYCLOPEDIA_of_MEDICINE_SECOND.pdf"

# Step 1: Extract Text from PDF
def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text("text") + "\n"
    return text

# Step 2: Build FAISS Index from PDF
index_file_path = os.path.join(DB_FAISS_PATH, "index.faiss")
if not os.path.exists(index_file_path):
    print("⚠️ FAISS index not found! Creating a new one...")

    # Load embedding model
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # Extract text from PDF and split into chunks
    text_data = extract_text_from_pdf(PDF_PATH)
    text_chunks = text_data.split("\n\n")  # Simple chunking, refine if needed

    # Create FAISS index
    db = FAISS.from_texts(text_chunks, embedding_model)
    db.save_local(DB_FAISS_PATH)
    print("FAISS index created and saved at:", DB_FAISS_PATH)
else:
    print(" FAISS index found. Loading...")
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = FAISS.load_local(DB_FAISS_PATH, embedding_model, allow_dangerous_deserialization=True)

# Step 3: Load LLM (Mistral with HuggingFace)
HF_TOKEN = os.environ.get("HF_TOKEN")
HUGGINGFACE_REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3"

def load_llm(huggingface_repo_id):
    return HuggingFaceEndpoint(
        repo_id=huggingface_repo_id,
        temperature=0.5,
        model_kwargs={"token": HF_TOKEN, "max_length": "200"}
    )

#  Step 4: Define Custom Prompt
CUSTOM_PROMPT_TEMPLATE = """
Use the pieces of information provided in the context to answer user's question.
If you don't know the answer, just say that you don't know. Don't make up an answer.
Don't provide anything out of the given context.

Context: {context}
Question: {question}

Start the answer directly. No small talk please.
"""

def set_custom_prompt():
    return PromptTemplate(template=CUSTOM_PROMPT_TEMPLATE, input_variables=["context", "question"])

#  Step 5: Create QA Chain
qa_chain = RetrievalQA.from_chain_type(
    llm=load_llm(HUGGINGFACE_REPO_ID),
    chain_type="stuff",
    retriever=db.as_retriever(search_kwargs={'k': 3}),
    return_source_documents=True,
    chain_type_kwargs={'prompt': set_custom_prompt()}
)

#  Step 6: Run Query
user_query = input("Write Query Here: ")
response = qa_chain.invoke({'query': user_query})

#  Step 7: Display Results
print("\nRESULT: ", response["result"])
print("\nSOURCE DOCUMENTS: ", response["source_documents"])



