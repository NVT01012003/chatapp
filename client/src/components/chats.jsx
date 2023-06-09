import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicInstance } from "../config/axiosConfig";
import { AuthContext } from "../contexts/authContext";
import { ChatContext } from "../contexts/chatContext";
import { StoreContext } from "../contexts/StoreContext";

function Chats({ toast }) {
    const { store, dispatch, sortChats } = useContext(StoreContext);
    const { currentChat, setCurrentChat } = useContext(ChatContext);
    const { currentUser, refreshToken } = useContext(AuthContext);
    const [onRightClick, setOnRightClick] = useState(null);
    const navigate = useNavigate();
    const ref = useRef();
    const handleGetMessages = async (chat) => {
        if (
            store.messages[chat.id] &&
            Object.keys(store.messages[chat.id]).length > 20
        ) {
            return setCurrentChat(chat);
        } else if (!store.messages[chat.id]) return setCurrentChat(chat);
        try {
            for (const [id, message] of Object.entries(
                store.messages[chat.id]
            )) {
                if (message.chat_created) {
                    return setCurrentChat(chat);
                }
            }

            setCurrentChat(chat);
            const { data } = await publicInstance.get(
                `/message/${chat.id}/get_messages`
            );
            if (data.status == "success") {
                dispatch({
                    type: "ADD_MESSAGES",
                    messages: data.elements,
                });
            } else toast("Something went wrong! Please try again.");
        } catch (e) {
            const data = e.response.data;
            if (data.message == "jwt expired") {
                refreshToken()
                    .then(async (res) => {
                        const { data } = await publicInstance.get(
                            `/message/${chat.id}/get_messages`
                        );
                        if (data.status == "success") {
                            dispatch({
                                type: "ADD_MESSAGES",
                                messages: data.elements,
                            });
                        } else toast("Something went wrong! Please try again.");
                    })
                    .catch((e) => {
                        if (e == "Server error") {
                            toast("Server error! Please try again.");
                        } else {
                            toast(
                                "The login session has expired! Please login again."
                            );
                            setTimeout(() => {
                                navigate("/login");
                            }, 6000);
                        }
                    });
            }
        }
    };

    const handleHiddenChat = async (id) => {
        try {
            const { data } = await publicInstance.put(
                `user/${currentUser.user_id}/hidden_chat`,
                {
                    chat_id: id,
                }
            );
            dispatch({
                type: "HIDDEN_CHAT",
                chat_id: id,
            });
        } catch (e) {
            const data = e.response?.data;
            if (data?.message == "jwt expired") {
                refreshToken()
                    .then(async (res) => {
                        const { data } = await publicInstance.put(
                            `user/${currentUser.user_id}/hidden_chat`,
                            {
                                chat_id: id,
                            }
                        );
                        dispatch({
                            type: "HIDDEN_CHAT",
                            chat_id: id,
                        });
                    })
                    .catch((e) => {
                        if (e == "Server error") {
                            return toast("Server error! Please try again.");
                        } else {
                            toast(
                                "The login session has expired! Please login again."
                            );
                            setTimeout(() => {
                                navigate("/login");
                            }, 6000);
                        }
                    });
            } else {
                toast("Server error! Please try again.");
            }
        }
    };

    useEffect(() => {
        ref.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentChat?.id]);

    return (
        <div className="chats">
            {(Object.keys(store.chats).length > 0 &&
                sortChats(store.chats)
                    .reverse()
                    .map(([time, id]) => {
                        const data = store.chats[id];
                        if (!data.members.includes(currentUser?.user_id))
                            return;
                        let avatar = data.chat_avatar;
                        let name = data.name;
                        let updated_at = new Date(
                            data.updated_at.split(".")[0]
                        );
                        const hour = (updated_at.getHours() + 7) % 24;
                        updated_at =
                            `${(`${hour}`.length == 2 && hour) || `0${hour}`}` +
                            ":" +
                            `${
                                (`${updated_at.getMinutes()}`.length == 2 &&
                                    updated_at.getMinutes()) ||
                                `0${updated_at.getMinutes()}`
                            }`;
                        let last_message = null;
                        if (data.last_message != null) {
                            if (
                                store.messages[data.id][data.last_message]
                                    .notice
                            ) {
                                const text_arr =
                                    store.messages[data.id][
                                        data.last_message
                                    ].text.split("/u");
                                last_message = `${
                                    store.users[
                                        store.messages[data.id][
                                            data.last_message
                                        ].sender
                                    ].display_name == currentUser.display_name
                                        ? "You"
                                        : store.users[
                                              store.messages[data.id][
                                                  data.last_message
                                              ].sender
                                          ].display_name
                                }: ${
                                    text_arr[0] +
                                    ` ${
                                        store.users[text_arr[1]].display_name
                                    } ` +
                                    text_arr[2]
                                }`;
                            } else if (
                                store.messages[data.id][data.last_message]?.text
                            ) {
                                last_message = `${
                                    store.users[
                                        store.messages[data.id][
                                            data.last_message
                                        ].sender
                                    ].display_name == currentUser.display_name
                                        ? "You"
                                        : store.users[
                                              store.messages[data.id][
                                                  data.last_message
                                              ].sender
                                          ].display_name
                                }: ${
                                    store.messages[data.id][data.last_message]
                                        .text
                                }`;
                            } else if (
                                store.messages[data.id][data.last_message]
                                    ?.photo_url
                            ) {
                                last_message = `${
                                    store.users[
                                        store.messages[data.id][
                                            data.last_message
                                        ].sender
                                    ].display_name == currentUser.display_name
                                        ? "You"
                                        : store.users[
                                              store.messages[data.id][
                                                  data.last_message
                                              ].sender
                                          ].display_name
                                } sent a picture!`;
                            } else {
                                last_message = `${
                                    store.users[
                                        store.messages[data.id][
                                            data.last_message
                                        ].sender
                                    ]?.display_name
                                } just sent a picture!`;
                            }
                        }
                        if (!data.is_group) {
                            avatar =
                                data.members[0] != currentUser.user_id
                                    ? store.users[data.members[0]].avatar_url
                                    : store.users[data.members[1]].avatar_url;
                            name =
                                data.members[0] != currentUser.user_id
                                    ? store.users[data.members[0]].display_name
                                    : store.users[data.members[1]].display_name;
                        } else {
                            avatar =
                                data.chat_avatar ||
                                "https://cdn3.vectorstock.com/i/1000x1000/24/27/people-group-avatar-character-vector-12392427.jpg";
                            name =
                                data.name ||
                                `${data.members.map(
                                    (id) => `${store.users[id].display_name} `
                                )}`;
                        }

                        return (
                            <div
                                className={`chat-item ${
                                    currentChat?.id == id && "active"
                                }`}
                                key={id}
                                onClick={() => {
                                    if (onRightClick) setOnRightClick(null);
                                    handleGetMessages(data);
                                }}
                                onContextMenu={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setOnRightClick((pre) => {
                                        if (pre == id) return null;
                                        else return id;
                                    });
                                }}
                                ref={ref}
                            >
                                <div
                                    className="chat-avatar"
                                    style={{
                                        backgroundImage: `url(${avatar})`,
                                    }}
                                ></div>
                                <div className="wrapper">
                                    <span>{name}</span>
                                    <span className="last-message">
                                        {last_message || "Created chat!"}
                                    </span>
                                </div>
                                <span className="updated">{updated_at}</span>
                                {onRightClick == id && (
                                    <div className="chat-feature">
                                        <span
                                            className="feature"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleHiddenChat(id);
                                            }}
                                        >
                                            Delete
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })) || <div></div>}
        </div>
    );
}

export default Chats;
