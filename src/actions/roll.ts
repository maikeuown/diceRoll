'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { DropResult } from '@/types';

export async function rollDice(): Promise<DropResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to drop dice.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_drop, total_score')
    .eq('id', user.id)
    .single();

  if (profile?.last_drop) {
    const lastDrop = new Date(profile.last_drop);
    const now = new Date();
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (lastDrop >= todayMidnight) {
      throw new Error('You already dropped today. Come back after midnight UTC!');
    }
  }

  // Generate 100 cryptographically random d6 values
  const randomBytes = new Uint8Array(100);
  crypto.getRandomValues(randomBytes);
  const diceValues = Array.from(randomBytes, (b) => (b % 6) + 1);
  const score = diceValues.reduce((sum, v) => sum + v, 0);

  // Record the drop
  const { error: insertError } = await supabase.from('drops').insert({
    user_id: user.id,
    score,
    dice_values: diceValues,
  });

  if (insertError) {
    throw new Error('Failed to record drop.');
  }

  // Update profile: increment total_score and set last_drop
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      total_score: (profile?.total_score ?? 0) + score,
      last_drop: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    throw new Error('Failed to update profile.');
  }

  revalidatePath('/');

  return { diceValues, score };
}
