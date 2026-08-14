import { z } from "zod";
import {
  NIF_ERROR,
  parseNif,
  parseRcs,
  parseStat,
  RCS_ERROR,
  STAT_ERROR,
} from "@/lib/provider-legal";

function optionalLegalId(
  parse: (value: string) => string | null,
  error: string
) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return undefined;
      if (value === null || String(value).trim() === "") return null;
      const parsed = parse(String(value));
      if (!parsed) {
        ctx.addIssue({ code: "custom", message: error });
        return z.NEVER;
      }
      return parsed;
    });
}

export const optionalNifSchema = optionalLegalId(parseNif, NIF_ERROR);
export const optionalStatSchema = optionalLegalId(parseStat, STAT_ERROR);
export const optionalRcsSchema = optionalLegalId(parseRcs, RCS_ERROR);
