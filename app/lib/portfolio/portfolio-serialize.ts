import {
  buildPortfolioImageUrl,
  type PortfolioCommentPayload,
  type PortfolioItemPayload,
} from "@/lib/portfolio";

const commentAuthorSelect = {
  id: true,
  name: true,
  avatar: true,
} as const;

export const portfolioItemInclude = {
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: {
      author: { select: commentAuthorSelect },
    },
  },
} as const;

type PortfolioRow = {
  id: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  comments: {
    id: string;
    body: string;
    createdAt: Date;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
  }[];
};

export function serializePortfolioItem(row: PortfolioRow): PortfolioItemPayload {
  const comments: PortfolioCommentPayload[] = row.comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    author: c.author,
  }));

  return {
    id: row.id,
    description: row.description,
    imageUrl: buildPortfolioImageUrl(row.id, row.updatedAt.getTime()),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    comments,
    commentCount: comments.length,
  };
}
