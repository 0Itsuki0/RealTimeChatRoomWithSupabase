

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { type User } from "@supabase/supabase-js"
import { Button } from "../components/ui/button"
import type { Database } from "../types/database.types"
import { Skeleton } from "../components/ui/skeleton"
import { X } from "lucide-react"

import { supabase } from "@/App"
import { emailToName } from "@/lib/utils"


// type ChatHistory = Tables<"chat_history">

type ChatHistoryProfile = Database["public"]["Views"]["chat_history_profile"]["Row"]

export type ChatHistoryProp = {
    roomId: number,
    roomName: string,
    currentUser: User,
    close: () => void
}

export function ChatHistory({ roomId, roomName, close, currentUser }: ChatHistoryProp) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(false)
    const [histories, setHistories] = useState<ChatHistoryProfile[]>([])
    const historiesRef = useRef(histories)
    const [input, setInput] = useState("")

    // handle The issue of a subscription callback not accessing the current React state is a common problem related to JavaScript closures and how React handles state updates.
    useEffect(() => {
        // Update the ref on every render
        historiesRef.current = histories
    }, [histories])


    const sortedHistories: ChatHistoryProfile[] = useMemo(() => {
        return histories.sort((first, second) => {
            if (first.created_at === null || second.created_at === null) {
                return 0
            }
            return first.created_at.localeCompare(second.created_at)
        })
    }, [histories])

    const fetchHistories = async () => {
        setLoading(true)

        const { data, error } = await supabase
            .from("chat_history_profile")
            .select("*")
            .eq("room", roomId)
            .order("created_at", { ascending: false })

        if (error) {
            alert(error.message)
        }
        setHistories(data ?? [])
        setLoading(false)
    }

    const handleSendSubmit = async () => {
        setLoading(true)
        const { error } = await supabase
            .from("chat_history")
            .insert({
                content: input,
                room: roomId
            })
        if (error) {
            alert(error.message)
        }
        setInput("")
        setLoading(false)
    }

    useEffect(() => {
        fetchHistories()
    }, [roomId])


    useLayoutEffect(() => {
        scrollRef?.current?.scrollIntoView({ behavior: 'smooth' })
    }, [sortedHistories])


    // subscribe to table changes
    useEffect(() => {
        const channel = supabase
            .channel('table-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_history',
                    filter: `room=eq.${roomId}`,
                },
                (payload) => {
                    handleChanges(payload.new)
                }
            )
            .subscribe((state, error) => {
                console.log("subscribe state: ", state, "error: ", error)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])


    const handleChanges = async (newData: { [key: string]: any }) => {
        if (newData["id"] === null) {
            return
        }

        const { data, error } = await supabase
            .from("chat_history_profile")
            .select("*")
            .eq("id", newData["id"])
            .limit(1)

        if (error) {
            alert(error.message)
        }

        if (data) {
            setHistories([...historiesRef.current, ...data])
        }
    }

    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 lg:w-3/5 w-4/5 h-2/3 bg-gray-300 shadow-sm shadow-gray-500 rounded-2xl py-4 ">
            <div className="flex flex-col gap-4 w-full h-full items-center justify-between relative m-auto">
                <div className="w-full px-4 flex flex-row  items-center justify-between">
                    <h1 className="font-medium text-lg line-clamp-1 text-ellipsis break-all">Room: {roomName}</h1>
                    <Button size="icon-sm" onClick={close} className="cursor-pointer"><X /></Button>
                </div>

                <div className="flex flex-col gap-4 w-full h-3/4 items-start overflow-scroll px-4 ">
                    {loading ? <>
                        <Skeleton className="w-full h-10" />
                        <Skeleton className="w-full h-10" />
                    </> : null}

                    {
                        !loading && histories.length === 0 ?
                            <div className="text-gray-500 text-sm">No one has said anything yet!</div> : null
                    }


                    {sortedHistories.map(history => {
                        return (
                            <div className="w-full flex flex-col gap-2" key={history.id}>
                                <div className="w-full bg-amber-50 rounded-md px-4 py-2 text-sm" key={history.id}>{history.content}</div>
                                <div className={`px-1 text-xs text-gray-500 ${history.created_by === currentUser.id ? "self-end" : "self-start"} `}>{emailToName(history.created_by_email)}</div>
                            </div>
                        )
                    })}

                    <div ref={scrollRef} />

                </div>

                <Field orientation="horizontal" className="w-full px-4">
                    <Input
                        type="text"
                        placeholder="..."
                        value={input}
                        required={true}
                        className="w-full border-black"
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button
                        type="button"
                        className="cursor-pointer"
                        disabled={loading || input.trim().length === 0}
                        onClick={handleSendSubmit}
                    >
                        {loading ? <span>Sending</span> : <span>Send</span>}
                    </Button>
                </Field>


            </div >
        </div >
    )

}
