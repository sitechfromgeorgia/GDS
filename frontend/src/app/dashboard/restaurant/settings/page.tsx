'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Bell, Store, Clock, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function RestaurantSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    restaurant: {
      name: 'Georgian Traditional Restaurant',
      address: 'ვაჟა-ფშაველას 25, თბილისი',
      phone: '+995 555 100 200',
      email: 'restaurant@example.com',
      description: 'ტრადიციული ქართული კერძები და საუკეთესო სერვისი',
    },
    workingHours: {
      monday: { open: '10:00', close: '23:00', enabled: true },
      tuesday: { open: '10:00', close: '23:00', enabled: true },
      wednesday: { open: '10:00', close: '23:00', enabled: true },
      thursday: { open: '10:00', close: '23:00', enabled: true },
      friday: { open: '10:00', close: '00:00', enabled: true },
      saturday: { open: '10:00', close: '00:00', enabled: true },
      sunday: { open: '11:00', close: '22:00', enabled: true },
    },
    notifications: {
      newOrders: true,
      lowStock: true,
      customerReviews: true,
      systemUpdates: false,
    },
    operations: {
      autoAcceptOrders: false,
      preparationTime: '20',
      minimumOrder: '15',
      deliveryFee: '5',
      freeDeliveryThreshold: '50',
    },
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // TODO: Implement API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: 'პარამეტრები შენახულია',
        description: 'რესტორნის პარამეტრები წარმატებით განახლდა',
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

  const weekDays = [
    { key: 'monday', label: 'ორშაბათი' },
    { key: 'tuesday', label: 'სამშაბათი' },
    { key: 'wednesday', label: 'ოთხშაბათი' },
    { key: 'thursday', label: 'ხუთშაბათი' },
    { key: 'friday', label: 'პარასკევი' },
    { key: 'saturday', label: 'შაბათი' },
    { key: 'sunday', label: 'კვირა' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">პარამეტრები</h1>
        <p className="text-muted-foreground mt-2">მართეთ თქვენი რესტორნის კონფიგურაცია</p>
      </div>

      <Tabs defaultValue="restaurant" className="space-y-4">
        <TabsList>
          <TabsTrigger value="restaurant">
            <Store className="h-4 w-4 mr-2" />
            რესტორანი
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            სამუშაო საათები
          </TabsTrigger>
          <TabsTrigger value="operations">
            <DollarSign className="h-4 w-4 mr-2" />
            ოპერაციები
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            შეტყობინებები
          </TabsTrigger>
        </TabsList>

        {/* Restaurant Info */}
        <TabsContent value="restaurant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>რესტორნის ინფორმაცია</CardTitle>
              <CardDescription>ძირითადი მონაცემები თქვენი რესტორნის შესახებ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>დასახელება</Label>
                <Input
                  value={settings.restaurant.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      restaurant: { ...settings.restaurant, name: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>მისამართი</Label>
                <Input
                  value={settings.restaurant.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      restaurant: { ...settings.restaurant, address: e.target.value },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ტელეფონი</Label>
                  <Input
                    value={settings.restaurant.phone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        restaurant: { ...settings.restaurant, phone: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>ელ-ფოსტა</Label>
                  <Input
                    type="email"
                    value={settings.restaurant.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        restaurant: { ...settings.restaurant, email: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>აღწერა</Label>
                <Textarea
                  value={settings.restaurant.description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      restaurant: { ...settings.restaurant, description: e.target.value },
                    })
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Hours */}
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>სამუშაო საათები</CardTitle>
              <CardDescription>განსაზღვრეთ თქვენი რესტორნის სამუშაო საათები</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weekDays.map((day) => {
                const hours = settings.workingHours[day.key as keyof typeof settings.workingHours]
                return (
                  <div key={day.key} className="flex items-center gap-4">
                    <div className="w-32">
                      <Label>{day.label}</Label>
                    </div>
                    <Switch
                      checked={hours.enabled}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          workingHours: {
                            ...settings.workingHours,
                            [day.key]: { ...hours, enabled: checked },
                          },
                        })
                      }
                    />
                    {hours.enabled ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              workingHours: {
                                ...settings.workingHours,
                                [day.key]: { ...hours, open: e.target.value },
                              },
                            })
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              workingHours: {
                                ...settings.workingHours,
                                [day.key]: { ...hours, close: e.target.value },
                              },
                            })
                          }
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">დახურულია</span>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Settings */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ოპერაციული პარამეტრები</CardTitle>
              <CardDescription>შეკვეთებისა და მიწოდების პარამეტრები</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>შეკვეთების ავტომატური მიღება</Label>
                  <p className="text-sm text-muted-foreground">
                    ავტომატურად მიიღეთ ყველა ახალი შეკვეთა
                  </p>
                </div>
                <Switch
                  checked={settings.operations.autoAcceptOrders}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      operations: { ...settings.operations, autoAcceptOrders: checked },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>მომზადების დრო (წუთები)</Label>
                <Input
                  type="number"
                  value={settings.operations.preparationTime}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operations: { ...settings.operations, preparationTime: e.target.value },
                    })
                  }
                  min="5"
                  max="120"
                />
                <p className="text-sm text-muted-foreground">საშუალო დრო შეკვეთის მომზადებისთვის</p>
              </div>

              <div className="space-y-2">
                <Label>მინიმალური შეკვეთა (₾)</Label>
                <Input
                  type="number"
                  value={settings.operations.minimumOrder}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operations: { ...settings.operations, minimumOrder: e.target.value },
                    })
                  }
                  min="0"
                />
                <p className="text-sm text-muted-foreground">მინიმალური თანხა შეკვეთისთვის</p>
              </div>

              <div className="space-y-2">
                <Label>მიწოდების საფასური (₾)</Label>
                <Input
                  type="number"
                  value={settings.operations.deliveryFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operations: { ...settings.operations, deliveryFee: e.target.value },
                    })
                  }
                  min="0"
                />
                <p className="text-sm text-muted-foreground">სტანდარტული მიწოდების ფასი</p>
              </div>

              <div className="space-y-2">
                <Label>უფასო მიწოდების ზღვარი (₾)</Label>
                <Input
                  type="number"
                  value={settings.operations.freeDeliveryThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operations: { ...settings.operations, freeDeliveryThreshold: e.target.value },
                    })
                  }
                  min="0"
                />
                <p className="text-sm text-muted-foreground">
                  შეკვეთის მინიმალური თანხა უფასო მიწოდებისთვის
                </p>
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
                    შეტყობინება ყოველი ახალი შეკვეთისთვის
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
                  <Label>დაბალი მარაგი</Label>
                  <p className="text-sm text-muted-foreground">
                    შეტყობინება პროდუქტის მარაგის შემცირებისას
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.lowStock}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, lowStock: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>მომხმარებელთა შეფასებები</Label>
                  <p className="text-sm text-muted-foreground">
                    შეტყობინება ახალი შეფასებისა და კომენტარისთვის
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.customerReviews}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, customerReviews: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>სისტემური განახლებები</Label>
                  <p className="text-sm text-muted-foreground">
                    შეტყობინება სისტემის განახლებებისა და სიახლეების შესახებ
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.systemUpdates}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, systemUpdates: checked },
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
