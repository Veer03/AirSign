import type { Metadata } from "next";
import { Workspace } from "@/components/app/workspace";

export const metadata: Metadata = {
  title: "Conversation workspace",
  description:
    "A conversation workspace with on-device hand tracking and a starter gesture classifier. ASL word recognition, speech output, and live reply captions are the next integrations.",
};

export default function AppPage() {
  return <Workspace />;
}
