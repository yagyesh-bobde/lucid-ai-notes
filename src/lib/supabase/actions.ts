// src/lib/supabase/actions.ts
// Server actions for Supabase operations
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from './server'
import { CreateNoteInput, Note, UpdateNoteInput } from './types'

// Notes service server actions
export async function getNotes() {
  const supabase = createClient()
  
  const { data: notes, error } = await (await supabase) 
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching notes:', error)
    return { error }
  }
  
  return { notes }
}

export async function getNote(id: string) {
  const supabase = createClient()
  
  const { data: note, error } = await (await supabase)
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching note:', error)
    return { error }
  }
  
  return { note }
}

export async function createNote(noteData: CreateNoteInput) {
  const supabase = createClient()
  
  // Get the current user
  const { data: { session } } = await (await supabase).auth.getSession()
  
  if (!session || !session.user) {
    return { error: { message: 'User not authenticated' } }
  }
  
  // Add required fields
  const dataWithUser = {
    ...noteData,
    user_id: session.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  const { data: note, error } = await (await supabase)
    .from('notes')
    .insert([dataWithUser])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating note:', error)
    return { error }
  }
  
  // Revalidate the notes list
  revalidatePath('/dashboard')
  
  return { note }
}

export async function updateNote(noteData: UpdateNoteInput) {
  const supabase = createClient()
  
  // Extract id from data
  const { id, ...data } = noteData
  
  // Add updated timestamp
  const dataWithTimestamp = {
    ...data,
    updated_at: new Date().toISOString(),
  }
  
  const { data: note, error } = await (await supabase)
    .from('notes')
    .update(dataWithTimestamp)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating note:', error)
    return { error }
  }
  
  // Revalidate the notes list and single note page
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/notes/${id}`)
  
  return { note }
}

export async function deleteNote(id: string) {
  const supabase = createClient()
  
  const { error } = await (await supabase)
    .from('notes')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting note:', error)
    return { error }
  }
  
  // Revalidate the notes list
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function saveSummary(noteId: string, summary: string) {
  const supabase = createClient()
  
  const { error } = await (await supabase)
    .from('notes')
    .update({
      summary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
  
  if (error) {
    console.error('Error saving summary:', error)
    return { error }
  }
  
  // Revalidate the notes list and single note page
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/notes/${noteId}`)
  
  return { success: true }
}

// Auth related server actions
export async function signIn(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const { error } = await (await supabase).auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error }
  }
  
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const { error } = await (await supabase).auth.signUp({
    email,
    password,
  })
  
  if (error) {
    return { error }
  }
  
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = createClient()
  
  await (await supabase).auth.signOut()
  
  redirect('/auth')
}

export async function getProfile() {
  const supabase = createClient()
  
  // Get the current user
  const { data: { session } } = await (await supabase).auth.getSession()
  
  if (!session || !session.user) {
    return { error: { message: 'User not authenticated' } }
  }
  
  const { data: profile, error } = await (await supabase)
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
    console.error('Error fetching profile:', error)
    return { error }
  }
  
  return { profile, user: session.user }
}