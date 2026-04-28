import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Plus, Trash2, Star, Edit, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
interface CwProfile {
  id: string;
  cwEmail: string;
  cwPassword: string;
  accountId?: string;
  accountLink?: string;
  profileDescription?: string;
  isPrimary: boolean;
  auth_token?: string;
  cookie?: string;
  lastAuthAt?: string;
  authStatus: boolean;
  createdAt: string;
}

export default function Profile() {
  const { updateUser } = useAuth();
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [cwProfile, setCwProfile] = useState<CwProfile | null>(null);
  const [isSavingMain, setIsSavingMain] = useState(false);
  const [isSavingCw, setIsSavingCw] = useState(false);
  const [deletingCw, setDeletingCw] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { telegramUser } = useAuth();
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCw, setLoadingCw] = useState(true);
  const [newProfile, setNewProfile] = useState({
    cwEmail: "",
    cwPassword: "",
    accountId: "",
    accountLink: "",
    profileDescription: "",
  });

  const [profileData, setProfileData] = useState({
    fullName: "",
    age: 0,
    birthday: "",
    telegramUsername: "",
    telegramId: "",
    email: "",
  });

  // Fetch user profile from /api/user and set it to profileData

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiClient.get("/api/user", { telegramId: telegramUser.id });
        if (response?.data) {
          setProfileData((prev) => ({
            ...prev,
            ...response.data,
          }));
        }
      } catch (error: any) {
        if (error.response.status === 404) {
          toast({
            title: "Error",
            description: "User not found",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Error",
          description: "Could not fetch user profile.",
          variant: "destructive",
        });
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUserProfile();

  }, []);

  // Fetch CW profile
  useEffect(() => {
    const fetchCwProfile = async () => {
      try {
        const response = await apiClient.get("/api/cw-profiles", { telegramId: telegramUser.id });
        if (response?.data && response.data.length > 0) {
          const profile = response.data[0]; // Get the single profile
          setCwProfile(profile);
          // Populate the form with existing data
          setNewProfile({
            cwEmail: profile.cwEmail,
            cwPassword: profile.cwPassword,
            accountId: profile.accountId || "",
            accountLink: profile.accountLink || "",
            profileDescription: profile.profileDescription || "",
          });
        }
      } catch (error: any) {
        console.error("Error fetching CW profile:", error);
      } finally {
        setLoadingCw(false);
      }
    };
    fetchCwProfile();
  }, []);



  const handleProfileUpdate = async () => {
    setIsSavingMain(true);
    try {
      const response = await apiClient.patch('/api/user', { ...profileData, telegramId: telegramUser.id });

      if (response && response.data && response.data.success) {
        // Update the user data in auth context
        updateUser(profileData);

        toast({
          title: "Success",
          description: "Profile updated successfully.",
          variant: "default",
        });
      } else if (response && response.data && response.data.error) {
        toast({
          title: "Error",
          description: `Error updating profile: ${response.data.error}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Info",
          description: "Profile update response received.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingMain(false);
    }
  };

  const handleAddCwProfile = async () => {
    // Clear previous validation errors
    setValidationErrors({});

    // Validate all required fields
    if (!validateProfile()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingCw(true);
    try {
      let response;
      if (cwProfile) {
        response = await apiClient.patch("/api/cw-profiles", { ...newProfile, telegramId: telegramUser.id });
      } else {
        response = await apiClient.post("/api/cw-profiles", { ...newProfile, telegramId: telegramUser.id });
      }

      if (response?.data) {
        setCwProfile(response.data);
        toast({
          title: "Success",
          description: response.data.authMessage || (cwProfile ? "Profile updated successfully." : "Profile created successfully."),
          variant: "default",
        });
        // Don't clear the form after successful save
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.response?.data?.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCw(false);
    }
  };

  const handleDeleteCwProfile = async () => {
    if (!cwProfile) return;

    try {
      setDeletingCw(true);
      await apiClient.delete(`/api/cw-profiles/${cwProfile.id}`, { telegramId: telegramUser.id });
      setCwProfile(null);
      // Clear the form after deletion
      setNewProfile({ cwEmail: "", cwPassword: "", accountId: "", accountLink: "", profileDescription: "" });
      toast({
        title: "Success",
        description: "Profile deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingCw(false);
    }
  };


  const toggleSensitiveData = () => {
    setShowSensitiveData(prev => !prev);
  };

  const maskSensitiveData = (data: string) => {
    return "•".repeat(8);
  };

  const validateProfile = () => {
    const errors: { [key: string]: string } = {};

    if (!newProfile.cwEmail.trim()) {
      errors.cwEmail = "Crowdworks email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newProfile.cwEmail)) {
      errors.cwEmail = "Please enter a valid email address";
    }

    if (!newProfile.cwPassword.trim()) {
      errors.cwPassword = "Crowdworks password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  if (loadingUser || loadingCw) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and Crowdworks profiles
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal" data-testid="tab-personal">Personal Info</TabsTrigger>
          <TabsTrigger value="crowdworks" data-testid="tab-crowdworks">Crowdworks Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your profile details and Telegram connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Profile Picture</p>
                  <p className="text-sm">Synced from Telegram</p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SiTelegram className="h-4 w-4 text-[#0088cc]" />
                    Refresh from Telegram
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    data-testid="input-full-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profileData.age}
                    onChange={(e) => setProfileData({ ...profileData, age: Number(e.target.value) })}
                    data-testid="input-age"
                    min={1}
                    max={120}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={profileData.birthday}
                    onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                    data-testid="input-birthday"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegramUsername">Telegram Username</Label>
                  <Input
                    id="telegramUsername"
                    value={profileData.telegramUsername}
                    disabled
                    data-testid="input-telegram-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegramId">Telegram ID</Label>
                  <Input
                    id="telegramId"
                    value={profileData.telegramId}
                    disabled
                    data-testid="input-telegram-id"
                  />
                </div>
              </div>

              <Button onClick={handleProfileUpdate} data-testid="button-save-profile" disabled={isSavingMain}>
                {isSavingMain && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSavingMain ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crowdworks" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Crowdworks Profile</h3>
            <p className="text-sm text-muted-foreground">
              Manage your Crowdworks account for automated bidding
            </p>
          </div>


          <Card>
            <CardHeader>
              <CardTitle>Crowdworks Account Information</CardTitle>
              <CardDescription>
                Configure your Crowdworks account for automated bidding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">

                <div className="space-y-2">
                  <Label htmlFor="cwEmail">Crowdworks Email *</Label>
                  <Input
                    id="cwEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={newProfile.cwEmail}
                    onChange={(e) => {
                      setNewProfile({ ...newProfile, cwEmail: e.target.value });
                      clearFieldError('cwEmail');
                    }}
                    data-testid="input-cw-email"
                    className={validationErrors.cwEmail ? "border-red-500" : ""}
                  />
                  {validationErrors.cwEmail && (
                    <p className="text-sm text-red-500">{validationErrors.cwEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cwPassword">Crowdworks Password *</Label>
                  <div className="relative">
                    <Input
                      id="cwPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={newProfile.cwPassword}
                      onChange={(e) => {
                        setNewProfile({ ...newProfile, cwPassword: e.target.value });
                        clearFieldError('cwPassword');
                      }}
                      data-testid="input-cw-password"
                      className={`pr-10 ${validationErrors.cwPassword ? "border-red-500" : ""}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-auto p-1.5 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {validationErrors.cwPassword && (
                    <p className="text-sm text-red-500">{validationErrors.cwPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    type="text"
                    placeholder="Enter account ID"
                    value={newProfile.accountId}
                    onChange={(e) => setNewProfile({ ...newProfile, accountId: e.target.value })}
                    data-testid="input-account-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountLink">Account Link</Label>
                  <Input
                    id="accountLink"
                    type="text"
                    placeholder="https://..."
                    value={newProfile.accountLink}
                    onChange={(e) => setNewProfile({ ...newProfile, accountLink: e.target.value })}
                    data-testid="input-account-link"
                  />
                </div>

              </div>

              <div className="space-y-2">
                <Label htmlFor="profileDescription">Profile Description</Label>
                <Textarea
                  id="profileDescription"
                  placeholder="Describe your skills, experience, and what you can offer to clients..."
                  value={newProfile.profileDescription}
                  onChange={(e) => setNewProfile({ ...newProfile, profileDescription: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs">
                  CW registration may take some time for Validation.
                </p>
              </div>

              {/* Authentication Status */}
              {cwProfile && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Authentication Status:</span>
                    <div className="flex items-center gap-1">
                      {cwProfile.authStatus ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${cwProfile.authStatus ? 'text-green-600' : 'text-red-600'}`}>
                        {cwProfile.authStatus ? 'Authenticated' : 'Authentication Failed'}
                      </span>
                    </div>
                  </div>

                  {cwProfile.lastAuthAt && (
                    <div className="text-sm text-muted-foreground">
                      Last Authentication: {new Date(cwProfile.lastAuthAt).toLocaleString()}
                    </div>
                  )}

                  {/* Sensitive Data Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Password:</span>
                      <span className="text-sm font-mono">
                        {showSensitiveData ? cwProfile.cwPassword : maskSensitiveData(cwProfile.cwPassword)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={toggleSensitiveData}
                      >
                        {showSensitiveData ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    {cwProfile.auth_token && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Auth Token:</span>
                        <span className="text-sm font-mono">
                          {showSensitiveData ? cwProfile.auth_token : maskSensitiveData(cwProfile.auth_token)}
                        </span>
                      </div>
                    )}

                    {cwProfile.cookie && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Cookie:</span>
                        <span className="text-sm font-mono">
                          {showSensitiveData ? cwProfile.cookie : maskSensitiveData(cwProfile.cookie)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleAddCwProfile} data-testid="button-save-profile" disabled={isSavingCw}>
                  {isSavingCw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSavingCw ? (cwProfile ? 'Updating...' : 'Saving...') : (cwProfile ? 'Update Profile' : 'Save Profile')}
                </Button>
                {cwProfile && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteCwProfile}
                    data-testid="button-delete-profile"
                    disabled={deletingCw || isSavingCw}
                  >
                    {deletingCw ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                        Delete Profile
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
