import { useTelegram } from "@/hooks/use-telegram";
import { Button } from "@/components/ui/button";
import { AlertCircle, MessageCircle } from "lucide-react";

export default function AccessDenied() {
  const { webApp } = useTelegram();

  const openTelegram = () => {
    if (webApp) {
      webApp.openLink("https://t.me/@Cw_my_bot");
    } else {
      window.open("https://t.me/@Cw_my_bot", "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this application. Please request access from the admin.
          </p>
        </div>

        <div className="space-y-4">
          <Button onClick={openTelegram} className="w-full" size="lg">
            <MessageCircle className="h-4 w-4 mr-2" />
            Request Access via Telegram
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Contact the admin to get access to this application.
          </p>
        </div>
      </div>
    </div>
  );
}
