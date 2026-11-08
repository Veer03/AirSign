import type { Metadata } from "next";
import { Workspace } from "@/components/app/workspace";

export const metadata: Metadata = {
  title: "Conversation workspace",
  description:
    "A conversation window with on-device hand tracking, a signer-confirmed AI gist, spoken output, and large live reply captions. Sign recognition is not connected yet.",
};

export default function AppPage() {
  return <Workspace />;
}
