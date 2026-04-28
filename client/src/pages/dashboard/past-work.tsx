import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Briefcase, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface PastWork {
  id: string;
  category: string;
  role: string;
  projectUrl: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { label: "Default (All Bids)", value: "default" },
  { label: "System Development", value: "system-development" },
  { label: "AI & Machine Learning", value: "ai-machine-learning" },
  { label: "App & Smartphone", value: "app-smartphone" },
  { label: "HP & Web Design", value: "hp-web-design" },
  { label: "EC Building", value: "ec-building" },
];

const roleOptions = {
  "default": [
    { label: "General Project", value: "general-project" },
  ],
  "system-development": [
    { label: "Site Construction and Web Development", value: "2" },
    { label: "Business systems and software", value: "83" },
    { label: "Server/Network Construction", value: "8" },
    { label: "Database design and construction", value: "12" },
    { label: "Excel VBA/Macro Development", value: "13" },
    { label: "Scraping/Data Collection", value: "282" },
    { label: "Web Programming", value: "173" },
    { label: "Project management and requirements definition", value: "1" },
    { label: "Programming instructor/mentor", value: "284" },
    { label: "Others (system development)", value: "78" },
    { label: "AWS construction and WAF implementation", value: "342" },
    { label: "Stock, FX, and virtual currency tool development", value: "343" },
    { label: "Customer management/CRM system development", value: "344" },
    { label: "Salesforce/SFA system development", value: "345" },
    { label: "Ordering system development", value: "346" },
    { label: "Reservation system development", value: "347" },
    { label: "Attendance management system development", value: "348" },
    { label: "Responsive website creation", value: "349" },
    { label: "Metaverse Development", value: "355" },
    { label: "System management, updates, and maintenance", value: "25" },
    { label: "Testing, Verification, and Debugging", value: "51" },
    { label: "Website updates and maintenance", value: "177" },
    { label: "Data Cleansing", value: "104" },
    { label: "Security measures", value: "179" },
    { label: "Quality assessment", value: "178" },
    { label: "Windows Application Development", value: "9" },
    { label: "Mac Application Development", value: "10" },
  ],
  "ai-machine-learning": [
    { label: "Machine Learning and Deep Learning", value: "364" },
    { label: "ChatGPT Development", value: "365" },
    { label: "AI/Chatbot Development", value: "283" },
    { label: "AI annotation", value: "366" },
  ],
  "app-smartphone": [
    { label: "iPhone/iPad app development", value: "3" },
    { label: "Android App Development", value: "4" },
    { label: "Smartphone app development and website construction", value: "82" },
    { label: "Social Game Development", value: "6" },
    { label: "Android Game Development", value: "174" },
    { label: "iPhone/iPad game development", value: "175" },
    { label: "Mobile app development", value: "81" },
  ],
  "hp-web-design": [
    { label: "Homepage creation", value: "14" },
    { label: "Web Design", value: "15" },
    { label: "WordPress production and installation", value: "20" },
    { label: "Landing page (LP) production", value: "17" },
    { label: "HTML and CSS coding", value: "16" },
    { label: "Website corrections, updates, and feature additions", value: "285" },
    { label: "Icon, button and header production", value: "286" },
    { label: "CMS implementation", value: "7" },
    { label: "Mobile site/smartphone site production", value: "87" },
    { label: "UI/UX Design", value: "77" },
    { label: "Interaction Design", value: "112" },
    { label: "Owned media production", value: "304" },
  ],
  "ec-building": [
    { label: "EC site production", value: "84" },
    { label: "E-commerce website design", value: "137" },
    { label: "EC site operation tool development", value: "315" },
    { label: "Product description creation", value: "316" },
    { label: "E-commerce consulting", value: "317" },
  ],
};

