import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getSuperAdminSession } from "@/lib/session";

const f = createUploadthing();

export const ourFileRouter = {
  // Symbol/image for questions (Widgit-style)
  questionImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSuperAdminSession();
      if (!session.superAdminId) throw new Error("Unauthorized");
      return { superAdminId: session.superAdminId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, uploadedBy: metadata.superAdminId };
    }),

  // Audio for read-aloud questions
  questionAudio: f({ audio: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSuperAdminSession();
      if (!session.superAdminId) throw new Error("Unauthorized");
      return { superAdminId: session.superAdminId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, uploadedBy: metadata.superAdminId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
