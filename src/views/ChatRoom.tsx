

import { useState, useEffect, useMemo, useRef } from "react"
import { type User } from "@supabase/supabase-js"
import { Button } from "../components/ui/button"
import type { Database } from "../types/database.types"
import { Skeleton } from "../components/ui/skeleton"
import { Plus, Trash2 } from "lucide-react"
import { supabase } from "@/App"
import { ChatHistory } from "./ChatHistory"
import { emailToName } from "@/lib/utils"


// type ChatRoom = Tables<"chatroom_master">
type ChatRoomProfile = Database["public"]["Views"]["chatroom_profile"]["Row"]

export type ChatRoomProp = {
    currentUser: User | null,
    showLogin: () => void
}

export function ChatRoom({ currentUser, showLogin }: ChatRoomProp) {
    const [loading, setLoading] = useState(false)
    const [rooms, setRooms] = useState<ChatRoomProfile[]>([])
    const [count, setCount] = useState<number | null>(null)

    const [selectedRoom, setSelectedRoom] = useState<ChatRoomProfile | null>(null)

    const roomsRef = useRef(rooms)

    const limit: number = 10

    const sortedRooms: ChatRoomProfile[] = useMemo(() => {
        return rooms.sort((first, second) => {
            if (first.created_at === null || second.created_at === null) {
                return 0
            }
            return second.created_at.localeCompare(first.created_at)
        })
    }, [rooms])

    // handle The issue of a subscription callback not accessing the current React state is a common problem related to JavaScript closures and how React handles state updates.
    useEffect(() => {
        // Update the ref on every render
        roomsRef.current = rooms
    }, [rooms])

    useEffect(() => {
        if (!open) {
            setSelectedRoom(null)
        }
    }, [open])

    const fetchRooms = async (offset: number) => {
        setLoading(true)

        const { data, error, count } = await supabase
            .from("chatroom_profile")
            .select("*", {
                count: "exact",
            })
            .order("created_at", { ascending: false })
            // (offset x, limit x)
            .range(offset, offset + limit - 1)

        if (error) {
            alert(error.message)
        }
        setRooms([...rooms, ...data ?? []])
        setCount(count)
        setLoading(false)
    }

    useEffect(() => {
        fetchRooms(0)
    }, [])

    // subscribe to table changes
    useEffect(() => {
        const channel = supabase
            .channel('table-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chatroom_master',
                },
                (payload) => {
                    handleInsert(payload.new)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'chatroom_master',
                },
                (payload) => {
                    handleDelete(payload.old)
                }
            )
            .subscribe((state, error) => {
                console.log("subscribe state: ", state, "error: ", error)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleDelete = async (old: { [key: string]: any }) => {
        if (old["id"] === null) {
            return
        }
        setRooms([...roomsRef.current.filter((r) => r.id != old["id"])])
    }



    const handleInsert = async (newData: { [key: string]: any }) => {
        if (newData["id"] === null) {
            return
        }
        const { data, error } = await supabase
            .from("chatroom_profile")
            .select("*")
            .eq("id", newData["id"])
            .limit(1)

        if (error) {
            alert(error.message)
        }
        if (data) {
            setRooms([...roomsRef.current, ...data])
        }
    }

    const deleteRoom = async (id: number | null) => {
        if (!id) {
            return
        }
        const result = window.confirm("Do you actually want to delete the room?")
        if (result === false) {
            return
        }
        const { error } = await supabase
            .from("chatroom_master")
            .delete()
            .eq('id', id)
        if (error) {
            alert(error.message)
        }
    }

    const createNewRoom = async () => {
        const name = window.prompt('Name for the room:')
        // cancel button pressed
        if (name === null) {
            return
        }
        // ok button with empty name
        if (name.trim().length === 0) {
            alert("Empty name.")
            return
        }

        const { error } = await supabase
            .from("chatroom_master")
            .insert({ name })

        if (error) {
            alert(error.message)
        }
    }


    const cardStyle = "w-36 h-36 p-4 border rounded-md bg-sky-300"

    return (
        <>
            <div className="flex flex-col gap-4 w-full h-full items-center justify-center">

                <div className="w-full gap-4 flex flex-row items-center justify-start">
                    <h1 className="font-medium text-lg line-clamp-1 text-ellipsis break-all">Total rooms: {count ?? "..."}</h1>
                    {
                        currentUser === null ? null : <Button size="icon-sm" onClick={createNewRoom} className="cursor-pointer"><Plus /></Button>
                    }

                </div>


                <div className="flex flex-row gap-8 w-xl h-full items-center justify-center flex-wrap">
                    {loading && rooms.length === 0 ? <>
                        <Skeleton className={cardStyle} />
                        <Skeleton className={cardStyle} />
                        <Skeleton className={cardStyle} />
                    </> : null}

                    {sortedRooms.map(room => {
                        return (
                            <div
                                className={`${cardStyle} p-4 flex flex-col gap-2 justify-center items-center align-middle hover:bg-sky-500 relative cursor-pointer`}
                                key={room.id}
                                onClick={() => {
                                    currentUser === null ? showLogin() : setSelectedRoom(room)
                                }}
                            >
                                <p className="font-medium line-clamp-1 text-ellipsis break-all text-black">{room.name ?? "unknwon"}</p>
                                <p className="text-xs text-gray-500 line-clamp-1 text-ellipsis break-all">By: {emailToName(room.email)}</p>
                                {
                                    currentUser?.id === room.created_by ?
                                        <Button
                                            className="absolute top-1 right-1 text-xs bg-red-200 cursor-pointer"
                                            size="icon-sm"
                                            onClick={async (e) => {
                                                e.stopPropagation()
                                                await deleteRoom(room.id)
                                            }}
                                        >
                                            <Trash2 />
                                        </Button> : null
                                }
                            </div>
                        )
                    })}

                </div>

                {
                    (count ?? 0) > rooms.length ?
                        <Button
                            variant={"outline"}
                            className="border-sky-500 bg-amber-100 border-2 cursor-pointer"
                            onClick={async () => await fetchRooms(rooms.length)}
                        >
                            {loading ? "Loading" : "More"}
                        </Button>
                        : null
                }

            </div >

            {selectedRoom && selectedRoom.id && selectedRoom.name && currentUser ?
                <ChatHistory roomId={selectedRoom.id} roomName={selectedRoom.name} close={() => setSelectedRoom(null)} currentUser={currentUser} />
                : null
            }
        </>
    )
}
