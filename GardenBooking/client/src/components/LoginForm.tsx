import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf } from "lucide-react";

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string) => void;
}

export default function LoginForm({ onLogin, onRegister }: LoginFormProps) {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", password: "", confirmPassword: "" });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempted:", loginData.username);
    onLogin(loginData.username, loginData.password);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert("Lösenorden stämmer inte överens");
      return;
    }
    console.log("Register attempted:", registerData.username);
    onRegister(registerData.username, registerData.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Trädgårdsarbete</CardTitle>
          <CardDescription>
            Boka dina veckor för trädgårdsarbete i bostadsrättsföreningen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Logga in</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Registrera</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Användarnamn</Label>
                  <Input
                    id="login-username"
                    data-testid="input-login-username"
                    value={loginData.username}
                    onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Lösenord</Label>
                  <Input
                    id="login-password"
                    data-testid="input-login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="button-login">
                  Logga in
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Användarnamn</Label>
                  <Input
                    id="register-username"
                    data-testid="input-register-username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Lösenord</Label>
                  <Input
                    id="register-password"
                    data-testid="input-register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Bekräfta lösenord</Label>
                  <Input
                    id="confirm-password"
                    data-testid="input-confirm-password"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="button-register">
                  Registrera
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}