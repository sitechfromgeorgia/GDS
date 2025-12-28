'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

export default function DemoSettingsPage() {
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: 'Demo Mode',
      description: 'Settings cannot be saved in demo mode.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">პარამეტრები</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">ზოგადი</TabsTrigger>
          <TabsTrigger value="account">ანგარიში</TabsTrigger>
          <TabsTrigger value="notifications">შეტყობინებები</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>რესტორნის ინფორმაცია</CardTitle>
              <CardDescription>მართეთ თქვენი რესტორნის ძირითადი ინფორმაცია</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name">სახელი</Label>
                <Input id="name" defaultValue="Demo Restaurant" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">ელ-ფოსტა</Label>
                <Input id="email" defaultValue="demo@example.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">ტელეფონი</Label>
                <Input id="phone" defaultValue="+995 555 00 00 00" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>შენახვა</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>პაროლის შეცვლა</CardTitle>
              <CardDescription>შეცვალეთ თქვენი ანგარიშის პაროლი</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="current">მიმდინარე პაროლი</Label>
                <Input id="current" type="password" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new">ახალი პაროლი</Label>
                <Input id="new" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>პაროლის შეცვლა</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
