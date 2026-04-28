import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Ban, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";

const CW_EMPLOYER_URL = "https://crowdworks.jp/public/employers/";

export default function BlockedClients() {
  const { user, telegramUser } = useAuth();
  const telegramId = telegramUser?.id ?? (user as any)?.telegramId ?? (user as any)?.id;
  const [list, setList] = useState<{ clientId: number; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [addValue, setAddValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = async () => {
    if (!telegramId) return;
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/blocked-clients", { telegramId });
      setList(res.data || []);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [telegramId]);

  const parseInput = (v: string): number | null => {
    const t = v.trim();
    const match = t.match(/(?:employers\/)?(\d+)$/);
    if (match) return parseInt(match[1], 10);
    const n = parseInt(t, 10);
    return isNaN(n) ? null : n;
  };

  const handleAdd = async () => {
    const id = parseInput(addValue);
    if (id == null) {
      setError("Enter a client ID (e.g. 6798718) or full URL (e.g. https://crowdworks.jp/public/employers/6798718)");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      await apiClient.post("/api/admin/blocked-clients", { telegramId, clientId: id });
      setAddValue("");
      await fetchList();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (clientId: number) => {
    try {
      await apiClient.delete(`/api/admin/blocked-clients/${clientId}`, { params: { telegramId } });
      await fetchList();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to remove");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blocked Clients</h1>
        <p className="text-muted-foreground">
          Block client IDs so their projects are not scraped or saved to the database. Add the client ID or employer URL (e.g. {CW_EMPLOYER_URL}6798718 → 6798718).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add blocked client</CardTitle>
          <CardDescription>Client ID or full Crowdworks employer URL</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Input
            placeholder="6798718 or https://crowdworks.jp/public/employers/6798718"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={handleAdd} disabled={adding} className="gap-2">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Blocked list
          </CardTitle>
          <CardDescription>These clients’ jobs will not be scraped or saved</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No blocked clients.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((item) => (
                <li
                  key={item.clientId}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium">{item.clientId}</span>
                    <a
                      href={`${CW_EMPLOYER_URL}${item.clientId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(item.clientId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
