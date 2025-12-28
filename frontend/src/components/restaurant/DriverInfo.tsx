import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone } from 'lucide-react'

interface DriverInfoProps {
  driver?: {
    full_name: string
    phone: string
    vehicle_info?: string
    avatar_url?: string
  } | null
}

export function DriverInfo({ driver }: DriverInfoProps) {
  if (!driver) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">კურიერის ინფორმაცია</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">კურიერი ჯერ არ არის დანიშნული</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">კურიერის ინფორმაცია</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={driver.avatar_url} />
          <AvatarFallback>{driver.full_name[0]}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-medium leading-none">{driver.full_name}</p>
          <p className="text-sm text-muted-foreground">{driver.vehicle_info}</p>
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="mr-1 h-3 w-3" />
            {driver.phone}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
