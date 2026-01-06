export type ModerationResult = {
  approved: boolean;
  confidence: number;
  categories: {
    porn: number;
    hentai: number;
    sexy: number;
    neutral: number;
    drawing: number;
  };
  reason?: string;
};

export type ModerationOptions = {
  threshold?: number; // Default 0.5 for balanced approach
  failClosed?: boolean; // Default true - block if moderation fails
};
