import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Copy, Play, Tag, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Prompt {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { label: "Default (All Bids)", value: "default" },
  { label: "System Development", value: "system-development" },
  { label: "AI & Machine Learning", value: "ai-machine-learning" },
  { label: "App & Smartphone", value: "app-smartphone" },
  { label: "HP & Web Design", value: "hp-web-design" },
  { label: "EC Building", value: "ec-building" },
];

const getCategoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label || value;

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPrompt, setNewPrompt] = useState({
    name: "",
    description: "",
    prompt: "",
    category: "",
    isActive: true,
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { telegramUser } = useAuth();
  const isCategoryInUse = (category: string, excludeId?: string) => {
    return prompts.some((p) => p.category === category && (!excludeId || p.id !== excludeId));
  };

  // Fetch prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await apiClient.get("/api/prompts", { telegramId: telegramUser.id });
        setPrompts(response.data || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to fetch prompts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPrompts();
  }, []);

  const handleCreatePrompt = async () => {
    try {
      setCreating(true);
      if (!newPrompt.name || !newPrompt.prompt || !newPrompt.category) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setCreating(false);
        return;
      }

      if (isCategoryInUse(newPrompt.category)) {
        toast({
          title: "Category already used",
          description: `A prompt for "${getCategoryLabel(newPrompt.category)}" already exists. Only one per category is allowed.`,
          variant: "destructive",
        });
        return;
      }

      const response = await apiClient.post("/api/prompts", { ...newPrompt, telegramId: telegramUser.id });
      setPrompts([...prompts, response]);
      setNewPrompt({ name: "", description: "", prompt: "", category: "", isActive: false });
      setShowCreateDialog(false);

      toast({
        title: "Success",
        description: "Prompt created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create prompt",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePrompt = async () => {
    if (!editingPrompt) return;

    try {
      setUpdating(true);
      if (!editingPrompt.name || !editingPrompt.prompt || !editingPrompt.category) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setUpdating(false);
        return;
      }

      if (isCategoryInUse(editingPrompt.category, editingPrompt.id)) {
        toast({
          title: "Category already used",
          description: `A prompt for "${getCategoryLabel(editingPrompt.category)}" already exists. Only one per category is allowed.`,
          variant: "destructive",
        });
        setUpdating(false);
        return;
      }

      const response = await apiClient.patch(`/api/prompts/${editingPrompt.id}`, { ...editingPrompt, telegramId: telegramUser.id });
      setPrompts(prompts.map(p => p.id === editingPrompt.id ? response : p));
      setEditingPrompt(null);

      toast({
        title: "Success",
        description: "Prompt updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update prompt",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    // Prevent deletion of default prompt
    const prompt = prompts.find(p => p.id === id);
    if (prompt?.name === "Default Bid Prompt") {
      toast({
        title: "Error",
        description: "Cannot delete the default prompt",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeletingId(id);
      await apiClient.delete(`/api/prompts/${id}`, { telegramId: telegramUser.id });
      setPrompts(prompts.filter(p => p.id !== id));

      toast({
        title: "Success",
        description: "Prompt deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard",
    });
  };

  const handleTestPrompt = (prompt: Prompt) => {
    toast({
      title: "Test Prompt",
      description: `Testing prompt: ${prompt.name}`,
    });
  };

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, Prompt[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prompt Configuration</h1>
          <p className="text-muted-foreground">
            Manage your AI prompts for bid text generation. A default prompt is automatically created for general use.
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Prompt</DialogTitle>
              <DialogDescription>
                Create a new prompt for AI bid text generation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newPrompt.name}
                    onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                    placeholder="e.g., Professional Bid Writer"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newPrompt.category}
                    onValueChange={(value) => setNewPrompt({ ...newPrompt, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem
                          key={category.value}
                          value={category.value}
                          disabled={isCategoryInUse(category.value)}
                        >
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPrompt.description}
                  onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                  placeholder="Brief description of this prompt"
                />
              </div>
              <div>
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  value={newPrompt.prompt}
                  onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                  placeholder="Enter your prompt here..."
                  rows={6}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newPrompt.isActive}
                  onCheckedChange={(checked) => setNewPrompt({ ...newPrompt, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePrompt} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {creating ? "Creating..." : "Create Prompt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first prompt to get started with AI bid text generation
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Prompt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Prompts ({prompts.length})</TabsTrigger>
            {Object.keys(groupedPrompts).map((category) => (
              <TabsTrigger key={category} value={category}>
                {getCategoryLabel(category)} ({groupedPrompts[category].length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={setEditingPrompt}
                onDelete={handleDeletePrompt}
                onCopy={handleCopyPrompt}
                onTest={handleTestPrompt}
                deletingId={deletingId}
              />
            ))}
          </TabsContent>

          {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {categoryPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={setEditingPrompt}
                  onDelete={handleDeletePrompt}
                  onCopy={handleCopyPrompt}
                  onTest={handleTestPrompt}
                  deletingId={deletingId}
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Update your prompt configuration
            </DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingPrompt.name}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={editingPrompt.category}
                    onValueChange={(value) => setEditingPrompt({ ...editingPrompt, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem
                          key={category.value}
                          value={category.value}
                          disabled={isCategoryInUse(category.value, editingPrompt.id)}
                        >
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingPrompt.description || ""}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-prompt">Prompt *</Label>
                <Textarea
                  id="edit-prompt"
                  value={editingPrompt.prompt}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={editingPrompt.isActive}
                  onCheckedChange={(checked) => setEditingPrompt({ ...editingPrompt, isActive: checked })}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPrompt(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePrompt} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {updating ? "Updating..." : "Update Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onCopy: (prompt: string) => void;
  onTest: (prompt: Prompt) => void;
  deletingId?: string | null;
}

function PromptCard({ prompt, onEdit, onDelete, onCopy, onTest, deletingId }: PromptCardProps) {
  const isDefaultPrompt = prompt.name === "Default Bid Prompt";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {prompt.name}
              {isDefaultPrompt && (
                <Badge variant="destructive">Default Prompt</Badge>
              )}
              {!prompt.isActive && !isDefaultPrompt && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isDefaultPrompt
                ? "A general-purpose prompt for creating bid messages. This prompt will be used when no specific prompt matches."
                : prompt.description
              }
            </CardDescription>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{getCategoryLabel(prompt.category)}</Badge>
              <span className="text-xs text-muted-foreground">
                Created {new Date(prompt.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTest(prompt)}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(prompt.prompt)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(prompt)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {!isDefaultPrompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(prompt.id)}
                disabled={deletingId === prompt.id}
              >
                {deletingId === prompt.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm font-mono whitespace-pre-wrap">{prompt.prompt}</p>
        </div>
      </CardContent>
    </Card>
  );
}
