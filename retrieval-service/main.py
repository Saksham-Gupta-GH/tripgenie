import os
from functools import lru_cache

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer, util


class Plan(BaseModel):
    id: str
    title: str
    destination: str
    numberOfDays: int = 0
    budget: float = 0
    itinerary: list[str] = Field(default_factory=list)


class RankRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    plans: list[Plan] = Field(max_length=100)
    top_k: int = Field(default=4, ge=1, le=10)


class RankedPlan(Plan):
    score: float


class RankResponse(BaseModel):
    plans: list[RankedPlan]
    model: str


app = FastAPI(title="TripGenie PyTorch Retriever", version="1.0.0")


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    return SentenceTransformer(os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"))


def verify_token(authorization: str | None = Header(default=None)) -> None:
    expected = os.getenv("RETRIEVAL_SERVICE_TOKEN")
    if expected and authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/rank", response_model=RankResponse, dependencies=[Depends(verify_token)])
def rank(request: RankRequest) -> RankResponse:
    model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    if not request.plans:
        return RankResponse(plans=[], model=model_name)

    model = get_model()
    documents = [" ".join([plan.title, plan.destination, *plan.itinerary]) for plan in request.plans]
    query_embedding = model.encode(request.query, convert_to_tensor=True, normalize_embeddings=True)
    plan_embeddings = model.encode(documents, convert_to_tensor=True, normalize_embeddings=True)
    scores = util.cos_sim(query_embedding, plan_embeddings)[0]
    top_results = scores.topk(k=min(request.top_k, len(request.plans)))
    ranked = [
        RankedPlan(**request.plans[index].model_dump(), score=float(score))
        for score, index in zip(top_results.values.tolist(), top_results.indices.tolist())
    ]
    return RankResponse(plans=ranked, model=model_name)
