"use client"
import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import FormField from "./FormField"
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { createUserWithEmailAndPassword, GithubAuthProvider, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { signUp, signIn, oauthSignIn } from '@/lib/actions/auth.action'

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // Submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (type === 'sign-up') {
        const { name, email, password } = values;

        // Create Firebase user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Directly create user in your DB without email verification
        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result?.success) {
          toast.error(result?.message || "Error creating the user");
          return;
        }

        toast.success("Account created successfully");
        // Redirect directly to dashboard
        router.push("/dashboard");

      } else {
        const { email, password } = values;

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        if (!idToken) {
          toast.error("Error signing in the user, Token not found");
          return;
        }

        const result = await signIn({
          email,
          idToken,
        });

        if (!result?.success) {
          toast.error(result?.message || "Error signing in the user");
          return;
        }

        toast.success("Logged in successfully, redirecting to dashboard");
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.log("error", error);
      let errorMessage = "An error occurred during authentication";

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid Credential";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later";
      }

      toast.error(errorMessage);
    }
  }

  // OAuth Sign In Handler
  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      let authProvider;
      if (provider === 'google') {
        authProvider = new GoogleAuthProvider();
      } else if (provider === 'github') {
        authProvider = new GithubAuthProvider();
      } else {
        throw new Error("Unsupported provider");
      }

      const userCredential = await signInWithPopup(auth, authProvider);
      const idToken = await userCredential.user.getIdToken();
      const { displayName, email, uid, photoURL } = userCredential.user;

      if (!email) {
        toast.error("Failed to retrieve email from your account");
        return;
      }

      const result = await oauthSignIn({
        uid,
        name: displayName || email.split('@')[0],
        email,
        photoURL: photoURL || '',
        provider,
        idToken
      });

      if (!result?.success) {
        toast.error(result?.message || "Error signing in");
        return;
      }

      toast.success("Logged in successfully, redirecting to dashboard");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("OAuth error:", error);

      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Authentication was cancelled");
        return;
      }

      toast.error(`Authentication failed: ${error.message}`);
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.png" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepWise</h2>
        </div>

        <h3>Practice job interviews with AI</h3>
        
        <div className="flex flex-col gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-3"
            onClick={() => handleOAuthSignIn('google')}
          >
            <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
            <span>Continue with Google</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-3"
            onClick={() => handleOAuthSignIn('github')}
          >
            <Image src="/github-icon.svg" alt="GitHub" width={20} height={20} />
            <span>Continue with GitHub</span>
          </Button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <Button className="btn" type="submit">
              {isSignIn ? "Sign In" : "Create an Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AuthForm
