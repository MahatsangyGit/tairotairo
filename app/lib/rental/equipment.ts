import type { EquipmentStatus, Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export const EQUIPMENT_CATEGORY_LABELS: Record<string, string> = {
  POWER_TOOLS: "Outillage électroportatif",
  HAND_TOOLS: "Outillage à main",
  ELECTRICAL: "Électricité",
  PLUMBING: "Plomberie",
  PAINTING: "Peinture",
  GARDENING: "Jardinage",
  CONSTRUCTION: "Construction",
  OTHER: "Autre",
};

export type EquipmentSearchParams = {
  search?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
  mine?: boolean;
  ownerId?: string;
  status?: EquipmentStatus | EquipmentStatus[];
};

export async function searchEquipment(params: EquipmentSearchParams) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 12));
  const where: Prisma.EquipmentItemWhereInput = {};

  if (params.mine && params.ownerId) {
    where.ownerId = params.ownerId;
  } else if (params.status) {
    where.status = Array.isArray(params.status)
      ? { in: params.status }
      : params.status;
  } else {
    where.status = "PUBLISHED";
  }

  if (params.category?.trim()) {
    where.category = params.category.trim() as Prisma.EnumEquipmentCategoryFilter;
  }
  if (params.location?.trim()) {
    where.location = {
      contains: params.location.trim(),
      mode: "insensitive",
    };
  }
  if (params.search?.trim()) {
    const q = params.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.equipmentItem.count({ where }),
    prisma.equipmentItem.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function serializeEquipment(
  item: {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    dailyPrice: number;
    depositAmount: number;
    status: string;
    isPlatformOwned: boolean;
    rejectionReason: string | null;
    photoKeys: string[];
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    owner?: { id: string; name: string; avatar: string | null } | null;
  }
) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    categoryLabel: EQUIPMENT_CATEGORY_LABELS[item.category] ?? item.category,
    location: item.location,
    dailyPrice: item.dailyPrice,
    depositAmount: item.depositAmount,
    status: item.status,
    isPlatformOwned: item.isPlatformOwned,
    rejectionReason: item.rejectionReason,
    photoKeys: item.photoKeys,
    photoUrl:
      item.photoKeys[0] != null
        ? `/api/rental/equipment/${item.id}/photos/0`
        : null,
    ownerId: item.ownerId,
    owner: item.owner ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
