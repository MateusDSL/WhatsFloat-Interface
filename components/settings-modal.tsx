"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Settings, Bell, HelpCircle } from "lucide-react"
import { useSettings } from "@/hooks/useSettings"
import { toast } from "@/hooks/use-toast"
import { t, getLanguageName } from "@/lib/i18n"

interface SettingsModalProps {
  children: React.ReactNode
}

export function SettingsModal({ children }: SettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { settings, saveSettings, updateSetting, resetSettings } = useSettings()

  const handleSettingChange = (category: string, key: string, value: any) => {
    updateSetting(category as any, key, value)
  }

  const handleSimpleSettingChange = (key: string, value: any) => {
    updateSetting(key as any, '', value)
  }

  const handleSaveSettings = () => {
    const result = saveSettings(settings)
    if (result.success) {
      toast({
        title: t('settings.saved', settings.language as any),
        description: t('settings.saved.description', settings.language as any),
      })
      setIsOpen(false)
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    }
  }

  const handleResetSettings = () => {
    resetSettings()
    toast({
      title: t('settings.reset', settings.language as any),
      description: t('settings.reset.description', settings.language as any),
    })
  }



  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={0}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
                 <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Settings className="h-5 w-5" />
             {t('settings.title', settings.language as any)}
           </DialogTitle>
           <DialogDescription>
             {t('settings.description', settings.language as any)}
           </DialogDescription>
         </DialogHeader>

        <div className="space-y-6">
                     {/* Notificações */}
           <div className="space-y-4">
             <div className="flex items-center gap-2">
               <Bell className="h-4 w-4" />
               <h3 className="font-medium">{t('notifications.title', settings.language as any)}</h3>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                 </TooltipTrigger>
                 <TooltipContent side="right" sideOffset={5} className="z-[9999] bg-popover border shadow-md">
                   <p className="text-sm">{t('tooltip.notifications', settings.language as any)}</p>
                 </TooltipContent>
               </Tooltip>
             </div>
            
            <div className="space-y-3">
                             <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label>Ativar notificações</Label>
                   <p className="text-sm text-muted-foreground">
                     Receber notificações de novos leads
                   </p>
                 </div>
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'enabled', checked)}
                />
              </div>

                             <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label>Som de notificação</Label>
                   <p className="text-sm text-muted-foreground">
                     Tocar som ao receber notificações
                   </p>
                 </div>
                <Switch
                  checked={settings.notifications.sound}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'sound', checked)}
                  disabled={!settings.notifications.enabled}
                />
              </div>

                             <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label>Notificações desktop</Label>
                   <p className="text-sm text-muted-foreground">
                     Mostrar notificações no sistema
                   </p>
                 </div>
                                 <Switch
                   checked={settings.notifications.desktop}
                   onCheckedChange={(checked) => handleSettingChange('notifications', 'desktop', checked)}
                   disabled={!settings.notifications.enabled}
                 />
               </div>


              
             </div>
          </div>

          <Separator />

                     {/* Idioma */}
           <div className="space-y-4">
             <div className="flex items-center gap-2">
               <h3 className="font-medium">{t('language.title', settings.language as any)}</h3>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                 </TooltipTrigger>
                 <TooltipContent side="right" sideOffset={5} className="z-[9999] bg-popover border shadow-md">
                   <p className="text-sm">{t('tooltip.language', settings.language as any)}</p>
                 </TooltipContent>
               </Tooltip>
             </div>
             <div className="space-y-2">
               <Select value={settings.language} onValueChange={(value) => handleSimpleSettingChange('language', value)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="pt-BR">{getLanguageName('pt-BR')}</SelectItem>
                   <SelectItem value="en-US">{getLanguageName('en-US')}</SelectItem>
                   <SelectItem value="es-ES">{getLanguageName('es-ES')}</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
        </div>

                 <div className="flex justify-between pt-4">
           <Button variant="outline" onClick={handleResetSettings}>
             {t('reset', settings.language as any)}
           </Button>
           <div className="flex gap-2">
             <Button variant="outline" onClick={() => setIsOpen(false)}>
               {t('cancel', settings.language as any)}
             </Button>
             <Button onClick={handleSaveSettings}>
               {t('save', settings.language as any)}
             </Button>
           </div>
                  </div>
       </DialogContent>
     </Dialog>
     </TooltipProvider>
   )
}
