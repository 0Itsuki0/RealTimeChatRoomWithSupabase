import "./index.css"

import { useState, useEffect } from "react"
import { createClient, type Session } from "@supabase/supabase-js"
import { Button } from "./components/ui/button"
import type { Database } from "./types/database.types"
import { LogIn, LogOut } from "lucide-react"
import { LoginForm } from "./views/LoginForm"
import { emailToName } from "./lib/utils"
import { ChatRoom } from "./views/ChatRoom"

export const supabase = createClient<Database>(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)


export default function App() {
    const [session, setSession] = useState<Session | null>(null)
    const [showLogin, setShowLogin] = useState(false)

    // Uncomment the following for sign in using magic link
    //
    // const params = new URLSearchParams(window.location.search)
    // const hasTokenHash = params.get("token_hash")
    // const [verifying, setVerifying] = useState(!!hasTokenHash)
    // const [authError, setAuthError] = useState<string | null>(null)
    // const [authSuccess, setAuthSuccess] = useState(false)

    useEffect(() => {

        // Uncomment the following for sign in using magic link
        //
        // const params = new URLSearchParams(window.location.search)
        // const token_hash = params.get("token_hash")
        // const type = params.get("type") as EmailOtpType | null

        // if (token_hash && type) {
        //     // Verify the OTP token
        //     supabase.auth.verifyOtp({
        //         token_hash,
        //         type: type || "email",
        //     }).then(({ error }) => {
        //         if (error) {
        //             setAuthError(error.message)
        //         } else {
        //             setAuthSuccess(true)
        //             // Clear URL params
        //             window.history.replaceState({}, document.title, "/")
        //         }
        //         setVerifying(false)
        //     })
        // }

        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        // we can also use the following to get existing User
        //
        // This method fetches the user object from the database instead of local session.
        // This method is useful for checking if the user is authorized because it validates the user's access token JWT on the server.
        // Should always be used when checking for user authorization on the server.
        // On the client, you can instead use getSession().session.user for faster results. getSession is insecure on the server.
        //
        // supabase.auth.getUser().then(({ data: { user } }) => {
        //     setUser(user)
        // })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setSession(null)
    }

    return (
        <>
            <div className="flex flex-col gap-6 items-center justify-center w-full max-w-3xl h-full px-8 py-10 font-mono m-auto overflow-y-scroll overflow-x-hidden">
                <div className="w-full flex flex-row items-center justify-between">
                    <h1 className="font-bold text-3xl line-clamp-1 text-ellipsis break-all">Itsuki's Chat Room!</h1>

                    <div className="w-fit flex flex-row items-center gap-2">
                        {session ?
                            <>
                                {emailToName(session.user.email ?? null)}
                                <Button size="icon-sm" onClick={handleLogout} className="cursor-pointer"><LogOut /></Button>
                            </> :
                            <>
                                <Button size="icon-sm" onClick={() => setShowLogin(true)} className="cursor-pointer"><LogIn /></Button>
                            </>}

                    </div>
                </div>
                <ChatRoom currentUser={session?.user ?? null} showLogin={() => { setShowLogin(true) }} />
                <div className="font-medium text-gray-400 italic text-sm my-2">Have a nice chat!</div>
            </div>
            {
                showLogin ? <LoginForm session={session} setSession={setSession} close={() => { setShowLogin(false) }} /> : null
            }

        </>

    )

}
