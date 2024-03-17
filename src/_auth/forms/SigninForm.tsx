import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { signinValidationSchema } from "@/lib/validation"
import Loader from "@/components/shared/Loader"
import { Link, useNavigate } from "react-router-dom"
import { useToast } from "@/components/ui/use-toast"
import { useSignInAccount } from "@/lib/react-query/queriesAndMutations"
import { useUserContext } from "@/context/AuthContext"


const SigninForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  const { mutateAsync: signInAccount, isPending: isUserSigningIn } = useSignInAccount();

  // 1. Define your form.
  const form = useForm<z.infer<typeof signinValidationSchema>>({
    resolver: zodResolver(signinValidationSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // 2. Define a submit handler.
  async function handleSignin(values: z.infer<typeof signinValidationSchema>) {

    const session = await signInAccount(values);

    if (!session) {
      return toast({
        title: "Log in failed. Please try again"
      })
    }
    console.log("session is", session);
    
    const isLoggedIn = await checkAuthUser();
    console.log("isLoggedin is", isLoggedIn);

    if (isLoggedIn) {
      form.reset();
      console.log("navigating to /");
      navigate("/");
    } else {
      return toast({
        title: "Log in failed. Please try again"
      })
    }
  }

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        <img src="/assets/images/logo.svg" alt="logo" />
        <h2 className="h3-bold md:h2-bold pt-4 sm:pt-8">Login to your account</h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">Welcome back! please enter your details</p>

        <form onSubmit={form.handleSubmit(handleSignin)} className="flex flex-col gap-5 w-full mt-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="shad-button_primary">
            {isUserSigningIn || isUserLoading ? (
              <div className="flex-center gap-2"><Loader />Loading...</div>
            ) : "Sign in"}
          </Button>
          <p className="text-small-regular text-light-2 text-center">
            Don't have an account?
            <Link to="/signup" className="text-primary-500 text-small-semibold ml-1">Sign up</Link>
          </p>
        </form>
      </div>
    </Form>
  )

}

export default SigninForm