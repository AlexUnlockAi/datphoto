"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { FileUp, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importRoster } from "@/app/(dashboard)/shoots/[id]/import/actions";

const NONE = "__none__";

export function CsvImportClient({ shootId }: { shootId: string }) {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [nameCol, setNameCol] = useState<string>("");
  const [gradeCol, setGradeCol] = useState<string>(NONE);
  const [idCol, setIdCol] = useState<string>(NONE);
  const [submitting, setSubmitting] = useState(false);

  function handleFile(file: File) {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data;
        if (data.length === 0) {
          toast.error("That file has no rows.");
          return;
        }
        const [head, ...rest] = data;
        setHeaders(head);
        setRows(rest);
        setNameCol(head[0]);
        setGradeCol(NONE);
        setIdCol(NONE);
      },
      error: (err) => toast.error(`Could not read file: ${err.message}`),
    });
  }

  const preview = useMemo(() => {
    if (!nameCol) return [];
    const nameIdx = headers.indexOf(nameCol);
    const gradeIdx = gradeCol === NONE ? -1 : headers.indexOf(gradeCol);
    const idIdx = idCol === NONE ? -1 : headers.indexOf(idCol);
    return rows.slice(0, 5).map((r) => ({
      full_name: nameIdx >= 0 ? r[nameIdx] ?? "" : "",
      grade_or_teacher: gradeIdx >= 0 ? r[gradeIdx] ?? "" : "",
      student_id: idIdx >= 0 ? r[idIdx] ?? "" : "",
    }));
  }, [rows, headers, nameCol, gradeCol, idCol]);

  async function handleImport() {
    if (!nameCol) {
      toast.error("Choose which column has the student's name.");
      return;
    }
    const nameIdx = headers.indexOf(nameCol);
    const gradeIdx = gradeCol === NONE ? -1 : headers.indexOf(gradeCol);
    const idIdx = idCol === NONE ? -1 : headers.indexOf(idCol);

    const mapped = rows.map((r) => ({
      full_name: r[nameIdx] ?? "",
      grade_or_teacher: gradeIdx >= 0 ? r[gradeIdx] ?? null : null,
      student_id: idIdx >= 0 ? r[idIdx] ?? null : null,
    }));

    setSubmitting(true);
    const result = await importRoster(shootId, mapped);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Imported ${result.inserted} students.`);
    router.push(`/shoots/${shootId}`);
  }

  if (headers.length === 0) {
    return (
      <Card>
        <CardContent className="py-14">
          <label
            htmlFor="csv-file"
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 text-center transition-colors hover:border-primary hover:bg-accent/40"
          >
            <FileUp className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Click to choose a CSV file</p>
              <p className="text-sm text-muted-foreground">
                Any column layout works &mdash; you&rsquo;ll map columns next.
              </p>
            </div>
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Map columns</CardTitle>
          <CardDescription>
            {rows.length} rows found. Students get sequential shoot numbers in this
            row order.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <ColumnPicker label="Full name (required)" value={nameCol} onChange={setNameCol} headers={headers} />
          <ColumnPicker label="Grade / teacher" value={gradeCol} onChange={setGradeCol} headers={headers} optional />
          <ColumnPicker label="Student ID" value={idCol} onChange={setIdCol} headers={headers} optional />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>First 5 rows, as they&rsquo;ll be imported.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grade / Teacher</TableHead>
                <TableHead>Student ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
                  <TableCell>{r.grade_or_teacher || "—"}</TableCell>
                  <TableCell>{r.student_id || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleImport} disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Import {rows.length} students
        </Button>
      </div>
    </div>
  );
}

function ColumnPicker({
  label,
  value,
  onChange,
  headers,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  headers: string[];
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>

        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a column" />
        </SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value={NONE}>None</SelectItem>}
          {headers.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