export default function PastWork() {
  const [pastWork, setPastWork] = useState<PastWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingWork, setEditingWork] = useState<PastWork | null>(null);
  const [newWork, setNewWork] = useState({
    category: "",
    role: "",
    projectUrl: "",
    description: "",
    isActive: true,
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { telegramUser } = useAuth();
  // Helper function to get category label from role
  const getCategoryFromRole = (role: string) => {
    for (const [categoryKey, roles] of Object.entries(roleOptions)) {
      if (roles.some(r => r.value === role)) {
        return categories.find(c => c.value === categoryKey)?.label || "Unknown";
      }
    }
    return "Unknown";
  };

  // Helper function to get role label from role value
  const getRoleLabel = (role: string) => {
    for (const roles of Object.values(roleOptions)) {
      const foundRole = roles.find(r => r.value === role);
      if (foundRole) {
        return foundRole.label;
      }
    }
    return role; // fallback to original value
  };

  // Helper function to get available roles for a category (excluding already used roles)
  const getAvailableRoles = (category: string, excludeRole?: string) => {
    if (!category || !roleOptions[category as keyof typeof roleOptions]) {
      return [];
    }

    const allRoles = roleOptions[category as keyof typeof roleOptions];
    const usedRoles = pastWork.map(w => w.role);

    // When editing, exclude the current role from the used roles list
    if (excludeRole) {
      const filteredUsedRoles = usedRoles.filter(role => role !== excludeRole);
      return allRoles.filter(role => !filteredUsedRoles.includes(role.value));
    }

    return allRoles.filter(role => !usedRoles.includes(role.value));
  };

  // Fetch past work
  useEffect(() => {
    const fetchPastWork = async () => {
      try {
        const response = await apiClient.get("/api/past-work", { telegramId: telegramUser.id });
        setPastWork(response.data || []);
      } catch (error: any) {
        if (error.response.status === 404) {
          toast({
            title: "Error",
            description: error.response.data.message,
            variant: "default",
          });
          return;
        }
        toast({
          title: "Error",
          description: "Failed to fetch past work",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPastWork();
  }, []);

  const handleAddWork = async () => {
    try {
      setCreating(true);

      if (!newWork.category || !newWork.role || !newWork.projectUrl.trim() || !newWork.description.trim()) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setCreating(false);
        return;
      }

      // Check if role is already used
      const isRoleAlreadyUsed = pastWork.some(w => w.role === newWork.role);
      if (isRoleAlreadyUsed) {
        toast({
          title: "Error",
          description: "This role already has a past work entry",
          variant: "destructive",
        });
        setCreating(false);
        return;
      }

      const response = await apiClient.post("/api/past-work", { ...newWork, telegramId: telegramUser.id });
      setPastWork([...pastWork, response.data]);
      setNewWork({ category: "", role: "", projectUrl: "", description: "", isActive: true });
      setShowAddDialog(false);

      toast({
        title: "Success",
        description: "Past work added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add past work",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateWork = async () => {
    if (!editingWork) return;

    try {
      setUpdating(true);

      if (!newWork.category || !newWork.role || !newWork.projectUrl.trim() || !newWork.description.trim()) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setUpdating(false);
        return;
      }

      // Check if role is already used by another entry
      const isRoleAlreadyUsed = pastWork.some(w => w.role === newWork.role && w.id !== editingWork.id);
      if (isRoleAlreadyUsed) {
        toast({
          title: "Error",
          description: "This role already has a past work entry",
          variant: "destructive",
        });
        setUpdating(false);
        return;
      }

      const response = await apiClient.patch(`/api/past-work/${editingWork.id}`, { ...newWork, telegramId: telegramUser.id });
      setPastWork(pastWork.map(w => w.id === editingWork.id ? response.data : w));
      setEditingWork(null);
      setNewWork({ category: "", role: "", projectUrl: "", description: "", isActive: true });
      setShowAddDialog(false);

      toast({
        title: "Success",
        description: "Past work updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update past work",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteWork = async (id: string) => {
    try {
      setDeletingId(id);
      await apiClient.delete(`/api/past-work/${id}`, { telegramId: telegramUser.id });
      setPastWork(pastWork.filter(w => w.id !== id));

      toast({
        title: "Success",
        description: "Past work deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete past work",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditWork = (work: PastWork) => {
    setEditingWork(work);
    setNewWork({
      category: work.category,
      role: work.role,
      projectUrl: work.projectUrl || "",
      description: work.description,
      isActive: work.isActive,
    });
    setShowAddDialog(true);
  };

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
          <h1 className="text-3xl font-bold mb-2">Past Work Portfolio</h1>
          <p className="text-muted-foreground">
            Manage your past work projects to showcase your experience and skills. This helps in creating more targeted bid messages.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span>Total roles: {Object.values(roleOptions).flat().length}</span>
            <span>Used roles: {pastWork.length}</span>
            <span>Available roles: {Object.values(roleOptions).flat().length - pastWork.length}</span>
          </div>
        </div>
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setEditingWork(null);
              setNewWork({ category: "", role: "", projectUrl: "", description: "", isActive: true });
            }
          }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Past Work
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" style={{ maxHeight: 680, overflow: 'auto' }}>
            <DialogHeader>
              <DialogTitle>{editingWork ? "Edit Past Work" : "Add Past Work"}</DialogTitle>
              <DialogDescription>
                {editingWork ? "Update your past work entry" : "Add a new project to your portfolio"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newWork.category}
                    onValueChange={(value) => setNewWork({ ...newWork, category: value, role: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={newWork.role}
                    onValueChange={(value) => setNewWork({ ...newWork, role: value })}
                    disabled={!newWork.category || getAvailableRoles(newWork.category, editingWork?.role).length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        getAvailableRoles(newWork.category, editingWork?.role).length === 0
                          ? "All roles used"
                          : "Select role"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles(newWork.category, editingWork?.role).length > 0 ? (
                        getAvailableRoles(newWork.category, editingWork?.role).map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-roles" disabled>
                          No available roles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {getAvailableRoles(newWork.category, editingWork?.role).length === 0 && newWork.category && (
                    <p className="text-xs text-muted-foreground">
                      All roles for this category already have entries. Choose a different category.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label>Project URLs *</Label>
                <Textarea
                  value={newWork.projectUrl}
                  onChange={(e) => setNewWork({ ...newWork, projectUrl: e.target.value })}
                  placeholder={`Enter URLs, one per line:
https://example.com/project1
https://example.com/project2
...`}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter project URLs, one per line. No limit on the number of URLs.
                </p>
              </div>
              <div>
                <Label htmlFor="description">Work Experience Description *</Label>
                <Textarea
                  id="description"
                  value={newWork.description}
                  onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                  placeholder="Describe your experience and achievements on this project..."
                  rows={6}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newWork.isActive}
                  onCheckedChange={(checked) => setNewWork({ ...newWork, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setEditingWork(null);
                setNewWork({ category: "", role: "", projectUrl: "", description: "", isActive: true });
              }}>
                Cancel
              </Button>
              <Button
                onClick={editingWork ? handleUpdateWork : handleAddWork}
                disabled={
                  !newWork.category || 
                  !newWork.role || 
                  !newWork.projectUrl.trim() ||
                  !newWork.description.trim() || 
                  getAvailableRoles(newWork.category, editingWork?.role).length === 0 || 
                  (!editingWork && creating) ||
                  (editingWork !== null && updating)
                }
              >
                {((!editingWork && creating) || (editingWork && updating)) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingWork 
                  ? updating ? "Updating..." : "Update Work"
                  : creating ? "Adding..." : "Add Work"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {pastWork.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No past work yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your past work projects to showcase your experience and skills
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {pastWork.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onEdit={handleEditWork}
              onDelete={handleDeleteWork}
              getCategoryFromRole={getCategoryFromRole}
              getRoleLabel={getRoleLabel}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface WorkCardProps {
  work: PastWork;
  onEdit: (work: PastWork) => void;
  onDelete: (id: string) => void;
  getCategoryFromRole: (role: string) => string;
  getRoleLabel: (role: string) => string;
  deletingId?: string | null;
}

function WorkCard({ work, onEdit, onDelete, getCategoryFromRole, getRoleLabel, deletingId }: WorkCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {getRoleLabel(work.role)}
              {!work.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {getCategoryFromRole(work.role)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(work)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(work.id)}
              disabled={deletingId === work.id}
            >
              {deletingId === work.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-1">Project URLs:</p>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto font-mono bg-muted p-3 rounded-md">
              {work.projectUrl || "No URLs provided"}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Work Experience:</p>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {work.description}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Added {new Date(work.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
