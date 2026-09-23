export type PolicyDocument = {
  id: string;
  title: string;
  severity: string;
  framework: string;
  domain: string;
  fileName: string;
  text: string;
};

export type PolicyChunk = {
  chunkId: string;
  policyId: string;
  title: string;
  heading: string;
  text: string;
  sourceFile: string;
};

export type RetrievalHit = PolicyChunk & {
  score: number;
  lexicalRank: number;
  denseRank: number;
};

export type RetrieveOptions = {
  k?: number;
};
