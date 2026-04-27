'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import disposableDomains from 'disposable-email-domains'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error("Supabase Login Error:", error);
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const profession = formData.get('profession') as string
  const country = formData.get('country') as string

  // 1. Validate Email against disposable domains
  const domain = email.split('@')[1]?.toLowerCase()
  if (domain && disposableDomains.includes(domain)) {
    redirect('/signup?message=Disposable email addresses are not allowed')
  }

  // 2. Validate Password Complexity (Min 8 chars, alphanumeric)
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/
  if (!passwordRegex.test(password)) {
    redirect('/signup?message=Password must be at least 8 characters and contain both letters and numbers')
  }

  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        full_name,
        profession,
        country,
      }
    }
  })
  
  if (error) {
    console.error("Supabase Signup Error:", error);
    redirect('/signup?message=' + encodeURIComponent(error.message))
  }

  // If Supabase returns no error but no session, it means either:
  // 1. Email confirmations are still turned ON.
  // 2. The email is already registered (Supabase fakes a success response for security).
  if (!data.session) {
    redirect('/signup?message=' + encodeURIComponent("Signup successful, but could not log you in. Are you sure 'Confirm email' is OFF? Or are you already registered? Try logging in!"))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

