/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { PageHeader } from "@/components/dashboard/ui";
import { UniversitiesExplorer } from "@/components/UniversitiesExplorer";

export const Route = createFileRoute("/browse-universities")({
  head: () => ({ meta: [{ title: "Universities · Varsity Hub" }] }),
  component: BrowseUniversities,
});

function BrowseUniversities() {
  return (
    <StudentShell>
      <PageHeader
        icon={Building2}
        eyebrow="Explore"
        title="Universities"
        subtitle="Search, compare and save universities that match your APS and goals."
      />
      <UniversitiesExplorer />
    </StudentShell>
  );
}
