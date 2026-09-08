"use client";

import { useState } from "react";
import { Copy, ExternalLink, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GalleryFolder } from "@/lib/types";

export function GalleryFolderManager({
  shootId,
  folders,
  createFolder,
}: {
  shootId: string;
  folders: GalleryFolder[];
  createFolder: (shootId: string, name: string) => Promise<{ error?: string }>;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    const result = await createFolder(shootId, name.trim());
    setSaving(false);
    if (result.error) toast.error(result.error);
    else { setName(""); toast.success("Gallery folder created"); }
  }
  function copy(token: string) {
    const url = `${window.location.origin}/g/${shootId}/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Folder link copied");
  }
  return (
    <Card>
      <CardHeader><CardTitle>Client gallery folders</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Family portraits" aria-label="New folder name" />
          <Button onClick={submit} disabled={saving || !name.trim()}><FolderPlus className="size-4" />Add folder</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {folders.map((folder) => {
            const path = `/g/${shootId}/${folder.public_token}`;
            return <div key={folder.id} className="flex items-center justify-between border border-border p-3">
              <div><p className="font-medium">{folder.name}</p><p className="text-xs text-muted-foreground">{folder.is_active ? "Active share link" : "Archived"}</p></div>
              <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => copy(folder.public_token)} aria-label={`Copy ${folder.name} link`}><Copy className="size-4" /></Button><a href={path} target="_blank" rel="noreferrer" aria-label={`Open ${folder.name}`} className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"><ExternalLink className="size-4" /></a></div>
            </div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
