/**
 * Visiting Card Maker - design stylish business cards.
 *
 * Design goals:
 * - Users can have multiple card profiles (personal, company1, company2).
 * - Each card profile can have multiple design variants (different layouts/themes).
 * - Future export to image/PDF will use these fields.
 */

import { defineTable, column, NOW } from "astro:db";

export const CardProfiles = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    profileName: column.text(),                        // e.g. "Main Business Card", "Freelancer Card"
    fullName: column.text(),
    jobTitle: column.text({ optional: true }),
    companyName: column.text({ optional: true }),
    email: column.text({ optional: true }),
    phone: column.text({ optional: true }),
    secondaryPhone: column.text({ optional: true }),
    website: column.text({ optional: true }),
    addressLine1: column.text({ optional: true }),
    addressLine2: column.text({ optional: true }),
    city: column.text({ optional: true }),
    state: column.text({ optional: true }),
    country: column.text({ optional: true }),
    postalCode: column.text({ optional: true }),
    notes: column.text({ optional: true }),
    isDefault: column.boolean({ default: false }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const CardDesigns = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    profileId: column.text({
      references: () => CardProfiles.columns.id,
    }),
    userId: column.text(),                             // duplicated for quick queries
    designName: column.text({ optional: true }),       // e.g. "Dark minimal", "Gradient"
    templateKey: column.text({ optional: true }),      // internal template identifier
    colorPalette: column.text({ optional: true }),     // JSON of colors used
    fontConfig: column.text({ optional: true }),       // JSON of fonts
    layoutConfig: column.text({ optional: true }),     // JSON describing layout blocks
    logoUrl: column.text({ optional: true }),          // stored logo if uploaded
    isFavorite: column.boolean({ default: false }),
    isPrimaryDesign: column.boolean({ default: false }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const tables = {
  CardProfiles,
  CardDesigns,
} as const;
