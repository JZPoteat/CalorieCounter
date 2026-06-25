import { createClient } from '@/lib/supabase/server'
import { GoalsForm } from '@/components/settings/GoalsForm'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('calorie_goal, protein_goal, carbs_goal, fat_goal')
    .single()

  const defaults = {
    calorie_goal: profile?.calorie_goal ?? 2000,
    protein_goal: profile?.protein_goal ?? 150,
    carbs_goal: profile?.carbs_goal ?? 250,
    fat_goal: profile?.fat_goal ?? 65,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Set your daily macro goals.</p>
      </div>
      <GoalsForm defaults={defaults} />
    </div>
  )
}
