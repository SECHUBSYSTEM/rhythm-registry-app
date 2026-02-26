import { z } from "zod";

export const checkoutFormSchema = z.object({
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  durationHours: z.number().min(1).max(6),
  vibeTags: z.array(z.string()).min(1, "Select at least one vibe"),
  rush: z.boolean().default(false),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;

export const orderPreferencesSchema = z.object({
  spotifyPlaylistUrl: z.string().min(1, "Spotify playlist URL is required"),
  mustPlay: z.string().optional(),
  doNotPlay: z.string().optional(),
  specialMoments: z.string().optional(),
  notes: z.string().optional(),
});

export type OrderPreferencesInput = z.infer<typeof orderPreferencesSchema>;

export const revisionSchema = z.object({
  revisionNotes: z.string().min(1, "Revision notes are required"),
  timestamps: z.string().optional(),
});

export type RevisionInput = z.infer<typeof revisionSchema>;

export const playlistSubmitSchema = z.object({
  playlistData: z.array(
    z.object({
      title: z.string().optional(),
      id: z.string().optional(),
      uri: z.string().optional(),
    })
  ),
});

export type PlaylistSubmitInput = z.infer<typeof playlistSubmitSchema>;
