'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Bell, Shield, Database, Mail, Server } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      orderUpdates: true,
      systemAlerts: true,
    },
    system: {
      maintenanceMode: false,
      autoBackup: true,
      debugMode: false,
      analyticsEnabled: true,
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: '',
      fromName: 'Georgian Distribution',
    },
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // TODO: Implement API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: 'პარამეტრები შენახულია',
        description: 'სისტემის პარამეტრები წარმატებით განახლდა',
      })
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: 'პარამეტრების შენახვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">პარამეტრები</h1>
        <p className="text-muted-foreground mt-2">მართეთ სისტემის კონფიგურაცია და პარამეტრები</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            ზოგადი
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            შეტყობინებები
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            უსაფრთხოება
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            ელ-ფოსტა
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            მონაცემთა ბაზა
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>სისტემის პარამეტრები</CardTitle>
              <CardDescription>ძირითადი სისტემის კონფიგურაცია</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>მოვლა-პატრონობის რეჟიმი</Label>
                  <p className="text-sm text-muted-foreground">
                    დროებით შეაჩერეთ სისტემა განახლებისთვის
                  </p>
                </div>
                <Switch
                  checked={settings.system.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      system: { ...settings.system, maintenanceMode: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ავტომატური რეზერვირება</Label>
                  <p className="text-sm text-muted-foreground">
                    ავტომატურად შექმენით რეზერვირება ყოველ დღე
                  </p>
                </div>
                <Switch
                  checked={settings.system.autoBackup}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      system: { ...settings.system, autoBackup: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug რეჟიმი</Label>
                  <p className="text-sm text-muted-foreground">
                    ჩართეთ დეტალური ლოგირება და დიაგნოსტიკა
                  </p>
                </div>
                <Switch
                  checked={settings.system.debugMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      system: { ...settings.system, debugMode: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ანალიტიკა</Label>
                  <p className="text-sm text-muted-foreground">
                    შეაგროვეთ სტატისტიკა და ანალიტიკური მონაცემები
                  </p>
                </div>
                <Switch
                  checked={settings.system.analyticsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      system: { ...settings.system, analyticsEnabled: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>შეტყობინებების პარამეტრები</CardTitle>
              <CardDescription>გამართეთ როგორ მიიღებთ შეტყობინებებს</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ელ-ფოსტის შეტყობინებები</Label>
                  <p className="text-sm text-muted-foreground">მიიღეთ შეტყობინებები ელ-ფოსტაზე</p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, email: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS შეტყობინებები</Label>
                  <p className="text-sm text-muted-foreground">მიიღეთ შეტყობინებები SMS-ით</p>
                </div>
                <Switch
                  checked={settings.notifications.sms}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, sms: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push შეტყობინებები</Label>
                  <p className="text-sm text-muted-foreground">
                    მიიღეთ push შეტყობინებები ბრაუზერში
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, push: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>შეკვეთების განახლებები</Label>
                  <p className="text-sm text-muted-foreground">
                    შეტყობინებები ახალი შეკვეთების შესახებ
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.orderUpdates}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, orderUpdates: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>სისტემური გაფრთხილებები</Label>
                  <p className="text-sm text-muted-foreground">
                    შეტყობინებები სისტემური მოვლენების შესახებ
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.systemAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, systemAlerts: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>უსაფრთხოების პარამეტრები</CardTitle>
              <CardDescription>მართეთ უსაფრთხოების პოლიტიკა</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>პაროლის მინიმალური სიგრძე</Label>
                <Input type="number" defaultValue="8" min="6" max="20" />
                <p className="text-sm text-muted-foreground">
                  მინიმალური სიმბოლოების რაოდენობა პაროლში
                </p>
              </div>

              <div className="space-y-2">
                <Label>სესიის ხანგრძლივობა (წუთები)</Label>
                <Input type="number" defaultValue="30" min="5" max="1440" />
                <p className="text-sm text-muted-foreground">სესიის ვადის გასვლის დრო</p>
              </div>

              <div className="space-y-2">
                <Label>მაქსიმალური შესვლის მცდელობები</Label>
                <Input type="number" defaultValue="3" min="1" max="10" />
                <p className="text-sm text-muted-foreground">
                  მცდელობების რაოდენობა ანგარიშის დაბლოკვამდე
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ელ-ფოსტის კონფიგურაცია</CardTitle>
              <CardDescription>SMTP სერვერის პარამეტრები</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input
                  value={settings.email.smtpHost}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtpHost: e.target.value },
                    })
                  }
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label>SMTP Port</Label>
                <Input
                  value={settings.email.smtpPort}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtpPort: e.target.value },
                    })
                  }
                  placeholder="587"
                />
              </div>

              <div className="space-y-2">
                <Label>SMTP Username</Label>
                <Input
                  value={settings.email.smtpUser}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtpUser: e.target.value },
                    })
                  }
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  value={settings.email.fromName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, fromName: e.target.value },
                    })
                  }
                  placeholder="Georgian Distribution"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>მონაცემთა ბაზის მართვა</CardTitle>
              <CardDescription>რეზერვირება და მოვლა-პატრონობა</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" className="gap-2">
                  <Database className="h-4 w-4" />
                  რეზერვირების შექმნა
                </Button>
                <Button variant="outline" className="gap-2">
                  <Server className="h-4 w-4" />
                  აღდგენა
                </Button>
              </div>

              <div className="space-y-2">
                <Label>ბოლო რეზერვირება</Label>
                <p className="text-sm text-muted-foreground">2025-11-05 14:30:00</p>
              </div>

              <div className="space-y-2">
                <Label>მონაცემთა ბაზის ზომა</Label>
                <p className="text-sm text-muted-foreground">245 MB</p>
              </div>

              <div className="space-y-2">
                <Label>რეზერვირების სიხშირე</Label>
                <Input type="text" defaultValue="ყოველდღიურად 02:00 AM" disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? 'შენახვა...' : 'პარამეტრების შენახვა'}
        </Button>
      </div>
    </div>
  )
}
