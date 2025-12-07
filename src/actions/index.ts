import type { ActionAPIContext } from "astro:actions";
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { db, eq, and, CardProfiles, CardDesigns } from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

export const server = {
  createProfile: defineAction({
    input: z.object({
      id: z.string().optional(),
      profileName: z.string().min(1, "Profile name is required"),
      fullName: z.string().min(1, "Full name is required"),
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      secondaryPhone: z.string().optional(),
      website: z.string().optional(),
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
      notes: z.string().optional(),
      isDefault: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      if (input.isDefault) {
        await db
          .update(CardProfiles)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(CardProfiles.userId, user.id));
      }

      const [profile] = await db
        .insert(CardProfiles)
        .values({
          id: input.id ?? crypto.randomUUID(),
          userId: user.id,
          profileName: input.profileName,
          fullName: input.fullName,
          jobTitle: input.jobTitle,
          companyName: input.companyName,
          email: input.email,
          phone: input.phone,
          secondaryPhone: input.secondaryPhone,
          website: input.website,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2,
          city: input.city,
          state: input.state,
          country: input.country,
          postalCode: input.postalCode,
          notes: input.notes,
          isDefault: input.isDefault ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { profile };
    },
  }),

  updateProfile: defineAction({
    input: z.object({
      id: z.string(),
      profileName: z.string().min(1).optional(),
      fullName: z.string().min(1).optional(),
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      secondaryPhone: z.string().optional(),
      website: z.string().optional(),
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
      notes: z.string().optional(),
      isDefault: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, ...rest } = input;

      const [existing] = await db
        .select()
        .from(CardProfiles)
        .where(and(eq(CardProfiles.id, id), eq(CardProfiles.userId, user.id)))
        .limit(1);

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Profile not found.",
        });
      }

      if (rest.isDefault) {
        await db
          .update(CardProfiles)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(CardProfiles.userId, user.id), eq(CardProfiles.isDefault, true)));
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { profile: existing };
      }

      const [profile] = await db
        .update(CardProfiles)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(CardProfiles.id, id), eq(CardProfiles.userId, user.id)))
        .returning();

      return { profile };
    },
  }),

  listProfiles: defineAction({
    input: z.object({}).optional(),
    handler: async (_, context) => {
      const user = requireUser(context);

      const profiles = await db
        .select()
        .from(CardProfiles)
        .where(eq(CardProfiles.userId, user.id));

      return { profiles };
    },
  }),

  deleteProfile: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [deleted] = await db
        .delete(CardProfiles)
        .where(and(eq(CardProfiles.id, input.id), eq(CardProfiles.userId, user.id)))
        .returning();

      if (!deleted) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Profile not found.",
        });
      }

      return { profile: deleted };
    },
  }),

  createDesign: defineAction({
    input: z.object({
      id: z.string().optional(),
      profileId: z.string(),
      designName: z.string().optional(),
      templateKey: z.string().optional(),
      colorPalette: z.string().optional(),
      fontConfig: z.string().optional(),
      layoutConfig: z.string().optional(),
      logoUrl: z.string().optional(),
      isFavorite: z.boolean().optional(),
      isPrimaryDesign: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [profile] = await db
        .select()
        .from(CardProfiles)
        .where(and(eq(CardProfiles.id, input.profileId), eq(CardProfiles.userId, user.id)))
        .limit(1);

      if (!profile) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Profile not found.",
        });
      }

      if (input.isPrimaryDesign) {
        await db
          .update(CardDesigns)
          .set({ isPrimaryDesign: false, updatedAt: new Date() })
          .where(and(eq(CardDesigns.profileId, input.profileId), eq(CardDesigns.userId, user.id)));
      }

      const [design] = await db
        .insert(CardDesigns)
        .values({
          id: input.id ?? crypto.randomUUID(),
          profileId: input.profileId,
          userId: user.id,
          designName: input.designName,
          templateKey: input.templateKey,
          colorPalette: input.colorPalette,
          fontConfig: input.fontConfig,
          layoutConfig: input.layoutConfig,
          logoUrl: input.logoUrl,
          isFavorite: input.isFavorite ?? false,
          isPrimaryDesign: input.isPrimaryDesign ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { design };
    },
  }),

  updateDesign: defineAction({
    input: z.object({
      id: z.string(),
      profileId: z.string(),
      designName: z.string().optional(),
      templateKey: z.string().optional(),
      colorPalette: z.string().optional(),
      fontConfig: z.string().optional(),
      layoutConfig: z.string().optional(),
      logoUrl: z.string().optional(),
      isFavorite: z.boolean().optional(),
      isPrimaryDesign: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, profileId, ...rest } = input;

      const [profile] = await db
        .select()
        .from(CardProfiles)
        .where(and(eq(CardProfiles.id, profileId), eq(CardProfiles.userId, user.id)))
        .limit(1);

      if (!profile) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Profile not found.",
        });
      }

      const [existing] = await db
        .select()
        .from(CardDesigns)
        .where(and(eq(CardDesigns.id, id), eq(CardDesigns.userId, user.id)))
        .limit(1);

      if (!existing || existing.profileId !== profileId) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Design not found.",
        });
      }

      if (rest.isPrimaryDesign) {
        await db
          .update(CardDesigns)
          .set({ isPrimaryDesign: false, updatedAt: new Date() })
          .where(and(eq(CardDesigns.profileId, profileId), eq(CardDesigns.userId, user.id)));
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { design: existing };
      }

      const [design] = await db
        .update(CardDesigns)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(CardDesigns.id, id))
        .returning();

      return { design };
    },
  }),

  listDesigns: defineAction({
    input: z
      .object({
        profileId: z.string().optional(),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);

      const profiles = await db
        .select()
        .from(CardProfiles)
        .where(eq(CardProfiles.userId, user.id));

      const allowedProfileIds = new Set(profiles.map((p) => p.id));
      if (input?.profileId && !allowedProfileIds.has(input.profileId)) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Profile not found.",
        });
      }

      const designs = await db
        .select()
        .from(CardDesigns)
        .where(eq(CardDesigns.userId, user.id));

      const filtered = input?.profileId
        ? designs.filter((d) => d.profileId === input.profileId)
        : designs.filter((d) => allowedProfileIds.has(d.profileId));

      return { designs: filtered };
    },
  }),
};
