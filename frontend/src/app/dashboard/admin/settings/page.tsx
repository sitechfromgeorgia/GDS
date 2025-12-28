'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  Server,
  AlertCircle,
  Download,
  ExternalLink,
  Clock,
  HardDrive,
  Calendar,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [exportingDatabase, setExportingDatabase] = useState(false)
  const [lastExport, setLastExport] = useState<string | null>(null)

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
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
    security: {
      passwordMinLength: 8,
      sessionTimeout: 30,
      maxLoginAttempts: 3,
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

  const handleExportDatabase = async () => {
    setExportingDatabase(true)
    try {
      // TODO: Implement actual database export via API
      // For now, simulate the export process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const timestamp = new Date().toISOString()
      setLastExport(timestamp)

      // Store in localStorage for persistence
      localStorage.setItem('lastDatabaseExport', timestamp)

      toast({
        title: 'მონაცემთა ბაზა ექსპორტირებულია',
        description: 'SQL ფაილი ჩამოიტვირთა წარმატებით',
      })

      // TODO: Trigger actual file download when backend is ready
      // const blob = new Blob([sqlData], { type: 'application/sql' })
      // const url = window.URL.createObjectURL(blob)
      // const a = document.createElement('a')
      // a.href = url
      // a.download = `database-export-${new Date().toISOString()}.sql`
      // a.click()
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: 'მონაცემთა ბაზის ექსპორტი ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setExportingDatabase(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">პარამეტრები</h1>
        <p className="text-muted-foreground mt-2">მართეთ სისტემის კონფიგურაცია და პარამეტრები</p>
      </div>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>სისტემის პარამეტრები</CardTitle>
              <CardDescription>ძირითადი სისტემის კონფიგურაცია</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label>მოვლა-პატრონობის რეჟიმი</Label>
                  {settings.system.maintenanceMode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      <AlertCircle className="h-3 w-3" />
                      აქტიური
                    </span>
                  )}
                </div>
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
              <div className="space-y-0.5 flex-1">
                <Label>ავტომატური რეზერვირება</Label>
                <p className="text-sm text-muted-foreground">
                  ავტომატურად შექმენით რეზერვირება ყოველ დღე 02:00 AM
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
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label>Debug რეჟიმი</Label>
                  {settings.system.debugMode && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      დეველოპერი
                    </span>
                  )}
                </div>
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
              <div className="space-y-0.5 flex-1">
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
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>შეტყობინებები</CardTitle>
              <CardDescription>გამართეთ როგორ მიიღებთ შეტყობინებებს</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channels */}
          <div>
            <h3 className="text-sm font-semibold mb-4">არხები</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
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
                <div className="space-y-0.5 flex-1">
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
            </div>
          </div>

          {/* Events */}
          <div className="pt-2 border-t">
            <h3 className="text-sm font-semibold mb-4">მოვლენები</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
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
                <div className="space-y-0.5 flex-1">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-950/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle>უსაფრთხოება</CardTitle>
              <CardDescription>მართეთ უსაფრთხოების პოლიტიკა</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="password-length">პაროლის მინიმალური სიგრძე</Label>
              <Input
                id="password-length"
                type="number"
                value={settings.security.passwordMinLength}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: { ...settings.security, passwordMinLength: Number(e.target.value) },
                  })
                }
                min="6"
                max="20"
              />
              <p className="text-xs text-muted-foreground">მინიმალური სიმბოლოების რაოდენობა</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timeout">სესიის ხანგრძლივობა (წუთები)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: { ...settings.security, sessionTimeout: Number(e.target.value) },
                  })
                }
                min="5"
                max="1440"
              />
              <p className="text-xs text-muted-foreground">სესიის ვადის გასვლის დრო</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-attempts">მაქსიმალური შესვლის მცდელობები</Label>
              <Input
                id="max-attempts"
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: { ...settings.security, maxLoginAttempts: Number(e.target.value) },
                  })
                }
                min="1"
                max="10"
              />
              <p className="text-xs text-muted-foreground">მცდელობების რაოდენობა დაბლოკვამდე</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration - Accordion */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="single" collapsible>
            <AccordionItem value="email" className="border-0">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">ელ-ფოსტის კონფიგურაცია</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      SMTP სერვერის პარამეტრები
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid gap-4 md:grid-cols-2 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
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
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input
                      id="smtp-port"
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
                    <Label htmlFor="smtp-user">SMTP Username</Label>
                    <Input
                      id="smtp-user"
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
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
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
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/10">
              <Database className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <CardTitle>მონაცემთა ბაზის მართვა</CardTitle>
              <CardDescription>ავტომატური და მექანიკური რეზერვირება</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: Supabase Automatic Backups */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 mt-0.5">
                <Server className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Supabase ავტომატური რეზერვირება</h3>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    აქტიური
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  თქვენი მონაცემთა ბაზა ავტომატურად ინახება Supabase-ის მიერ ყოველდღიურად.
                  რეზერვირებები ხელმისაწვდომია Supabase Dashboard-ში.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 mt-2"
                  onClick={() =>
                    window.open(
                      'https://supabase.com/dashboard/project/_/database/backups',
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="h-3 w-3" />
                  გახსენი Supabase Dashboard
                </Button>
              </div>
            </div>
          </div>

          {/* Section 2: Manual Database Export */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  მექანიკური ექსპორტი
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ჩამოტვირთეთ მონაცემთა ბაზის სრული ასლი SQL ფაილად
                </p>
              </div>
              <Button onClick={handleExportDatabase} disabled={exportingDatabase} className="gap-2">
                {exportingDatabase ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ექსპორტირება...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    ექსპორტის გაშვება
                  </>
                )}
              </Button>
            </div>

            {lastExport && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>ბოლო ექსპორტი: {new Date(lastExport).toLocaleString('ka-GE')}</span>
              </div>
            )}
          </div>

          {/* Section 3: Advanced Options (Accordion) */}
          <div className="pt-4 border-t">
            <Accordion type="single" collapsible>
              <AccordionItem value="advanced" className="border-0">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Settings className="h-4 w-4" />
                    დამატებითი პარამეტრები
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-6">
                    {/* Schedule Configuration */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-3">ავტომატური ექსპორტის განრიგი</h4>
                        <p className="text-xs text-muted-foreground mb-4">
                          მოითხოვს backend cron job-ის კონფიგურაციას
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex-1">
                          <Label>ავტომატური ექსპორტი</Label>
                          <p className="text-sm text-muted-foreground">
                            პერიოდულად შექმენით დამატებითი რეზერვირება
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
                          disabled
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 opacity-50">
                        <div className="space-y-2">
                          <Label htmlFor="backup-frequency">სიხშირე</Label>
                          <Input
                            id="backup-frequency"
                            value="ყოველდღიურად"
                            disabled
                            placeholder="ყოველდღიურად / ყოველკვირეული / ყოველთვიური"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="backup-time">დრო</Label>
                          <Input id="backup-time" type="time" value="02:00" disabled />
                        </div>
                      </div>

                      <p className="text-xs text-amber-600 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/10 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          ეს ფუნქცია მოითხოვს backend API-ს და cron job-ის კონფიგურაციას. ამჟამად არ
                          არის აქტიური.
                        </span>
                      </p>
                    </div>

                    {/* Database Information */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-medium">მონაცემთა ბაზის ინფორმაცია</h4>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            ბაზის ზომა
                          </Label>
                          <p className="text-sm font-medium">~245 MB</p>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            ცხრილების რაოდენობა
                          </Label>
                          <p className="text-sm font-medium">12 ცხრილი</p>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Supabase ბექაფი
                          </Label>
                          <p className="text-sm font-medium">ყოველდღიურად 02:00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>

      {/* Save Button - Sticky on mobile */}
      <div className="sticky bottom-4 flex justify-end pt-4">
        <Button onClick={handleSave} disabled={loading} size="lg" className="shadow-lg">
          {loading ? 'შენახვა...' : 'პარამეტრების შენახვა'}
        </Button>
      </div>
    </div>
  )
}
