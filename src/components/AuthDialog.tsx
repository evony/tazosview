'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Shield, 
  Heart, 
  Phone, 
  Lock, 
  User, 
  Mail, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register';
  defaultDivision?: 'MALE' | 'FEMALE';
}

export function AuthDialog({ open, onOpenChange, defaultTab = 'login', defaultDivision }: AuthDialogProps) {
  const { login, register, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedDivision, setSelectedDivision] = useState<'MALE' | 'FEMALE'>(defaultDivision || 'MALE');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await login(loginForm.phone, loginForm.password);
    
    if (result.success) {
      toast({
        title: 'Login Berhasil!',
        description: 'Selamat datang kembali!',
        variant: 'default'
      });
      onOpenChange(false);
      setLoginForm({ phone: '', password: '' });
    } else {
      toast({
        title: 'Login Gagal',
        description: result.error || 'Periksa kembali nomor HP dan password',
        variant: 'destructive'
      });
    }
    
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: 'Password Tidak Cocok',
        description: 'Pastikan password dan konfirmasi password sama',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    const result = await register({
      phone: registerForm.phone,
      password: registerForm.password,
      name: registerForm.name,
      email: registerForm.email || undefined
    });
    
    if (result.success) {
      toast({
        title: 'Registrasi Berhasil!',
        description: 'Akun kamu telah dibuat. Selamat bermain!',
        variant: 'default'
      });
      onOpenChange(false);
      setRegisterForm({ phone: '', password: '', confirmPassword: '', name: '', email: '' });
    } else {
      toast({
        title: 'Registrasi Gagal',
        description: result.error || 'Gagal membuat akun',
        variant: 'destructive'
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-yellow-400/20 text-white">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center glow-pulse">
              <Trophy className="w-8 h-8 text-black" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl text-gradient-gold">
            IDOL META
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Masuk atau daftar untuk mulai bermain
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900">
            <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black">
              Masuk
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black">
              Daftar
            </TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-phone" className="text-gray-300">Nomor HP</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="login-phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={loginForm.phone}
                    onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                    className="pl-10 bg-gray-900 border-gray-700 focus:border-yellow-400 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="pl-10 pr-10 bg-gray-900 border-gray-700 focus:border-yellow-400 text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Division Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300">Pilih Divisi</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDivision('MALE')}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      selectedDivision === 'MALE'
                        ? "border-red-500 bg-red-500/10"
                        : "border-gray-700 bg-gray-900 hover:border-gray-600"
                    )}
                  >
                    <Shield className={cn(
                      "w-8 h-8 mx-auto mb-2",
                      selectedDivision === 'MALE' ? "text-red-400" : "text-gray-500"
                    )} />
                    <p className={cn(
                      "font-medium",
                      selectedDivision === 'MALE' ? "text-red-400" : "text-gray-400"
                    )}>Male</p>
                    <p className="text-xs text-gray-500">Divisi Pria</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDivision('FEMALE')}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      selectedDivision === 'FEMALE'
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-gray-700 bg-gray-900 hover:border-gray-600"
                    )}
                  >
                    <Heart className={cn(
                      "w-8 h-8 mx-auto mb-2",
                      selectedDivision === 'FEMALE' ? "text-cyan-400" : "text-gray-500"
                    )} />
                    <p className={cn(
                      "font-medium",
                      selectedDivision === 'FEMALE' ? "text-cyan-400" : "text-gray-400"
                    )}>Female</p>
                    <p className="text-xs text-gray-500">Divisi Wanita</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-name" className="text-gray-300">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Nama kamu"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="pl-10 bg-gray-900 border-gray-700 focus:border-yellow-400 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-phone" className="text-gray-300">Nomor HP</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className="pl-10 bg-gray-900 border-gray-700 focus:border-yellow-400 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-gray-300">Email (Opsional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="email@example.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="pl-10 bg-gray-900 border-gray-700 focus:border-yellow-400 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="pl-10 pr-10 bg-gray-900 border-gray-700 focus:border-yellow-400 text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password" className="text-gray-300">Konfirmasi Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="pl-10 bg-gray-900 border-gray-700 focus:border-yellow-400 text-white"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className={cn(
                  "w-full font-semibold",
                  selectedDivision === 'MALE'
                    ? "bg-gradient-to-r from-red-600 to-red-800 text-white"
                    : "bg-gradient-to-r from-cyan-400 to-pink-400 text-black"
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  `Daftar ${selectedDivision === 'MALE' ? 'Male' : 'Female'} Division`
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
