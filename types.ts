
export interface GeneratedContent {
  longScript: string;
  shortScript: string;
  titles: string[];
  description: string;
  tags: string;
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  }
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  previewText: string;
  content: GeneratedContent;
  citations: GroundingChunk[];
}
