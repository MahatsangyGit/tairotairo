export const PORTFOLIO_MAX_ITEMS = 24;
export const PORTFOLIO_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const PORTFOLIO_MAX_DESCRIPTION_LENGTH = 2000;
export const PORTFOLIO_MAX_COMMENT_LENGTH = 1000;

export function buildPortfolioImageUrl(itemId: string): string {
  return `/api/provider/portfolio/${itemId}/image`;
}

export interface PortfolioCommentPayload {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface PortfolioItemPayload {
  id: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  comments: PortfolioCommentPayload[];
  commentCount: number;
}
