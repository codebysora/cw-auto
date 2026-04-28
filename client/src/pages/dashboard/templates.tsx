import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

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
import { Plus, Edit, Trash2, FileText, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { BidTemplate } from "@shared/schema";
import { useAuth } from "@/lib/auth";
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
    { label: "General Bid Template", value: "general-bid-template" },
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


export default function Templates() {
  const [templates, setTemplates] = useState<BidTemplate[]>([]);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BidTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    category: "",
    role: "",
    prompt: "",
    template: "",
    isActive: true,
  });
  const { telegramUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    const usedRoles = templates.map(t => t.role);

    // When editing, exclude the current role from the used roles list
    if (excludeRole) {
      const filteredUsedRoles = usedRoles.filter(role => role !== excludeRole);
      return allRoles.filter(role => !filteredUsedRoles.includes(role.value));
    }

    return allRoles.filter(role => !usedRoles.includes(role.value));
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await apiClient.get("/api/bid-templates", { telegramId: telegramUser.id });
        setTemplates(response.data || []);
      } catch (error: any) {
        console.error("Error fetching templates:", error);
        // If API fails, create default template locally
        if (error.response.status === 404) {
          toast({
            title: "Error",
            description: "Templates not found",
            variant: "destructive",
          });
          return;
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleAddTemplate = async () => {
    // Validate required fields
    if (!newTemplate.category || !newTemplate.role || !newTemplate.prompt || !newTemplate.template) {
      console.error("Please fill in all required fields");
      return;
    }

    // Check if role is already used
    const isRoleAlreadyUsed = templates.some(t => t.role === newTemplate.role);
    if (isRoleAlreadyUsed) {
      console.error("This role already has a template");
      return;
    }

    setCreating(true);
    try {
      // Only send role, prompt, template, and isActive to database (not category)
      const { category, ...templateData } = newTemplate;
      const response = await apiClient.post("/api/bid-templates", { ...templateData, telegramId: telegramUser.id });
      setTemplates([...templates, response.data.template]);
      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message || "Template added successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.data.error || "Failed to add template",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding template:", error);
    } finally {
      setCreating(false);
    }
    setShowAddTemplate(false);
    setNewTemplate({ category: "", role: "", prompt: "", template: "", isActive: true });
  };

  const handleEditTemplate = (template: BidTemplate) => {
    // Find the category for this role
    const category = getCategoryFromRole(template.role);
    const categoryValue = categories.find(c => c.label === category)?.value || "";

    setEditingTemplate(template);
    setNewTemplate({
      category: categoryValue,
      role: template.role,
      prompt: template.prompt,
      template: template.template,
      isActive: template.isActive || true,
    });
    setShowAddTemplate(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    // Validate required fields
    if (!newTemplate.category || !newTemplate.role || !newTemplate.prompt || !newTemplate.template) {
      console.error("Please fill in all required fields");
      return;
    }

    // Check if role is already used by another template
    const isRoleAlreadyUsed = templates.some(t => t.role === newTemplate.role && t.id !== editingTemplate.id);
    if (isRoleAlreadyUsed) {
      console.error("This role already has a template");
      return;
    }

    try {
      setUpdating(true);
      // Only send role, prompt, template, and isActive to database (not category)
      const { category, ...templateData } = newTemplate;
      const response = await apiClient.patch(`/api/bid-templates/${editingTemplate.id}`, { ...templateData, telegramId: telegramUser.id });

      // Update the template in the list
      setTemplates(templates.map(t =>
        t.id === editingTemplate.id ? { ...t, ...response.data } : t
      ));

      setShowAddTemplate(false);
      setEditingTemplate(null);
      setNewTemplate({ category: "", role: "", prompt: "", template: "", isActive: true });
    } catch (error) {
      console.error("Error updating template:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    // Prevent deletion of default template
    const template = templates.find(t => t.id === id);
    if (template?.role === "general-bid-template") {
      console.error("Cannot delete default template");
      return;
    }

    try {
      setDeletingId(id);
      const response = await apiClient.delete(`/api/bid-templates/${id}`, { telegramId: telegramUser.id });
      if (response.data.success) {
        setTemplates(templates.filter((t) => t.id !== id));
        toast({
          title: "Success",
          description: response.data.message || "Template deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.data.error || "Failed to delete template",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    loading ? (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ) : (
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Bid Templates</h1>
            <p className="text-muted-foreground">
              Create custom bid templates for different roles and manage their active status. A default template is automatically created for general use.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Total roles: {Object.values(roleOptions).flat().length}</span>
              <span>Used roles: {templates.filter(t => t.role !== "general-bid-template").length}</span>
              <span>Available roles: {Object.values(roleOptions).flat().length - templates.filter(t => t.role !== "general-bid-template").length}</span>
            </div>
          </div>
          <Dialog open={showAddTemplate} onOpenChange={(open) => {
            setShowAddTemplate(open);
            if (!open) {
              setEditingTemplate(null);
              setNewTemplate({ category: "", role: "", prompt: "", template: "", isActive: true });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-template">
                <Plus className="h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Bid Template" : "Create Bid Template"}</DialogTitle>
                <DialogDescription>
                  {editingTemplate ? "Update your template for automated bidding" : "Set up a new template for automated bidding"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value, role: "" })}
                    >
                      <SelectTrigger id="category" data-testid="select-category">
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
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newTemplate.role}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, role: value })}
                      disabled={!newTemplate.category || getAvailableRoles(newTemplate.category, editingTemplate?.role).length === 0}
                    >
                      <SelectTrigger id="role" data-testid="select-role">
                        <SelectValue placeholder={
                          getAvailableRoles(newTemplate.category, editingTemplate?.role).length === 0
                            ? "All roles used"
                            : "Select role"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRoles(newTemplate.category, editingTemplate?.role).length > 0 ? (
                          getAvailableRoles(newTemplate.category, editingTemplate?.role).map((role) => (
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
                    {getAvailableRoles(newTemplate.category, editingTemplate?.role).length === 0 && newTemplate.category && (
                      <p className="text-xs text-muted-foreground">
                        All roles for this category already have templates. Choose a different category.
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt">Trigger Prompt</Label>
                  <Input
                    id="prompt"
                    placeholder="Keywords to trigger this template"
                    value={newTemplate.prompt}
                    onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                    data-testid="input-prompt"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter keywords that will trigger this template (e.g., "WordPress e-commerce")
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template">Bid Template</Label>
                  <Textarea
                    id="template"
                    placeholder="Write your bid template here..."
                    value={newTemplate.template}
                    onChange={(e) => setNewTemplate({ ...newTemplate, template: e.target.value })}
                    rows={6}
                    data-testid="textarea-template"
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be sent automatically when matching jobs are found
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newTemplate.isActive}
                    onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowAddTemplate(false);
                  setEditingTemplate(null);
                  setNewTemplate({ category: "", role: "", prompt: "", template: "", isActive: true });
                }}>
                  Cancel
                </Button>
                <Button
                  onClick={editingTemplate ? handleUpdateTemplate : handleAddTemplate}
                  data-testid={editingTemplate ? "button-confirm-edit-template" : "button-confirm-add-template"}
                  disabled={!newTemplate.category || !newTemplate.role || !newTemplate.prompt || !newTemplate.template || getAvailableRoles(newTemplate.category, editingTemplate?.role).length === 0 || (!editingTemplate && creating) || (editingTemplate !== null && updating)}
                >
                  {((!editingTemplate && creating) || (editingTemplate !== null && updating)) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTemplate
                    ? updating ? "Updating..." : "Update Template"
                    : creating ? "Creating..." : "Create Template"
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="hover-elevate" data-testid={`card-template-${template.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {template.role === "general-bid-template" ? (
                      <Badge variant="destructive">Default Template</Badge>
                    ) : (
                      <>
                        <Badge variant="outline">{getCategoryFromRole(template.role)}</Badge>
                        <Badge variant="default">{getRoleLabel(template.role)}</Badge>
                        <Badge variant="secondary" className="text-xs">Used</Badge>
                      </>
                    )}
                    {!template.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mb-1">
                    <FileText className="inline h-4 w-4 mr-2" />
                    {template.role === "general-bid-template" ? "Default Bid Template" : template.prompt}
                  </CardTitle>
                  {template.role === "general-bid-template" && (
                    <p className="text-sm text-muted-foreground">
                      This template will be used for all bids when no specific template matches
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditTemplate(template)}
                    data-testid={`button-edit-template-${template.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {template.role !== "general-bid-template" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={deletingId === template.id}
                      data-testid={`button-delete-template-${template.id}`}
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Template Message:</p>
                    <div
                      className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto"
                    >
                      {template.template}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Test Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first bid template to start automating your bidding process
                </p>
                <Button onClick={() => setShowAddTemplate(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  );
}
