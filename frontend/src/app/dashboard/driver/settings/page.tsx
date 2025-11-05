'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Bell, User, Car, Navigation } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function DriverSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    profile: {
      fullName: 'გიორგი მამულაშვილი',
      phone: '+995 555 123 456',
      email: 'driver@example.com',
      licenseNumber: 'AA123456',
    },
    vehicle: {
      model: 'Toyota Prius',
      plate: 'AB-123-CD',
      year: '2020',
      color: 'თეთრი',
    },
    notifications: {
      newOrders: true,
      orderUpdates: true,
      messages: true,
      promotions: false,
    },
    preferences: {
      autoAcceptOrders: false,
      soundEnabled: true,
      vibrationEnabled: true,
      requireRestaurantConfirmation: true,
    },
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // TODO: Implement API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: 'პარამეტრები შენახულია',
        description: 'თქვენი პარამეტრები წარმატებით განახლდა',
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
        <p className="text-muted-foreground mt-2">
          მართეთ თქვენი პროფილის და აპლიკაციის პარამეტრები
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            პროფილი
          </TabsTrigger>
          <TabsTrigger value="vehicle">
            <Car className="h-4 w-4 mr-2" />
            ავტომობილი
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            შეტყობინებები
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="h-4 w-4 mr-2" />
            პრეფერენციები
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>პირადი ინფორმაცია</CardTitle>
              <CardDescription>განაახლეთ თქვენი პირადი მონაცემები</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>სრული სახელი</Label>
                <Input
                  value={settings.profile.fullName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profile: { ...settings.profile, fullName: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>ტელეფონი</Label>
                <Input
                  value={settings.profile.phone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profile: { ...settings.profile, phone: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>ელ-ფოსტა</Label>
                <Input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profile: { ...settings.profile, email: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>მართვის მოწმობის ნომერი</Label>
                <Input
                  value={settings.profile.licenseNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profile: { ...settings.profile, licenseNumber: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Settings */}
        <TabsContent value="vehicle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ავტომობილის ინფორმაცია</CardTitle>
              <CardDescription>განაახლეთ თქვენი ავტომობილის მონაცემები</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>მარკა და მოდელი</Label>
                <Input
                  value={settings.vehicle.model}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vehicle: { ...settings.vehicle, model: e.target.value },
                    })
                  }
                  placeholder="Toyota Prius"
                />
              </div>

              <div className="space-y-2">
                <Label>სახელმწიფო ნომერი</Label>
                <Input
                  value={settings.vehicle.plate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vehicle: { ...settings.vehicle, plate: e.target.value },
                    })
                  }
                  placeholder="AB-123-CD"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>გამოშვების წელი</Label>
                  <Input
                    value={settings.vehicle.year}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        vehicle: { ...settings.vehicle, year: e.target.value },
                      })
                    }
                    placeholder="2020"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ფერი</Label>
                  <Input
                    value={settings.vehicle.color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        vehicle: { ...settings.vehicle, color: e.target.value },
                      })
                    }
                    placeholder="თეთრი"
                  />
                </div>
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
                  <Label>ახალი შეკვეთები</Label>
                  <p className="text-sm text-muted-foreground">
                    შეტყობინება ახალი შეკვეთების შესახებ
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.newOrders}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, newOrders: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>შეკვეთის განახლებები</Label>
                  <p className="text-sm text-muted-foreground">
                    შეტყობინება შეკვეთის სტატუსის შეცვლისას
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
                  <Label>შეტყობინებები</Label>
                  <p className="text-sm text-muted-foreground">
                    შეტყობინებები ადმინისა და რესტორნებისგან
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.messages}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, messages: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>აქციები და სიახლეები</Label>
                  <p className="text-sm text-muted-foreground">
                    ინფორმაცია აქციებისა და სიახლეების შესახებ
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.promotions}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, promotions: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Settings */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>აპლიკაციის პარამეტრები</CardTitle>
              <CardDescription>პერსონალიზაცია და ფუნქციონალურობა</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>შეკვეთების ავტომატური მიღება</Label>
                  <p className="text-sm text-muted-foreground">
                    ავტომატურად მიიღეთ ახალი შეკვეთები
                  </p>
                </div>
                <Switch
                  checked={settings.preferences.autoAcceptOrders}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, autoAcceptOrders: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ხმის შეტყობინებები</Label>
                  <p className="text-sm text-muted-foreground">
                    ხმოვანი სიგნალები შეტყობინებებისთვის
                  </p>
                </div>
                <Switch
                  checked={settings.preferences.soundEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, soundEnabled: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ვიბრაცია</Label>
                  <p className="text-sm text-muted-foreground">ვიბრაცია შეტყობინებებისთვის</p>
                </div>
                <Switch
                  checked={settings.preferences.vibrationEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, vibrationEnabled: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>რესტორნის დადასტურება აუცილებელია</Label>
                  <p className="text-sm text-muted-foreground">
                    შეკვეთა ჩაბარებულად ითვლება მხოლოდ ობიექტის დადასტურების შემდეგ
                  </p>
                </div>
                <Switch
                  checked={settings.preferences.requireRestaurantConfirmation}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      preferences: {
                        ...settings.preferences,
                        requireRestaurantConfirmation: checked,
                      },
                    })
                  }
                />
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
